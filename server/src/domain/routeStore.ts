// In-memory store of currently-assigned routes. Only the consumer mutates it.

import type { Route } from "@shared/types";

class RouteStore {
  private byId = new Map<string, Route>();
  private byVehicle = new Map<string, string>();

  upsert(route: Route): void {
    this.byId.set(route.id, route);
    this.byVehicle.set(route.vehicleId, route.id);
  }

  remove(routeId: string): void {
    const route = this.byId.get(routeId);

    if (!route) return;

    this.byId.delete(routeId);

    if (this.byVehicle.get(route.vehicleId) === routeId) {
      this.byVehicle.delete(route.vehicleId);
    }
  }

  getByVehicle(vehicleId: string): Route | undefined {
    const routeId = this.byVehicle.get(vehicleId);

    return routeId ? this.byId.get(routeId) : undefined;
  }

  all(): Route[] {
    return Array.from(this.byId.values());
  }

  size(): number {
    return this.byId.size;
  }
}

export const routeStore = new RouteStore();
