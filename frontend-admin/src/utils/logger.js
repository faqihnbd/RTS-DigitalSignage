/**
 * Frontend Admin Logger
 *
 * Logger utility for capturing and sending important actions/errors to backend
 * Logs are stored in backend/logs/frontend-admin/ folder
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const SOURCE = "frontend-admin";

// Log queue for batch sending
let logQueue = [];
let flushTimeout = null;
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 20;

// Log levels
const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * Get current user info from storage
 */
const getUserInfo = () => {
  const token =
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");
  const tenantId =
    localStorage.getItem("tenant_id") || sessionStorage.getItem("tenant_id");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");
  const userId =
    localStorage.getItem("user_id") || sessionStorage.getItem("user_id");

  return { userId, tenantId, role, hasToken: !!token };
};

/**
 * Format timestamp for logs
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Add log to queue
 */
const queueLog = (level, message, metadata = {}) => {
  const logEntry = {
    level,
    message,
    metadata: {
      ...getUserInfo(),
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

  try {
    await fetch(`${API_BASE_URL}/api/frontend-logs/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: SOURCE,
        logs: logsToSend,
      }),
    });
  } catch (error) {
    // If sending fails, put logs back in queue (up to max size)
    console.error("Failed to send logs to backend:", error);
    logQueue = [
      ...logsToSend.slice(0, MAX_QUEUE_SIZE - logQueue.length),
      ...logQueue,
    ];
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
      ...getUserInfo(),
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
    console.error("Failed to send log to backend:", error);
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
   * Log authentication events
   */
  logAuth(action, success, details = {}) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const message = `Auth: ${action}`;
    if (success) {
      queueLog(level, message, { action, success, ...details });
    } else {
      sendLogImmediately(level, message, { action, success, ...details });
    }
  },

  /**
   * Log navigation/page views
   */
  logNavigation(pageName, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Navigation: ${pageName}`, {
      page: pageName,
      ...details,
    });
  },

  /**
   * Log user actions (button clicks, form submissions, etc.)
   */
  logAction(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Action: ${action}`, { action, ...details });
  },

  /**
   * Log content operations
   */
  logContent(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Content: ${action}`, { action, ...details });
  },

  /**
   * Log playlist operations
   */
  logPlaylist(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Playlist: ${action}`, { action, ...details });
  },

  /**
   * Log device operations
   */
  logDevice(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Device: ${action}`, { action, ...details });
  },

  /**
   * Log payment operations
   */
  logPayment(action, details = {}) {
    queueLog(LOG_LEVELS.INFO, `Payment: ${action}`, { action, ...details });
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
   * Flush pending logs (call before page unload)
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
    navigator.sendBeacon(`${API_BASE_URL}/api/frontend-logs/batch`, data);
    logQueue = [];
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

export default logger;
