const { Tenant, Package, Content } = require("../models");
const { Op } = require("sequelize");

// Middleware untuk mengecek storage quota
const checkStorageQuota = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;

    // Get tenant dengan package info
    const tenant = await Tenant.findByPk(tenantId, {
      include: [{ model: Package }],
    });

    if (!tenant || !tenant.Package) {
      return res.status(400).json({
        message: "Tenant package not found",
        type: "error",
      });
    }

    // Skip check untuk custom package
    if (tenant.Package.name === "Custom") {
      return next();
    }

    // Hitung total storage yang sudah digunakan
    const contents = await Content.findAll({
      where: { tenant_id: tenantId },
      attributes: ["size"],
    });

    const usedStorageBytes = contents.reduce((total, content) => {
      return total + (parseInt(content.size) || 0);
    }, 0);

    const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
    const maxStorageGB = tenant.Package.storage_gb;

    // Jika upload baru, cek ukuran file
    if (req.file) {
      const newFileGB = req.file.size / (1024 * 1024 * 1024);
      if (usedStorageGB + newFileGB > maxStorageGB) {
        return res.status(413).json({
          message: `Storage quota exceeded. Used: ${usedStorageGB.toFixed(
            2
          )}GB, Max: ${maxStorageGB}GB, File size: ${newFileGB.toFixed(2)}GB`,
          type: "storage_quota_exceeded",
          usedStorage: usedStorageGB.toFixed(2),
          maxStorage: maxStorageGB,
          fileSize: newFileGB.toFixed(2),
        });
      }
    }

    // Attach storage info ke request
    req.storageInfo = {
      used: usedStorageGB,
      max: maxStorageGB,
      available: maxStorageGB - usedStorageGB,
    };

    next();
  } catch (error) {
    console.error("Storage quota check error:", error);
    res.status(500).json({
      message: "Error checking storage quota",
      type: "error",
    });
  }
};

// Function untuk mendapatkan storage info
const getStorageInfo = async (tenantId) => {
  try {
    const tenant = await Tenant.findByPk(tenantId, {
      include: [{ model: Package }],
    });

    if (!tenant || !tenant.Package) {
      return null;
    }

    const contents = await Content.findAll({
      where: { tenant_id: tenantId },
      attributes: ["size"],
    });

    const usedStorageBytes = contents.reduce((total, content) => {
      return total + (parseInt(content.size) || 0);
    }, 0);

    const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
    const maxStorageGB = tenant.Package.storage_gb;

    return {
      usedStorage: usedStorageBytes,
      storageLimit: maxStorageGB * 1024 * 1024 * 1024, // Convert GB to bytes
      usagePercentage: (usedStorageGB / maxStorageGB) * 100,
      packageName: tenant.Package.name,
    };
  } catch (error) {
    console.error("Get storage info error:", error);
    return null;
  }
};

module.exports = {
  checkStorageQuota,
  getStorageInfo,
};
