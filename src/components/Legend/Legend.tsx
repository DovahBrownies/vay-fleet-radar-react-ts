import type { ReactElement } from "react";
import { VEHICLE_STATUS, type VehicleStatus } from "@shared/types";
import { VEHICLE_STATUS_COLORS } from "@app/styles/colors";

import { LegendContainer, LegendLabel, LegendRow, LegendTitle, Swatch } from "./styles";

interface LegendItem {
  status: VehicleStatus;
  label: string;
}

const LEGEND_ITEMS: readonly LegendItem[] = [
  { status: VEHICLE_STATUS.FREE, label: "Free" },
  { status: VEHICLE_STATUS.WITH_CUSTOMER, label: "With customer" },
  { status: VEHICLE_STATUS.EN_ROUTE, label: "En route" },
];

export function Legend(): ReactElement {
  return (
    <LegendContainer aria-label="Map legend">
      <LegendTitle>Legend</LegendTitle>
      {LEGEND_ITEMS.map(({ status, label }) => (
        <LegendRow key={status}>
          <Swatch $color={VEHICLE_STATUS_COLORS[status]} aria-hidden />
          <LegendLabel>{label}</LegendLabel>
        </LegendRow>
      ))}
    </LegendContainer>
  );
}
