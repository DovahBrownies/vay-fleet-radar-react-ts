import type { ReactElement } from "react";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  LAS_VEGAS_CENTER_LAT,
  LAS_VEGAS_CENTER_LNG,
  MAP_INITIAL_ZOOM,
  MAP_STYLE_URL,
} from "@app/constants";

import { MapContainer } from "./styles";

const MAP_FILL_STYLE = { width: "100%", height: "100%" };

export function FleetMap(): ReactElement {
  return (
    <MapContainer>
      <Map
        initialViewState={{
          longitude: LAS_VEGAS_CENTER_LNG,
          latitude: LAS_VEGAS_CENTER_LAT,
          zoom: MAP_INITIAL_ZOOM,
        }}
        mapStyle={MAP_STYLE_URL}
        style={MAP_FILL_STYLE}
      />
    </MapContainer>
  );
}
