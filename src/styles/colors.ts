// Centralized color tokens. Semantic names, organized by role so callers
// reach for the *meaning* (TopBar background) rather than the value (#1f2330).
//
// If a component needs a color, import it from here — no inline hex literals
// or rgba() in styles.ts files or React inline styles.

export const SURFACE_COLORS = {
  TOP_BAR: "#1f2330",
  MAP_PLACEHOLDER: "#dde3ec",
  BODY: "#f5f5f5",
  PANEL_TRANSLUCENT: "rgba(255, 255, 255, 0.92)",
} as const;

export const TEXT_COLORS = {
  ON_DARK: "#f0f2f7",
  BODY: "#1a1a1a",
  MUTED: "#5a6072",
} as const;

export const VEHICLE_STATUS_COLORS = {
  FREE: "#2e7d32",
  WITH_CUSTOMER: "#1565c0",
  EN_ROUTE: "#ef6c00",
} as const;

export const CONNECTION_STATUS_COLORS = {
  CONNECTED: "#3ddc84",
  CONNECTING: "#ffb547",
  DISCONNECTED: "#e53935",
} as const;

export const SHADOW_COLORS = {
  PANEL: "rgba(0, 0, 0, 0.12)",
} as const;

export const MARKER_COLORS = {
  STROKE: "#ffffff",
  ARROW: "#ffffff",
} as const;

export const BATTERY_COLORS = {
  OK: "#2e7d32",
  LOW: "#ef6c00",
  CRITICAL: "#e53935",
} as const;
