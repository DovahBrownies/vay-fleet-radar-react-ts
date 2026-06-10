// WebSocket broadcaster: snapshots on connect, batched telemetry broadcasts on a timer, and immediate forwarding for route lifecycle events.

import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

import { WS_MESSAGE_TYPE, type TelemetryEvent, type WSMessage } from "@shared/types";

import { BROADCAST_INTERVAL_MS, WS_PATH } from "@server/constants";
import { eventBus } from "@server/kafka/eventBus";
import {
  TOPIC_VEHICLE_TELEMETRY,
  TOPIC_ROUTE_ASSIGNED,
  TOPIC_ROUTE_CLEARED,
} from "@server/kafka/topics";
import { vehicleStore } from "@server/domain/vehicleStore";
import { routeStore } from "@server/domain/routeStore";

// Per-vehicle buffer: each new telemetry event overwrites the previous one for that `vehicleId`, so a flush always sends the latest known state.
const telemetryBuffer = new Map<string, TelemetryEvent>();

function sendTo(client: WebSocket, message: WSMessage): void {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

function broadcast(webSocketServer: WebSocketServer, message: WSMessage): void {
  for (const client of webSocketServer.clients) {
    sendTo(client, message);
  }
}

function sendSnapshot(client: WebSocket): void {
  const snapshot: WSMessage = {
    type: WS_MESSAGE_TYPE.SNAPSHOT,
    vehicles: vehicleStore.all(),
    routes: routeStore.all(),
    serverTime: Date.now(),
  };

  sendTo(client, snapshot);
}

function flushTelemetryBatch(webSocketServer: WebSocketServer): void {
  if (telemetryBuffer.size === 0) return;

  const updates = Array.from(telemetryBuffer.values());
  telemetryBuffer.clear();

  broadcast(webSocketServer, { type: WS_MESSAGE_TYPE.TELEMETRY_BATCH, updates });
}

export function attachWebSocketServer(httpServer: HttpServer): () => void {
  const webSocketServer = new WebSocketServer({ server: httpServer, path: WS_PATH });

  webSocketServer.on("connection", (client) => {
    console.log(`[WS] Client connected (total: ${webSocketServer.clients.size})`);
    sendSnapshot(client);

    client.on("close", () => {
      console.log(`[WS] Client disconnected (total: ${webSocketServer.clients.size})`);
    });
  });

  // Coalesce telemetry: keep only the latest event per vehicle inside the window.
  const unsubscribeTelemetry = eventBus.subscribe(TOPIC_VEHICLE_TELEMETRY, (telemetryEvent) => {
    telemetryBuffer.set(telemetryEvent.vehicleId, telemetryEvent);
  });

  // Route lifecycle events are rare - Forward each one immediately.
  const unsubscribeRouteAssigned = eventBus.subscribe(TOPIC_ROUTE_ASSIGNED, (routeAssignedEvent) => {
    broadcast(webSocketServer, {
      type: WS_MESSAGE_TYPE.ROUTE_ASSIGNED,
      route: {
        id: routeAssignedEvent.routeId,
        vehicleId: routeAssignedEvent.vehicleId,
        polyline: routeAssignedEvent.polyline,
        assignedAt: routeAssignedEvent.assignedAt,
      },
    });
  });

  const unsubscribeRouteCleared = eventBus.subscribe(TOPIC_ROUTE_CLEARED, (routeClearedEvent) => {
    broadcast(webSocketServer, {
      type: WS_MESSAGE_TYPE.ROUTE_CLEARED,
      vehicleId: routeClearedEvent.vehicleId,
      routeId: routeClearedEvent.routeId,
    });
  });

  const flushHandle = setInterval(() => flushTelemetryBatch(webSocketServer), BROADCAST_INTERVAL_MS);

  return () => {
    clearInterval(flushHandle);
    unsubscribeTelemetry();
    unsubscribeRouteAssigned();
    unsubscribeRouteCleared();
    webSocketServer.close();
  };
}
