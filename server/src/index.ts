import express from "express";
import { PORT, WS_PATH } from "./constants.js";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true, ws: WS_PATH });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Listening on http://localhost:${PORT}`);
  console.log(`[SERVER] WebSocket path: ${WS_PATH} (not yet wired)`);
});
