const express = require("express");
const { Tenant, Package, User, Device } = require("../models");
const router = express.Router();
const authMiddleware = require("./authMiddleware");

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
    console.error("Storage info error:", error);
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

    // Update tenant
    await tenant.update({
      name,
      email,
      subdomain,
      package_id,
      expired_at,
      status,
      custom_max_devices,
      custom_storage_gb,
      duration_months,
    });

    // Always check and cleanup devices if exceed limit
    try {
      // Get device limit
      const newPackage = await Package.findByPk(package_id);
      const maxDevices =
        custom_max_devices || (newPackage ? newPackage.max_devices : 999);

      console.log(
        `[Tenant Update] Checking device limit for tenant ${tenant.name}: max=${maxDevices}`
      );

      // Count current devices
      const devices = await Device.findAll({
        where: { tenant_id: tenant.id },
        order: [["registered_at", "DESC"]], // Sort by newest first
      });

      console.log(
        `[Tenant Update] Current devices: ${devices.length}, limit: ${maxDevices}`
      );

      // If devices exceed limit, delete the newest ones
      if (devices && devices.length > maxDevices) {
        const devicesToDelete = devices.slice(0, devices.length - maxDevices);
        const deleteIds = devicesToDelete.map((d) => d.id);

        console.log(
          `[Tenant Update] Deleting ${deleteIds.length} devices:`,
          deleteIds
        );

        if (deleteIds.length > 0) {
          const deletedCount = await Device.destroy({
            where: { id: deleteIds },
          });

          console.log(
            `✅ Deleted ${deletedCount} devices for tenant ${tenant.name} (limit: ${maxDevices}, had: ${devices.length})`
          );
        }
      } else {
        console.log(`[Tenant Update] No cleanup needed - devices within limit`);
      }
    } catch (deviceError) {
      console.error("❌ Error cleaning up devices:", deviceError);
      // Don't fail the whole update if device cleanup fails
    }

    res.json(tenant);
  } catch (err) {
    console.error("Error updating tenant:", err);
    res.status(400).json({ message: err.message, stack: err.stack });
  }
});

// DELETE /tenants/:id
router.delete("/:id", isSuperAdmin, async (req, res) => {
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) return res.status(404).json({ message: "Not found" });
  await tenant.destroy();
  res.json({ message: "Deleted" });
});

module.exports = router;
