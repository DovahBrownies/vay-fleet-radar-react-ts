import type { ReactElement } from "react";
import { VEHICLE_STATUS } from "@shared/types";

import { FilterPanel } from "@app/components/FilterPanel";
import { FleetMap } from "@app/components/FleetMap";
import { Legend } from "@app/components/Legend";
import { VehicleDetails } from "@app/components/VehicleDetails";
import { VehicleMarkers } from "@app/components/VehicleMarkers";
import { VehicleRoutes } from "@app/components/VehicleRoutes";
import { CONNECTION_STATUS, type ConnectionStatus, useFleetStore } from "@app/store/fleetStore";

import {
  ConnectionPill,
  DebugLabel,
  DebugPair,
  DebugPanel,
  DebugRow,
  DebugValue,
  MapStage,
  PageContainer,
  StatusGroup,
  Title,
  TopBar,
} from "./styles";

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  [CONNECTION_STATUS.CONNECTING]: "Connecting…",
  [CONNECTION_STATUS.CONNECTED]: "Connected",
  [CONNECTION_STATUS.DISCONNECTED]: "Disconnected",
};

const NO_SERVER_TIME_PLACEHOLDER = "-";

export function FleetRadarPage(): ReactElement {
  const connection = useFleetStore((state) => state.connection);
  const serverTimeMs = useFleetStore((state) => state.serverTimeMs);
  const vehiclesById = useFleetStore((state) => state.vehiclesById);
  const routesById = useFleetStore((state) => state.routesById);

  const vehicles = Object.values(vehiclesById);
  const enRouteCount = vehicles.filter(
    (vehicle) => vehicle.status === VEHICLE_STATUS.EN_ROUTE,
  ).length;
  const freeCount = vehicles.filter((vehicle) => vehicle.status === VEHICLE_STATUS.FREE).length;
  const withCustomerCount = vehicles.filter(
    (vehicle) => vehicle.status === VEHICLE_STATUS.WITH_CUSTOMER,
  ).length;
  const routeCount = Object.keys(routesById).length;
  const serverTimeLabel = serverTimeMs
    ? new Date(serverTimeMs).toLocaleTimeString()
    : NO_SERVER_TIME_PLACEHOLDER;

  return (
    <PageContainer>
      <TopBar>
        <Title>FLEET RADAR</Title>
        <StatusGroup>
          <ConnectionPill $status={connection}>{CONNECTION_LABELS[connection]}</ConnectionPill>
          <DebugPair>
            <DebugLabel>Server time</DebugLabel>
            <DebugValue>{serverTimeLabel}</DebugValue>
          </DebugPair>
        </StatusGroup>
      </TopBar>

      <MapStage>
        <FleetMap>
          <VehicleRoutes />
          <VehicleMarkers />
        </FleetMap>
        <Legend />
        <FilterPanel />
        <VehicleDetails />
        <DebugPanel>
          <DebugRow>
            <DebugPair>
              <DebugLabel>Vehicles</DebugLabel>
              <DebugValue>{vehicles.length}</DebugValue>
            </DebugPair>
          </DebugRow>
          <DebugRow>
            <DebugPair>
              <DebugLabel>FREE</DebugLabel>
              <DebugValue>{freeCount}</DebugValue>
            </DebugPair>
            <DebugPair>
              <DebugLabel>WITH_CUSTOMER</DebugLabel>
              <DebugValue>{withCustomerCount}</DebugValue>
            </DebugPair>
            <DebugPair>
              <DebugLabel>EN_ROUTE</DebugLabel>
              <DebugValue>{enRouteCount}</DebugValue>
            </DebugPair>
          </DebugRow>
          <DebugRow>
            <DebugPair>
              <DebugLabel>Routes</DebugLabel>
              <DebugValue>{routeCount}</DebugValue>
            </DebugPair>
          </DebugRow>
        </DebugPanel>
      </MapStage>
    </PageContainer>
  );
}
