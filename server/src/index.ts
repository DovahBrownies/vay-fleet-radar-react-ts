// Server entrypoint: HTTP + (eventually) WS, plus the simulated event pipeline.

import express from "express";
import { PORT, WS_PATH } from "./constants.js";
import { startConsumer } from "./kafka/consumer.js";
import { startSimulator } from "./domain/simulator.js";
import { vehicleStore } from "./domain/vehicleStore.js";

const HEARTBEAT_INTERVAL_MS = 5000;

const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true, ws: WS_PATH, fleetSize: vehicleStore.size() });
});

// Wire the event pipeline before the simulator starts producing.
startConsumer();
startSimulator();

setInterval(() => {
  const sample = vehicleStore.all()[0];
  console.log(
    `[STORE] size=${vehicleStore.size()} sample=${sample?.id} status=${sample?.status} battery=${sample?.battery.toFixed(1)}`,
  );
}, HEARTBEAT_INTERVAL_MS);

app.listen(PORT, () => {
  console.log(`[SERVER] Listening on http://localhost:${PORT}`);
  console.log(`[SERVER] WebSocket path: ${WS_PATH} (not yet wired)`);
});
