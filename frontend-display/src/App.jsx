import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import PlayerScreen from "./components/PlayerScreen";
import AuthScreen from "./components/AuthScreen";
import PackageExpiredScreen from "./components/PackageExpiredScreen";
import StatusIndicator from "./components/StatusIndicator";
import Toast from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAppWatchdog } from "./components/AppWatchdog";
import { PlayerService } from "./services/PlayerService";
import StorageService from "./services/StorageService";
import logger from "./utils/logger";

function App() {
  const [playerData, setPlayerData] = useState(null);
  const [deviceId, setDeviceId] = useState("");
  const [savedToken, setSavedToken] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [heartbeatInterval, setHeartbeatInterval] = useState(null); // Heartbeat interval untuk status monitoring
  const [isInitializing, setIsInitializing] = useState(true); // Loading state untuk initialization
  const [toast, setToast] = useState(null); // Toast notification state
  const [showPackageExpired, setShowPackageExpired] = useState(false); // Package expired screen
  const [packageExpiredMessage, setPackageExpiredMessage] = useState(""); // Package expired message

  // Refs for cleanup and tracking
  const refreshIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastVisibilityChangeRef = useRef(Date.now());
  const deviceIdRef = useRef(deviceId);
  const savedTokenRef = useRef(savedToken);

  // Update refs when state changes
  useEffect(() => {
    deviceIdRef.current = deviceId;
    savedTokenRef.current = savedToken;
  }, [deviceId, savedToken]);

  // Initialize watchdog for auto-recovery from frozen states
  const { reportActivity } = useAppWatchdog({
    checkInterval: 30000, // Check every 30 seconds
    freezeThreshold: 180000, // Reload if frozen for 3 minutes
    maxInactiveTime: 600000, // Reload if inactive for 10 minutes
    debug: import.meta.env.DEV,
  });

  // Handle visibility change (tab focus/blur, wake from sleep)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      const timeSinceLastChange = now - lastVisibilityChangeRef.current;
      lastVisibilityChangeRef.current = now;

      if (!document.hidden) {
        console.log("[VISIBILITY] Page became visible");

        // If page was hidden for more than 2 minutes, refresh data
        if (timeSinceLastChange > 120000) {
          console.log(
            "[VISIBILITY] Was hidden for a long time, refreshing data..."
          );

          // Report activity to watchdog
          reportActivity();

          // Refresh player data if authenticated
          if (deviceIdRef.current && savedTokenRef.current) {
            loadPlayerData(deviceIdRef.current, savedTokenRef.current, true);
          }
        }
      }
    };

    // Handle online event - refresh data when connection restored
    const handleOnline = () => {
      console.log("[NETWORK] Connection restored, refreshing data...");
      setConnectionStatus("syncing");
      reportActivity();

      if (deviceIdRef.current && savedTokenRef.current) {
        loadPlayerData(deviceIdRef.current, savedTokenRef.current, true)
          .then(() => setConnectionStatus("online"))
          .catch(() => setConnectionStatus("offline"));
      }
    };

    const handleOffline = () => {
      console.log("[NETWORK] Connection lost");
      setConnectionStatus("offline");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reportActivity]);

  useEffect(() => {
    initializeApp();

    // Cleanup intervals on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // Setup data refresh interval when player data is loaded
  useEffect(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (playerData && deviceId && savedToken) {
      // Refresh every 5 minutes (300 seconds) instead of 30 seconds
      // This significantly reduces network usage from ~14MB to ~1.4MB per day
      const interval = setInterval(() => {
        loadPlayerData(deviceId, savedToken, true); // true = silent refresh
        reportActivity(); // Report to watchdog
      }, 300000); // Refresh every 5 minutes (was 30 seconds)

      refreshIntervalRef.current = interval;
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        setRefreshInterval(null);
      }
    };
  }, [playerData, deviceId, savedToken, reportActivity]);

  // Setup heartbeat interval untuk status monitoring (60 detik)
  useEffect(() => {
    // Clear existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Hanya jalankan heartbeat jika device sudah authenticated dan ada data
    if (playerData && deviceId && savedToken) {
      const playerService = new PlayerService(deviceId, savedToken);

      // Kirim heartbeat pertama segera
      playerService
        .sendHeartbeat()
        .then(() => {
          reportActivity(); // Report to watchdog
        })
        .catch((err) => {
          // Heartbeat failed - logged to backend via logger
        });

      // Setup interval untuk heartbeat setiap 2 menit (120 detik)
      // Reduced from 60s to 120s to save ~50% bandwidth on heartbeats
      const interval = setInterval(async () => {
        try {
          await playerService.sendHeartbeat();
          reportActivity(); // Report to watchdog
        } catch (error) {
          // Jangan ubah status - biarkan backend yang deteksi timeout
        }
      }, 120 * 1000); // 2 menit (was 60 detik)

      heartbeatIntervalRef.current = interval;
      setHeartbeatInterval(interval);
    }

    // Cleanup heartbeat interval
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [playerData, deviceId, savedToken, reportActivity]);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);

      // Log app initialization
      logger.info("Display App Initializing", {
        version: import.meta.env.VITE_APP_VERSION || "1.0.0",
        environment: import.meta.env.MODE,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      });

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
        logger.logDevice("Device Authenticated", { deviceId: finalDeviceId });
        await loadPlayerData(finalDeviceId, token);
      } else {
        logger.info("No saved credentials, showing auth screen");
        setShowAuth(true);
      }
    } catch (error) {
      console.error("Init error:", error);
      logger.logException(error, "App Initialization");
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
      logger.logApiError("/api/player/data", error, { deviceId: devId });

      // Check if device not found (404) - device might have been deleted
      if (error.response?.status === 404) {
        console.error("[SECURITY] Device not found - may have been deleted");
        logger.logDevice("Device Not Found", {
          deviceId: devId,
          reason: "404",
        });
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

      // Check if package has expired (401 with PACKAGE_EXPIRED error)
      if (error.response?.status === 401) {
        const errorData = error.response?.data;
        const errorType = errorData?.error || error.errorType;

        if (errorType === "PACKAGE_EXPIRED") {
          console.error("[PACKAGE] Package has expired");
          const storage = new StorageService();
          await storage.clearAuth();

          // Clear all states
          setPlayerData(null);
          setSavedToken(null);
          setDeviceId("");
          setIsInitializing(false);
          setConnectionStatus("offline");

          // Show package expired screen instead of auth screen
          const errorMessage =
            errorData?.message ||
            "Durasi paket telah habis. Silakan hubungi administrator untuk memperpanjang paket.";

          setPackageExpiredMessage(errorMessage);
          setShowPackageExpired(true);
          setShowAuth(false);
          return;
        }

        // Check if tenant is suspended
        if (errorType === "TENANT_SUSPENDED") {
          console.error("[TENANT] Tenant is suspended");
          const storage = new StorageService();
          await storage.clearAuth();

          // Clear all states
          setPlayerData(null);
          setSavedToken(null);
          setDeviceId("");
          setIsInitializing(false);
          setConnectionStatus("offline");

          // Show package expired screen with suspension message
          const errorMessage =
            "Akun telah ditangguhkan. Silakan hubungi administrator.";

          setPackageExpiredMessage(errorMessage);
          setShowPackageExpired(true);
          setShowAuth(false);
          return;
        }

        // Check for specific auth errors
        if (errorType === "INVALID_DEVICE_ID") {
          console.error("[AUTH] Invalid Device ID");
          const storage = new StorageService();
          await storage.clearAuth();

          setPlayerData(null);
          setSavedToken(null);
          setDeviceId("");
          setIsInitializing(false);
          setConnectionStatus("offline");

          const errorMessage =
            errorData?.message ||
            "Device ID tidak valid atau tidak ditemukan. Periksa kembali Device ID Anda.";
          setAuthError(errorMessage);
          setShowAuth(true);
          setShowPackageExpired(false);
          return;
        }

        if (errorType === "INVALID_TOKEN") {
          console.error("[AUTH] Invalid Token");
          const storage = new StorageService();
          await storage.clearAuth();

          setPlayerData(null);
          setSavedToken(null);
          setDeviceId("");
          setIsInitializing(false);
          setConnectionStatus("offline");

          const errorMessage =
            errorData?.message ||
            "License Key tidak valid. Periksa kembali License Key Anda.";
          setAuthError(errorMessage);
          setShowAuth(true);
          setShowPackageExpired(false);
          return;
        }

        if (errorType === "TENANT_NOT_FOUND") {
          console.error("[AUTH] Tenant not found");
          const storage = new StorageService();
          await storage.clearAuth();

          setPlayerData(null);
          setSavedToken(null);
          setDeviceId("");
          setIsInitializing(false);
          setConnectionStatus("offline");

          const errorMessage =
            errorData?.message ||
            "Tenant tidak ditemukan untuk device ini. Silakan hubungi administrator.";
          setAuthError(errorMessage);
          setShowAuth(true);
          setShowPackageExpired(false);
          return;
        }

        // Generic auth error
        console.error(
          "[DEBUG] Auth error detected - clearing credentials and showing auth screen"
        );
        const storage = new StorageService();
        await storage.clearAuth();

        setPlayerData(null);
        setSavedToken(null);
        setDeviceId("");
        setIsInitializing(false); // Stop loading spinner

        // Use error message from backend if available
        const errorMessage =
          error.message ||
          errorData?.message ||
          "Sesi Anda telah berakhir. Silakan login kembali.";
        setAuthError(errorMessage);
        setShowAuth(true);
        setShowPackageExpired(false);
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

  // Show package expired screen if package has expired
  if (showPackageExpired) {
    const handleBackToAuth = async () => {
      try {
        // Clear console
        console.clear();

        // Clear all storage
        const storage = new StorageService();
        await storage.clearEverything();

        // Reset all states to initial values
        setShowPackageExpired(false);
        setPackageExpiredMessage("");
        setPlayerData(null);
        setSavedToken(null);
        setDeviceId("");
        setConnectionStatus("offline");
        setAuthError(null);
        setIsAuthenticating(false);
        setToast(null);

        // Clear refresh interval if exists
        if (refreshInterval) {
          clearInterval(refreshInterval);
          setRefreshInterval(null);
        }

        // Show auth screen
        setShowAuth(true);
        setIsInitializing(false);
      } catch (error) {
        console.error("Error during reset:", error);
        // Still show auth screen even if error
        setShowPackageExpired(false);
        setShowAuth(true);
      }
    };
    return (
      <PackageExpiredScreen
        message={packageExpiredMessage}
        onBackToAuth={handleBackToAuth}
      />
    );
  }

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
            Wisse Digital Signage
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

// Wrap App with ErrorBoundary for production stability
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
