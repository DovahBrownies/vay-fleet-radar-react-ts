// Styled-component primitives for the FleetRadarPage shell.

import styled from "styled-components";

import { CONNECTION_STATUS, type ConnectionStatus } from "@app/store/fleetStore";
import {
  CONNECTION_STATUS_COLORS,
  SHADOW_COLORS,
  SURFACE_COLORS,
  TEXT_COLORS,
} from "@app/styles/colors";

const TOP_BAR_HEIGHT_REM = 3.5;
const TOP_BAR_PADDING_X_REM = 1.5;
const TITLE_FONT_SIZE_REM = 1.125;
const TITLE_LETTER_SPACING_REM = 0.03125;
const STATUS_GROUP_GAP_REM = 1.5;
const STATUS_GROUP_FONT_SIZE_REM = 0.8125;
const STATUS_DOT_SIZE_REM = 0.625;
const STATUS_DOT_GAP_REM = 0.5;
const STATUS_DOT_COLOR: Record<ConnectionStatus, string> = {
  [CONNECTION_STATUS.CONNECTED]: CONNECTION_STATUS_COLORS.CONNECTED,
  [CONNECTION_STATUS.CONNECTING]: CONNECTION_STATUS_COLORS.CONNECTING,
  [CONNECTION_STATUS.DISCONNECTED]: CONNECTION_STATUS_COLORS.DISCONNECTED,
};
const DEBUG_PANEL_OFFSET_REM = 1.5;
const DEBUG_PANEL_PADDING_Y_REM = 1;
const DEBUG_PANEL_PADDING_X_REM = 1.25;
const DEBUG_PANEL_RADIUS_REM = 0.5;
const DEBUG_PANEL_FONT_SIZE_REM = 0.875;
const DEBUG_PANEL_SHADOW_OFFSET_Y_REM = 0.125;
const DEBUG_PANEL_SHADOW_BLUR_REM = 0.5;
const DEBUG_LABEL_GAP_REM = 0.5;
const DEBUG_ROW_GAP_REM = 1;

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

export const TopBar = styled.header`
  height: ${TOP_BAR_HEIGHT_REM}rem;
  background: ${SURFACE_COLORS.TOP_BAR};
  color: ${TEXT_COLORS.ON_DARK};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${TOP_BAR_PADDING_X_REM}rem;
  flex-shrink: 0;
`;

export const Title = styled.h1`
  font-size: ${TITLE_FONT_SIZE_REM}rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: ${TITLE_LETTER_SPACING_REM}rem;
`;

export const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${STATUS_GROUP_GAP_REM}rem;
  font-size: ${STATUS_GROUP_FONT_SIZE_REM}rem;
`;

export const ConnectionPill = styled.span<{ $status: ConnectionStatus }>`
  display: inline-flex;
  align-items: center;
  gap: ${STATUS_DOT_GAP_REM}rem;

  &::before {
    content: "";
    width: ${STATUS_DOT_SIZE_REM}rem;
    height: ${STATUS_DOT_SIZE_REM}rem;
    border-radius: 50%;
    background: ${({ $status }) => STATUS_DOT_COLOR[$status]};
  }
`;

export const MapStage = styled.main`
  flex: 1;
  background: ${SURFACE_COLORS.MAP_PLACEHOLDER};
  position: relative;
  overflow: hidden;
`;

export const DebugPanel = styled.div`
  position: absolute;
  top: ${DEBUG_PANEL_OFFSET_REM}rem;
  left: ${DEBUG_PANEL_OFFSET_REM}rem;
  padding: ${DEBUG_PANEL_PADDING_Y_REM}rem ${DEBUG_PANEL_PADDING_X_REM}rem;
  background: ${SURFACE_COLORS.PANEL_TRANSLUCENT};
  border-radius: ${DEBUG_PANEL_RADIUS_REM}rem;
  font-size: ${DEBUG_PANEL_FONT_SIZE_REM}rem;
  font-family: ui-monospace, Consolas, monospace;
  box-shadow: 0 ${DEBUG_PANEL_SHADOW_OFFSET_Y_REM}rem ${DEBUG_PANEL_SHADOW_BLUR_REM}rem
    ${SHADOW_COLORS.PANEL};
  line-height: 1.6;
`;

export const DebugRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${DEBUG_ROW_GAP_REM}rem;
`;

export const DebugPair = styled.span`
  color: ${TEXT_COLORS.MUTED};
  display: inline-flex;
  align-items: baseline;
`;

export const DebugLabel = styled.span`
  margin-right: ${DEBUG_LABEL_GAP_REM}rem;
`;

export const DebugValue = styled.span`
  font-weight: 600;
`;
