const express = require("express");
const { User, Tenant, Device, Content } = require("../models");
const logger = require("../utils/logger");
const router = express.Router();

// GET /notifications - Get notifications for current user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const tenantId = req.user.tenant_id;

    // Mock notifications based on user role and tenant
    let notifications = [];

    if (userRole === "super_admin") {
      // Super admin notifications
      const totalTenants = await Tenant.count();
      const totalDevices = await Device.count();
      const totalContents = await Content.count();

      notifications = [
        {
          id: 1,
          type: "info",
          title: "System Overview",
          message: `System has ${totalTenants} tenants, ${totalDevices} devices, and ${totalContents} content items.`,
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: 2,
          type: "warning",
          title: "System Maintenance",
          message: "Scheduled maintenance will occur this weekend.",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: false,
        },
      ];
    } else if (userRole === "tenant_admin") {
      // Tenant admin notifications
      const tenantDevices = await Device.count({
        where: { tenant_id: tenantId },
      });
      const tenantContents = await Content.count({
        where: { tenant_id: tenantId },
      });

      notifications = [
        {
          id: 1,
          type: "info",
          title: "Tenant Overview",
          message: `Your tenant has ${tenantDevices} devices and ${tenantContents} content items.`,
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: 2,
          type: "success",
          title: "Content Updated",
          message: "New content has been successfully uploaded.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
      ];
    } else {
      // Regular user notifications
      notifications = [
        {
          id: 1,
          type: "info",
          title: "Welcome",
          message: "Welcome to RunToStart CMS!",
          timestamp: new Date().toISOString(),
          read: false,
        },
      ];
    }

    res.json(notifications);
  } catch (error) {
    logger.logError(error, req, {
      action: "fetch_notifications",
      userId: req.user.id,
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /notifications/:id/read - Mark notification as read
router.post("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, you would update the notification in the database
    // For now, just return success
    res.json({ message: "Notification marked as read", id: parseInt(id) });
  } catch (error) {
    logger.logError(error, req, {
      action: "mark_notification_read",
      notificationId: req.params.id,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /notifications/:id - Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, you would delete the notification from the database
    // For now, just return success
    res.json({ message: "Notification deleted", id: parseInt(id) });
  } catch (error) {
    logger.logError(error, req, {
      action: "delete_notification",
      notificationId: req.params.id,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
