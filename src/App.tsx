// App root: starts the WebSocket client once, renders the Fleet Radar page.

import { useEffect } from "react";

import { FleetRadarPage } from "@app/pages/FleetRadarPage";
import { startFleetWebSocketClient } from "@app/services/websocketClient";

function App(): React.ReactElement {
  useEffect(() => {
    const client = startFleetWebSocketClient();

    return () => client.stop();
  }, []);

  return <FleetRadarPage />;
}

export default App;
