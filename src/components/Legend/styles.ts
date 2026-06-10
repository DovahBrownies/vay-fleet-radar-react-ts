import styled from "styled-components";
import { MARKER_COLORS, SHADOW_COLORS, SURFACE_COLORS, TEXT_COLORS } from "@app/styles/colors";

const LEGEND_OFFSET_REM = 1.5;
const LEGEND_PADDING_Y_REM = 0.75;
const LEGEND_PADDING_X_REM = 1;
const LEGEND_RADIUS_REM = 0.5;
const LEGEND_FONT_SIZE_REM = 0.8125;
const LEGEND_TITLE_FONT_SIZE_REM = 0.6875;
const LEGEND_TITLE_LETTER_SPACING_REM = 0.05;
const LEGEND_TITLE_GAP_REM = 0.5;
const LEGEND_ROW_GAP_REM = 0.375;
const LEGEND_SWATCH_SIZE_REM = 0.75;
const LEGEND_SWATCH_STROKE_REM = 0.0625;
const LEGEND_LABEL_GAP_REM = 0.625;
const LEGEND_SHADOW_OFFSET_Y_REM = 0.125;
const LEGEND_SHADOW_BLUR_REM = 0.5;

export const LegendContainer = styled.aside`
  position: absolute;
  bottom: ${LEGEND_OFFSET_REM}rem;
  left: ${LEGEND_OFFSET_REM}rem;
  padding: ${LEGEND_PADDING_Y_REM}rem ${LEGEND_PADDING_X_REM}rem;
  background: ${SURFACE_COLORS.PANEL_TRANSLUCENT};
  border-radius: ${LEGEND_RADIUS_REM}rem;
  box-shadow: 0 ${LEGEND_SHADOW_OFFSET_Y_REM}rem ${LEGEND_SHADOW_BLUR_REM}rem
    ${SHADOW_COLORS.PANEL};
  font-size: ${LEGEND_FONT_SIZE_REM}rem;
`;

export const LegendTitle = styled.h2`
  font-size: ${LEGEND_TITLE_FONT_SIZE_REM}rem;
  font-weight: 600;
  letter-spacing: ${LEGEND_TITLE_LETTER_SPACING_REM}rem;
  text-transform: uppercase;
  color: ${TEXT_COLORS.MUTED};
  margin: 0 0 ${LEGEND_TITLE_GAP_REM}rem 0;
`;

export const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${LEGEND_LABEL_GAP_REM}rem;

  & + & {
    margin-top: ${LEGEND_ROW_GAP_REM}rem;
  }
`;

export const Swatch = styled.span<{ $color: string }>`
  display: inline-block;
  width: ${LEGEND_SWATCH_SIZE_REM}rem;
  height: ${LEGEND_SWATCH_SIZE_REM}rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: ${LEGEND_SWATCH_STROKE_REM}rem solid ${MARKER_COLORS.STROKE};
  box-shadow: 0 0 0 ${LEGEND_SWATCH_STROKE_REM}rem ${SHADOW_COLORS.PANEL};
`;

export const LegendLabel = styled.span`
  color: ${TEXT_COLORS.BODY};
`;
