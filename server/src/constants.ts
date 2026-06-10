// All server-sided constants. Networking + city center come from @shared/constants
// so the frontend and the simulator can never drift apart.

export {
  BACKEND_PORT as PORT,
  WS_PATH,
  LAS_VEGAS_CENTER_LAT,
  LAS_VEGAS_CENTER_LNG,
} from "@shared/constants";

export const FLEET_SIZE = 100;
export const EN_ROUTE_TARGET = 10;

export const TICK_INTERVAL_MS = 1000;
export const BROADCAST_INTERVAL_MS = 1000;

export const VEHICLE_SPEED_MPS = 12;
export const BATTERY_DRAIN_PER_TICK = 0.03;
export const BATTERY_DRAIN_EN_ROUTE_PER_TICK = 0.08;

export const CITY_SPAWN_RADIUS_KM = 6;
export const ROUTE_MIN_LENGTH_KM = 1.5;
export const ROUTE_MAX_LENGTH_KM = 6;
