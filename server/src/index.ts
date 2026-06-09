// Server entrypoint: HTTP + (eventually) WS, plus the simulated event pipeline.

import express from "express";

import { VEHICLE_STATUS } from "@shared/types";

import { PORT, WS_PATH } from "@server/constants";
import { startConsumer } from "@server/kafka/consumer";
import { startSimulator, activeRouteCount } from "@server/domain/simulator";
import { vehicleStore } from "@server/domain/vehicleStore";
import { routeStore } from "@server/domain/routeStore";

const HEARTBEAT_INTERVAL_MS = 5000;

const app = express();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    ws: WS_PATH,
    fleetSize: vehicleStore.size(),
    routes: routeStore.size(),
  });
});

// Wire the event pipeline before the simulator starts producing.
startConsumer();
startSimulator();

setInterval(() => {
  const vehicles = vehicleStore.all();
  const enRouteCount = vehicles.filter((vehicle) => vehicle.status === VEHICLE_STATUS.EN_ROUTE).length;

  console.log(
    `[STORE] vehicles=${vehicleStore.size()} enRoute=${enRouteCount} routes=${routeStore.size()} (sim:${activeRouteCount()})`,
  );
}, HEARTBEAT_INTERVAL_MS);

app.listen(PORT, () => {
  console.log(`[SERVER] Listening on http://localhost:${PORT}`);
  console.log(`[SERVER] WebSocket path: ${WS_PATH} (not yet wired)`);
});
