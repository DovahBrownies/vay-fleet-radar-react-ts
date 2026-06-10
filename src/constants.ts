// Frontend-wide constants. UI-only values.

import { VEHICLE_STATUS } from "@shared/types";
import {
  BACKEND_PORT,
  WS_PATH,
  LAS_VEGAS_CENTER_LAT,
  LAS_VEGAS_CENTER_LNG,
} from "@shared/constants";

// Constructed from the shared port + path so the server and client can never drift.
export const WS_URL = `ws://localhost:${BACKEND_PORT}${WS_PATH}`;

// Auto-reconnect parameters for the WS client.
export const WS_RECONNECT_INITIAL_DELAY_MS = 500;
export const WS_RECONNECT_MAX_DELAY_MS = 8000;
export const WS_RECONNECT_BACKOFF_FACTOR = 2;

// Map view. Center comes from the shared geographic truth.
export { LAS_VEGAS_CENTER_LAT, LAS_VEGAS_CENTER_LNG };
export const MAP_INITIAL_ZOOM = 11.5;
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

// Status color tokens - also used by the legend and the marker layer in Step 7.
export const STATUS_COLORS: Record<string, string> = {
  [VEHICLE_STATUS.FREE]: "#2e7d32",
  [VEHICLE_STATUS.WITH_CUSTOMER]: "#1565c0",
  [VEHICLE_STATUS.EN_ROUTE]: "#ef6c00",
};

// Battery alert thresholds (percent).
export const LOW_BATTERY_THRESHOLD = 25;
export const CRITICAL_BATTERY_THRESHOLD = 10;

// A vehicle is considered "stale" if we haven't received telemetry for it in this long. Slightly more than 2 ticks to absorb a single dropped batch.
export const STALE_THRESHOLD_MS = 2500;
