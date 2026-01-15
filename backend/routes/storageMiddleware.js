const { Tenant, Package, Content } = require("../models");
const { Op } = require("sequelize");
const { cleanupExcessStorage } = require("../utils/storageCleanup");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");
const sequelize = require("../db");

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

    // Determine storage limit
    let maxStorageGB = tenant.custom_storage_gb || tenant.Package.storage_gb;

    // FORCE DIRECT SQL QUERY to bypass any ORM/connection cache
    // This ensures we get the MOST UP-TO-DATE storage data after deletes
    const results = await sequelize.query(
      `SELECT id, filename, size FROM contents WHERE tenant_id = ? ORDER BY id`,
      {
        replacements: [tenantId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // When using QueryTypes.SELECT, sequelize returns array directly (not [results, metadata])
    const contents = Array.isArray(results) ? results : [];

    logger.info("Storage check: files retrieved via DIRECT SQL", {
      action: "storage_check",
      tenantId,
      fileCount: contents.length,
    });

    const usedStorageBytes = contents.reduce((total, content) => {
      return total + (parseInt(content.size) || 0);
    }, 0);

    const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024);
    const usedStorageMB = usedStorageBytes / (1024 * 1024);
    const maxStorageBytes = maxStorageGB * 1024 * 1024 * 1024;

    logger.info("Storage check: usage calculated", {
      action: "storage_check",
      tenantId,
      usedStorageMB: usedStorageMB.toFixed(2),
      usedStorageGB: usedStorageGB.toFixed(3),
      maxStorageGB,
    });

    // Jika upload baru, cek ukuran file
    if (req.file) {
      const newFileBytes = req.file.size;
      const newFileGB = newFileBytes / (1024 * 1024 * 1024);
      const totalAfterUploadBytes = usedStorageBytes + newFileBytes;
      const totalAfterUploadGB = totalAfterUploadBytes / (1024 * 1024 * 1024);

      logger.info("Storage check: upload size calculated", {
        action: "storage_check_upload",
        tenantId,
        uploadSizeGB: newFileGB.toFixed(3),
        totalAfterUploadGB: totalAfterUploadGB.toFixed(3),
      });

      // PENTING: TIDAK ADA AUTO CLEANUP saat upload!
      // User harus hapus file lama secara MANUAL terlebih dahulu
      // Auto cleanup HANYA untuk scenario downgrade package, bukan untuk upload
      if (totalAfterUploadBytes > maxStorageBytes) {
        logger.warn("Storage check: upload will exceed limit, REJECTING", {
          action: "storage_quota_exceeded",
          tenantId,
          totalAfterUploadBytes,
          maxStorageBytes,
        });

        // Delete the uploaded file immediately
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
            logger.info(
              "Storage check: deleted uploaded file due to quota exceeded",
              {
                action: "storage_cleanup_upload",
                tenantId,
                filePath: req.file.path,
              }
            );
          } catch (deleteError) {
            logger.error("Storage check: error deleting uploaded file", {
              action: "storage_cleanup_upload_error",
              tenantId,
              filePath: req.file.path,
              error: deleteError.message,
            });
          }
        }

        // Calculate storage in MB for clarity (1 GB = 1024 MB)
        const usedStorageMB = (usedStorageBytes / (1024 * 1024)).toFixed(2);
        const maxStorageMB = (maxStorageBytes / (1024 * 1024)).toFixed(2);
        const newFileMB = (newFileBytes / (1024 * 1024)).toFixed(2);
        const totalAfterUploadMB = (
          totalAfterUploadBytes /
          (1024 * 1024)
        ).toFixed(2);
        const spaceNeeded = totalAfterUploadBytes - maxStorageBytes;
        const spaceNeededMB = (spaceNeeded / (1024 * 1024)).toFixed(2);

        return res.status(413).json({
          message: `Ruang penyimpanan tidak cukup! Saat ini terpakai ${usedStorageMB}MB dari ${maxStorageMB}MB (${maxStorageGB}GB). File yang ingin diupload: ${newFileMB}MB. Total setelah upload: ${totalAfterUploadMB}MB. Anda perlu menghapus ${spaceNeededMB}MB file lama terlebih dahulu, atau upgrade paket Anda.`,
          type: "storage_quota_exceeded",
          usedStorageMB: parseFloat(usedStorageMB),
          maxStorageMB: parseFloat(maxStorageMB),
          fileSizeMB: parseFloat(newFileMB),
          totalAfterUploadMB: parseFloat(totalAfterUploadMB),
          spaceNeededMB: parseFloat(spaceNeededMB),
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
    logger.error("Storage quota check error", {
      action: "storage_quota_check_error",
      tenantId: req.user?.tenant_id,
      error: error.message,
    });
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

    // Use custom_storage_gb if available, otherwise use package storage
    const maxStorageGB = tenant.custom_storage_gb || tenant.Package.storage_gb;

    logger.info("Storage info retrieved", {
      action: "get_storage_info",
      tenantId,
      usedStorageGB: usedStorageGB.toFixed(3),
      maxStorageGB,
    });

    return {
      usedStorage: usedStorageBytes,
      storageLimit: maxStorageGB * 1024 * 1024 * 1024, // Convert GB to bytes
      usagePercentage: (usedStorageGB / maxStorageGB) * 100,
      packageName: tenant.Package.name,
    };
  } catch (error) {
    logger.error("Get storage info error", {
      action: "get_storage_info_error",
      tenantId,
      error: error.message,
    });
    return null;
  }
};

module.exports = {
  checkStorageQuota,
  getStorageInfo,
};
