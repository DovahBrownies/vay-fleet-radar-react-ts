
import { useEffect, useState, type ReactElement } from "react";

import { VEHICLE_STATUS, type Vehicle } from "@shared/types";
import { CRITICAL_BATTERY_THRESHOLD, LOW_BATTERY_THRESHOLD } from "@app/constants";
import { useFleetStore } from "@app/store/fleetStore";
import { BATTERY_COLORS } from "@app/styles/colors";

import {
  ActionButton,
  Actions,
  BatteryValue,
  CloseButton,
  DetailLabel,
  DetailRow,
  DetailValue,
  DetailsCard,
  DetailsHeader,
  DetailsSection,
  DetailsTitle,
  DetailsTitleGroup,
  StatusBadge,
} from "./styles";

const COORD_PRECISION = 5;
const HEADING_PRECISION = 0;
const BATTERY_PRECISION = 0;
const STALE_THRESHOLD_S = 60;
const MS_PER_S = 1000;
const S_PER_MINUTE = 60;
const RELATIVE_TIME_TICK_MS = 1000;

const STATUS_LABEL: Record<Vehicle["status"], string> = {
  [VEHICLE_STATUS.FREE]: "Free",
  [VEHICLE_STATUS.WITH_CUSTOMER]: "With customer",
  [VEHICLE_STATUS.EN_ROUTE]: "En route",
};

const CLOSE_LABEL = "Close details";
const CLOSE_SYMBOL = "×";

function batteryColor(battery: number): string {
  if (battery <= CRITICAL_BATTERY_THRESHOLD) return BATTERY_COLORS.CRITICAL;

  if (battery <= LOW_BATTERY_THRESHOLD) return BATTERY_COLORS.LOW;

  return BATTERY_COLORS.OK;
}

function formatRelativeTime(updatedAtMs: number, nowMs: number): string {
  const elapsedS = Math.max(0, Math.round((nowMs - updatedAtMs) / MS_PER_S));

  if (elapsedS < 2) return "just now";

  if (elapsedS < STALE_THRESHOLD_S) return `${elapsedS}s ago`;

  const elapsedMin = Math.floor(elapsedS / S_PER_MINUTE);

  return `${elapsedMin}m ago`;
}

function handleDispatchFieldAgent(vehicleId: string): void {
  console.log(`[ACTION] Dispatch field agent to ${vehicleId}`);
}

function handleSupportTrip(vehicleId: string): void {
  console.log(`[ACTION] Support trip for ${vehicleId}`);
}

export function VehicleDetails(): ReactElement | null {
  const selectedVehicleId = useFleetStore((state) => state.selectedVehicleId);
  const vehicle = useFleetStore((state) =>
    state.selectedVehicleId ? (state.vehiclesById[state.selectedVehicleId] ?? null) : null,
  );
  const route = useFleetStore((state) =>
    vehicle?.routeId ? (state.routesById[vehicle.routeId] ?? null) : null,
  );
  const selectVehicle = useFleetStore((state) => state.selectVehicle);

  // Tick "now" once per second so "Updated" stays fresh while the panel is open.
  // Tried calling Date.now() in render but that's problematic so we capture it as state instead.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!selectedVehicleId) return;

    const handle = setInterval(() => setNowMs(Date.now()), RELATIVE_TIME_TICK_MS);

    return () => clearInterval(handle);
  }, [selectedVehicleId]);

  if (!selectedVehicleId || !vehicle) return null;

  const relativeUpdated = formatRelativeTime(vehicle.updatedAt, nowMs);

  return (
    <DetailsCard aria-label={`Details for vehicle ${vehicle.id}`}>
      <DetailsHeader>
        <DetailsTitleGroup>
          <DetailsTitle>{vehicle.id}</DetailsTitle>
          <StatusBadge $status={vehicle.status}>{STATUS_LABEL[vehicle.status]}</StatusBadge>
        </DetailsTitleGroup>
        <CloseButton
          type="button"
          aria-label={CLOSE_LABEL}
          onClick={() => selectVehicle(null)}
        >
          {CLOSE_SYMBOL}
        </CloseButton>
      </DetailsHeader>

      <DetailsSection>
        <DetailRow>
          <DetailLabel>Battery</DetailLabel>
          <BatteryValue $color={batteryColor(vehicle.battery)}>
            {vehicle.battery.toFixed(BATTERY_PRECISION)}%
          </BatteryValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Heading</DetailLabel>
          <DetailValue>{vehicle.heading.toFixed(HEADING_PRECISION)}°</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Position</DetailLabel>
          <DetailValue>
            {vehicle.lat.toFixed(COORD_PRECISION)}, {vehicle.lng.toFixed(COORD_PRECISION)}
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Updated</DetailLabel>
          <DetailValue>{relativeUpdated}</DetailValue>
        </DetailRow>
      </DetailsSection>

      {route && (
        <DetailsSection>
          <DetailRow>
            <DetailLabel>Route</DetailLabel>
            <DetailValue>{route.id.slice(0, 8)}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Waypoints</DetailLabel>
            <DetailValue>{route.polyline.length}</DetailValue>
          </DetailRow>
        </DetailsSection>
      )}

      <Actions>
        <ActionButton type="button" onClick={() => handleDispatchFieldAgent(vehicle.id)}>
          Dispatch field agent
        </ActionButton>
        <ActionButton type="button" onClick={() => handleSupportTrip(vehicle.id)}>
          Support trip
        </ActionButton>
      </Actions>
    </DetailsCard>
  );
}
