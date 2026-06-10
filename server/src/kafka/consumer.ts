// Consumer: subscribes to event topics and reduces them into the domain stores.
// VehicleStore and RouteStore only mutate here.

import { eventBus } from "@server/kafka/eventBus";
import {
  TOPIC_VEHICLE_TELEMETRY,
  TOPIC_ROUTE_ASSIGNED,
  TOPIC_ROUTE_CLEARED,
} from "@server/kafka/topics";
import { vehicleStore } from "@server/domain/vehicleStore";
import { routeStore } from "@server/domain/routeStore";

export function startConsumer(): () => void {
  const unsubscribeTelemetry = eventBus.subscribe(TOPIC_VEHICLE_TELEMETRY, (telemetryEvent) => {
    const existingVehicle = vehicleStore.get(telemetryEvent.vehicleId);

    vehicleStore.upsert({
      id: telemetryEvent.vehicleId,
      lat: telemetryEvent.lat,
      lng: telemetryEvent.lng,
      heading: telemetryEvent.heading,
      battery: telemetryEvent.battery,
      status: telemetryEvent.status,
      // Preserve routeId - telemetry never owns route lifecycle.
      routeId: existingVehicle?.routeId ?? null,
      updatedAt: telemetryEvent.timestamp,
    });
  });

  const unsubscribeRouteAssigned = eventBus.subscribe(TOPIC_ROUTE_ASSIGNED, (routeAssignedEvent) => {
    routeStore.upsert({
      id: routeAssignedEvent.routeId,
      vehicleId: routeAssignedEvent.vehicleId,
      polyline: routeAssignedEvent.polyline,
      assignedAt: routeAssignedEvent.assignedAt,
    });

    const existingVehicle = vehicleStore.get(routeAssignedEvent.vehicleId);

    if (existingVehicle) {
      vehicleStore.upsert({ ...existingVehicle, routeId: routeAssignedEvent.routeId });
    }
  });

  const unsubscribeRouteCleared = eventBus.subscribe(TOPIC_ROUTE_CLEARED, (routeClearedEvent) => {
    routeStore.remove(routeClearedEvent.routeId);

    const existingVehicle = vehicleStore.get(routeClearedEvent.vehicleId);

    // Guard against a stale clear stomping on a newly-assigned route.
    if (existingVehicle && existingVehicle.routeId === routeClearedEvent.routeId) {
      vehicleStore.upsert({ ...existingVehicle, routeId: null });
    }
  });

  return () => {
    unsubscribeTelemetry();
    unsubscribeRouteAssigned();
    unsubscribeRouteCleared();
  };
}
