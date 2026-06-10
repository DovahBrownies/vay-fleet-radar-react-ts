// WebSocket probe for debugging purposes. I would probably remove this in production unless the team would find it useful.

import WebSocket from "ws";

import { WS_MESSAGE_TYPE, type WSMessage } from "@shared/types";
import { PORT, WS_PATH } from "@server/constants";

const DEFAULT_WS_URL = `ws://localhost:${PORT}${WS_PATH}`;
const MESSAGE_PREVIEW_LENGTH = 140;
const MAX_MESSAGES = 4;
const URL_ARG_INDEX = 2;

const targetUrl = process.argv[URL_ARG_INDEX] ?? DEFAULT_WS_URL;
const socket = new WebSocket(targetUrl);

let messagesReceived = 0;

socket.on("open", () => console.log(`[PROBE] connected to ${targetUrl}`));

socket.on("message", (data) => {
  messagesReceived += 1;
  const message = JSON.parse(data.toString()) as WSMessage;

  let summary: string;

  if (message.type === WS_MESSAGE_TYPE.SNAPSHOT) {
    summary = `${message.type} vehicles=${message.vehicles.length} routes=${message.routes.length}`;
  } else if (message.type === WS_MESSAGE_TYPE.TELEMETRY_BATCH) {
    const samplePreview = JSON.stringify(message.updates[0]).slice(0, MESSAGE_PREVIEW_LENGTH);
    summary = `${message.type} updates=${message.updates.length} sample=${samplePreview}`;
  } else if (message.type === WS_MESSAGE_TYPE.ROUTE_ASSIGNED) {
    summary = `${message.type} vehicleId=${message.route.vehicleId} polyLen=${message.route.polyline.length}`;
  } else {
    summary = `${message.type} vehicleId=${message.vehicleId}`;
  }

  console.log(`[PROBE] msg ${messagesReceived}: ${summary}`);

  if (messagesReceived >= MAX_MESSAGES) socket.close();
});

socket.on("close", () => {
  console.log("[PROBE] closed");
  process.exit(0);
});

socket.on("error", (error: Error) => {
  console.error("[PROBE] error", error.message);
  process.exit(1);
});
