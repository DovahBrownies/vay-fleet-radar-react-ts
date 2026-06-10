// OSRM client.

import type { LngLat } from "@shared/types";

import { OSRM_BASE_URL, OSRM_TIMEOUT_MS } from "@server/constants";

const COORDINATE_DECIMAL_PLACES = 6;

interface OsrmRouteResult {
  polyline: LngLat[];
  distanceMeters: number;
}

interface OsrmResponseRoute {
  geometry: { type: "LineString"; coordinates: LngLat[] };
  distance: number;
  duration: number;
}

interface OsrmResponse {
  code: string;
  routes?: OsrmResponseRoute[];
  message?: string;
}

function fixedCoord(value: number): string {
  return value.toFixed(COORDINATE_DECIMAL_PLACES);
}

export async function fetchDrivingRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
): Promise<OsrmRouteResult | null> {
  const coords = `${fixedCoord(startLng)},${fixedCoord(startLat)};${fixedCoord(endLng)},${fixedCoord(endLat)}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), OSRM_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: abortController.signal });
    clearTimeout(timeoutHandle);

    if (!response.ok) {
      console.warn(`[ROUTING] OSRM responded ${response.status} ${response.statusText}`);

      return null;
    }

    const data = (await response.json()) as OsrmResponse;

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn(`[ROUTING] OSRM returned no routes (code=${data.code}, message=${data.message ?? "n/a"})`);

      return null;
    }

    const [firstRoute] = data.routes;

    if (firstRoute.geometry.coordinates.length < 2) {
      console.warn("[ROUTING] OSRM route had fewer than 2 points");

      return null;
    }

    return {
      polyline: firstRoute.geometry.coordinates,
      distanceMeters: firstRoute.distance,
    };
  } catch (error) {
    clearTimeout(timeoutHandle);

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ROUTING] OSRM fetch failed: ${message}`);

    return null;
  }
}
