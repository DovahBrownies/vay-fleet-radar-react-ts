import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { FeatureCollection, Point } from "geojson";
import { Layer, Source, useMap } from "react-map-gl/maplibre";

import { VEHICLE_STATUS, type Vehicle } from "@shared/types";

import { useFleetStore } from "@app/store/fleetStore";
import { MARKER_COLORS, VEHICLE_STATUS_COLORS } from "@app/styles/colors";

const VEHICLE_BODY_RADIUS = 6;
const VEHICLE_BODY_STROKE_WIDTH = 1.5;
const ARROW_ICON_SIZE = 16;
const ARROW_ICON_SCALE = 0.85;

const ARROW_ICON_NAME = "vehicle-arrow";
const VEHICLE_SOURCE_ID = "vehicles";
const VEHICLE_BODY_LAYER_ID = "vehicle-body";
const VEHICLE_ARROW_LAYER_ID = "vehicle-arrow";

interface VehicleFeatureProperties {
  id: string;
  status: Vehicle["status"];
  heading: number;
  battery: number;
}

function buildFeatureCollection(
  vehiclesById: Record<string, Vehicle>,
): FeatureCollection<Point, VehicleFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: Object.values(vehiclesById).map((vehicle) => ({
      type: "Feature",
      id: vehicle.id,
      geometry: { type: "Point", coordinates: [vehicle.lng, vehicle.lat] },
      properties: {
        id: vehicle.id,
        status: vehicle.status,
        heading: vehicle.heading,
        battery: vehicle.battery,
      },
    })),
  };
}

// Draw a small white triangular arrow into an offscreen canvas; the resulting ImageData is registered with MapLibre via addImage() and used as the symbol layer's icon.
// Doing this client-side avoids shipping a PNG/SVG asset.
function makeArrowImageData(sizePx: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("[VehicleMarkers] could not get 2D context for arrow icon");
  }

  const center = sizePx / 2;
  const padding = 3;
  const baseY = sizePx - padding;
  const notchY = baseY - 4;

  context.fillStyle = MARKER_COLORS.ARROW;
  context.beginPath();
  context.moveTo(center, padding);
  context.lineTo(sizePx - padding, baseY);
  context.lineTo(center, notchY);
  context.lineTo(padding, baseY);
  context.closePath();
  context.fill();

  return context.getImageData(0, 0, sizePx, sizePx);
}

export function VehicleMarkers(): ReactElement | null {
  const { current: mapRef } = useMap();
  const vehiclesById = useFleetStore((state) => state.vehiclesById);
  const [iconReady, setIconReady] = useState(false);

  // Register the arrow icon once, after the style is ready. Kept alive for the
  // map's lifetime — no cleanup needed.
  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();

    function registerIcon(): void {
      if (!map.hasImage(ARROW_ICON_NAME)) {
        map.addImage(ARROW_ICON_NAME, makeArrowImageData(ARROW_ICON_SIZE));
      }

      setIconReady(true);
    }

    if (map.isStyleLoaded()) {
      registerIcon();
    } else {
      map.once("style.load", registerIcon);
    }
  }, [mapRef]);

  const featureCollection = useMemo(
    () => buildFeatureCollection(vehiclesById),
    [vehiclesById],
  );

  if (featureCollection.features.length === 0) return null;

  return (
    <Source id={VEHICLE_SOURCE_ID} type="geojson" data={featureCollection}>
      <Layer
        id={VEHICLE_BODY_LAYER_ID}
        type="circle"
        paint={{
          "circle-radius": VEHICLE_BODY_RADIUS,
          "circle-color": [
            "match",
            ["get", "status"],
            VEHICLE_STATUS.FREE,
            VEHICLE_STATUS_COLORS.FREE,
            VEHICLE_STATUS.WITH_CUSTOMER,
            VEHICLE_STATUS_COLORS.WITH_CUSTOMER,
            VEHICLE_STATUS.EN_ROUTE,
            VEHICLE_STATUS_COLORS.EN_ROUTE,
            VEHICLE_STATUS_COLORS.FREE,
          ],
          "circle-stroke-width": VEHICLE_BODY_STROKE_WIDTH,
          "circle-stroke-color": MARKER_COLORS.STROKE,
        }}
      />
      {iconReady && (
        <Layer
          id={VEHICLE_ARROW_LAYER_ID}
          type="symbol"
          layout={{
            "icon-image": ARROW_ICON_NAME,
            "icon-size": ARROW_ICON_SCALE,
            "icon-rotate": ["get", "heading"],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          }}
        />
      )}
    </Source>
  );
}
