// Consumer: subscribes to event topics and reduces them into the VehicleStore.
// The store only mutates here, mirroring how a Kafka consumer materializes state.

import { eventBus } from "./eventBus.js";
import { TOPIC_VEHICLE_TELEMETRY } from "./topics.js";
import { vehicleStore } from "../domain/vehicleStore.js";

export function startConsumer(): () => void {
  const unsubTelemetry = eventBus.subscribe(TOPIC_VEHICLE_TELEMETRY, (e) => {
    const existing = vehicleStore.get(e.vehicleId);
    vehicleStore.upsert({
      id: e.vehicleId,
      lat: e.lat,
      lng: e.lng,
      heading: e.heading,
      battery: e.battery,
      status: e.status,
      routeId: existing?.routeId ?? null,
      updatedAt: e.timestamp,
    });
  });

  return () => {
    unsubTelemetry();
  };
}
