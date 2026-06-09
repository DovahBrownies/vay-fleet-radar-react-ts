// All common types.
// ! NOTE: The server emits Kafka-style events; the client receives WS messages.

export const VEHICLE_STATUS = {
  FREE: "FREE",
  WITH_CUSTOMER: "WITH_CUSTOMER",
  EN_ROUTE: "EN_ROUTE",
} as const;

export type VehicleStatus = (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];

export type LngLat = [number, number];

export interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  battery: number;
  status: VehicleStatus;
  routeId: string | null;
  updatedAt: number;
}

export interface Route {
  id: string;
  vehicleId: string;
  polyline: LngLat[];
  assignedAt: number;
}

// Kafka-style events that flow through the in-process event bus.
// The server publishes; the consumer reduces them into VehicleStore / RouteStore.

export interface TelemetryEvent {
  vehicleId: string;
  lat: number;
  lng: number;
  heading: number;
  battery: number;
  status: VehicleStatus;
  timestamp: number;
}

export interface RouteAssignmentEvent {
  routeId: string;
  vehicleId: string;
  polyline: LngLat[];
  assignedAt: number;
}

export interface RouteClearedEvent {
  vehicleId: string;
  routeId: string;
  clearedAt: number;
}

// Messages the WebSocket server pushes to clients.
// - SNAPSHOT:         full state on connect
// - TELEMETRY_BATCH:  per-broadcast-tick deltas
// - ROUTE_ASSIGNED / ROUTE_CLEARED: route lifecycle, forwarded immediately

export type WSMessage =
  | { type: "SNAPSHOT"; vehicles: Vehicle[]; routes: Route[]; serverTime: number }
  | { type: "TELEMETRY_BATCH"; updates: TelemetryEvent[] }
  | { type: "ROUTE_ASSIGNED"; route: Route }
  | { type: "ROUTE_CLEARED"; vehicleId: string; routeId: string };
