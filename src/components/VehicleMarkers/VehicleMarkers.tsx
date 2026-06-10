import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { Layer, Source, useMap } from "react-map-gl/maplibre";

import { VEHICLE_STATUS, type Vehicle } from "@shared/types";

import {
  NORMAL_MARKER_OPACITY,
  STALE_MARKER_OPACITY,
  STALE_THRESHOLD_MS,
} from "@app/constants";
import { type FleetFilters, useFleetStore } from "@app/store/fleetStore";
import { isVehicleVisible } from "@app/store/visibility";
import { MARKER_COLORS, VEHICLE_STATUS_COLORS } from "@app/styles/colors";

const VEHICLE_BODY_RADIUS = 6;
const VEHICLE_BODY_RADIUS_SELECTED = 10;
const VEHICLE_BODY_STROKE_WIDTH = 1.5;
const VEHICLE_BODY_STROKE_WIDTH_SELECTED = 3;
const ARROW_ICON_SIZE = 16;
const ARROW_ICON_SCALE = 0.85;
const NOW_TICK_MS = 1000;

const ARROW_ICON_NAME = "vehicle-arrow";
const VEHICLE_SOURCE_ID = "vehicles";
const VEHICLE_BODY_LAYER_ID = "vehicle-body";
const VEHICLE_ARROW_LAYER_ID = "vehicle-arrow";

interface VehicleFeatureProperties {
  id: string;
  status: Vehicle["status"];
  heading: number;
  battery: number;
  selected: boolean;
  visible: boolean;
  stale: boolean;
}

function buildFeatureCollection(
  vehiclesById: Record<string, Vehicle>,
  selectedVehicleId: string | null,
  filters: FleetFilters,
  nowMs: number,
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
        selected: vehicle.id === selectedVehicleId,
        visible: isVehicleVisible(vehicle, filters, nowMs),
        stale: nowMs - vehicle.updatedAt > STALE_THRESHOLD_MS,
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
  const selectedVehicleId = useFleetStore((state) => state.selectedVehicleId);
  const filters = useFleetStore((state) => state.filters);
  const selectVehicle = useFleetStore((state) => state.selectVehicle);
  const [iconReady, setIconReady] = useState(false);

  // Tick "now" once per second so stale-based filtering stays accurate even when
  // telemetry stops flowing. Date.now() in render would violate React 19 purity.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const handle = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);

    return () => clearInterval(handle);
  }, []);

  // Register the arrow icon once, after the style is ready. Kept alive for the map's lifetime - no cleanup needed.
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

  // Click + hover handlers. Clicking a vehicle selects it; clicking off any
  // vehicle clears the selection. Cursor flips to pointer over markers.
  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();

    function handleClick(event: MapLayerMouseEvent): void {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [VEHICLE_BODY_LAYER_ID],
      });

      if (features.length > 0) {
        const clickedId = features[0].properties?.id as string | undefined;
        selectVehicle(clickedId ?? null);
      } else {
        selectVehicle(null);
      }
    }

    function handleMouseEnter(): void {
      map.getCanvas().style.cursor = "pointer";
    }

    function handleMouseLeave(): void {
      map.getCanvas().style.cursor = "";
    }

    map.on("click", handleClick);
    map.on("mouseenter", VEHICLE_BODY_LAYER_ID, handleMouseEnter);
    map.on("mouseleave", VEHICLE_BODY_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("click", handleClick);
      map.off("mouseenter", VEHICLE_BODY_LAYER_ID, handleMouseEnter);
      map.off("mouseleave", VEHICLE_BODY_LAYER_ID, handleMouseLeave);
    };
  }, [mapRef, selectVehicle]);

  const featureCollection = useMemo(
    () => buildFeatureCollection(vehiclesById, selectedVehicleId, filters, nowMs),
    [vehiclesById, selectedVehicleId, filters, nowMs],
  );

  if (featureCollection.features.length === 0) return null;

  return (
    <Source id={VEHICLE_SOURCE_ID} type="geojson" data={featureCollection}>
      <Layer
        id={VEHICLE_BODY_LAYER_ID}
        type="circle"
        filter={["get", "visible"]}
        paint={{
          "circle-radius": [
            "case",
            ["get", "selected"],
            VEHICLE_BODY_RADIUS_SELECTED,
            VEHICLE_BODY_RADIUS,
          ],
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
          "circle-stroke-width": [
            "case",
            ["get", "selected"],
            VEHICLE_BODY_STROKE_WIDTH_SELECTED,
            VEHICLE_BODY_STROKE_WIDTH,
          ],
          "circle-stroke-color": MARKER_COLORS.STROKE,
          "circle-opacity": [
            "case",
            ["get", "stale"],
            STALE_MARKER_OPACITY,
            NORMAL_MARKER_OPACITY,
          ],
          "circle-stroke-opacity": [
            "case",
            ["get", "stale"],
            STALE_MARKER_OPACITY,
            NORMAL_MARKER_OPACITY,
          ],
        }}
      />
      {iconReady && (
        <Layer
          id={VEHICLE_ARROW_LAYER_ID}
          type="symbol"
          filter={["get", "visible"]}
          layout={{
            "icon-image": ARROW_ICON_NAME,
            "icon-size": ARROW_ICON_SCALE,
            "icon-rotate": ["get", "heading"],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          }}
          paint={{
            "icon-opacity": [
              "case",
              ["get", "stale"],
              STALE_MARKER_OPACITY,
              NORMAL_MARKER_OPACITY,
            ],
          }}
        />
      )}
    </Source>
  );
}
