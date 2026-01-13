const express = require("express");
const { Package, Tenant, Payment } = require("../models");
const router = express.Router();
const authMiddleware = require("./authMiddleware");

// Middleware: Only super admin
function isSuperAdmin(req, res, next) {
  if (req.user && req.user.role === "super_admin") return next();
  return res.status(403).json({ message: "Forbidden" });
}

// GET /packages
router.get("/", async (req, res) => {
  try {
    const packages = await Package.findAll({
      where: { is_active: true },
      order: [["price", "ASC"]],
    });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /packages/current - Get current tenant's package
router.get("/current", async (req, res) => {
  if (!req.user || req.user.role !== "tenant_admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      include: [Package],
    });

    if (!tenant || !tenant.Package) {
      return res.status(404).json({ message: "Package not found" });
    }

    // Return package with custom values if they exist
    const packageData = tenant.Package.toJSON();
    if (tenant.custom_max_devices !== null) {
      packageData.max_devices = tenant.custom_max_devices;
    }
    if (tenant.custom_storage_gb !== null) {
      packageData.storage_gb = tenant.custom_storage_gb;
    }

    res.json(packageData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /packages/upgrade - Upgrade tenant's package
router.post("/upgrade", async (req, res) => {
  if (!req.user || req.user.role !== "tenant_admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { package_id } = req.body;

    const newPackage = await Package.findByPk(package_id);
    if (!newPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    const tenant = await Tenant.findByPk(req.user.tenant_id, {
      include: [Package],
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check if it's actually an upgrade
    if (tenant.Package && newPackage.price <= tenant.Package.price) {
      return res
        .status(400)
        .json({ message: "You can only upgrade to a higher plan" });
    }

    // Create payment record for the upgrade
    const payment = await Payment.create({
      tenant_id: req.user.tenant_id,
      package_id: package_id,
      amount: newPackage.price,
      status: "pending",
      payment_method: "manual",
      description: `Upgrade to ${newPackage.name} plan`,
    });

    res.json({
      message: "Upgrade request created. Please complete payment.",
      payment: payment,
      package: newPackage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /packages/:id - Update package (super admin only)
router.put("/:id", authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const packageId = req.params.id;
    const pkg = await Package.findByPk(packageId);

    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    const { max_devices, storage_gb } = req.body;

    // Update only if values are provided
    const updateData = {};
    if (max_devices !== undefined) updateData.max_devices = max_devices;
    if (storage_gb !== undefined) updateData.storage_gb = storage_gb;

    await pkg.update(updateData);

    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
