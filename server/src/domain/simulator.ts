// Vehicle simulator: seeds the fleet, then ticks every TICK_INTERVAL_MS, publishes
// telemetry events, and manages the route lifecycle (assign / advance / clear).

import { randomUUID } from "node:crypto";

import { VEHICLE_STATUS, type LngLat, type VehicleStatus } from "@shared/types";

import { eventBus } from "@server/kafka/eventBus";
import {
  TOPIC_VEHICLE_TELEMETRY,
  TOPIC_ROUTE_ASSIGNED,
  TOPIC_ROUTE_CLEARED,
} from "@server/kafka/topics";

import {
  FLEET_SIZE,
  EN_ROUTE_TARGET,
  WITH_CUSTOMER_DRIVING_TARGET,
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
import { fetchDrivingRoute } from "@server/domain/routing";

const VEHICLE_ID_PREFIX = "veh";
const VEHICLE_ID_PAD_LENGTH = 3;
const FULL_CIRCLE_DEG = 360;
const METERS_PER_DEG_LAT = 111_000;
const METERS_PER_KM = 1000;
const MS_PER_S = 1000;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const INITIAL_BATTERY_MIN = 40;
const INITIAL_BATTERY_RANGE = 60;
const SPAWN_FREE_PROBABILITY = 0.78; // ~78% FREE, ~22% WITH_CUSTOMER at spawn
const MIN_SEGMENT_INDEX = 0;
const MIN_POLYLINE_POINTS = 2;

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
  polyline: LngLat[];
  segmentLengthsMeters: number[];
  segmentBearingsDeg: number[];
  totalMeters: number;
  traveledMeters: number;
  // EN_ROUTE routes are visible to the operator (ROUTE_ASSIGNED / ROUTE_CLEARED events fire).
  // WITH_CUSTOMER drives are simulator-internal: the vehicle moves on roads but no events publish.
  publishEvents: boolean;
}

const fleet = new Map<string, SimVehicle>();
const activeRoutesByVehicleId = new Map<string, ActiveRoute>();
const pendingRouteAssignments = new Set<string>();

function randomInRange(minValue: number, maxValue: number): number {
  return minValue + Math.random() * (maxValue - minValue);
}

function metersPerDegLng(latitudeDeg: number): number {
  return METERS_PER_DEG_LAT * Math.cos(latitudeDeg * DEG_TO_RAD);
}

function bearingDegBetween(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): number {
  const dyMeters = (endLat - startLat) * METERS_PER_DEG_LAT;
  const dxMeters = (endLng - startLng) * metersPerDegLng(startLat);
  const bearingRad = Math.atan2(dxMeters, dyMeters);
  const bearingDeg = bearingRad * RAD_TO_DEG;

  return (bearingDeg + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
}

function segmentLengthMeters(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): number {
  const dyMeters = (endLat - startLat) * METERS_PER_DEG_LAT;
  const dxMeters = (endLng - startLng) * metersPerDegLng(startLat);

  return Math.sqrt(dxMeters * dxMeters + dyMeters * dyMeters);
}

interface PrecomputedRouteShape {
  segmentLengthsMeters: number[];
  segmentBearingsDeg: number[];
  totalMeters: number;
}

function precomputeRouteShape(polyline: LngLat[]): PrecomputedRouteShape {
  const segmentLengthsMeters: number[] = [];
  const segmentBearingsDeg: number[] = [];
  let totalMeters = 0;

  for (let pointIndex = 0; pointIndex < polyline.length - 1; pointIndex += 1) {
    const [startLng, startLat] = polyline[pointIndex];
    const [endLng, endLat] = polyline[pointIndex + 1];

    const lengthMeters = segmentLengthMeters(startLat, startLng, endLat, endLng);
    const bearingDeg = bearingDegBetween(startLat, startLng, endLat, endLng);

    segmentLengthsMeters.push(lengthMeters);
    segmentBearingsDeg.push(bearingDeg);
    totalMeters += lengthMeters;
  }

  return { segmentLengthsMeters, segmentBearingsDeg, totalMeters };
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

function randomDestinationFrom(originVehicle: SimVehicle): { lat: number; lng: number } {
  const lengthKm = randomInRange(ROUTE_MIN_LENGTH_KM, ROUTE_MAX_LENGTH_KM);
  const lengthMeters = lengthKm * METERS_PER_KM;
  const bearingDeg = Math.random() * FULL_CIRCLE_DEG;
  const bearingRad = bearingDeg * DEG_TO_RAD;

  const dyMeters = Math.cos(bearingRad) * lengthMeters;
  const dxMeters = Math.sin(bearingRad) * lengthMeters;

  return {
    lat: originVehicle.lat + dyMeters / METERS_PER_DEG_LAT,
    lng: originVehicle.lng + dxMeters / metersPerDegLng(originVehicle.lat),
  };
}

function attachRouteToVehicle(
  vehicle: SimVehicle,
  polyline: LngLat[],
  timestampMs: number,
  publishEvents: boolean,
): void {
  // Visible (EN_ROUTE) routes start from a FREE vehicle and promote it.
  // Hidden (WITH_CUSTOMER) routes start from a WITH_CUSTOMER vehicle and leave its status alone.
  const expectedStatus = publishEvents ? VEHICLE_STATUS.FREE : VEHICLE_STATUS.WITH_CUSTOMER;
  if (vehicle.status !== expectedStatus) return;
  if (polyline.length < MIN_POLYLINE_POINTS) return;

  const shape = precomputeRouteShape(polyline);
  if (shape.totalMeters === 0 || shape.segmentLengthsMeters.length === 0) return;

  const routeId = randomUUID();
  const activeRoute: ActiveRoute = {
    routeId,
    polyline,
    segmentLengthsMeters: shape.segmentLengthsMeters,
    segmentBearingsDeg: shape.segmentBearingsDeg,
    totalMeters: shape.totalMeters,
    traveledMeters: 0,
    publishEvents,
  };

  activeRoutesByVehicleId.set(vehicle.id, activeRoute);
  vehicle.heading = shape.segmentBearingsDeg[MIN_SEGMENT_INDEX];

  if (publishEvents) {
    vehicle.status = VEHICLE_STATUS.EN_ROUTE;
    eventBus.publish(TOPIC_ROUTE_ASSIGNED, {
      routeId,
      vehicleId: vehicle.id,
      polyline,
      assignedAt: timestampMs,
    });
  }
}

async function initiateRouteAssignment(
  vehicle: SimVehicle,
  publishEvents: boolean,
): Promise<void> {
  try {
    const destination = randomDestinationFrom(vehicle);
    const osrmRoute = await fetchDrivingRoute(
      vehicle.lng,
      vehicle.lat,
      destination.lng,
      destination.lat,
    );

    if (osrmRoute && osrmRoute.polyline.length >= MIN_POLYLINE_POINTS) {
      attachRouteToVehicle(vehicle, osrmRoute.polyline, Date.now(), publishEvents);

      return;
    }

    // Fall back to straight-line so the simulator keeps working when OSRM fails.
    const fallbackPolyline: LngLat[] = [
      [vehicle.lng, vehicle.lat],
      [destination.lng, destination.lat],
    ];

    console.warn(`[ROUTING] Falling back to straight-line route for ${vehicle.id}`);
    attachRouteToVehicle(vehicle, fallbackPolyline, Date.now(), publishEvents);
  } finally {
    pendingRouteAssignments.delete(vehicle.id);
  }
}

function countActiveRoutesByKind(publishEvents: boolean): number {
  let count = 0;

  for (const route of activeRoutesByVehicleId.values()) {
    if (route.publishEvents === publishEvents) count += 1;
  }

  return count;
}

function countPendingByCandidateStatus(candidateStatus: VehicleStatus): number {
  let count = 0;

  for (const vehicleId of pendingRouteAssignments) {
    const vehicle = fleet.get(vehicleId);
    if (vehicle && vehicle.status === candidateStatus) count += 1;
  }

  return count;
}

function topUpRoutesForKind(
  candidateStatus: VehicleStatus,
  targetCount: number,
  publishEvents: boolean,
): void {
  const inFlight = countActiveRoutesByKind(publishEvents) + countPendingByCandidateStatus(candidateStatus);
  if (inFlight >= targetCount) return;

  const candidates: SimVehicle[] = [];

  for (const vehicle of fleet.values()) {
    if (
      vehicle.status === candidateStatus &&
      !activeRoutesByVehicleId.has(vehicle.id) &&
      !pendingRouteAssignments.has(vehicle.id)
    ) {
      candidates.push(vehicle);
    }
  }

  const slotsToFill = targetCount - inFlight;

  for (let slotIndex = 0; slotIndex < slotsToFill && candidates.length > 0; slotIndex += 1) {
    const pickIndex = Math.floor(Math.random() * candidates.length);
    const chosenVehicle = candidates.splice(pickIndex, 1)[0];

    pendingRouteAssignments.add(chosenVehicle.id);
    void initiateRouteAssignment(chosenVehicle, publishEvents);
  }
}

function assignNewRoutesIfNeeded(): void {
  topUpRoutesForKind(VEHICLE_STATUS.FREE, EN_ROUTE_TARGET, true);
  topUpRoutesForKind(VEHICLE_STATUS.WITH_CUSTOMER, WITH_CUSTOMER_DRIVING_TARGET, false);
}

function advanceEnRouteVehicle(
  vehicle: SimVehicle,
  vehicleRoute: ActiveRoute,
  timestampMs: number,
): void {
  const stepMeters = VEHICLE_SPEED_MPS * (TICK_INTERVAL_MS / MS_PER_S);
  vehicleRoute.traveledMeters += stepMeters;

  if (vehicleRoute.traveledMeters >= vehicleRoute.totalMeters) {
    const lastPoint = vehicleRoute.polyline[vehicleRoute.polyline.length - 1];
    const lastBearing =
      vehicleRoute.segmentBearingsDeg[vehicleRoute.segmentBearingsDeg.length - 1];

    vehicle.lng = lastPoint[0];
    vehicle.lat = lastPoint[1];
    vehicle.heading = lastBearing;

    activeRoutesByVehicleId.delete(vehicle.id);

    if (vehicleRoute.publishEvents) {
      // EN_ROUTE trip done: drop off, vehicle becomes available.
      vehicle.status = VEHICLE_STATUS.FREE;
      eventBus.publish(TOPIC_ROUTE_CLEARED, {
        vehicleId: vehicle.id,
        routeId: vehicleRoute.routeId,
        clearedAt: timestampMs,
      });
    }
    // WITH_CUSTOMER trip done: the passenger gets out, the next one boards; vehicle stays
    // WITH_CUSTOMER and a fresh route gets assigned on the next tick.

    return;
  }

  // Walk the polyline by accumulating segment lengths until we find the current one.
  let accumulatedMeters = 0;

  for (
    let segmentIndex = 0;
    segmentIndex < vehicleRoute.segmentLengthsMeters.length;
    segmentIndex += 1
  ) {
    const segmentLength = vehicleRoute.segmentLengthsMeters[segmentIndex];
    const segmentEndMeters = accumulatedMeters + segmentLength;

    if (segmentEndMeters >= vehicleRoute.traveledMeters) {
      const segmentProgress = (vehicleRoute.traveledMeters - accumulatedMeters) / segmentLength;
      const [startLng, startLat] = vehicleRoute.polyline[segmentIndex];
      const [endLng, endLat] = vehicleRoute.polyline[segmentIndex + 1];

      vehicle.lng = startLng + (endLng - startLng) * segmentProgress;
      vehicle.lat = startLat + (endLat - startLat) * segmentProgress;
      vehicle.heading = vehicleRoute.segmentBearingsDeg[segmentIndex];

      return;
    }

    accumulatedMeters = segmentEndMeters;
  }
}

function tick(): void {
  const timestampMs = Date.now();

  assignNewRoutesIfNeeded();

  for (const vehicle of fleet.values()) {
    const vehicleRoute = activeRoutesByVehicleId.get(vehicle.id);

    if (vehicleRoute) {
      advanceEnRouteVehicle(vehicle, vehicleRoute, timestampMs);
      vehicle.battery = Math.max(0, vehicle.battery - BATTERY_DRAIN_EN_ROUTE_PER_TICK);
    } else {
      // Idle vehicles (FREE / WITH_CUSTOMER) stay put. Telemetry still streams
      // each tick so battery drains and the "Updated Ns ago" timer keeps moving.
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

// Exposed so the heartbeat log can show the route-pipeline breakdown.
export function activeRouteCount(): number {
  return activeRoutesByVehicleId.size;
}

export function visibleRouteCount(): number {
  return countActiveRoutesByKind(true);
}

export function hiddenRouteCount(): number {
  return countActiveRoutesByKind(false);
}
