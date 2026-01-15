import axios from "axios";
import StorageService from "./StorageService";

export class PlayerService {
  constructor(deviceId, token) {
    this.deviceId = deviceId;
    this.token = token;
    this.baseURL = import.meta.env.VITE_API_URL;
    this.storageService = new StorageService();

    // Use existing session ID or generate new one
    this.sessionId = null;
    this.initSessionId();

    // Check if we're in development mode
    this.isDevelopment =
      import.meta.env.DEV ||
      import.meta.env.MODE === "development" ||
      this.baseURL.includes("localhost");

    // Setup axios instance
    this.setupAxiosInstance();
  }

  async initSessionId() {
    // Try to get existing session ID
    const existingSessionId = await this.storageService.getSessionId();

    if (existingSessionId) {
      this.sessionId = existingSessionId;
    } else {
      // Generate new session ID
      this.sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      await this.storageService.saveSessionId(this.sessionId);
    }
  }

  async ensureSessionId() {
    if (!this.sessionId) {
      await this.initSessionId();
    }
    return this.sessionId;
  }

  setupAxiosInstance() {
    // Configure axios instance
    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "X-Session-ID": this.sessionId || "pending",
    };

    // Add bypass header only in development
    if (this.isDevelopment) {
      headers["X-Bypass-Concurrent"] = "true";
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers,
    });

    // Add request interceptor for auth
    this.api.interceptors.request.use(
      async (config) => {
        await this.ensureSessionId();
        config.headers.Authorization = `Bearer ${this.token}`;
        config.headers["X-Session-ID"] = this.sessionId;

        // Add bypass header only in development
        if (this.isDevelopment) {
          config.headers["X-Bypass-Concurrent"] = "true";
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Log error with full response data
          console.error("[DEBUG] 401 Unauthorized - clearing credentials");
          console.error(
            "[DEBUG] Error response from backend:",
            error.response?.data
          );

          // Don't clear auth here if it's PACKAGE_EXPIRED or TENANT_SUSPENDED
          // Let App.jsx handle these specific cases
          const errorData = error.response?.data;
          if (
            errorData?.error !== "PACKAGE_EXPIRED" &&
            errorData?.error !== "TENANT_SUSPENDED"
          ) {
            await this.storageService.clearAuth();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async getPlayerData(forceFresh = false) {
    try {
      await this.ensureSessionId();

      // Get cached ETag for conditional request
      const cachedETag = await this.storageService.getItem("playerData_etag");
      const cachedData = await this.storageService.getLastSync();

      const url = `/api/player/data/${this.deviceId}`;

      // Setup headers for conditional request (saves bandwidth if data hasn't changed)
      const headers = {};
      if (!forceFresh && cachedETag) {
        headers["If-None-Match"] = cachedETag;
      }

      try {
        const response = await this.api.get(url, { headers });
        const playerData = response.data;

        // Save ETag for next request
        const newETag = response.headers["etag"];
        if (newETag) {
          await this.storageService.setItem("playerData_etag", newETag);
        }

        // Clear old cache if forceFresh
        if (forceFresh) {
          await this.storageService.clearCache();
        }

        // Save to cache for offline access
        await this.storageService.saveLastSync({
          deviceId: this.deviceId,
          playerData: playerData,
          success: true,
          timestamp: Date.now(),
        });
        return playerData;
      } catch (error) {
        // 304 Not Modified - use cached data (saves bandwidth!)
        if (error.response?.status === 304 && cachedData?.playerData) {
          console.log("[CACHE] Data not modified, using cached version");
          return cachedData.playerData;
        }
        throw error;
      }
    } catch (error) {
      if (error.response) {
        console.error(
          "[DEBUG] Error response from backend:",
          error.response.data
        );

        // Create enhanced error with specific error type and message
        const errorData = error.response.data;
        const errorType = errorData?.error || "UNKNOWN_ERROR";
        const errorMessage = errorData?.message || error.message;

        // Create error with specific message based on error type
        let specificMessage = errorMessage;
        if (errorType === "INVALID_DEVICE_ID") {
          specificMessage =
            errorMessage || "Device ID tidak valid atau tidak ditemukan";
        } else if (errorType === "INVALID_TOKEN") {
          specificMessage = errorMessage || "License Key tidak valid";
        } else if (errorType === "TENANT_NOT_FOUND") {
          specificMessage = errorMessage || "Tenant tidak ditemukan";
        } else if (errorType === "PACKAGE_EXPIRED") {
          specificMessage = errorMessage || "Paket telah habis";
        } else if (errorType === "TENANT_SUSPENDED") {
          specificMessage = errorMessage || "Tenant telah ditangguhkan";
        }

        // Re-throw the error with response data and specific message
        const enhancedError = new Error(specificMessage);
        enhancedError.response = error.response;
        enhancedError.errorType = errorType;
        throw enhancedError;
      } else {
        console.error("[DEBUG] Error fetching player data:", error);
      }

      // Try to load from cache if network fails
      const lastSync = await this.storageService.getLastSync();
      if (lastSync && lastSync.playerData) {
        return lastSync.playerData;
      }

      throw new Error(`Failed to load player data: ${error.message}`);
    }
  }

  async sendHeartbeat() {
    try {
      const heartbeatData = {
        device_id: this.deviceId,
        status: "online",
        timestamp: new Date().toISOString(),
        player_info: await this.getPlayerInfo(),
      };
      await this.api.post("/api/player/heartbeat", heartbeatData);
    } catch (error) {
      console.error("Error sending heartbeat:", error);
      // Don't throw - heartbeat failures shouldn't stop playback
    }
  }

  async sendPlaybackStats(stats) {
    try {
      const statsData = {
        device_id: this.deviceId,
        ...stats,
        timestamp: new Date().toISOString(),
      };
      await this.api.post("/api/player/stats", statsData);
    } catch (error) {
      console.error("Error sending playback stats:", error);
      // Don't throw - stats failures shouldn't stop playback
    }
  }

  async reportError(errorData) {
    try {
      const errorReport = {
        device_id: this.deviceId,
        ...errorData,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
      };
      await this.api.post("/api/player/error", errorReport);
    } catch (error) {
      console.error("Error reporting error:", error);
    }
  }

  async getPlayerInfo() {
    try {
      return {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.connection,
        cache_stats: await this.storageService.getCacheStats(),
      };
    } catch (error) {
      console.error("Error getting player info:", error);
      return {
        user_agent: navigator.userAgent,
        online: navigator.onLine,
      };
    }
  }

  async validateDevice() {
    try {
      const response = await this.api.get(
        `/api/player/validate/${this.deviceId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error validating device:", error);
      throw new Error(`Device validation failed: ${error.message}`);
    }
  }

  async downloadContent(contentId) {
    try {
      const response = await this.api.get(`/api/player/content/${contentId}`, {
        responseType: "blob",
      });

      return response.data;
    } catch (error) {
      console.error(`[ERROR] Failed to download content ${contentId}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      throw error;
    }
  }

  handleAuthError() {
    console.error("Authentication error - clearing stored credentials");
    // Clear credentials but DON'T reload - let the app handle showing auth screen
    this.storageService.clearAuth();
    // Throw error to be caught by caller
    throw new Error("Authentication failed. Please login again.");
  }

  updateToken(newToken) {
    this.token = newToken;
    this.storageService.saveDeviceToken(newToken);
  }

  getContentUrl(contentId) {
    return `${this.baseURL}/api/player/content/${contentId}`;
  }

  async checkConnection() {
    try {
      await this.api.get("/api/health", { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}
