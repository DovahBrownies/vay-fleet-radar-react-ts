// App root: starts the WebSocket client once, renders the Fleet Radar page.

import { useEffect, type ReactElement } from "react";

import { FleetRadarPage } from "@app/pages/FleetRadarPage";
import { startFleetWebSocketClient } from "@app/services/websocketClient";
import { GlobalStyles } from "@app/styles/GlobalStyles";

function App(): ReactElement {
  useEffect(() => {
    const client = startFleetWebSocketClient();

    return () => client.stop();
  }, []);

  return (
    <>
      <GlobalStyles />
      <FleetRadarPage />
    </>
  );
}

export default App;
