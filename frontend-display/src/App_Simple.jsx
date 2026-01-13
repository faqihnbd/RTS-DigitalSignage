import { useState, useEffect } from "react";
import "./App.css";
import PlayerScreen from "./components/PlayerScreen";
import AuthScreen from "./components/AuthScreen";
import StatusIndicator from "./components/StatusIndicator";
import { PlayerService } from "./services/PlayerService";
import StorageService from "./services/StorageService";

function App() {
  const [playerData, setPlayerData] = useState(null);
  const [deviceId, setDeviceId] = useState("");
  const [savedToken, setSavedToken] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const storage = new StorageService();

      // Get URL device ID
      const urlParams = new URLSearchParams(window.location.search);
      const urlDeviceId = urlParams.get("device_id") || urlParams.get("id");

      // Get saved credentials
      const token = await storage.getDeviceToken();
      const devId = await storage.getDeviceId();

      if (token && (devId || urlDeviceId)) {
        const finalDeviceId = devId || urlDeviceId;
        setDeviceId(finalDeviceId);
        setSavedToken(token);
        await loadPlayerData(finalDeviceId, token);
      } else {
        setShowAuth(true);
      }
    } catch (error) {
      console.error("Init error:", error);
      setShowAuth(true);
    }
  };

  const loadPlayerData = async (devId, token) => {
    try {
      setConnectionStatus("syncing");

      const playerService = new PlayerService(devId, token);
      const data = await playerService.getPlayerData();

      setPlayerData(data);
      setConnectionStatus("online");
    } catch (error) {
      console.error("Load player data error:", error);
      setConnectionStatus("offline");
      setShowAuth(true);
    }
  };

  const handleAuthentication = async (inputDeviceId, inputToken) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);

      const storage = new StorageService();
      await storage.saveDeviceToken(inputToken);
      await storage.saveDeviceId(inputDeviceId);

      setSavedToken(inputToken);
      setDeviceId(inputDeviceId);
      setShowAuth(false);

      await loadPlayerData(inputDeviceId, inputToken);
    } catch (error) {
      console.error("Auth error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // SIMPLE RENDERING LOGIC
  if (playerData) {
    return (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "purple" }}
      >
        <StatusIndicator status={connectionStatus} />
        <PlayerScreen playerData={playerData} deviceId={deviceId} />
      </div>
    );
  }

  if (showAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "black", color: "white" }}>
        <AuthScreen
          onAuthentication={handleAuthentication}
          authError={authError}
          isAuthenticating={isAuthenticating}
          deviceId={deviceId}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "orange",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2>Loading...</h2>
    </div>
  );
}

export default App;
