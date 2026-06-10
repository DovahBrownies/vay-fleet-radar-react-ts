import styled from "styled-components";
import {
  SHADOW_COLORS,
  SURFACE_COLORS,
  TEXT_COLORS,
  VEHICLE_STATUS_COLORS,
} from "@app/styles/colors";

const DETAILS_TOP_REM = 1.5;
const DETAILS_RIGHT_REM = 1.5;
const DETAILS_WIDTH_REM = 22;
const DETAILS_PADDING_REM = 1.25;
const DETAILS_RADIUS_REM = 0.5;
const DETAILS_SHADOW_OFFSET_Y_REM = 0.25;
const DETAILS_SHADOW_BLUR_REM = 1;
const DETAILS_FONT_SIZE_REM = 0.875;
const DETAILS_HEADER_GAP_REM = 0.75;
const DETAILS_TITLE_FONT_SIZE_REM = 1;
const DETAILS_CLOSE_SIZE_REM = 1.5;
const DETAILS_SECTION_GAP_REM = 0.75;
const DETAILS_ROW_GAP_REM = 0.25;
const DETAILS_LABEL_WIDTH_REM = 6;
const DETAILS_BADGE_PADDING_Y_REM = 0.125;
const DETAILS_BADGE_PADDING_X_REM = 0.5;
const DETAILS_BADGE_RADIUS_REM = 0.25;
const DETAILS_BADGE_FONT_SIZE_REM = 0.6875;
const DETAILS_BADGE_LETTER_SPACING_REM = 0.04;
const DETAILS_ACTIONS_GAP_REM = 0.5;
const DETAILS_ACTIONS_TOP_GAP_REM = 1;
const DETAILS_BUTTON_PADDING_Y_REM = 0.5;
const DETAILS_BUTTON_PADDING_X_REM = 0.75;
const DETAILS_BUTTON_RADIUS_REM = 0.375;
const DETAILS_BUTTON_FONT_SIZE_REM = 0.8125;
const DETAILS_BUTTON_BORDER_WIDTH_REM = 0.0625;

const DETAILS_TOP_BAR_HEIGHT_REM = 3.5;
const DETAILS_MAX_HEIGHT_PADDING_REM = 3;

export const DetailsCard = styled.aside`
  position: absolute;
  top: ${DETAILS_TOP_REM}rem;
  right: ${DETAILS_RIGHT_REM}rem;
  width: ${DETAILS_WIDTH_REM}rem;
  max-height: calc(100vh - ${DETAILS_TOP_BAR_HEIGHT_REM + DETAILS_MAX_HEIGHT_PADDING_REM}rem);
  padding: ${DETAILS_PADDING_REM}rem;
  background: ${SURFACE_COLORS.PANEL_TRANSLUCENT};
  border-radius: ${DETAILS_RADIUS_REM}rem;
  box-shadow: 0 ${DETAILS_SHADOW_OFFSET_Y_REM}rem ${DETAILS_SHADOW_BLUR_REM}rem
    ${SHADOW_COLORS.PANEL};
  font-size: ${DETAILS_FONT_SIZE_REM}rem;
  overflow-y: auto;
`;

export const DetailsHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${DETAILS_HEADER_GAP_REM}rem;
  margin-bottom: ${DETAILS_SECTION_GAP_REM}rem;
`;

export const DetailsTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DETAILS_ROW_GAP_REM}rem;
  min-width: 0;
`;

export const DetailsTitle = styled.h2`
  font-size: ${DETAILS_TITLE_FONT_SIZE_REM}rem;
  font-weight: 600;
  margin: 0;
  color: ${TEXT_COLORS.BODY};
  font-family: ui-monospace, Consolas, monospace;
`;

export const CloseButton = styled.button`
  width: ${DETAILS_CLOSE_SIZE_REM}rem;
  height: ${DETAILS_CLOSE_SIZE_REM}rem;
  border: none;
  background: transparent;
  color: ${TEXT_COLORS.MUTED};
  cursor: pointer;
  font-size: ${DETAILS_TITLE_FONT_SIZE_REM}rem;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    color: ${TEXT_COLORS.BODY};
  }
`;

export const StatusBadge = styled.span<{ $status: keyof typeof VEHICLE_STATUS_COLORS }>`
  align-self: flex-start;
  padding: ${DETAILS_BADGE_PADDING_Y_REM}rem ${DETAILS_BADGE_PADDING_X_REM}rem;
  border-radius: ${DETAILS_BADGE_RADIUS_REM}rem;
  background: ${({ $status }) => VEHICLE_STATUS_COLORS[$status]};
  color: ${TEXT_COLORS.ON_DARK};
  font-size: ${DETAILS_BADGE_FONT_SIZE_REM}rem;
  font-weight: 600;
  letter-spacing: ${DETAILS_BADGE_LETTER_SPACING_REM}rem;
  text-transform: uppercase;
`;

export const DetailsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${DETAILS_ROW_GAP_REM}rem;

  & + & {
    margin-top: ${DETAILS_SECTION_GAP_REM}rem;
    padding-top: ${DETAILS_SECTION_GAP_REM}rem;
    border-top: ${DETAILS_BUTTON_BORDER_WIDTH_REM}rem solid ${SHADOW_COLORS.PANEL};
  }
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${DETAILS_ROW_GAP_REM}rem;
`;

export const DetailLabel = styled.span`
  color: ${TEXT_COLORS.MUTED};
  width: ${DETAILS_LABEL_WIDTH_REM}rem;
  flex-shrink: 0;
`;

export const DetailValue = styled.span`
  color: ${TEXT_COLORS.BODY};
  font-family: ui-monospace, Consolas, monospace;
  font-weight: 500;
`;

export const BatteryValue = styled(DetailValue)<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DETAILS_ACTIONS_GAP_REM}rem;
  margin-top: ${DETAILS_ACTIONS_TOP_GAP_REM}rem;
`;

export const ActionButton = styled.button`
  padding: ${DETAILS_BUTTON_PADDING_Y_REM}rem ${DETAILS_BUTTON_PADDING_X_REM}rem;
  border-radius: ${DETAILS_BUTTON_RADIUS_REM}rem;
  border: ${DETAILS_BUTTON_BORDER_WIDTH_REM}rem solid ${SHADOW_COLORS.PANEL};
  background: transparent;
  color: ${TEXT_COLORS.BODY};
  cursor: pointer;
  font-size: ${DETAILS_BUTTON_FONT_SIZE_REM}rem;
  font-weight: 500;
  text-align: left;

  &:hover {
    background: ${SURFACE_COLORS.MAP_PLACEHOLDER};
  }
`;
