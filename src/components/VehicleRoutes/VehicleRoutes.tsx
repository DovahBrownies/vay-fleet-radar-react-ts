import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { FeatureCollection, LineString } from "geojson";
import { Layer, Source } from "react-map-gl/maplibre";

import type { Route, Vehicle } from "@shared/types";

import { type FleetFilters, useFleetStore } from "@app/store/fleetStore";
import { isVehicleVisible } from "@app/store/visibility";
import { VEHICLE_STATUS_COLORS } from "@app/styles/colors";

const ROUTE_LINE_WIDTH = 3;
const ROUTE_LINE_OPACITY = 0.7;
const NOW_TICK_MS = 1000;

const ROUTE_SOURCE_ID = "vehicle-routes";
const ROUTE_LINE_LAYER_ID = "vehicle-route-line";

interface RouteFeatureProperties {
  routeId: string;
  vehicleId: string;
}

function buildFeatureCollection(
  routesById: Record<string, Route>,
  vehiclesById: Record<string, Vehicle>,
  filters: FleetFilters,
  nowMs: number,
): FeatureCollection<LineString, RouteFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: Object.values(routesById)
      .filter((route) => {
        const vehicle = vehiclesById[route.vehicleId];

        // Drop the route if we have no vehicle for it, or its vehicle is filtered out.
        return vehicle ? isVehicleVisible(vehicle, filters, nowMs) : false;
      })
      .map((route) => ({
        type: "Feature",
        id: route.id,
        geometry: { type: "LineString", coordinates: route.polyline },
        properties: { routeId: route.id, vehicleId: route.vehicleId },
      })),
  };
}

export function VehicleRoutes(): ReactElement | null {
  const routesById = useFleetStore((state) => state.routesById);
  const vehiclesById = useFleetStore((state) => state.vehiclesById);
  const filters = useFleetStore((state) => state.filters);

  // Same nowMs ticker as VehicleMarkers so stale-based filtering stays accurate
  // even without telemetry.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const handle = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);

    return () => clearInterval(handle);
  }, []);

  const featureCollection = useMemo(
    () => buildFeatureCollection(routesById, vehiclesById, filters, nowMs),
    [routesById, vehiclesById, filters, nowMs],
  );

  if (featureCollection.features.length === 0) return null;

  return (
    <Source id={ROUTE_SOURCE_ID} type="geojson" data={featureCollection}>
      <Layer
        id={ROUTE_LINE_LAYER_ID}
        type="line"
        paint={{
          "line-color": VEHICLE_STATUS_COLORS.EN_ROUTE,
          "line-width": ROUTE_LINE_WIDTH,
          "line-opacity": ROUTE_LINE_OPACITY,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
    </Source>
  );
}
