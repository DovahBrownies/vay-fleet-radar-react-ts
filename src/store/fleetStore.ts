// Frontend source of truth. Wire messages flow in via applyMessage().
// UI components subscribe via selectors so a single vehicle tick doesn't re-render anything that didn't change.

import { create } from "zustand";

import {
  WS_MESSAGE_TYPE,
  type Route,
  type Vehicle,
  type VehicleStatus,
  type WSMessage,
} from "@shared/types";

export const CONNECTION_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export interface FleetFilters {
  statuses: ReadonlySet<VehicleStatus>;
  lowBatteryOnly: boolean;
  staleOnly: boolean;
}

interface FleetState {
  vehiclesById: Record<string, Vehicle>;
  routesById: Record<string, Route>;
  selectedVehicleId: string | null;
  filters: FleetFilters;
  connection: ConnectionStatus;
  serverTimeMs: number | null;

  applyMessage: (message: WSMessage) => void;
  selectVehicle: (vehicleId: string | null) => void;
  setFilters: (patch: Partial<FleetFilters>) => void;
  setConnection: (connection: ConnectionStatus) => void;
}

const INITIAL_FILTERS: FleetFilters = {
  statuses: new Set(),
  lowBatteryOnly: false,
  staleOnly: false,
};

export const useFleetStore = create<FleetState>((set) => ({
  vehiclesById: {},
  routesById: {},
  selectedVehicleId: null,
  filters: INITIAL_FILTERS,
  connection: CONNECTION_STATUS.CONNECTING,
  serverTimeMs: null,

  applyMessage: (message) => {
    if (message.type === WS_MESSAGE_TYPE.SNAPSHOT) {
      const vehiclesById: Record<string, Vehicle> = {};

      for (const vehicle of message.vehicles) {
        vehiclesById[vehicle.id] = vehicle;
      }

      const routesById: Record<string, Route> = {};

      for (const route of message.routes) {
        routesById[route.id] = route;
      }

      set({ vehiclesById, routesById, serverTimeMs: message.serverTime });

      return;
    }

    if (message.type === WS_MESSAGE_TYPE.TELEMETRY_BATCH) {
      set((state) => {
        const nextVehiclesById = { ...state.vehiclesById };

        for (const telemetry of message.updates) {
          const existingVehicle = nextVehiclesById[telemetry.vehicleId];
          nextVehiclesById[telemetry.vehicleId] = {
            id: telemetry.vehicleId,
            lat: telemetry.lat,
            lng: telemetry.lng,
            heading: telemetry.heading,
            battery: telemetry.battery,
            status: telemetry.status,
            // Preserve routeId - telemetry never owns route lifecycle, route events do.
            routeId: existingVehicle?.routeId ?? null,
            updatedAt: telemetry.timestamp,
          };
        }

        return { vehiclesById: nextVehiclesById };
      });

      return;
    }

    if (message.type === WS_MESSAGE_TYPE.ROUTE_ASSIGNED) {
      set((state) => {
        const nextRoutesById = { ...state.routesById, [message.route.id]: message.route };
        const existingVehicle = state.vehiclesById[message.route.vehicleId];
        const nextVehiclesById = existingVehicle
          ? {
              ...state.vehiclesById,
              [existingVehicle.id]: { ...existingVehicle, routeId: message.route.id },
            }
          : state.vehiclesById;

        return { routesById: nextRoutesById, vehiclesById: nextVehiclesById };
      });

      return;
    }

    if (message.type === WS_MESSAGE_TYPE.ROUTE_CLEARED) {
      set((state) => {
        const { [message.routeId]: _removedRoute, ...nextRoutesById } = state.routesById;
        const existingVehicle = state.vehiclesById[message.vehicleId];
        const nextVehiclesById =
          existingVehicle && existingVehicle.routeId === message.routeId
            ? {
                ...state.vehiclesById,
                [existingVehicle.id]: { ...existingVehicle, routeId: null },
              }
            : state.vehiclesById;

        return { routesById: nextRoutesById, vehiclesById: nextVehiclesById };
      });

      return;
    }
  },

  selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId }),

  setFilters: (patch) =>
    set((state) => ({
      filters: { ...state.filters, ...patch },
    })),

  setConnection: (connection) => set({ connection }),
}));
