const express = require("express");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const {
  Device,
  Schedule,
  Playlist,
  PlaylistItem,
  Content,
  Tenant,
  Package,
  Layout,
  LayoutZone,
} = require("../models");
const logger = require("../utils/logger");
const router = express.Router();

// Middleware untuk validasi device token
const validateDeviceToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const deviceId = req.params.deviceId; // Might be undefined for some routes

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let device;

    if (deviceId) {
      // For routes with deviceId parameter, validate both device_id and license_key
      device = await Device.findOne({
        where: {
          device_id: deviceId,
          license_key: token,
          status: { [Op.in]: ["active", "online", "offline"] }, // Accept active, online, and offline (for new devices)
        },
        include: ["Tenant"],
      });

      // If device not found with both deviceId and token, check which one is wrong
      if (!device) {
        // Check if device exists with this deviceId
        const deviceExists = await Device.findOne({
          where: { device_id: deviceId },
        });

        if (!deviceExists) {
          return res.status(401).json({
            error: "INVALID_DEVICE_ID",
            message:
              "Device ID tidak ditemukan. Periksa kembali Device ID Anda.",
          });
        }

        // Device exists but token is wrong
        return res.status(401).json({
          error: "INVALID_TOKEN",
          message: "License Key tidak valid. Periksa kembali License Key Anda.",
        });
      }
    } else {
      // For routes without deviceId parameter, validate only license_key
      device = await Device.findOne({
        where: {
          license_key: token,
          status: { [Op.in]: ["active", "online", "offline"] }, // Accept active, online, and offline (for new devices)
        },
        include: ["Tenant"],
      });

      if (!device) {
        return res.status(401).json({
          error: "INVALID_TOKEN",
          message: "License Key tidak valid. Periksa kembali License Key Anda.",
        });
      }
    }

    if (!device.Tenant) {
      return res.status(401).json({
        error: "TENANT_NOT_FOUND",
        message: "Tenant tidak ditemukan untuk device ini.",
      });
    }

    // Check if tenant is active OR if tenant package has expired
    if (device.Tenant.status !== "active") {
      let errorMessage = "Inactive device or tenant";

      if (device.Tenant.status === "expired") {
        errorMessage = "PACKAGE_EXPIRED";
      } else if (device.Tenant.status === "suspended") {
        errorMessage = "TENANT_SUSPENDED";
      }

      return res.status(401).json({
        error: errorMessage,
        tenant_status: device.Tenant.status,
        expired_at: device.Tenant.expired_at,
      });
    }

    // Additional check: Verify if package expiry date has passed
    if (device.Tenant.expired_at) {
      const now = new Date();
      const expiryDate = new Date(device.Tenant.expired_at);

      if (now > expiryDate) {
        // Auto-update tenant status to expired
        await device.Tenant.update({ status: "expired" });

        return res.status(401).json({
          error: "PACKAGE_EXPIRED",
          tenant_status: "expired",
          expired_at: device.Tenant.expired_at,
          message: "Paket telah habis. Silakan hubungi administrator.",
        });
      }
    }

    req.device = device;
    next();
  } catch (error) {
    logger.logDevice("Token Validation Error", req, { error: error.message });
    res.status(401).json({ error: "Invalid token" });
  }
};

// GET /player/data/:deviceId - New endpoint for frontend-display
router.get("/data/:deviceId", validateDeviceToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const clientSessionId = req.headers["x-session-id"] || "default";

    // Find device
    const device = await Device.findOne({
      where: { device_id: deviceId },
      include: ["Tenant", "Package"],
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Check if device belongs to same tenant as token
    if (device.tenant_id !== req.device.tenant_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // VALIDASI KETAT: Check for concurrent sessions
    const currentSessionId = device.player_info
      ? JSON.parse(device.player_info).sessionId
      : null;

    // Jika ada session lain yang aktif, cek apakah masih valid
    if (currentSessionId && currentSessionId !== clientSessionId) {
      const lastHeartbeat = device.last_heartbeat;
      const now = new Date();
      const timeDiff = lastHeartbeat
        ? (now - new Date(lastHeartbeat)) / 1000
        : 999;

      // Jika session lain masih aktif dalam 2 menit terakhir, TOLAK akses
      // TIDAK ADA BYPASS - validasi ketat untuk 1 license = 1 session aktif
      if (timeDiff < 120) {
        return res.status(409).json({
          error: "LICENSE_IN_USE",
          message:
            "🔒 Perangkat ini sedang digunakan di browser/aplikasi lain. Setiap license hanya dapat digunakan untuk 1 sesi aktif. Tutup aplikasi lain terlebih dahulu atau tunggu 2 menit.",
          inUse: true,
          timeDiff: Math.round(timeDiff),
          deviceId: device.device_id,
          details: {
            currentlyActive: true,
            lastHeartbeat: lastHeartbeat,
            waitTime: `${Math.ceil(120 - timeDiff)} detik`,
          },
        });
      } else {
        // Session lama sudah expired (> 2 menit), izinkan session baru
      }
    }

    // Update session info dengan session baru
    const playerInfo = {
      sessionId: clientSessionId,
      lastAccess: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "Unknown",
      ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      connectedAt: new Date().toISOString(),
    };

    await device.update({
      player_info: JSON.stringify(playerInfo),
      last_heartbeat: new Date(),
      status: "online",
    });

    // Get assigned playlists for this specific device
    const { DevicePlaylist } = require("../models");

    // First get device playlist assignments
    const devicePlaylists = await DevicePlaylist.findAll({
      where: { device_id: device.id },
      include: [
        {
          model: Playlist,
          include: [
            {
              model: PlaylistItem,
              as: "items",
              include: [
                {
                  model: Content,
                  as: "content",
                },
              ],
            },
            {
              model: Schedule,
              as: "schedules",
            },
            {
              model: Layout,
              as: "layout",
              include: [
                {
                  model: LayoutZone,
                  as: "zones",
                  include: [
                    { model: Content, as: "content" },
                    {
                      model: Playlist,
                      as: "playlist",
                      include: [
                        {
                          model: PlaylistItem,
                          as: "items",
                          include: [{ model: Content, as: "content" }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          { model: Playlist },
          { model: PlaylistItem, as: "items" },
          "order",
          "ASC",
        ],
        [
          { model: Playlist },
          { model: Layout, as: "layout" },
          { model: LayoutZone, as: "zones" },
          { model: Playlist, as: "playlist" },
          { model: PlaylistItem, as: "items" },
          "order",
          "ASC",
        ],
      ],
    });

    const playlists = devicePlaylists.map((dp) => dp.Playlist).filter(Boolean);

    const playerData = {
      device: {
        id: device.device_id,
        name: device.device_name,
        location: device.location,
        tenant_id: device.tenant_id,
        package: device.Package,
      },
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        loop: playlist.loop,
        layout: playlist.layout
          ? {
              id: playlist.layout.id,
              name: playlist.layout.name,
              type: playlist.layout.type,
              configuration: playlist.layout.configuration,
              displays: playlist.layout.configuration?.displays || [
                {
                  id: 1,
                  name: "Display 1",
                  orientation: "landscape",
                  primary: true,
                },
              ],
              zones: playlist.layout.zones
                ? playlist.layout.zones.map((zone) => ({
                    id: zone.id,
                    zone_name: zone.zone_name,
                    position: zone.position,
                    content_type: zone.content_type,
                    content_id: zone.content_id,
                    playlist_id: zone.playlist_id,
                    settings: zone.settings,
                    z_index: zone.z_index,
                    is_visible: zone.is_visible,
                    content: zone.content
                      ? {
                          id: zone.content.id,
                          filename: zone.content.filename,
                          file_path: zone.content.file_path,
                          file_size: zone.content.file_size,
                          mime_type: zone.content.mime_type,
                          type: zone.content.type,
                          title: zone.content.title,
                        }
                      : null,
                    playlist: zone.playlist
                      ? {
                          id: zone.playlist.id,
                          name: zone.playlist.name,
                          items: zone.playlist.items
                            ? zone.playlist.items.map((item) => ({
                                id: item.id,
                                order: item.order,
                                duration_sec:
                                  item.duration_sec ||
                                  item.content?.duration_sec,
                                content: item.content
                                  ? {
                                      id: item.content.id,
                                      filename: item.content.filename,
                                      file_path: item.content.file_path,
                                      mime_type: item.content.mime_type,
                                      type: item.content.type,
                                      title: item.content.title,
                                      duration_sec: item.content.duration_sec,
                                    }
                                  : null,
                              }))
                            : [],
                        }
                      : null,
                  }))
                : [],
            }
          : null,
        items: playlist.items
          ? playlist.items.map((item) => ({
              id: item.id,
              name: item.name,
              content_id: item.content_id,
              content_type: item.content?.type || "unknown",
              duration_sec: item.duration_sec,
              orientation: item.orientation,
              transition: item.transition,
              order: item.order,
              start_date: item.start_date,
              end_date: item.end_date,
              html_content: item.html_content,
              // Add content details
              content: item.content
                ? {
                    id: item.content.id,
                    filename: item.content.filename,
                    file_path: item.content.file_path,
                    file_size: item.content.file_size,
                    mime_type: item.content.mime_type,
                  }
                : null,
            }))
          : [],
        schedules: playlist.schedules
          ? playlist.schedules.map((schedule) => ({
              id: schedule.id,
              name: schedule.name,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              days: schedule.days
                ? JSON.parse(schedule.days)
                : [0, 1, 2, 3, 4, 5, 6],
              start_date: schedule.start_date,
              end_date: schedule.end_date,
              is_active: schedule.is_active,
            }))
          : [],
      })),
      settings: {
        refresh_interval: 5 * 60 * 1000, // 5 minutes
        heartbeat_interval: 60 * 1000, // 1 minute
        cache_duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        preload_content: true,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(playerData);
  } catch (error) {
    logger.logError(error, req, {
      action: "Get Player Data",
      deviceId: req.params.deviceId,
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Device heartbeat
router.post("/heartbeat", validateDeviceToken, async (req, res) => {
  try {
    const { status, player_info } = req.body;

    // Use device from middleware (already validated)
    const device = req.device;

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Update device status
    await device.update({
      last_heartbeat: new Date(),
      status: status || "online",
      player_info: player_info
        ? JSON.stringify(player_info)
        : device.player_info,
    });

    res.json({
      success: true,
      message: "Heartbeat received",
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    logger.logError(error, req, { action: "Process Heartbeat" });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Playback statistics
router.post("/stats", validateDeviceToken, async (req, res) => {
  try {
    const {
      device_id,
      playlist_id,
      content_id,
      play_duration,
      total_duration,
      event_type, // 'play_start', 'play_end', 'error'
    } = req.body;

    // You can implement PlayerStats model or log to existing model
    // For now, we'll just acknowledge

    res.json({
      success: true,
      message: "Statistics recorded",
    });
  } catch (error) {
    logger.logError(error, req, { action: "Record Stats" });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error reporting
router.post("/error", validateDeviceToken, async (req, res) => {
  try {
    const errorData = req.body;

    // Log error from player device
    logger.error("Player error reported", {
      ...errorData,
      deviceId: req.device?.device_id,
      tenantId: req.device?.tenant_id,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Error report received",
    });
  } catch (error) {
    logger.logError(error, req, { action: "Process Error Report" });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "RTS Digital Signage Player API",
  });
});

// GET /player/validate?token=xxx (Keep existing endpoint for backward compatibility)
router.get("/validate", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: "Token required" });
  const device = await Device.findOne({ where: { token }, include: [Tenant] });
  if (!device) return res.status(404).json({ message: "Device not found" });
  if (
    device.status !== "active" ||
    !device.Tenant ||
    device.Tenant.status !== "active"
  ) {
    return res.status(403).json({ message: "Device or tenant not active" });
  }
  res.json({
    valid: true,
    device: { id: device.id, name: device.name, tenant_id: device.tenant_id },
  });
});

// GET /player/schedule?token=xxx
router.get("/schedule", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: "Token required" });
  const device = await Device.findOne({ where: { token }, include: [Tenant] });
  if (
    !device ||
    device.status !== "active" ||
    !device.Tenant ||
    device.Tenant.status !== "active"
  ) {
    return res.status(403).json({ message: "Device or tenant not active" });
  }
  // Ambil semua jadwal aktif untuk device ini
  const schedules = await Schedule.findAll({
    where: { device_id: device.id, tenant_id: device.tenant_id },
    include: [
      {
        model: Playlist,
        include: [
          {
            model: PlaylistItem,
            as: "items",
            include: [{ model: Content, as: "content" }],
          },
        ],
      },
    ],
  });
  res.json({ device: { id: device.id, name: device.name }, schedules });
});

// GET /player/content/:id - Download content file for player (requires device token)
router.get("/content/:id", validateDeviceToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find content by ID
    const content = await Content.findByPk(id);

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    // Check if file exists
    const filePath = path.join(
      __dirname,
      "..",
      content.file_path || `uploads/${content.filename}`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    // Set appropriate headers
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    res.set({
      "Content-Type": content.mime_type || "application/octet-stream",
      "Content-Length": fileSize,
      "Content-Disposition": `inline; filename="${content.filename}"`,
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      "Accept-Ranges": "bytes",
    });

    // Support range requests for video streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).set({
          "Content-Range": `bytes */${fileSize}`,
        });
        return res.end();
      }

      const chunksize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.status(206).set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
      });

      stream.pipe(res);
    } else {
      // Send full file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    logger.logError(error, req, {
      action: "Serve Content File",
      contentId: req.params.id,
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
