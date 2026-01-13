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
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Loading state untuk initialization
  const [toast, setToast] = useState(null); // Toast notification state

  useEffect(() => {
    initializeApp();

    // Cleanup refresh interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Setup data refresh interval when player data is loaded
  useEffect(() => {
    if (playerData && deviceId && savedToken && !refreshInterval) {
      const interval = setInterval(() => {
        loadPlayerData(deviceId, savedToken, true); // true = silent refresh
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };
  }, [playerData, deviceId, savedToken]);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
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
    } finally {
      setIsInitializing(false);
    }
  };

  const loadPlayerData = async (devId, token, silent = false) => {
    try {
      if (!silent) {
        setConnectionStatus("syncing");
      }

      const playerService = new PlayerService(devId, token);
      const data = await playerService.getPlayerData();

      setPlayerData(data);
      if (!silent) {
        setConnectionStatus("online");
        setIsInitializing(false); // Stop loading spinner after successful load
      }
    } catch (error) {
      console.error("Load player data error:", error);

      // Check if device not found (404) - device might have been deleted
      if (error.response?.status === 404) {
        console.error("[SECURITY] Device not found - may have been deleted");
        const storage = new StorageService();
        await storage.clearAuth();

        // Clear all states
        setPlayerData(null);
        setSavedToken(null);
        setDeviceId("");
        setIsInitializing(false);
        setConnectionStatus("offline");

        // Show toast notification
        setToast({
          message:
            "🚫 Perangkat tidak ditemukan. Mungkin telah dihapus dari sistem.",
          type: "error",
        });

        // Set error and show auth screen
        setAuthError("Perangkat tidak ditemukan. Silakan hubungkan kembali.");
        setShowAuth(true);
        return;
      }

      // Check if it's a concurrent session error (409)
      if (error.response?.status === 409) {
        console.error("[SECURITY] License is being used in another session");
        const errorData = error.response?.data;
        const storage = new StorageService();
        await storage.clearAuth();

        // Clear all states
        setPlayerData(null);
        setSavedToken(null);
        setDeviceId("");
        setIsInitializing(false); // Stop loading spinner
        setConnectionStatus("offline");

        // Tampilkan toast notification
        const errorMessage =
          errorData?.message ||
          "🔒 License ini sedang digunakan di browser/aplikasi lain. Setiap license hanya dapat digunakan untuk 1 sesi aktif.";

        setToast({
          message: errorMessage,
          type: "warning",
        });

        // Set error message dan tampilkan auth screen
        setAuthError(errorMessage);
        setShowAuth(true);
        return;
      }

      // Check if it's an auth error (401)
      if (
        error.response?.status === 401 ||
        error.message?.includes("Authentication failed")
      ) {
        console.error(
          "[DEBUG] Auth error detected - clearing credentials and showing auth screen"
        );
        const storage = new StorageService();
        await storage.clearAuth();

        setPlayerData(null);
        setSavedToken(null);
        setDeviceId("");
        setIsInitializing(false); // Stop loading spinner
        setAuthError("Your session has expired. Please login again.");
        setShowAuth(true);
        setConnectionStatus("offline");
        return;
      }

      if (!silent) {
        setConnectionStatus("offline");
        setIsInitializing(false); // Stop loading spinner
        // Don't automatically show auth for non-auth errors
        setAuthError(error.message || "Failed to load player data");
      } else {
        console.warn("[DEBUG] Silent refresh failed, keeping current data");
      }
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
      <>
        <StatusIndicator status={connectionStatus} />
        <PlayerScreen playerData={playerData} deviceId={deviceId} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  if (showAuth) {
    return (
      <>
        <AuthScreen
          onAuthentication={handleAuthentication}
          authError={authError}
          isAuthenticating={isAuthenticating}
          deviceId={deviceId}
          onClearError={() => setAuthError(null)}
        />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Loading/Initializing screen - hanya tampilkan jika masih initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            RTS Digital Signage
          </h2>
          <p className="text-blue-200">Initializing system...</p>
          <div className="loading-spinner mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  // Fallback - jika tidak ada player data dan tidak showAuth, redirect ke auth
  return (
    <>
      <AuthScreen
        onAuthentication={handleAuthentication}
        authError={authError}
        isAuthenticating={isAuthenticating}
        deviceId={deviceId}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default App;
