const express = require("express");
const router = express.Router();
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");

// Create separate loggers for each frontend
const createFrontendLogger = (frontendName) => {
  const logDirectory = path.join(__dirname, "..", "logs", frontendName);

  // Ensure log directory exists
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }

  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(
      ({ timestamp, level, message, stack, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`;
        }

        if (stack) {
          msg += `\n${stack}`;
        }

        return msg;
      }
    )
  );

  // Transport for all logs
  const allLogsTransport = new DailyRotateFile({
    filename: path.join(logDirectory, "application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
  });

  // Transport for error logs only
  const errorLogsTransport = new DailyRotateFile({
    filename: path.join(logDirectory, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    level: "error",
  });

  // Transport for combined logs
  const combinedLogsTransport = new DailyRotateFile({
    filename: path.join(logDirectory, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "7d",
    format: customFormat,
  });

  return winston.createLogger({
    level: "info",
    format: customFormat,
    defaultMeta: { service: `rts-${frontendName}` },
    transports: [allLogsTransport, errorLogsTransport, combinedLogsTransport],
  });
};

// Create loggers for each frontend
const frontendLoggers = {
  "frontend-admin": createFrontendLogger("frontend-admin"),
  "frontend-central": createFrontendLogger("frontend-central"),
  "frontend-display": createFrontendLogger("frontend-display"),
};

// Allowed log levels
const ALLOWED_LEVELS = ["info", "warn", "error", "debug"];

// Allowed frontend sources
const ALLOWED_SOURCES = [
  "frontend-admin",
  "frontend-central",
  "frontend-display",
];

/**
 * POST /api/frontend-logs
 * Receive logs from frontend applications
 *
 * Body:
 * {
 *   source: "frontend-admin" | "frontend-central" | "frontend-display",
 *   level: "info" | "warn" | "error" | "debug",
 *   message: string,
 *   metadata: object (optional)
 * }
 */
router.post("/", (req, res) => {
  try {
    const { source, level, message, metadata = {} } = req.body;

    // Validate source
    if (!source || !ALLOWED_SOURCES.includes(source)) {
      return res.status(400).json({
        error: "Invalid source. Must be one of: " + ALLOWED_SOURCES.join(", "),
      });
    }

    // Validate level
    if (!level || !ALLOWED_LEVELS.includes(level)) {
      return res.status(400).json({
        error: "Invalid level. Must be one of: " + ALLOWED_LEVELS.join(", "),
      });
    }

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required and must be a string",
      });
    }

    // Get client info
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      ...metadata,
    };

    // Get the appropriate logger
    const logger = frontendLoggers[source];

    // Log the message
    logger.log(level, message, clientInfo);

    res.json({ success: true, message: "Log recorded" });
  } catch (error) {
    console.error("Error recording frontend log:", error);
    res.status(500).json({ error: "Failed to record log" });
  }
});

/**
 * POST /api/frontend-logs/batch
 * Receive multiple logs from frontend applications (batch mode)
 *
 * Body:
 * {
 *   source: "frontend-admin" | "frontend-central" | "frontend-display",
 *   logs: [
 *     { level: "info", message: "...", metadata: {}, timestamp: "..." },
 *     ...
 *   ]
 * }
 */
router.post("/batch", (req, res) => {
  try {
    const { source, logs } = req.body;

    // Validate source
    if (!source || !ALLOWED_SOURCES.includes(source)) {
      return res.status(400).json({
        error: "Invalid source. Must be one of: " + ALLOWED_SOURCES.join(", "),
      });
    }

    // Validate logs array
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        error: "Logs must be a non-empty array",
      });
    }

    // Get client info
    const baseClientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    };

    // Get the appropriate logger
    const logger = frontendLoggers[source];

    let successCount = 0;
    let errorCount = 0;

    // Process each log
    logs.forEach((log) => {
      const { level, message, metadata = {}, timestamp } = log;

      if (
        ALLOWED_LEVELS.includes(level) &&
        message &&
        typeof message === "string"
      ) {
        const clientInfo = {
          ...baseClientInfo,
          ...metadata,
          clientTimestamp: timestamp,
        };
        logger.log(level, message, clientInfo);
        successCount++;
      } else {
        errorCount++;
      }
    });

    res.json({
      success: true,
      message: `Batch processed: ${successCount} logged, ${errorCount} skipped`,
    });
  } catch (error) {
    console.error("Error recording batch frontend logs:", error);
    res.status(500).json({ error: "Failed to record batch logs" });
  }
});

module.exports = router;
