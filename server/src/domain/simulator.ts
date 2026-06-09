// Vehicle simulator: seeds the fleet, then ticks every TICK_INTERVAL_MS, publishes
// telemetry events, and manages the route lifecycle (assign / advance / clear).

import { randomUUID } from "node:crypto";

import { VEHICLE_STATUS, type VehicleStatus } from "@shared/types";

import { eventBus } from "@server/kafka/eventBus";
import {
  TOPIC_VEHICLE_TELEMETRY,
  TOPIC_ROUTE_ASSIGNED,
  TOPIC_ROUTE_CLEARED,
} from "@server/kafka/topics";

import {
  FLEET_SIZE,
  EN_ROUTE_TARGET,
  TICK_INTERVAL_MS,
  LAS_VEGAS_CENTER_LAT,
  LAS_VEGAS_CENTER_LNG,
  CITY_SPAWN_RADIUS_KM,
  BATTERY_DRAIN_PER_TICK,
  BATTERY_DRAIN_EN_ROUTE_PER_TICK,
  VEHICLE_SPEED_MPS,
  ROUTE_MIN_LENGTH_KM,
  ROUTE_MAX_LENGTH_KM,
} from "@server/constants";

const VEHICLE_ID_PREFIX = "veh";
const VEHICLE_ID_PAD_LENGTH = 3;
const FULL_CIRCLE_DEG = 360;
const METERS_PER_DEG_LAT = 111_000;
const METERS_PER_KM = 1000;
const MS_PER_S = 1000;
const DEG_TO_RAD = Math.PI / 180;
const INITIAL_BATTERY_MIN = 40;
const INITIAL_BATTERY_RANGE = 60;
const SPAWN_FREE_PROBABILITY = 0.78; // ~78% FREE, ~22% WITH_CUSTOMER at spawn
const IDLE_JITTER_DEG = 0.00015;
const HEADING_JITTER_DEG = 5;
const ROUTE_PROGRESS_COMPLETE = 1;

interface SimVehicle {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  battery: number;
  status: VehicleStatus;
}

interface ActiveRoute {
  routeId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  bearingDeg: number;
  totalMeters: number;
  traveledMeters: number;
}

const fleet = new Map<string, SimVehicle>();
const activeRoutesByVehicleId = new Map<string, ActiveRoute>();

function randomInRange(minValue: number, maxValue: number): number {
  return minValue + Math.random() * (maxValue - minValue);
}

function metersPerDegLng(latitudeDeg: number): number {
  return METERS_PER_DEG_LAT * Math.cos(latitudeDeg * DEG_TO_RAD);
}

// Vehicles spawn as FREE or WITH_CUSTOMER only; the simulator promotes a subset
// to EN_ROUTE by assigning them real routes.
function pickInitialStatus(): VehicleStatus {
  return Math.random() < SPAWN_FREE_PROBABILITY
    ? VEHICLE_STATUS.FREE
    : VEHICLE_STATUS.WITH_CUSTOMER;
}

function spawnVehicle(vehicleIndex: number): SimVehicle {
  const radiusDeg = CITY_SPAWN_RADIUS_KM / (METERS_PER_DEG_LAT / METERS_PER_KM);
  const angleRad = Math.random() * 2 * Math.PI;
  const distanceFromCenterDeg = Math.sqrt(Math.random()) * radiusDeg;

  return {
    id: `${VEHICLE_ID_PREFIX}-${String(vehicleIndex).padStart(VEHICLE_ID_PAD_LENGTH, "0")}`,
    lat: LAS_VEGAS_CENTER_LAT + Math.sin(angleRad) * distanceFromCenterDeg,
    lng: LAS_VEGAS_CENTER_LNG + Math.cos(angleRad) * distanceFromCenterDeg,
    heading: Math.random() * FULL_CIRCLE_DEG,
    battery: INITIAL_BATTERY_MIN + Math.random() * INITIAL_BATTERY_RANGE,
    status: pickInitialStatus(),
  };
}

function seedFleet(): void {
  for (let vehicleIndex = 0; vehicleIndex < FLEET_SIZE; vehicleIndex += 1) {
    const vehicle = spawnVehicle(vehicleIndex);
    fleet.set(vehicle.id, vehicle);
  }
}

function makeRouteFrom(originVehicle: SimVehicle): ActiveRoute {
  const lengthKm = randomInRange(ROUTE_MIN_LENGTH_KM, ROUTE_MAX_LENGTH_KM);
  const lengthMeters = lengthKm * METERS_PER_KM;
  const bearingDeg = Math.random() * FULL_CIRCLE_DEG;
  const bearingRad = bearingDeg * DEG_TO_RAD;

  const dyMeters = Math.cos(bearingRad) * lengthMeters;
  const dxMeters = Math.sin(bearingRad) * lengthMeters;

  const endLat = originVehicle.lat + dyMeters / METERS_PER_DEG_LAT;
  const endLng = originVehicle.lng + dxMeters / metersPerDegLng(originVehicle.lat);

  return {
    routeId: randomUUID(),
    startLat: originVehicle.lat,
    startLng: originVehicle.lng,
    endLat,
    endLng,
    bearingDeg,
    totalMeters: lengthMeters,
    traveledMeters: 0,
  };
}

function assignNewRoutesIfNeeded(timestampMs: number): void {
  if (activeRoutesByVehicleId.size >= EN_ROUTE_TARGET) return;

  const freeCandidates: SimVehicle[] = [];

  for (const vehicle of fleet.values()) {
    if (vehicle.status === VEHICLE_STATUS.FREE && !activeRoutesByVehicleId.has(vehicle.id)) {
      freeCandidates.push(vehicle);
    }
  }

  const slotsToFill = EN_ROUTE_TARGET - activeRoutesByVehicleId.size;

  for (let slotIndex = 0; slotIndex < slotsToFill && freeCandidates.length > 0; slotIndex += 1) {
    const pickIndex = Math.floor(Math.random() * freeCandidates.length);
    const chosenVehicle = freeCandidates.splice(pickIndex, 1)[0];
    const newRoute = makeRouteFrom(chosenVehicle);

    activeRoutesByVehicleId.set(chosenVehicle.id, newRoute);
    chosenVehicle.status = VEHICLE_STATUS.EN_ROUTE;
    chosenVehicle.heading = newRoute.bearingDeg;

    eventBus.publish(TOPIC_ROUTE_ASSIGNED, {
      routeId: newRoute.routeId,
      vehicleId: chosenVehicle.id,
      polyline: [
        [newRoute.startLng, newRoute.startLat],
        [newRoute.endLng, newRoute.endLat],
      ],
      assignedAt: timestampMs,
    });
  }
}

function advanceEnRouteVehicle(
  vehicle: SimVehicle,
  vehicleRoute: ActiveRoute,
  timestampMs: number,
): void {
  const stepMeters = VEHICLE_SPEED_MPS * (TICK_INTERVAL_MS / MS_PER_S);
  vehicleRoute.traveledMeters += stepMeters;

  const progress = Math.min(
    ROUTE_PROGRESS_COMPLETE,
    vehicleRoute.traveledMeters / vehicleRoute.totalMeters,
  );

  vehicle.lat = vehicleRoute.startLat + (vehicleRoute.endLat - vehicleRoute.startLat) * progress;
  vehicle.lng = vehicleRoute.startLng + (vehicleRoute.endLng - vehicleRoute.startLng) * progress;
  vehicle.heading = vehicleRoute.bearingDeg;

  if (progress >= ROUTE_PROGRESS_COMPLETE) {
    activeRoutesByVehicleId.delete(vehicle.id);
    vehicle.status = VEHICLE_STATUS.FREE;

    eventBus.publish(TOPIC_ROUTE_CLEARED, {
      vehicleId: vehicle.id,
      routeId: vehicleRoute.routeId,
      clearedAt: timestampMs,
    });
  }
}

function applyIdleDrift(vehicle: SimVehicle): void {
  vehicle.lat += randomInRange(-IDLE_JITTER_DEG, IDLE_JITTER_DEG);
  vehicle.lng += randomInRange(-IDLE_JITTER_DEG, IDLE_JITTER_DEG);
  vehicle.heading =
    (vehicle.heading + randomInRange(-HEADING_JITTER_DEG, HEADING_JITTER_DEG) + FULL_CIRCLE_DEG) %
    FULL_CIRCLE_DEG;
}

function tick(): void {
  const timestampMs = Date.now();

  assignNewRoutesIfNeeded(timestampMs);

  for (const vehicle of fleet.values()) {
    const vehicleRoute = activeRoutesByVehicleId.get(vehicle.id);

    if (vehicleRoute) {
      advanceEnRouteVehicle(vehicle, vehicleRoute, timestampMs);
      vehicle.battery = Math.max(0, vehicle.battery - BATTERY_DRAIN_EN_ROUTE_PER_TICK);
    } else {
      applyIdleDrift(vehicle);
      vehicle.battery = Math.max(0, vehicle.battery - BATTERY_DRAIN_PER_TICK);
    }

    eventBus.publish(TOPIC_VEHICLE_TELEMETRY, {
      vehicleId: vehicle.id,
      lat: vehicle.lat,
      lng: vehicle.lng,
      heading: vehicle.heading,
      battery: vehicle.battery,
      status: vehicle.status,
      timestamp: timestampMs,
    });
  }
}

export function startSimulator(): () => void {
  seedFleet();
  tick();

  const tickHandle = setInterval(tick, TICK_INTERVAL_MS);

  return () => clearInterval(tickHandle);
}

// Exposed so the heartbeat log can show how many vehicles are currently EN_ROUTE.
export function activeRouteCount(): number {
  return activeRoutesByVehicleId.size;
}
