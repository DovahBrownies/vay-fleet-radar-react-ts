import styled from "styled-components";

import {
  MARKER_COLORS,
  SHADOW_COLORS,
  SURFACE_COLORS,
  TEXT_COLORS,
} from "@app/styles/colors";

const PANEL_OFFSET_REM = 1.5;
const PANEL_WIDTH_REM = 16;
const PANEL_PADDING_Y_REM = 0.875;
const PANEL_PADDING_X_REM = 1;
const PANEL_RADIUS_REM = 0.5;
const PANEL_FONT_SIZE_REM = 0.8125;
const PANEL_SHADOW_OFFSET_Y_REM = 0.125;
const PANEL_SHADOW_BLUR_REM = 0.5;
const PANEL_TITLE_FONT_SIZE_REM = 0.6875;
const PANEL_TITLE_LETTER_SPACING_REM = 0.05;
const PANEL_TITLE_GAP_REM = 0.5;
const PANEL_SECTION_GAP_REM = 0.625;
const CHIP_GROUP_GAP_REM = 0.375;
const CHIP_PADDING_Y_REM = 0.25;
const CHIP_PADDING_X_REM = 0.625;
const CHIP_RADIUS_REM = 1;
const CHIP_BORDER_WIDTH_REM = 0.0625;
const CHECKBOX_GAP_REM = 0.5;
const CHECKBOX_SIZE_REM = 1;
const COUNTER_FONT_SIZE_REM = 0.75;
const DIVIDER_GAP_REM = 0.625;

export const PanelContainer = styled.aside`
  position: absolute;
  bottom: ${PANEL_OFFSET_REM}rem;
  right: ${PANEL_OFFSET_REM}rem;
  width: ${PANEL_WIDTH_REM}rem;
  padding: ${PANEL_PADDING_Y_REM}rem ${PANEL_PADDING_X_REM}rem;
  background: ${SURFACE_COLORS.PANEL_TRANSLUCENT};
  border-radius: ${PANEL_RADIUS_REM}rem;
  box-shadow: 0 ${PANEL_SHADOW_OFFSET_Y_REM}rem ${PANEL_SHADOW_BLUR_REM}rem
    ${SHADOW_COLORS.PANEL};
  font-size: ${PANEL_FONT_SIZE_REM}rem;
`;

export const PanelTitle = styled.h2`
  font-size: ${PANEL_TITLE_FONT_SIZE_REM}rem;
  font-weight: 600;
  letter-spacing: ${PANEL_TITLE_LETTER_SPACING_REM}rem;
  text-transform: uppercase;
  color: ${TEXT_COLORS.MUTED};
  margin: 0 0 ${PANEL_TITLE_GAP_REM}rem 0;
`;

export const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${CHIP_GROUP_GAP_REM}rem;
`;

export const Chip = styled.button<{ $color: string; $active: boolean }>`
  padding: ${CHIP_PADDING_Y_REM}rem ${CHIP_PADDING_X_REM}rem;
  border-radius: ${CHIP_RADIUS_REM}rem;
  border: ${CHIP_BORDER_WIDTH_REM}rem solid ${({ $color }) => $color};
  background: ${({ $color, $active }) => ($active ? $color : "transparent")};
  color: ${({ $color, $active }) => ($active ? MARKER_COLORS.STROKE : $color)};
  font-size: ${PANEL_FONT_SIZE_REM}rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
`;

export const SectionDivider = styled.div`
  height: ${CHIP_BORDER_WIDTH_REM}rem;
  background: ${SHADOW_COLORS.PANEL};
  margin: ${DIVIDER_GAP_REM}rem 0;
`;

export const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${CHECKBOX_GAP_REM}rem;
  cursor: pointer;
  color: ${TEXT_COLORS.BODY};

  & + & {
    margin-top: ${PANEL_SECTION_GAP_REM}rem;
  }
`;

export const Checkbox = styled.input.attrs({ type: "checkbox" })`
  width: ${CHECKBOX_SIZE_REM}rem;
  height: ${CHECKBOX_SIZE_REM}rem;
  cursor: pointer;
  margin: 0;
`;

export const Counter = styled.p`
  font-size: ${COUNTER_FONT_SIZE_REM}rem;
  color: ${TEXT_COLORS.MUTED};
  margin: ${DIVIDER_GAP_REM}rem 0 0 0;
  font-family: ui-monospace, Consolas, monospace;
`;
