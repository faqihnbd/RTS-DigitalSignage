const express = require("express");
const { Tenant, Device, PlayerStat, Payment } = require("../models");
const { Op } = require("sequelize");
const router = express.Router();

// Only super admin
function isSuperAdmin(req, res, next) {
  if (req.user && req.user.role === "super_admin") return next();
  return res.status(403).json({ message: "Forbidden" });
}

// GET /monitor/summary
router.get("/summary", isSuperAdmin, async (req, res) => {
  const HEARTBEAT_TIMEOUT = 120; // 2 minutes in seconds
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - HEARTBEAT_TIMEOUT * 1000);

  const totalTenant = await Tenant.count();
  const totalDevice = await Device.count();

  // Count active devices based on recent heartbeat
  const activeDevice = await Device.count({
    where: {
      last_heartbeat: {
        [Op.gte]: cutoffTime,
      },
    },
  });

  const totalJamTayang = Math.round(
    (await PlayerStat.sum("duration_sec")) / 3600
  );
  const totalPayment = await Payment.sum("amount", {
    where: { status: "paid" },
  });
  res.json({
    totalTenant,
    totalDevice,
    activeDevice,
    totalJamTayang,
    totalPayment,
  });
});

// GET /monitor/devices?status=active|inactive|suspended
router.get("/devices", isSuperAdmin, async (req, res) => {
  const HEARTBEAT_TIMEOUT = 120; // 2 minutes in seconds
  const now = new Date();

  let where = {};

  // If status filter is provided, handle based on new heartbeat logic
  if (req.query.status === "active" || req.query.status === "online") {
    const cutoffTime = new Date(now.getTime() - HEARTBEAT_TIMEOUT * 1000);
    where.last_heartbeat = {
      [Op.gte]: cutoffTime,
    };
  } else if (
    req.query.status === "offline" ||
    req.query.status === "inactive"
  ) {
    const cutoffTime = new Date(now.getTime() - HEARTBEAT_TIMEOUT * 1000);
    where = {
      [Op.or]: [
        { last_heartbeat: null },
        {
          last_heartbeat: {
            [Op.lt]: cutoffTime,
          },
        },
      ],
    };
  } else if (req.query.status) {
    // For other status values, use status field directly
    where.status = req.query.status;
  }

  const devices = await Device.findAll({ where, include: [Tenant] });

  // Update status in response based on real-time heartbeat
  const devicesWithStatus = devices.map((device) => {
    const deviceData = device.toJSON();

    // Calculate real-time status based on last_heartbeat
    if (deviceData.last_heartbeat) {
      const lastHeartbeat = new Date(deviceData.last_heartbeat);
      const timeDiff = (now - lastHeartbeat) / 1000; // in seconds

      // If last heartbeat is older than 2 minutes, device is offline
      if (timeDiff > HEARTBEAT_TIMEOUT) {
        deviceData.status = "offline";
      } else {
        deviceData.status = "online";
      }
    } else {
      // No heartbeat recorded = offline
      deviceData.status = "offline";
    }

    return deviceData;
  });

  res.json(devicesWithStatus);
});

// GET /monitor/tenants?status=active|suspended|expired
router.get("/tenants", isSuperAdmin, async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  const tenants = await Tenant.findAll({ where });
  res.json(tenants);
});

module.exports = router;
