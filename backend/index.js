const express = require("express");
const sequelize = require("./db");

const authRoutes = require("./routes/auth");
const tenantRoutes = require("./routes/tenant");
const authMiddleware = require("./routes/authMiddleware");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
const contentRoutes = require("./routes/content");
const playlistRoutes = require("./routes/playlist");
const scheduleRoutes = require("./routes/schedule");
const playerRoutes = require("./routes/player");
const paymentRoutes = require("./routes/payment");
const statsRoutes = require("./routes/stats");
const exportRoutes = require("./routes/export");
const monitorRoutes = require("./routes/monitor");
const automationRoutes = require("./routes/automation");
const notificationRoutes = require("./routes/notification");
const auditRoutes = require("./routes/audit");
const layoutRoutes = require("./routes/layout");
const frontendLogsRoutes = require("./routes/frontendLogs");

const packageRoutes = require("./routes/package");

const logger = require("./utils/logger");
const {
  loggingMiddleware,
  errorLoggingMiddleware,
  errorHandlerMiddleware,
} = require("./routes/loggingMiddleware");

const cors = require("cors");
const path = require("path");
const app = express();
app.use(
  cors({
    origin: [
      process.env.FRONTEND_ADMIN_URL || "http://localhost:5173",
      process.env.FRONTEND_DISPLAY_URL || "http://localhost:5174",
      process.env.FRONTEND_CENTRAL_URL || "http://localhost:5175",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Add logging middleware
app.use(loggingMiddleware);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "RunToStart CMS Backend is running." });
});

// Public endpoints (no auth required)
// Public content endpoint for display players
app.get("/api/contents/public/:id", async (req, res) => {
  try {
    const { Content } = require("./models");
    const contentId = req.params.id;

    // Find content by ID (no auth required for display players)
    const content = await Content.findByPk(contentId, {
      attributes: ["id", "type", "filename", "url", "size", "duration_sec"],
    });

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json(content);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sync DB & start server
const PORT = process.env.PORT || 3000;

// Frontend logs endpoint (public, no auth required for frontend logging)
app.use("/api/frontend-logs", frontendLogsRoutes);

// Auth
app.use("/api/auth", authRoutes);

// Tenant CRUD (protected)
app.use("/api/tenants", authMiddleware, tenantRoutes);

// User CRUD (protected)
app.use("/api/users", authMiddleware, userRoutes);

// Device CRUD (protected, tenant admin only)
app.use("/api/devices", authMiddleware, deviceRoutes);

// Content CRUD (protected, tenant admin only)
app.use("/api/contents", authMiddleware, contentRoutes);

// Playlist & Playlist Item CRUD (protected, tenant admin only)
app.use("/api/playlists", authMiddleware, playlistRoutes);

// Layout CRUD (protected, tenant admin only)
app.use("/api/layouts", authMiddleware, layoutRoutes);

// Schedule CRUD (protected, tenant admin only)
app.use("/api/schedules", authMiddleware, scheduleRoutes);

// Player endpoint (no auth, for device)
app.use("/api/player", playerRoutes);

// Midtrans webhook notification (no auth required)
app.post("/api/payments/midtrans/notification", async (req, res) => {
  try {
    logger.logPayment("Midtrans Webhook Received", req, { body: req.body });

    const { coreApi } = require("./config/midtrans");
    const { Payment, Package, Tenant } = require("./models");

    const statusResponse = await coreApi.transaction.notification(req.body);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    logger.logPayment("Midtrans Status Received", req, {
      orderId,
      transactionStatus,
      fraudStatus,
    });

    // Find payment by order ID
    const payment = await Payment.findOne({
      where: { midtrans_order_id: orderId },
      include: [Package, Tenant],
    });

    if (!payment) {
      logger.warn("Payment not found for Midtrans webhook", { orderId });
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment based on transaction status
    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        payment.status = "pending";
      } else if (fraudStatus === "accept") {
        payment.status = "paid";
        payment.paid_at = new Date();
      }
    } else if (transactionStatus === "settlement") {
      payment.status = "paid";
      payment.paid_at = new Date();
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      payment.status = "failed";
    } else if (transactionStatus === "pending") {
      payment.status = "pending";
    }

    // Update transaction ID
    payment.midtrans_transaction_id = statusResponse.transaction_id;
    await payment.save();

    logger.logPayment("Payment Status Updated", req, {
      orderId,
      paymentId: payment.id,
      status: payment.status,
    });

    // If payment is successful, activate package for tenant
    if (payment.status === "paid") {
      try {
        const tenant = payment.Tenant;

        tenant.package_id = payment.package_id;
        tenant.package_expires_at = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ); // 30 days
        await tenant.save();

        logger.logPayment("Package Activated for Tenant", req, {
          tenantId: tenant.id,
          packageId: payment.package_id,
          expiresAt: tenant.package_expires_at,
        });
      } catch (upgradeError) {
        logger.logError(upgradeError, req, {
          action: "Package Activation Failed",
          tenantId: payment.Tenant?.id,
        });
      }
    }

    res.json({ message: "Webhook notification processed successfully" });
  } catch (err) {
    logger.logError(err, req, { action: "Midtrans Webhook Error" });
    res.status(500).json({ message: err.message });
  }
});

// Payment endpoint (protected)
app.use("/api/payments", authMiddleware, paymentRoutes);

// Package endpoint (protected)
app.use("/api/packages", authMiddleware, packageRoutes);

// Statistik endpoint (protected)
app.use("/api/stats", authMiddleware, statsRoutes);

// Export laporan endpoint (protected)
app.use("/api/export", authMiddleware, exportRoutes);

// Monitoring global endpoint (super admin only)
app.use("/api/monitor", authMiddleware, monitorRoutes);

// Automation (auto-renew, reminder) endpoint (super admin only)
app.use("/api/automation", authMiddleware, automationRoutes);

// Notifications endpoint (protected)
app.use("/api/notifications", authMiddleware, notificationRoutes);

// Audit logs endpoint (protected)
app.use("/api/audit", authMiddleware, auditRoutes);

// Add error logging and handling middleware (must be after all routes)
app.use(errorLoggingMiddleware);
app.use(errorHandlerMiddleware);

// Jalankan server dan sync DB
(async () => {
  try {
    logger.info("🔄 Connecting to database...");
    await sequelize.authenticate();
    logger.info("✅ Database connected");
    logger.info("🔄 Syncing models...");
    await sequelize.sync();
    logger.info("✅ Models synced");

    // Setup tenant expiry checker - runs every hour
    const { checkAndUpdateExpiredTenants } = require("./utils/tenantExpiry");

    // Run once on startup
    logger.info("🔄 Checking for expired tenants on startup...");
    const expiredCount = await checkAndUpdateExpiredTenants();
    logger.info(
      `✅ Initial tenant expiry check completed. ${expiredCount} tenants updated.`
    );

    // Schedule to run every hour
    setInterval(async () => {
      logger.info("🔄 Running scheduled tenant expiry check...");
      try {
        const count = await checkAndUpdateExpiredTenants();
        if (count > 0) {
          logger.info(
            `✅ Tenant expiry check completed. ${count} tenants updated.`
          );
        }
      } catch (error) {
        logger.error("❌ Error in scheduled tenant expiry check:", error);
      }
    }, 60 * 60 * 1000); // Run every hour (3600000 ms)

    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`✅ Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    logger.error("Unable to connect to the database:", err);
  }
})();
module.exports = app;
