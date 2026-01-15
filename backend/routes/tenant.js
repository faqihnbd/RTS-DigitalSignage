const express = require("express");
const { Tenant, Package, User, Device, Content } = require("../models");
const router = express.Router();
const authMiddleware = require("./authMiddleware");
const logger = require("../utils/logger");
const {
  cleanupExcessStorage,
  getStorageUsage,
} = require("../utils/storageCleanup");
const path = require("path");
const fs = require("fs").promises;

// GET /tenant/me (khusus tenant_admin, ambil data tenant miliknya sendiri)
router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== "tenant_admin" || !req.user.tenant_id) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const tenant = await Tenant.findByPk(req.user.tenant_id, {
    include: [
      Package,
      {
        model: User,
        where: { id: req.user.id },
        required: false,
      },
    ],
  });
  if (!tenant) return res.status(404).json({ message: "Not found" });

  // Add user email to response
  const response = {
    ...tenant.toJSON(),
    User: tenant.Users?.[0] || { email: req.user.email },
  };

  res.json(response);
});

// GET /tenants/storage-info (khusus tenant_admin, ambil info storage dan package)
router.get("/storage-info", authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== "tenant_admin" || !req.user.tenant_id) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      include: [Package],
    });
    if (!tenant) return res.status(404).json({ message: "Not found" });

    // Calculate storage usage
    const { Content } = require("../models");
    const contents = await Content.findAll({
      where: { tenant_id: req.user.tenant_id },
      attributes: ["size"],
    });

    const usedStorageBytes = contents.reduce((total, content) => {
      return total + (parseInt(content.size) || 0);
    }, 0);

    const packageStorageGB = tenant.Package ? tenant.Package.storage : 1; // Default 1GB if no package
    const maxStorageBytes = packageStorageGB * 1024 * 1024 * 1024;
    const usagePercentage = (usedStorageBytes / maxStorageBytes) * 100;

    const storageInfo = {
      packageName: tenant.Package ? tenant.Package.name : "No Package",
      packagePrice: tenant.Package ? tenant.Package.price : null,
      maxStorage: packageStorageGB,
      usedStorage: usedStorageBytes,
      remainingStorage: maxStorageBytes - usedStorageBytes,
      usagePercentage: Math.min(100, usagePercentage),
      package: tenant.Package
        ? {
            name: tenant.Package.name,
            storage: tenant.Package.storage,
            devices: tenant.Package.devices,
            price: tenant.Package.price,
          }
        : null,
      tenant: {
        name: tenant.name,
        status: tenant.status,
        expired_at: tenant.expired_at,
      },
    };

    res.json(storageInfo);
  } catch (error) {
    logger.logError(error, req, {
      action: "get_storage_info",
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Middleware: Only super admin
function isSuperAdmin(req, res, next) {
  if (req.user && req.user.role === "super_admin") return next();
  return res.status(403).json({ message: "Forbidden" });
}

// GET /tenants
router.get("/", isSuperAdmin, async (req, res) => {
  const tenants = await Tenant.findAll({ include: [Package] });
  res.json(tenants);
});

// POST /tenants
router.post("/", isSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      subdomain,
      package_id,
      expired_at,
      custom_max_devices,
      custom_storage_gb,
      duration_months,
    } = req.body;
    if (!email || typeof email !== "string" || email.trim() === "") {
      return res
        .status(400)
        .json({ message: "Email wajib diisi dan tidak boleh kosong" });
    }
    const tenant = await Tenant.create({
      name,
      email,
      subdomain,
      package_id,
      expired_at,
      custom_max_devices,
      custom_storage_gb,
      duration_months,
    });
    res.status(201).json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /tenants/:id
router.get("/:id", isSuperAdmin, async (req, res) => {
  const tenant = await Tenant.findByPk(req.params.id, { include: [Package] });
  if (!tenant) return res.status(404).json({ message: "Not found" });
  res.json(tenant);
});

// PUT /tenants/:id
router.put("/:id", isSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Not found" });

    const oldPackageId = tenant.package_id;
    const oldCustomMaxDevices = tenant.custom_max_devices;
    const oldCustomStorageGb = tenant.custom_storage_gb;

    const {
      name,
      email,
      subdomain,
      package_id,
      expired_at,
      status,
      custom_max_devices,
      custom_storage_gb,
      duration_months,
    } = req.body;
    if (!email || typeof email !== "string" || email.trim() === "") {
      return res
        .status(400)
        .json({ message: "Email wajib diisi dan tidak boleh kosong" });
    }

    // Automatically set status to active if expired_at is in the future
    let finalStatus = status;
    if (expired_at) {
      const expiryDate = new Date(expired_at);
      const now = new Date();
      if (expiryDate > now && tenant.status === "expired") {
        finalStatus = "active";
        logger.info("Tenant status changed from expired to active", {
          action: "tenant_status_change",
          tenantId: tenant.id,
          tenantName: tenant.name,
        });
      }
    }

    // Check if storage limit is being reduced
    let storageCleanupNeeded = false;
    let newStorageLimit = null;
    let oldStorageLimit = null;

    // Get old storage limit
    if (oldCustomStorageGb) {
      oldStorageLimit = oldCustomStorageGb;
    } else if (oldPackageId) {
      const oldPackage = await Package.findByPk(oldPackageId);
      if (oldPackage) {
        oldStorageLimit = oldPackage.storage_gb;
      }
    }

    // Get new storage limit
    if (custom_storage_gb !== undefined && custom_storage_gb !== null) {
      newStorageLimit = custom_storage_gb;
    } else if (package_id) {
      const newPackage = await Package.findByPk(package_id);
      if (newPackage) {
        newStorageLimit = newPackage.storage_gb;
      }
    }

    logger.info("Storage limit check during tenant update", {
      action: "storage_check",
      tenantId: tenant.id,
      oldStorageGB: oldStorageLimit,
      newStorageGB: newStorageLimit,
    });

    // Check if storage is being reduced (downgrade scenario)
    if (
      oldStorageLimit &&
      newStorageLimit &&
      newStorageLimit < oldStorageLimit
    ) {
      logger.warn("Storage downgrade detected", {
        action: "storage_downgrade",
        tenantId: tenant.id,
        oldStorageGB: oldStorageLimit,
        newStorageGB: newStorageLimit,
      });
      storageCleanupNeeded = true;
    }

    // Update tenant
    await tenant.update({
      name,
      email,
      subdomain,
      package_id,
      expired_at,
      status: finalStatus,
      custom_max_devices,
      custom_storage_gb,
      duration_months,
    });

    // ALWAYS check and cleanup storage after update
    let storageCleanupResult = null;

    // Determine final storage limit after update
    let finalStorageLimit = null;
    if (custom_storage_gb !== undefined && custom_storage_gb !== null) {
      finalStorageLimit = custom_storage_gb;
    } else if (package_id) {
      const finalPackage = await Package.findByPk(package_id);
      if (finalPackage) {
        finalStorageLimit = finalPackage.storage_gb;
      }
    }

    if (finalStorageLimit) {
      try {
        const { Content } = require("../models");
        const contents = await Content.findAll({
          where: { tenant_id: tenant.id },
          attributes: ["size"],
        });

        const usedStorageBytes = contents.reduce((total, content) => {
          return total + (parseInt(content.size) || 0);
        }, 0);

        const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
        const maxStorageBytes = finalStorageLimit * 1024 * 1024 * 1024;

        logger.info("Storage usage check after tenant update", {
          action: "storage_usage_check",
          tenantId: tenant.id,
          usedStorageGB: usedStorageGB.toFixed(3),
          limitGB: finalStorageLimit,
        });

        // If storage exceeds limit, cleanup automatically
        if (usedStorageBytes > maxStorageBytes) {
          logger.warn("Storage exceeds limit, starting auto cleanup", {
            action: "storage_auto_cleanup_start",
            tenantId: tenant.id,
            usedBytes: usedStorageBytes,
            maxBytes: maxStorageBytes,
          });
          storageCleanupResult = await cleanupExcessStorage(
            tenant.id,
            finalStorageLimit
          );

          if (storageCleanupResult.success) {
            logger.info("Storage cleanup completed successfully", {
              action: "storage_cleanup_success",
              tenantId: tenant.id,
              deletedCount: storageCleanupResult.deletedCount,
              freedSpaceGB: storageCleanupResult.freedSpaceGB,
              currentUsageGB: storageCleanupResult.currentUsageGB,
              limitGB: finalStorageLimit,
            });
          }
        } else {
          logger.info("Storage within limit, no cleanup needed", {
            action: "storage_check_ok",
            tenantId: tenant.id,
          });
        }
      } catch (checkError) {
        logger.error("Error checking/cleaning storage during tenant update", {
          action: "storage_cleanup_error",
          tenantId: tenant.id,
          error: checkError.message,
        });
        // Don't fail the whole update if cleanup fails
      }
    }

    // Always check and cleanup devices if exceed limit
    try {
      // Get device limit
      const newPackage = await Package.findByPk(package_id);
      const maxDevices =
        custom_max_devices || (newPackage ? newPackage.max_devices : 999);

      logger.info("Checking device limit for tenant", {
        action: "device_limit_check",
        tenantId: tenant.id,
        tenantName: tenant.name,
        maxDevices: maxDevices,
      });

      // Count current devices
      const devices = await Device.findAll({
        where: { tenant_id: tenant.id },
        order: [["registered_at", "DESC"]], // Sort by newest first
      });

      logger.info("Current devices count for tenant", {
        action: "device_count",
        tenantId: tenant.id,
        currentDevices: devices.length,
        maxDevices: maxDevices,
      });

      // If devices exceed limit, delete the newest ones
      if (devices && devices.length > maxDevices) {
        const devicesToDelete = devices.slice(0, devices.length - maxDevices);
        const deleteIds = devicesToDelete.map((d) => d.id);

        logger.info("Deleting excess devices for tenant", {
          action: "device_cleanup_start",
          tenantId: tenant.id,
          devicesToDelete: deleteIds.length,
          deviceIds: deleteIds,
        });

        if (deleteIds.length > 0) {
          const deletedCount = await Device.destroy({
            where: { id: deleteIds },
          });

          logger.info("Deleted excess devices for tenant", {
            action: "device_cleanup_success",
            tenantId: tenant.id,
            tenantName: tenant.name,
            deletedCount: deletedCount,
            maxDevices: maxDevices,
            hadDevices: devices.length,
          });
        }
      } else {
        logger.info("Devices within limit, no cleanup needed", {
          action: "device_check_ok",
          tenantId: tenant.id,
        });
      }
    } catch (deviceError) {
      logger.error("Error cleaning up devices during tenant update", {
        action: "device_cleanup_error",
        tenantId: tenant.id,
        error: deviceError.message,
      });
      // Don't fail the whole update if device cleanup fails
    }

    // Prepare response
    const response = {
      ...tenant.toJSON(),
    };

    // Add storage cleanup info if it occurred
    if (storageCleanupResult) {
      response.storageCleanup = storageCleanupResult;
    }

    res.json(response);
  } catch (err) {
    logger.logError(err, req, {
      action: "update_tenant",
      tenantId: req.params.id,
    });
    res.status(400).json({ message: err.message, stack: err.stack });
  }
});

// DELETE /tenants/:id
router.delete("/:id", isSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Not found" });

    // 1. Get all content files dari tenant ini sebelum dihapus
    const contents = await Content.findAll({
      where: { tenant_id: req.params.id },
      attributes: ["id", "filename", "type"],
    });

    // 2. Hapus file fisik dari storage
    const uploadDir = path.join(__dirname, "..", "uploads");
    let deletedFiles = 0;
    let failedFiles = 0;

    for (const content of contents) {
      if (content.filename) {
        const filePath = path.join(uploadDir, content.filename);
        try {
          await fs.unlink(filePath);
          deletedFiles++;
        } catch (err) {
          // File might not exist, ignore error
          if (err.code !== "ENOENT") {
            logger.error("Failed to delete file during tenant deletion", {
              action: "delete_tenant_file_error",
              tenantId: req.params.id,
              filename: content.filename,
              error: err.message,
            });
            failedFiles++;
          }
        }
      }
    }

    // 3. Hapus tenant (CASCADE akan hapus semua data terkait di database)
    await tenant.destroy();

    res.json({
      message: "Tenant deleted successfully",
      details: {
        tenant_name: tenant.name,
        deleted_files: deletedFiles,
        failed_files: failedFiles,
        total_contents: contents.length,
      },
    });
  } catch (err) {
    logger.logError(err, req, {
      action: "delete_tenant",
      tenantId: req.params.id,
    });
    res.status(500).json({ message: err.message });
  }
});

// POST /tenants/:id/extend-package - Extend tenant package duration
router.post("/:id/extend-package", isSuperAdmin, async (req, res) => {
  try {
    const { duration_months } = req.body;

    if (!duration_months || duration_months <= 0) {
      return res.status(400).json({ message: "Invalid duration_months" });
    }

    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Calculate new expiry date
    const currentExpiry = tenant.expired_at
      ? new Date(tenant.expired_at)
      : new Date();
    const now = new Date();

    // If current expiry is in the past, extend from now
    // Otherwise extend from current expiry date
    const baseDate = currentExpiry > now ? currentExpiry : now;

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + duration_months);

    // Update tenant
    await tenant.update({
      expired_at: newExpiry,
      status: "active", // Reactivate tenant
      duration_months: duration_months,
    });

    // Reactivate all devices of this tenant
    await Device.update(
      { status: "active" },
      {
        where: {
          tenant_id: tenant.id,
          status: "suspended",
        },
      }
    );

    res.json({
      message: "Package extended successfully",
      tenant: tenant,
      new_expiry: newExpiry,
      extended_by_months: duration_months,
    });
  } catch (err) {
    logger.logError(err, req, {
      action: "extend_package",
      tenantId: req.params.id,
      durationMonths: duration_months,
    });
    res.status(500).json({ message: err.message });
  }
});

// GET /tenants/expiry-status - Get expiry status summary (for super admin dashboard)
router.get("/expiry-status/summary", isSuperAdmin, async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { getDaysUntilExpiry } = require("../utils/tenantExpiry");

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Get expired tenants
    const expiredTenants = await Tenant.findAll({
      where: {
        status: "expired",
      },
      include: [Package],
    });

    // Get expiring within 7 days
    const expiringSoon = await Tenant.findAll({
      where: {
        status: "active",
        expired_at: {
          [Op.not]: null,
          [Op.between]: [now, in7Days],
        },
      },
      include: [Package],
    });

    // Get expiring within 30 days
    const expiringThisMonth = await Tenant.findAll({
      where: {
        status: "active",
        expired_at: {
          [Op.not]: null,
          [Op.between]: [now, in30Days],
        },
      },
      include: [Package],
    });

    res.json({
      expired: {
        count: expiredTenants.length,
        tenants: expiredTenants.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          expired_at: t.expired_at,
          package_name: t.Package?.name || "No Package",
          days_expired: Math.abs(getDaysUntilExpiry(t.expired_at)),
        })),
      },
      expiring_soon: {
        count: expiringSoon.length,
        tenants: expiringSoon.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          expired_at: t.expired_at,
          package_name: t.Package?.name || "No Package",
          days_remaining: getDaysUntilExpiry(t.expired_at),
        })),
      },
      expiring_this_month: {
        count: expiringThisMonth.length,
        tenants: expiringThisMonth.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          expired_at: t.expired_at,
          package_name: t.Package?.name || "No Package",
          days_remaining: getDaysUntilExpiry(t.expired_at),
        })),
      },
    });
  } catch (err) {
    logger.logError(err, req, { action: "get_expiry_status" });
    res.status(500).json({ message: err.message });
  }
});

// POST /tenants/:id/suspend - Suspend or activate tenant
router.post("/:id/suspend", isSuperAdmin, async (req, res) => {
  try {
    const { suspended } = req.body;

    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Update tenant status based on suspend flag
    const newStatus = suspended ? "suspended" : "active";
    await tenant.update({
      status: newStatus,
      suspended: suspended,
    });

    // Update all devices of this tenant
    const deviceStatus = suspended ? "suspended" : "active";
    await Device.update(
      { status: deviceStatus },
      {
        where: {
          tenant_id: tenant.id,
        },
      }
    );

    res.json({
      message: suspended
        ? "Tenant suspended successfully"
        : "Tenant activated successfully",
      tenant: tenant,
    });
  } catch (err) {
    logger.logError(err, req, {
      action: "suspend_activate_tenant",
      tenantId: req.params.id,
    });
    res.status(500).json({ message: err.message });
  }
});

// POST /tenants/:id/cleanup-storage - Force cleanup storage for tenant
router.post("/:id/cleanup-storage", isSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [{ model: Package }],
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    logger.info("Starting forced storage cleanup for tenant", {
      action: "force_cleanup_start",
      tenantId: tenant.id,
      tenantName: tenant.name,
    });

    // Get storage limit
    let storageLimit;
    if (tenant.custom_storage_gb) {
      storageLimit = tenant.custom_storage_gb;
    } else if (tenant.Package) {
      storageLimit = tenant.Package.storage_gb;
    } else {
      return res
        .status(400)
        .json({ message: "No storage limit found for tenant" });
    }

    // Perform cleanup
    const cleanupResult = await cleanupExcessStorage(tenant.id, storageLimit);

    res.json({
      success: true,
      message: "Storage cleanup completed",
      tenant: {
        id: tenant.id,
        name: tenant.name,
        storageLimit: storageLimit,
      },
      cleanup: cleanupResult,
    });
  } catch (error) {
    logger.logError(error, req, {
      action: "force_cleanup",
      tenantId: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: "Error during storage cleanup",
      error: error.message,
    });
  }
});

module.exports = router;
