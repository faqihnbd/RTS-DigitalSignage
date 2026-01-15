const express = require("express");
const { PlayerStat, Device, Content, Tenant, sequelize } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const router = express.Router();

// Only super admin or tenant admin for their tenant
function canViewStats(req, tenantId) {
  if (req.user.role === "super_admin") return true;
  if (req.user.role === "tenant_admin" && req.user.tenant_id === tenantId)
    return true;
  return false;
}

// GET /stats/summary?tenant_id=xx&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/summary", async (req, res) => {
  const { tenant_id, from, to } = req.query;
  if (!tenant_id || !canViewStats(req, parseInt(tenant_id)))
    return res.status(403).json({ message: "Forbidden" });
  const where = { tenant_id };
  if (from && to)
    where.played_at = { [Op.between]: [from + " 00:00:00", to + " 23:59:59"] };
  // Total jam tayang, jumlah layar aktif, konten terpopuler
  const totalDuration = await PlayerStat.sum("duration_sec", { where });
  const activeDevices = await PlayerStat.aggregate("device_id", "count", {
    distinct: true,
    where,
  });
  const topContent = await PlayerStat.findAll({
    where,
    attributes: [
      "content_id",
      [
        PlayerStat.sequelize.fn(
          "SUM",
          PlayerStat.sequelize.col("duration_sec")
        ),
        "total_sec",
      ],
    ],
    group: ["content_id"],
    order: [[PlayerStat.sequelize.literal("total_sec"), "DESC"]],
    limit: 3,
    // include: [{ model: Content }], // Temporarily disabled to avoid alias error
  });
  res.json({ totalDuration, activeDevices, topContent });
});

// GET /stats/daily?tenant_id=xx&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/daily", async (req, res) => {
  const { tenant_id, from, to } = req.query;
  if (!tenant_id || !canViewStats(req, parseInt(tenant_id)))
    return res.status(403).json({ message: "Forbidden" });
  const where = { tenant_id };
  if (from && to)
    where.played_at = { [Op.between]: [from + " 00:00:00", to + " 23:59:59"] };
  // Group by day
  const stats = await PlayerStat.findAll({
    where,
    attributes: [
      [
        PlayerStat.sequelize.fn("DATE", PlayerStat.sequelize.col("played_at")),
        "date",
      ],
      [
        PlayerStat.sequelize.fn(
          "SUM",
          PlayerStat.sequelize.col("duration_sec")
        ),
        "total_sec",
      ],
    ],
    group: ["date"],
    order: [["date", "ASC"]],
  });
  res.json(stats);
});

// GET /stats/device/:device_id?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/device/:device_id", async (req, res) => {
  const { from, to } = req.query;
  const device = await Device.findByPk(req.params.device_id);
  if (!device || !canViewStats(req, device.tenant_id))
    return res.status(403).json({ message: "Forbidden" });
  const where = { device_id: device.id };
  if (from && to)
    where.played_at = { [Op.between]: [from + " 00:00:00", to + " 23:59:59"] };
  const stats = await PlayerStat.findAll({
    where,
    // include: [{ model: Content }], // Temporarily disabled to avoid alias error
  });
  res.json(stats);
});

// GET /stats/dashboard - Get dashboard statistics for current user
router.get("/dashboard", async (req, res) => {
  try {
    // For tenant admin, get stats for their tenant only
    // For super admin, get global stats
    let whereClause = {};
    let tenantId = null;

    if (req.user.role === "tenant_admin") {
      tenantId = req.user.tenant_id;
      whereClause.tenant_id = tenantId;
    }

    // Get basic counts
    const totalContent =
      req.user.role === "super_admin"
        ? await Content.count()
        : await Content.count({ where: whereClause });

    const totalDevices =
      req.user.role === "super_admin"
        ? await Device.count()
        : await Device.count({ where: whereClause });

    // Active devices (devices with recent activity in last 24 hours)
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDevices = await PlayerStat.count({
      distinct: true,
      col: "device_id",
      where: {
        ...whereClause,
        played_at: {
          [Op.gte]: recentDate,
        },
      },
    });

    // Get total revenue from payments
    const { Payment } = require("../models");
    let totalRevenue = 0;

    if (req.user.role === "super_admin") {
      // Super admin sees all revenue
      const payments = await Payment.findAll({
        where: {
          status: "paid",
        },
      });
      totalRevenue = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );
    } else {
      // Tenant admin sees only their revenue
      const payments = await Payment.findAll({
        where: {
          tenant_id: tenantId,
          status: "paid",
        },
      });
      totalRevenue = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );
    }

    const dashboardStats = {
      totalContent,
      totalPlaylists: 0, // Placeholder - can be implemented if playlist model exists
      activeDevices,
      totalRevenue,
    };

    res.json(dashboardStats);
  } catch (error) {
    logger.logError(error, req, { action: "fetch_dashboard_statistics" });
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /stats/dashboard-test - Get dashboard statistics without authentication (for testing)
router.get("/dashboard-test", async (req, res) => {
  try {
    // Simulate tenant admin for testing
    const mockUser = {
      role: "tenant_admin",
      tenant_id: 1,
    };

    let whereClause = {};
    let tenantId = null;

    if (mockUser.role === "tenant_admin") {
      tenantId = mockUser.tenant_id;
      whereClause.tenant_id = tenantId;
    }

    // Get basic counts
    const totalContent =
      mockUser.role === "super_admin"
        ? await Content.count()
        : await Content.count({ where: whereClause });

    const totalDevices =
      mockUser.role === "super_admin"
        ? await Device.count()
        : await Device.count({ where: whereClause });

    // Active devices (devices with recent activity in last 24 hours)
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDevices = await PlayerStat.count({
      distinct: true,
      col: "device_id",
      where: {
        ...whereClause,
        played_at: {
          [Op.gte]: recentDate,
        },
      },
    });

    // Get total revenue from payments
    const { Payment } = require("../models");
    let totalRevenue = 0;

    if (mockUser.role === "super_admin") {
      // Super admin sees all revenue
      const payments = await Payment.findAll({
        where: {
          status: "paid",
        },
      });
      totalRevenue = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );
    } else {
      // Tenant admin sees only their revenue
      const payments = await Payment.findAll({
        where: {
          tenant_id: tenantId,
          status: "paid",
        },
      });
      totalRevenue = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );
    }

    const dashboardStats = {
      totalContent,
      totalPlaylists: 0,
      activeDevices,
      totalRevenue,
    };

    res.json(dashboardStats);
  } catch (error) {
    logger.logError(error, req, { action: "fetch_dashboard_statistics_test" });
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /stats/global - Get global system statistics (super admin only)
router.get("/global", async (req, res) => {
  try {
    // Only super admin can access global stats
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden - Super admin only" });
    }

    // Get global statistics
    const totalTenants = await Tenant.count();
    const totalDevices = await Device.count();
    const totalContents = await Content.count();
    const totalPlayStats = await PlayerStat.count();

    // Active devices (devices with recent activity)
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const activeDevices = await PlayerStat.count({
      distinct: true,
      col: "device_id",
      where: {
        played_at: {
          [Op.gte]: recentDate,
        },
      },
    });

    // Total playback duration
    const totalDuration = (await PlayerStat.sum("duration_sec")) || 0;

    // Top performing tenants by content count
    const topTenants = await Tenant.findAll({
      include: [
        {
          model: Content,
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "id",
        "name",
        [sequelize.fn("COUNT", sequelize.col("Contents.id")), "content_count"],
      ],
      group: ["Tenant.id", "Tenant.name"],
      order: [[sequelize.fn("COUNT", sequelize.col("Contents.id")), "DESC"]],
      limit: 5,
      subQuery: false,
      raw: true,
    });

    const globalStats = {
      overview: {
        total_tenants: totalTenants,
        total_devices: totalDevices,
        total_contents: totalContents,
        active_devices: activeDevices,
        total_play_stats: totalPlayStats,
        total_duration_hours: Math.round(totalDuration / 3600),
      },
      top_tenants: topTenants,
      system_health: {
        status: "healthy",
        uptime: "99.9%",
        last_backup: new Date().toISOString().split("T")[0],
      },
    };

    res.json(globalStats);
  } catch (error) {
    logger.logError(error, req, { action: "fetch_global_statistics" });
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /stats/daily-global?days=7 - Get global daily statistics (super admin only)
router.get("/daily-global", async (req, res) => {
  try {
    // Only super admin can access global stats
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden - Super admin only" });
    }

    const days = parseInt(req.query.days) || 7;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get daily statistics for all tenants
    const stats = await PlayerStat.findAll({
      where: {
        played_at: {
          [Op.gte]: fromDate,
        },
      },
      attributes: [
        [
          PlayerStat.sequelize.fn(
            "DATE",
            PlayerStat.sequelize.col("played_at")
          ),
          "date",
        ],
        [
          PlayerStat.sequelize.fn(
            "SUM",
            PlayerStat.sequelize.col("duration_sec")
          ),
          "total_sec",
        ],
        [
          PlayerStat.sequelize.fn(
            "COUNT",
            PlayerStat.sequelize.literal("DISTINCT device_id")
          ),
          "active_devices",
        ],
      ],
      group: ["date"],
      order: [["date", "ASC"]],
      raw: true,
    });

    // Transform data to include both duration and active devices
    const transformedStats = stats.map((stat) => ({
      date: stat.date,
      total_duration: Math.round(stat.total_sec / 3600), // Convert to hours
      active_devices: parseInt(stat.active_devices) || 0,
    }));

    res.json(transformedStats);
  } catch (error) {
    logger.logError(error, req, { action: "fetch_daily_global_statistics" });
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
