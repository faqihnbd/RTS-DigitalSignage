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

const packageRoutes = require("./routes/package");

const cors = require("cors");
const path = require("path");
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
    console.error("Error getting public content:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sync DB & start server
const PORT = process.env.PORT || 3000;

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
    const { coreApi } = require("./config/midtrans");
    const { Payment, Package, Tenant } = require("./models");

    const statusResponse = await coreApi.transaction.notification(req.body);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Find payment by order ID
    const payment = await Payment.findOne({
      where: { midtrans_order_id: orderId },
      include: [Package, Tenant],
    });

    if (!payment) {
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

    // If payment is successful, activate package for tenant
    if (payment.status === "paid") {
      try {
        const tenant = payment.Tenant;

        tenant.package_id = payment.package_id;
        tenant.package_expires_at = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ); // 30 days
        await tenant.save();
      } catch (upgradeError) {
        console.error(`Error upgrading package for tenant:`, upgradeError);
      }
    }

    res.json({ message: "Webhook notification processed successfully" });
  } catch (err) {
    console.error("Midtrans webhook notification error:", err);
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

// Jalankan server dan sync DB
(async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected");
    console.log("🔄 Syncing models...");
    await sequelize.sync();
    console.log("✅ Models synced");
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
})();
module.exports = app;
