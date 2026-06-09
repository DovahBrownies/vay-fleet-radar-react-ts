// In-memory source of truth for vehicle state.
// Read-only from the outside; the consumer is the only writer.

import type { Vehicle } from "@shared/types";

class VehicleStore {
  private vehicles = new Map<string, Vehicle>();

  upsert(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
  }

  get(vehicleId: string): Vehicle | undefined {
    return this.vehicles.get(vehicleId);
  }

  all(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  size(): number {
    return this.vehicles.size;
  }
}

export const vehicleStore = new VehicleStore();
