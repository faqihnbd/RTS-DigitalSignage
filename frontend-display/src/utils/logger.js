/**
 * Frontend Display Logger
 *
 * Logger utility for capturing and sending important actions/errors to backend
 * Logs are stored in backend/logs/frontend-display/ folder
 *
 * This logger is optimized for display devices with:
 * - Larger queue for offline support
 * - LocalStorage backup for logs when offline
 * - Device-specific metadata
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const SOURCE = "frontend-display";

// Log queue for batch sending
let logQueue = [];
let flushTimeout = null;
const FLUSH_INTERVAL = 10000; // 10 seconds (longer for display devices)
const MAX_QUEUE_SIZE = 50; // Larger queue for display devices
const STORAGE_KEY = "display_log_queue";

// Log levels
const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * Get device info from storage
 */
const getDeviceInfo = () => {
  const deviceId = localStorage.getItem("device_id") || "unknown";
  const deviceToken = localStorage.getItem("device_token");
  const tenantId = localStorage.getItem("tenant_id") || "unknown";
  const displayId = localStorage.getItem("display_id") || "unknown";

  return {
    deviceId,
    tenantId,
    displayId,
    hasToken: !!deviceToken,
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
};

/**
 * Format timestamp for logs
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Load queued logs from localStorage (for offline support)
 */
const loadQueueFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        logQueue = parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load log queue from storage:", error);
  }
};

/**
 * Save queue to localStorage (for offline support)
 */
const saveQueueToStorage = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(logQueue.slice(0, MAX_QUEUE_SIZE))
    );
  } catch (error) {
    console.error("Failed to save log queue to storage:", error);
  }
};

/**
 * Clear queue from localStorage
 */
const clearQueueFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear log queue from storage:", error);
  }
};

// Load any pending logs from storage on startup
loadQueueFromStorage();

/**
 * Add log to queue
 */
const queueLog = (level, message, metadata = {}) => {
  const logEntry = {
    level,
    message,
    metadata: {
      ...getDeviceInfo(),
      url: window.location.href,
      path: window.location.pathname,
      ...metadata,
    },
    timestamp: getTimestamp(),
  };

  logQueue.push(logEntry);

  // Console output for development
  if (import.meta.env.DEV) {
    const consoleMethod =
      level === "error"
        ? console.error
        : level === "warn"
        ? console.warn
        : console.log;
    consoleMethod(
      `[${SOURCE}][${level.toUpperCase()}]`,
      message,
      logEntry.metadata
    );
  }

  // Save to storage for offline support
  saveQueueToStorage();

  // Flush if queue is full
  if (logQueue.length >= MAX_QUEUE_SIZE) {
    flushLogs();
  } else if (!flushTimeout) {
    // Set timeout for periodic flush
    flushTimeout = setTimeout(flushLogs, FLUSH_INTERVAL);
  }
};

/**
 * Flush log queue to backend
 */
const flushLogs = async () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (logQueue.length === 0) return;

  const logsToSend = [...logQueue];
  logQueue = [];
  clearQueueFromStorage();

  try {
    const response = await fetch(`${API_BASE_URL}/api/frontend-logs/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: SOURCE,
        logs: logsToSend,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    // If sending fails, put logs back in queue (up to max size)
    console.error("Failed to send logs to backend:", error);
    logQueue = [
      ...logsToSend.slice(0, MAX_QUEUE_SIZE - logQueue.length),
      ...logQueue,
    ];
    saveQueueToStorage();
  }
};

/**
 * Send single log immediately (for critical errors)
 */
const sendLogImmediately = async (level, message, metadata = {}) => {
  const logData = {
    source: SOURCE,
    level,
    message,
    metadata: {
      ...getDeviceInfo(),
      url: window.location.href,
      path: window.location.pathname,
      ...metadata,
    },
  };

  // Console output
  if (import.meta.env.DEV) {
    const consoleMethod =
      level === "error"
        ? console.error
        : level === "warn"
        ? console.warn
        : console.log;
    consoleMethod(
      `[${SOURCE}][${level.toUpperCase()}]`,
      message,
      logData.metadata
    );
  }

  try {
    await fetch(`${API_BASE_URL}/api/frontend-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    });
  } catch (error) {
    // If immediate send fails, queue it
    console.error("Failed to send log to backend, queuing:", error);
    queueLog(level, message, metadata);
  }
};

// ==================== Logger API ====================

const logger = {
  /**
   * Debug level log
   */
  debug(message, metadata = {}) {
    queueLog(LOG_LEVELS.DEBUG, message, metadata);
  },

  /**
   * Info level log
   */
  info(message, metadata = {}) {
    queueLog(LOG_LEVELS.INFO, message, metadata);
  },

  /**
   * Warning level log
   */
  warn(message, metadata = {}) {
    queueLog(LOG_LEVELS.WARN, message, metadata);
  },

  /**
   * Error level log - sent immediately
   */
  error(message, metadata = {}) {
    sendLogImmediately(LOG_LEVELS.ERROR, message, metadata);
  },

  // ==================== Helper Methods ====================

  /**
   * Log device registration/activation events
   */
  logDevice(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Device: ${action}`, { action, ...details });
  },

  /**
   * Log playlist operations
   */
  logPlaylist(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Playlist: ${action}`, { action, ...details });
  },

  /**
   * Log content playback events
   */
  logPlayback(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Playback: ${action}`, { action, ...details });
  },

  /**
   * Log content load/cache events
   */
  logContent(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Content: ${action}`, { action, ...details });
  },

  /**
   * Log connection status changes
   */
  logConnection(status, details = {}) {
    const level = status === "connected" ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    queueLog(level, `Connection: ${status}`, { status, ...details });
  },

  /**
   * Log display mode changes
   */
  logDisplayMode(mode, details = {}) {
    queueLog(LOG_LEVELS.INFO, `DisplayMode: ${mode}`, { mode, ...details });
  },

  /**
   * Log screen/zone changes
   */
  logZone(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Zone: ${action}`, { action, ...details });
  },

  /**
   * Log sync events
   */
  logSync(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Sync: ${action}`, { action, ...details });
  },

  /**
   * Log media errors
   */
  logMediaError(mediaType, error, details = {}) {
    sendLogImmediately(LOG_LEVELS.ERROR, `MediaError: ${mediaType}`, {
      mediaType,
      error: error.message || String(error),
      ...details,
    });
  },

  /**
   * Log API request errors
   */
  logApiError(endpoint, error, details = {}) {
    sendLogImmediately(LOG_LEVELS.ERROR, `API Error: ${endpoint}`, {
      endpoint,
      error: error.message || String(error),
      stack: error.stack,
      ...details,
    });
  },

  /**
   * Log caught exceptions
   */
  logException(error, context = "") {
    sendLogImmediately(
      LOG_LEVELS.ERROR,
      `Exception: ${context || error.message}`,
      {
        context,
        error: error.message,
        stack: error.stack,
        name: error.name,
      }
    );
  },

  /**
   * Flush pending logs (call before page unload or when online)
   */
  flush() {
    return flushLogs();
  },
};

// Flush logs before page unload
window.addEventListener("beforeunload", () => {
  if (logQueue.length > 0) {
    // Use sendBeacon for reliable delivery during page unload
    const data = JSON.stringify({
      source: SOURCE,
      logs: logQueue,
    });
    const sent = navigator.sendBeacon(
      `${API_BASE_URL}/api/frontend-logs/batch`,
      data
    );
    if (sent) {
      logQueue = [];
      clearQueueFromStorage();
    }
  }
});

// Global error handler
window.addEventListener("error", (event) => {
  logger.logException(
    event.error || new Error(event.message),
    "Uncaught Error"
  );
});

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  logger.logException(
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason)),
    "Unhandled Promise Rejection"
  );
});

// Flush logs when coming back online
window.addEventListener("online", () => {
  logger.logConnection("connected", { event: "online" });
  flushLogs();
});

// Log when going offline
window.addEventListener("offline", () => {
  logger.logConnection("disconnected", { event: "offline" });
});

export default logger;
