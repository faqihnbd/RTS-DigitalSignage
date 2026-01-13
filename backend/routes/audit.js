const express = require("express");
const { User, Tenant, Device, Content } = require("../models");
const { Op } = require("sequelize");
const router = express.Router();

// GET /audit - Get audit logs
router.get("/", async (req, res) => {
  try {
    const userRole = req.user.role;
    const tenantId = req.user.tenant_id;
    const { page = 1, limit = 10, action, user_id, from, to } = req.query;

    // Build where clause for filtering
    let where = {};

    // Role-based filtering
    if (userRole !== "super_admin" && tenantId) {
      where.tenant_id = tenantId;
    }

    if (action) {
      where.action = { [Op.iLike]: `%${action}%` };
    }

    if (user_id) {
      where.user_id = user_id;
    }

    if (from && to) {
      where.timestamp = {
        [Op.between]: [new Date(from), new Date(to)],
      };
    }

    // Mock audit log data since we don't have a dedicated audit table
    const mockAuditLogs = [
      {
        id: 1,
        action: "LOGIN",
        user_id: req.user.id,
        user_name: req.user.name || "Current User",
        tenant_id: tenantId,
        tenant_name: tenantId ? "Sample Tenant" : null,
        details: "User logged into the system",
        ip_address: req.ip || "127.0.0.1",
        user_agent: req.get("User-Agent") || "",
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        action: "CONTENT_CREATE",
        user_id: req.user.id,
        user_name: req.user.name || "Current User",
        tenant_id: tenantId,
        tenant_name: tenantId ? "Sample Tenant" : null,
        details: "Created new content item",
        ip_address: req.ip || "127.0.0.1",
        user_agent: req.get("User-Agent") || "",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        action: "DEVICE_UPDATE",
        user_id: req.user.id,
        user_name: req.user.name || "Current User",
        tenant_id: tenantId,
        tenant_name: tenantId ? "Sample Tenant" : null,
        details: "Updated device configuration",
        ip_address: req.ip || "127.0.0.1",
        user_agent: req.get("User-Agent") || "",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        action: "PLAYLIST_DELETE",
        user_id: req.user.id,
        user_name: req.user.name || "Current User",
        tenant_id: tenantId,
        tenant_name: tenantId ? "Sample Tenant" : null,
        details: "Deleted playlist",
        ip_address: req.ip || "127.0.0.1",
        user_agent: req.get("User-Agent") || "",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 5,
        action: "USER_CREATE",
        user_id: req.user.id,
        user_name: req.user.name || "Current User",
        tenant_id: tenantId,
        tenant_name: tenantId ? "Sample Tenant" : null,
        details: "Created new user account",
        ip_address: req.ip || "127.0.0.1",
        user_agent: req.get("User-Agent") || "",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Apply filters to mock data
    let filteredLogs = mockAuditLogs;

    if (action) {
      filteredLogs = filteredLogs.filter((log) =>
        log.action.toLowerCase().includes(action.toLowerCase())
      );
    }

    if (from || to) {
      filteredLogs = filteredLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        if (from && logDate < new Date(from)) return false;
        if (to && logDate > new Date(to)) return false;
        return true;
      });
    }

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(offset, offset + parseInt(limit));

    res.json({
      logs: paginatedLogs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: filteredLogs.length,
        total_pages: Math.ceil(filteredLogs.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /audit/actions - Get available audit actions for filtering
router.get("/actions", async (req, res) => {
  try {
    const actions = [
      "LOGIN",
      "LOGOUT",
      "CONTENT_CREATE",
      "CONTENT_UPDATE",
      "CONTENT_DELETE",
      "DEVICE_CREATE",
      "DEVICE_UPDATE",
      "DEVICE_DELETE",
      "PLAYLIST_CREATE",
      "PLAYLIST_UPDATE",
      "PLAYLIST_DELETE",
      "SCHEDULE_CREATE",
      "SCHEDULE_UPDATE",
      "SCHEDULE_DELETE",
      "USER_CREATE",
      "USER_UPDATE",
      "USER_DELETE",
      "TENANT_CREATE",
      "TENANT_UPDATE",
      "TENANT_DELETE",
    ];

    res.json(actions);
  } catch (error) {
    console.error("Error fetching audit actions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
