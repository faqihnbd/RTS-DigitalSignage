const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// Define log directory
const logDirectory = path.join(__dirname, "..", "logs");

// Define custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if exists
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace for errors
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  })
);

// Transport for all logs (rotating daily)
const allLogsTransport = new DailyRotateFile({
  filename: path.join(logDirectory, "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d", // Keep logs for 14 days
  level: "info",
});

// Transport for error logs only (rotating daily)
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(logDirectory, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d", // Keep error logs for 30 days
  level: "error",
});

// Transport for combined logs (all levels in one file, rotating daily)
const combinedLogsTransport = new DailyRotateFile({
  filename: path.join(logDirectory, "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "7d", // Keep combined logs for 7 days
  format: customFormat,
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  defaultMeta: { service: "rts-digital-signage" },
  transports: [allLogsTransport, errorLogsTransport, combinedLogsTransport],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(consoleTransport);
}

// Add event handlers for rotate events
allLogsTransport.on("rotate", (oldFilename, newFilename) => {
  logger.info("Log file rotated", { oldFilename, newFilename });
});

// Create stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods for common logging scenarios
logger.logRequest = (req, message, metadata = {}) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenant_id,
    ...metadata,
  });
};

logger.logError = (error, req = null, additionalInfo = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    ...additionalInfo,
  };

  if (req) {
    errorLog.method = req.method;
    errorLog.url = req.originalUrl;
    errorLog.ip = req.ip;
    errorLog.userId = req.user?.id;
    errorLog.tenantId = req.user?.tenant_id;
    errorLog.body = req.body;
    errorLog.params = req.params;
    errorLog.query = req.query;
  }

  logger.error("Application Error", errorLog);
};

logger.logAuth = (action, success, req, details = {}) => {
  logger.info(`Auth: ${action}`, {
    success,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    email: details.email,
    userId: details.userId,
    tenantId: details.tenantId,
    ...details,
  });
};

logger.logPayment = (action, req, details = {}) => {
  logger.info(`Payment: ${action}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenant_id,
    ...details,
  });
};

logger.logDevice = (action, req, details = {}) => {
  logger.info(`Device: ${action}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenant_id,
    ...details,
  });
};

logger.logContent = (action, req, details = {}) => {
  logger.info(`Content: ${action}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenant_id,
    ...details,
  });
};

logger.logPlaylist = (action, req, details = {}) => {
  logger.info(`Playlist: ${action}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenant_id,
    ...details,
  });
};

module.exports = logger;
