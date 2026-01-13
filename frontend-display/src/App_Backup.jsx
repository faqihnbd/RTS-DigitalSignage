import { useState, useEffect, useRef } from "react";
import "./App.css";
import PlayerScreen from "./components/PlayerScreen";
import AuthScreen from "./components/AuthScreen";
import LoadingScreen from "./components/LoadingScreen";
import StatusIndicator from "./components/StatusIndicator";
import { PlayerService } from "./services/PlayerService";
import StorageService from "./services/StorageService";

function App() {
  // Deklarasi semua state terlebih dahulu
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const [savedToken, setSavedToken] = useState(null);
  const [savedDeviceId, setSavedDeviceId] = useState(null);
  // State untuk form Auth minimal
  const [inputDeviceId, setInputDeviceId] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [forceShowAuth, setForceShowAuth] = useState(false);

  // Ref to store timeout ID so it can be cleared
  const initTimeoutRef = useRef(null);

  useEffect(() => {
    // Hanya jalankan sekali saat component mount
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      try {
        // Test basic functionality first
        const storage = new StorageService();

        // Cek URL parameter untuk device ID
        const urlParams = new URLSearchParams(window.location.search);
        const urlDeviceId = urlParams.get("device_id") || urlParams.get("id");

        if (urlDeviceId && mounted) {
          setDeviceId(urlDeviceId);
          // Simpan ke storage jika belum ada
          try {
            const existingDeviceId = await storage.getDeviceId();
            if (!existingDeviceId && mounted) {
              await storage.saveDeviceId(urlDeviceId);
            }
          } catch (storageError) {
            console.warn(
              "[WARN] Storage error, continuing without storage:",
              storageError
            );
          }
        }

        // Cek apakah sudah ada token dan deviceId tersimpan
        let token = null;
        let devId = null;

        try {
          token = await storage.getDeviceToken();
          devId = await storage.getDeviceId();

          // Reset any stored UUID-style device IDs, only keep actual device names
          if (devId && devId.includes("-") && devId.length > 20) {
            await storage.clearAuth();
            setSavedToken(null);
            setSavedDeviceId(null);
            setForceShowAuth(true);
            return;
          }
        } catch (storageError) {
          console.warn(
            "[WARN] Storage error when getting credentials:",
            storageError
          );
        }

        if (mounted) {
          setSavedToken(token);
          setSavedDeviceId(devId || urlDeviceId);

          console.log("Saved token:", token || "none");
          console.log("Saved device ID:", devId || urlDeviceId || "none");
          console.log("URL device ID:", urlDeviceId || "none");

          const finalDeviceId = devId || urlDeviceId;

          if (token && finalDeviceId) {
            console.log(
              "[DEBUG] Both token and deviceId exist, loading player data..."
            );
            setDeviceId(finalDeviceId);
            setIsAuthenticated(true);
            await loadPlayerData(finalDeviceId, token);
          } else {
            console.log(
              "[DEBUG] Missing token or deviceId, will show auth screen"
            );
            console.log("[DEBUG] token exists:", !!token);
            console.log("[DEBUG] finalDeviceId exists:", !!finalDeviceId);

            // Pre-fill form with URL device ID if available
            if (urlDeviceId) {
              setInputDeviceId(urlDeviceId);
            }
          }
        }
      } catch (error) {
        console.error("[ERROR] Error initializing app:", error);
      } finally {
        if (mounted) {
          console.log("[DEBUG] Setting isLoading to false");
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Fallback timeout untuk memastikan loading tidak stuck
    initTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        console.log(
          "[DEBUG] Initialization timeout reached, checking current state..."
        );
        setIsLoading(false);
      }
    }, 5000); // 5 detik timeout

    return () => {
      mounted = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []); // Empty dependencies - run only once

  const handleAuthentication = async (inputDeviceId, inputToken) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      console.log("[DEBUG] Attempting authentication with:", {
        deviceId: inputDeviceId,
        token: inputToken ? inputToken.substring(0, 20) + "..." : "NULL",
      });

      const storage = new StorageService();
      // Simpan token dan device ID yang baru diinput
      await storage.saveDeviceToken(inputToken);
      await storage.saveDeviceId(inputDeviceId);

      setSavedToken(inputToken);
      setSavedDeviceId(inputDeviceId);
      setDeviceId(inputDeviceId); // Set ke device ID yang baru
      setIsAuthenticated(true);

      console.log("[DEBUG] Credentials saved, loading player data...");
      await loadPlayerData(inputDeviceId, inputToken); // Gunakan input device ID, bukan yang dari state
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
      setIsLoading(false);
    }
  };

  const loadPlayerData = async (devId, token) => {
    try {
      console.log(
        "[DEBUG] Loading player data for device:",
        devId,
        "with token:",
        token ? token.substring(0, 20) + "..." : "NULL"
      );
      setConnectionStatus("syncing");

      const playerService = new PlayerService(devId, token);
      const data = await playerService.getPlayerData();

      console.log("[DEBUG] Player data loaded successfully:", data);
      setPlayerData(data);
      setConnectionStatus("online");
      setForceShowAuth(false); // Reset force show auth setelah berhasil load data
      setIsAuthenticated(true); // Ensure we're marked as authenticated
      setIsLoading(false); // Ensure loading is stopped

      // Clear the initialization timeout since we succeeded
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
        console.log("[DEBUG] Cleared initialization timeout");
      }

      // Start periodic sync
      startPeriodicSync(playerService);
    } catch (error) {
      console.error("[ERROR] Error loading player data:", error);
      setConnectionStatus("offline");

      // Show more specific error message
      if (error.response?.status === 401) {
        alert("Authentication failed. Please check your license key.");
      } else if (error.response?.status === 404) {
        alert("Device not found. Please check your device ID.");
      } else if (error.response?.status === 409) {
        alert(
          error.message ||
            "Perangkat sedang digunakan di browser/aplikasi lain. Tutup aplikasi lain atau tunggu beberapa menit."
        );
        setForceShowAuth(true); // Force show auth to allow retry
      } else {
        alert(`Failed to load player data: ${error.message}`);
      }
    }
  };

  const startPeriodicSync = (playerService) => {
    let lastSyncHash = null;

    // Sync every 5 minutes
    setInterval(async () => {
      try {
        setConnectionStatus("syncing");
        const data = await playerService.getPlayerData(true); // Force fresh data

        // Create hash of playlist data to detect changes
        const currentHash = JSON.stringify(data.playlists);
        if (lastSyncHash && lastSyncHash !== currentHash) {
          console.log("[DEBUG] Playlist data changed, forcing refresh");
          await playerService.storageService.clearCache();
        }
        lastSyncHash = currentHash;

        setPlayerData(data);
        setConnectionStatus("online");
      } catch (error) {
        console.error("Sync error:", error);
        setConnectionStatus("offline");
      }
    }, 5 * 60 * 1000);

    // Send heartbeat every minute
    setInterval(async () => {
      try {
        await playerService.sendHeartbeat();
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 60 * 1000);
  };

  // Render logic yang lebih simple
  console.log(
    "[DEBUG] Render check - isLoading:",
    isLoading,
    "forceShowAuth:",
    forceShowAuth,
    "playerData:",
    !!playerData,
    "savedToken:",
    !!savedToken
  );

  console.log("[DEBUG] Exact values:", {
    playerData: playerData,
    savedToken: savedToken,
    forceShowAuth: forceShowAuth,
    condition1: !!(playerData && savedToken && !forceShowAuth),
    condition2: !!(isLoading && !forceShowAuth && !playerData),
  });

  // If we have player data, show the player regardless of loading state
  if (playerData) {
    console.log(
      "[DEBUG] Showing PlayerScreen - has data (simplified condition)"
    );
    return (
      <>
        <StatusIndicator status={connectionStatus} />
        <PlayerScreen
          playerData={playerData}
          deviceId={deviceId || savedDeviceId || ""}
        />
      </>
    );
  }

  if (isLoading && !forceShowAuth && !playerData) {
    console.log("[DEBUG] Showing loading screen");
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Loading Digital Signage...</h2>
          <div style={{ margin: "20px 0" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "3px solid #333",
                borderTop: "3px solid #fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
          <button
            onClick={() => {
              console.log("[DEBUG] Manual override - stopping loading");
              setIsLoading(false);
              setForceShowAuth(true);
            }}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #666",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Skip Loading (Debug)
          </button>
          <button
            onClick={() => {
              console.log("[DEBUG] Force show auth screen");
              setIsLoading(false);
              setSavedToken(null);
              setForceShowAuth(true);
            }}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#006600",
              color: "white",
              border: "1px solid #666",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Force Auth Screen
          </button>
        </div>
      </div>
    );
  }

  // Show auth screen if no token or forced or no player data
  if (!savedToken || forceShowAuth) {
    console.log("[DEBUG] Showing auth screen");
    return (
      <div
        key={`auth-screen-${forceShowAuth}`}
        id="auth-screen-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 99999,
          minHeight: "100vh",
          background: "white",
          color: "black",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "auto",
        }}
      >
        <h2>Setup Digital Signage Player</h2>
        <p style={{ marginBottom: 16, color: "#666" }}>
          {savedDeviceId
            ? `Device ID: ${savedDeviceId} detected. Please enter your license key.`
            : "Please enter your device ID and license key."}
        </p>

        {authError && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: 4,
              color: "#c00",
            }}
          >
            <strong>Error:</strong> {authError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Selalu gunakan input device ID, jangan fallback ke saved
            if (!inputDeviceId || !inputToken) {
              setAuthError("Both Device ID and License Key are required");
              return;
            }
            handleAuthentication(inputDeviceId, inputToken);
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <input
              value={inputDeviceId}
              onChange={(e) => setInputDeviceId(e.target.value)}
              placeholder="Device ID (e.g., TV001)"
              style={{ fontSize: 18, padding: 8, width: "250px" }}
              required
              disabled={isAuthenticating}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="License Key (e.g., DEMO-TV001-CKSTOQPKJ)"
              style={{ fontSize: 18, padding: 8, width: "250px" }}
              type="text"
              required
              disabled={isAuthenticating}
            />
          </div>
          <button
            type="submit"
            style={{
              fontSize: 18,
              padding: "8px 24px",
              backgroundColor: isAuthenticating ? "#ccc" : "#007cba",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: isAuthenticating ? "not-allowed" : "pointer",
            }}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? "Connecting..." : "Connect Player"}
          </button>
        </form>
        {savedDeviceId === "TV001" && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#f0f8ff",
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            <strong>Demo License Key:</strong>
            <br />
            DEMO-TV001-CKSTOQPKJ
          </div>
        )}
      </div>
    );
  }

  console.log(
    "[DEBUG] Showing PlayerScreen - playerData:",
    !!playerData,
    "deviceId:",
    deviceId || savedDeviceId
  );

  return (
    <>
      <StatusIndicator status={connectionStatus} />
      <PlayerScreen
        playerData={playerData}
        deviceId={deviceId || savedDeviceId || ""}
      />
    </>
  );
}

export default App;
