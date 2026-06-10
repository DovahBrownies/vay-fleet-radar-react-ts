// Single source of truth for "is this vehicle visible under the current filters?"
// Used by
// - VehicleMarkers (per-feature visibility)
// - VehicleRoutes (hide line if its vehicle is filtered out)
// - FilterPanel (counter).

import type { Vehicle } from "@shared/types";

import { LOW_BATTERY_THRESHOLD, STALE_THRESHOLD_MS } from "@app/constants";
import type { FleetFilters } from "@app/store/fleetStore";

export function isVehicleVisible(
  vehicle: Vehicle,
  filters: FleetFilters,
  nowMs: number,
): boolean {
  // Status set is exhaustive - only listed statuses are visible. Empty set hides everything.
  if (!filters.statuses.has(vehicle.status)) {
    return false;
  }

  if (filters.lowBatteryOnly && vehicle.battery > LOW_BATTERY_THRESHOLD) {
    return false;
  }

  if (filters.staleOnly && nowMs - vehicle.updatedAt <= STALE_THRESHOLD_MS) {
    return false;
  }

  return true;
}
