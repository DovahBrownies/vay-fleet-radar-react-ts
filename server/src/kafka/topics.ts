// Kafka-style topic names. Centralized so producer + consumer agree by reference.

export const TOPIC_VEHICLE_TELEMETRY = "vehicle.telemetry";
export const TOPIC_ROUTE_ASSIGNED = "vehicle.route.assigned";
export const TOPIC_ROUTE_CLEARED = "vehicle.route.cleared";

export type Topic =
  | typeof TOPIC_VEHICLE_TELEMETRY
  | typeof TOPIC_ROUTE_ASSIGNED
  | typeof TOPIC_ROUTE_CLEARED;
