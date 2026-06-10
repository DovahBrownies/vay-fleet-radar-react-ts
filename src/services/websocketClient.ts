// WebSocket client: connects, dispatches incoming WSMessages into the store, reconnects with exponential backoff on disconnect.

import type { WSMessage } from "@shared/types";

import {
  WS_URL,
  WS_RECONNECT_INITIAL_DELAY_MS,
  WS_RECONNECT_MAX_DELAY_MS,
  WS_RECONNECT_BACKOFF_FACTOR,
} from "@app/constants";
import { CONNECTION_STATUS, useFleetStore } from "@app/store/fleetStore";

interface FleetWebSocketClient {
  stop: () => void;
}

export function startFleetWebSocketClient(url: string = WS_URL): FleetWebSocketClient {
  let socket: WebSocket | null = null;
  let reconnectTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelayMs = WS_RECONNECT_INITIAL_DELAY_MS;
  let stopped = false;

  const { applyMessage, setConnection } = useFleetStore.getState();

  function scheduleReconnect(): void {
    if (stopped) return;

    setConnection(CONNECTION_STATUS.DISCONNECTED);

    reconnectTimeoutHandle = setTimeout(() => {
      reconnectDelayMs = Math.min(
        reconnectDelayMs * WS_RECONNECT_BACKOFF_FACTOR,
        WS_RECONNECT_MAX_DELAY_MS,
      );
      connect();
    }, reconnectDelayMs);
  }

  function connect(): void {
    if (stopped) return;

    setConnection(CONNECTION_STATUS.CONNECTING);
    console.log(`[WS-CLIENT] connecting to ${url}`);

    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("[WS-CLIENT] open");
      reconnectDelayMs = WS_RECONNECT_INITIAL_DELAY_MS;
      setConnection(CONNECTION_STATUS.CONNECTED);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WSMessage;
        applyMessage(message);
      } catch (error) {
        console.error("[WS-CLIENT] failed to parse message", error);
      }
    };

    socket.onerror = (event) => {
      console.warn("[WS-CLIENT] error", event);
    };

    socket.onclose = (event) => {
      console.log(`[WS-CLIENT] closed (code=${event.code}); reconnect in ${reconnectDelayMs}ms`);
      socket = null;
      scheduleReconnect();
    };
  }

  connect();

  return {
    stop: () => {
      stopped = true;

      if (reconnectTimeoutHandle !== null) {
        clearTimeout(reconnectTimeoutHandle);
        reconnectTimeoutHandle = null;
      }

      if (socket !== null) {
        socket.close();
        socket = null;
      }

      setConnection(CONNECTION_STATUS.DISCONNECTED);
    },
  };
}
