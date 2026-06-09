// All common types.
// ! NOTE: The server emits Kafka-style events; the client receives WS messages.

export type VehicleStatus = "FREE" | "WITH_CUSTOMER" | "EN_ROUTE";

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

/**
 * Kafka-style events that flow through the in-process event bus.
 * The server publishes; the consumer reduces them into VehicleStore.
 */

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

/**
 * Messages the WebSocket server pushes to clients.
 * - SNAPSHOT: full state on connect
 * - TELEMETRY_BATCH: per-tick deltas
 * - ROUTE_ASSIGNED / ROUTE_CLEARED: route lifecycle
 */

export type WSMessage =
  | { type: "SNAPSHOT"; vehicles: Vehicle[]; routes: Route[]; serverTime: number }
  | { type: "TELEMETRY_BATCH"; updates: TelemetryEvent[] }
  | { type: "ROUTE_ASSIGNED"; route: Route }
  | { type: "ROUTE_CLEARED"; vehicleId: string; routeId: string };
