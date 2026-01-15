const express = require("express");
const { Op } = require("sequelize");
const {
  Device,
  Tenant,
  Package,
  Playlist,
  DevicePlaylist,
} = require("../models");
const logger = require("../utils/logger");
const router = express.Router();

// Assign playlist to device
router.post("/:id/assign-playlist", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });
  const deviceId = req.params.id;
  const { playlist_id } = req.body;
  if (!playlist_id)
    return res.status(400).json({ message: "playlist_id required" });
  // Hapus assign sebelumnya (hanya satu playlist per device)
  await DevicePlaylist.destroy({ where: { device_id: deviceId } });
  // Assign baru
  await DevicePlaylist.create({ device_id: deviceId, playlist_id });
  res.json({ success: true });
});

// Remove playlist assignment from device
router.delete("/:id/assign-playlist", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });
  const deviceId = req.params.id;
  // Hapus assign playlist dari device
  await DevicePlaylist.destroy({ where: { device_id: deviceId } });
  res.json({ success: true });
});

// Get assigned playlist for device
router.get("/:id/assigned-playlist", async (req, res) => {
  const deviceId = req.params.id;
  const assignment = await DevicePlaylist.findOne({
    where: { device_id: deviceId },
  });
  if (!assignment) return res.json({ playlist: null });
  const playlist = await Playlist.findByPk(assignment.playlist_id);
  res.json({ playlist });
});

// Only tenant admin can manage devices for their tenant, or super admin can manage all
function canManageDevices(req) {
  return (
    req.user &&
    (req.user.role === "tenant_admin" || req.user.role === "super_admin")
  );
}

// GET /devices
router.get("/", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });

  let whereClause = {};
  if (req.user.role === "tenant_admin") {
    whereClause.tenant_id = req.user.tenant_id;
  }
  // Super admin can see all devices (no where clause restriction)

  const devices = await Device.findAll({
    where: whereClause,
    include: [
      Tenant,
      {
        model: DevicePlaylist,
        include: [
          {
            model: Playlist,
          },
        ],
      },
    ],
  });

  // Update device status based on last_heartbeat in real-time
  const HEARTBEAT_TIMEOUT = 120; // 2 minutes in seconds
  const now = new Date();

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

// POST /devices
router.post("/", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { name, token, device_type, location, resolution } = req.body;

    // Check tenant's device limit based on package
    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      include: [Package],
    });

    if (!tenant || !tenant.Package) {
      return res.status(400).json({ message: "Tenant package not found" });
    }

    const currentDevices = await Device.count({
      where: { tenant_id: req.user.tenant_id },
    });

    if (currentDevices >= tenant.Package.max_devices) {
      return res.status(400).json({
        message: `Device limit reached. Your ${tenant.Package.name} plan allows maximum ${tenant.Package.max_devices} devices. Please upgrade your plan.`,
      });
    }

    // Generate device_id based on device_type and count
    const typePrefix = (device_type || "tv").toUpperCase();
    const deviceCount = await Device.count({
      where: {
        tenant_id: req.user.tenant_id,
        device_type: device_type || "tv",
      },
    });
    const deviceId = `${typePrefix}${String(deviceCount + 1).padStart(3, "0")}`;

    // Generate license key
    const licenseKey = `${deviceId}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Set expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const device = await Device.create({
      name,
      device_id: deviceId,
      device_name: name,
      token: token || `DEV-${Date.now()}`,
      license_key: licenseKey,
      device_type: device_type || "tv",
      location: location || "Not specified",
      resolution: resolution || "1920x1080",
      status: "offline",
      tenant_id: req.user.tenant_id,
      package_id: tenant.package_id,
      expires_at: expiresAt,
      last_heartbeat: null,
      player_info: null,
    });
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /devices/stats - Get device statistics
router.get("/stats", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });

  let whereClause = {};
  if (req.user.role === "tenant_admin") {
    whereClause.tenant_id = req.user.tenant_id;
  }

  try {
    const HEARTBEAT_TIMEOUT = 120; // 2 minutes in seconds
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - HEARTBEAT_TIMEOUT * 1000);

    const totalDevices = await Device.count({ where: whereClause });

    // Count devices with recent heartbeat (within last 2 minutes) as online
    const onlineDevices = await Device.count({
      where: {
        ...whereClause,
        last_heartbeat: {
          [Op.gte]: cutoffTime,
        },
      },
    });

    const offlineDevices = totalDevices - onlineDevices;

    const uptime =
      totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    res.json({
      total: totalDevices,
      online: onlineDevices,
      offline: offlineDevices,
      uptime: uptime,
    });
  } catch (error) {
    logger.logError(error, req, { action: "Get Device Stats" });
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /devices/:id
router.get("/:id", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });
  const device = await Device.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    include: [Tenant],
  });
  if (!device) return res.status(404).json({ message: "Not found" });
  res.json(device);
});

// PUT /devices/:id
router.put("/:id", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });
  const device = await Device.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!device) return res.status(404).json({ message: "Not found" });
  try {
    const { name, status, token, device_type, location, resolution } = req.body;
    if (name) {
      device.name = name;
      device.device_name = name; // Also update device_name
    }
    if (status) device.status = status;
    if (token) device.token = token;
    if (device_type) device.device_type = device_type;
    if (location) device.location = location;
    if (resolution) device.resolution = resolution;
    device.last_seen = new Date();
    await device.save();
    res.json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /devices/:id
router.delete("/:id", async (req, res) => {
  if (!canManageDevices(req))
    return res.status(403).json({ message: "Forbidden" });
  const device = await Device.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!device) return res.status(404).json({ message: "Not found" });
  await device.destroy();
  res.json({ message: "Deleted" });
});

module.exports = router;
