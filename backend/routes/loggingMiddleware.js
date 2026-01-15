const logger = require("../utils/logger");

/**
 * Middleware untuk log semua HTTP request
 */
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info("Incoming Request", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id,
    tenantId: req.user?.tenant_id,
    body: req.method !== "GET" ? sanitizeBody(req.body) : undefined,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - startTime;

    // Log response
    const logLevel = res.statusCode >= 400 ? "error" : "info";
    logger[logLevel]("Request Completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      tenantId: req.user?.tenant_id,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Sanitize request body untuk menghilangkan data sensitif dari log
 */
function sanitizeBody(body) {
  if (!body || typeof body !== "object") return body;

  const sanitized = { ...body };
  const sensitiveFields = ["password", "token", "api_key", "apiKey", "secret"];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}

/**
 * Error handling middleware untuk log semua error
 */
const errorLoggingMiddleware = (err, req, res, next) => {
  logger.logError(err, req, {
    errorName: err.name,
    errorCode: err.code,
  });

  // Pass error to next error handler
  next(err);
};

/**
 * Final error handler middleware
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  loggingMiddleware,
  errorLoggingMiddleware,
  errorHandlerMiddleware,
};
