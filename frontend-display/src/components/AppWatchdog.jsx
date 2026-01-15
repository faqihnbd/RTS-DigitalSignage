import { useEffect, useRef, useCallback } from "react";
import logger from "../utils/logger";

/**
 * AppWatchdog Hook
 * Monitors application health and performs auto-recovery when frozen
 * Critical for production digital signage displays
 */
const useAppWatchdog = (options = {}) => {
  const {
    // How often to check if app is responding (ms)
    checkInterval = 30000, // 30 seconds
    // How long to wait before considering app frozen (ms)
    freezeThreshold = 120000, // 2 minutes
    // Maximum time without activity before reload (ms)
    maxInactiveTime = 300000, // 5 minutes
    // Callback for health check
    onHealthCheck = null,
    // Enable debug logging
    debug = false,
  } = options;

  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(Date.now());
  const watchdogIntervalRef = useRef(null);
  const isActiveRef = useRef(true);

  const log = useCallback(
    (message, ...args) => {
      // Watchdog logs disabled in production
      // if (debug) {
      //   console.log(`[Watchdog] ${message}`, ...args);
      // }
    },
    [debug]
  );

  // Update activity timestamp
  const reportActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastHeartbeatRef.current = Date.now();
    log("Activity reported");
  }, [log]);

  // Check if app is frozen
  const checkHealth = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;

    log("Health check:", {
      timeSinceLastActivity: `${Math.round(timeSinceLastActivity / 1000)}s`,
      timeSinceLastHeartbeat: `${Math.round(timeSinceLastHeartbeat / 1000)}s`,
      isActive: isActiveRef.current,
    });

    // Call custom health check if provided
    if (onHealthCheck) {
      try {
        onHealthCheck({
          timeSinceLastActivity,
          timeSinceLastHeartbeat,
          isActive: isActiveRef.current,
        });
      } catch (error) {
        logger.logAction(
          "Watchdog Health Check Error",
          { error: error.message },
          "error"
        );
      }
    }

    // Check if app appears frozen
    if (timeSinceLastHeartbeat > freezeThreshold) {
      logger.logAction(
        "Watchdog Freeze Detected",
        { timeSinceLastHeartbeat: Math.round(timeSinceLastHeartbeat / 1000) },
        "warn"
      );

      // Store reason in localStorage for debugging
      try {
        localStorage.setItem(
          "watchdog_reload_reason",
          JSON.stringify({
            reason: "freeze_detected",
            timeSinceLastHeartbeat,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (e) {
        // Ignore storage errors
      }

      // Reload the page
      window.location.reload();
      return;
    }

    // Check for extended inactivity (no media playing)
    if (timeSinceLastActivity > maxInactiveTime && isActiveRef.current) {
      logger.logAction(
        "Watchdog Inactivity",
        { timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000) },
        "warn"
      );

      // Store reason in localStorage for debugging
      try {
        localStorage.setItem(
          "watchdog_reload_reason",
          JSON.stringify({
            reason: "extended_inactivity",
            timeSinceLastActivity,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (e) {
        // Ignore storage errors
      }

      // Reload the page
      window.location.reload();
    }
  }, [freezeThreshold, maxInactiveTime, onHealthCheck, log]);

  // Start watchdog timer
  useEffect(() => {
    log("Starting watchdog");

    // Initial activity report
    reportActivity();

    // Start watchdog interval
    watchdogIntervalRef.current = setInterval(() => {
      // Update heartbeat
      lastHeartbeatRef.current = Date.now();

      // Run health check
      checkHealth();
    }, checkInterval);

    // Handle visibility change (tab focus/blur, screen sleep/wake)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        log("Page hidden");
        isActiveRef.current = false;
      } else {
        log("Page visible again - resetting activity");
        isActiveRef.current = true;
        reportActivity();

        // Check if we've been asleep for too long
        const now = Date.now();
        const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;

        if (timeSinceLastHeartbeat > freezeThreshold) {
          logger.logAction(
            "Watchdog Wake from Sleep - Reload",
            {
              timeSinceLastHeartbeat: Math.round(timeSinceLastHeartbeat / 1000),
            },
            "warn"
          );

          try {
            localStorage.setItem(
              "watchdog_reload_reason",
              JSON.stringify({
                reason: "wake_from_sleep",
                timeSinceLastHeartbeat,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (e) {
            // Ignore storage errors
          }

          // Small delay to let the page stabilize, then reload
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      log("Network online");
      reportActivity();
    };

    const handleOffline = () => {
      log("Network offline");
    };

    // Handle errors that might indicate a problem
    const handleError = (event) => {
      logger.logException(event.error || event.message);
      reportActivity(); // Reset activity to prevent immediate reload
    };

    const handleUnhandledRejection = (event) => {
      logger.logException(event.reason);
      reportActivity(); // Reset activity to prevent immediate reload
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup
    return () => {
      log("Stopping watchdog");
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [checkInterval, freezeThreshold, checkHealth, reportActivity, log]);

  return {
    reportActivity,
    isActive: isActiveRef.current,
  };
};

/**
 * AppWatchdog Component
 * Wrapper component that provides watchdog functionality
 */
const AppWatchdog = ({
  children,
  checkInterval = 30000,
  freezeThreshold = 120000,
  maxInactiveTime = 300000,
  debug = false,
}) => {
  useAppWatchdog({
    checkInterval,
    freezeThreshold,
    maxInactiveTime,
    debug,
  });

  return children;
};

export { useAppWatchdog };
export default AppWatchdog;
