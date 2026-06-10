import { useMemo, type ReactElement } from "react";
import type { FeatureCollection, LineString } from "geojson";
import { Layer, Source } from "react-map-gl/maplibre";

import type { Route } from "@shared/types";

import { useFleetStore } from "@app/store/fleetStore";
import { VEHICLE_STATUS_COLORS } from "@app/styles/colors";

const ROUTE_LINE_WIDTH = 3;
const ROUTE_LINE_OPACITY = 0.7;

const ROUTE_SOURCE_ID = "vehicle-routes";
const ROUTE_LINE_LAYER_ID = "vehicle-route-line";

interface RouteFeatureProperties {
  routeId: string;
  vehicleId: string;
}

function buildFeatureCollection(
  routesById: Record<string, Route>,
): FeatureCollection<LineString, RouteFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: Object.values(routesById).map((route) => ({
      type: "Feature",
      id: route.id,
      geometry: { type: "LineString", coordinates: route.polyline },
      properties: { routeId: route.id, vehicleId: route.vehicleId },
    })),
  };
}

export function VehicleRoutes(): ReactElement | null {
  const routesById = useFleetStore((state) => state.routesById);

  const featureCollection = useMemo(
    () => buildFeatureCollection(routesById),
    [routesById],
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
