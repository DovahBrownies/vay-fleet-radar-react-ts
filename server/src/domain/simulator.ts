// Vehicle simulator: seeds the fleet, then ticks every TICK_INTERVAL_MS and publishes
// TelemetryEvents

import { eventBus } from "../kafka/eventBus.js";
import { TOPIC_VEHICLE_TELEMETRY } from "../kafka/topics.js";
import type { VehicleStatus } from "../../../shared/types.js";
import {
  FLEET_SIZE,
  TICK_INTERVAL_MS,
  LAS_VEGAS_CENTER_LAT,
  LAS_VEGAS_CENTER_LNG,
  CITY_SPAWN_RADIUS_KM,
  BATTERY_DRAIN_PER_TICK,
} from "../constants.js";

const VEHICLE_ID_PREFIX = "veh";
const VEHICLE_ID_PAD_LENGTH = 3;
const FULL_CIRCLE_DEG = 360;
const KM_PER_DEG_LAT = 111;
const INITIAL_BATTERY_MIN = 40;
const INITIAL_BATTERY_RANGE = 60;
const STATUS_WEIGHT_FREE = 0.7;
const STATUS_WEIGHT_CUSTOMER = 0.2;
const IDLE_JITTER_DEG = 0.00015;
const HEADING_JITTER_DEG = 5;

interface SimVehicle {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  battery: number;
  status: VehicleStatus;
}

const fleet = new Map<string, SimVehicle>();

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickInitialStatus(): VehicleStatus {
  const roll = Math.random();
  if (roll < STATUS_WEIGHT_FREE) return "FREE";
  if (roll < STATUS_WEIGHT_FREE + STATUS_WEIGHT_CUSTOMER) return "WITH_CUSTOMER";
  return "EN_ROUTE";
}

function spawnVehicle(index: number): SimVehicle {
  const radiusDeg = CITY_SPAWN_RADIUS_KM / KM_PER_DEG_LAT;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radiusDeg;
  return {
    id: `${VEHICLE_ID_PREFIX}-${String(index).padStart(VEHICLE_ID_PAD_LENGTH, "0")}`,
    lat: LAS_VEGAS_CENTER_LAT + Math.sin(angle) * distance,
    lng: LAS_VEGAS_CENTER_LNG + Math.cos(angle) * distance,
    heading: Math.random() * FULL_CIRCLE_DEG,
    battery: INITIAL_BATTERY_MIN + Math.random() * INITIAL_BATTERY_RANGE,
    status: pickInitialStatus(),
  };
}

function seedFleet(): void {
  for (let i = 0; i < FLEET_SIZE; i += 1) {
    const v = spawnVehicle(i);
    fleet.set(v.id, v);
  }
}

function tickVehicle(v: SimVehicle): SimVehicle {
  return {
    ...v,
    lat: v.lat + randomInRange(-IDLE_JITTER_DEG, IDLE_JITTER_DEG),
    lng: v.lng + randomInRange(-IDLE_JITTER_DEG, IDLE_JITTER_DEG),
    heading:
      (v.heading + randomInRange(-HEADING_JITTER_DEG, HEADING_JITTER_DEG) + FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG,
    battery: Math.max(0, v.battery - BATTERY_DRAIN_PER_TICK),
  };
}

function tick(): void {
  const now = Date.now();
  for (const [id, v] of fleet) {
    const next = tickVehicle(v);
    fleet.set(id, next);
    eventBus.publish(TOPIC_VEHICLE_TELEMETRY, {
      vehicleId: id,
      lat: next.lat,
      lng: next.lng,
      heading: next.heading,
      battery: next.battery,
      status: next.status,
      timestamp: now,
    });
  }
}

export function startSimulator(): () => void {
  seedFleet();
  // Emit one tick immediately so consumers see initial state.
  tick();
  const handle = setInterval(tick, TICK_INTERVAL_MS);
  return () => clearInterval(handle);
}
