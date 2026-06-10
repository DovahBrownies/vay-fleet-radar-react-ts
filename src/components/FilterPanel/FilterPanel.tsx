import { useEffect, useMemo, useState, type ReactElement } from "react";

import { VEHICLE_STATUS, type VehicleStatus } from "@shared/types";

import { useFleetStore } from "@app/store/fleetStore";
import { isVehicleVisible } from "@app/store/visibility";
import { VEHICLE_STATUS_COLORS } from "@app/styles/colors";

import {
  Checkbox,
  CheckboxRow,
  Chip,
  ChipGroup,
  Counter,
  PanelContainer,
  PanelTitle,
  SectionDivider,
} from "./styles";

const NOW_TICK_MS = 1000;

interface ChipDescriptor {
  status: VehicleStatus;
  label: string;
}

const STATUS_CHIPS: readonly ChipDescriptor[] = [
  { status: VEHICLE_STATUS.FREE, label: "Free" },
  { status: VEHICLE_STATUS.WITH_CUSTOMER, label: "With cust." },
  { status: VEHICLE_STATUS.EN_ROUTE, label: "En route" },
];

export function FilterPanel(): ReactElement {
  const filters = useFleetStore((state) => state.filters);
  const setFilters = useFleetStore((state) => state.setFilters);
  const vehiclesById = useFleetStore((state) => state.vehiclesById);

  // Match the ticker used by the marker / route layers so the counter never
  // disagrees with what's on the map.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const handle = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);

    return () => clearInterval(handle);
  }, []);

  function toggleStatus(status: VehicleStatus): void {
    const nextStatuses = new Set(filters.statuses);

    if (nextStatuses.has(status)) {
      nextStatuses.delete(status);
    } else {
      nextStatuses.add(status);
    }

    setFilters({ statuses: nextStatuses });
  }

  const { visibleCount, totalCount } = useMemo(() => {
    const vehicles = Object.values(vehiclesById);
    const visible = vehicles.filter((vehicle) => isVehicleVisible(vehicle, filters, nowMs));

    return { visibleCount: visible.length, totalCount: vehicles.length };
  }, [vehiclesById, filters, nowMs]);

  return (
    <PanelContainer aria-label="Fleet filters">
      <PanelTitle>Filters</PanelTitle>

      <ChipGroup>
        {STATUS_CHIPS.map(({ status, label }) => {
          const active = filters.statuses.has(status);

          return (
            <Chip
              key={status}
              type="button"
              aria-pressed={active}
              $color={VEHICLE_STATUS_COLORS[status]}
              $active={active}
              onClick={() => toggleStatus(status)}
            >
              {label}
            </Chip>
          );
        })}
      </ChipGroup>

      <SectionDivider />

      <CheckboxRow>
        <Checkbox
          checked={filters.lowBatteryOnly}
          onChange={(event) => setFilters({ lowBatteryOnly: event.target.checked })}
        />
        Low battery only
      </CheckboxRow>
      <CheckboxRow>
        <Checkbox
          checked={filters.staleOnly}
          onChange={(event) => setFilters({ staleOnly: event.target.checked })}
        />
        Stale only
      </CheckboxRow>

      <Counter>
        Showing {visibleCount} of {totalCount}
      </Counter>
    </PanelContainer>
  );
}
