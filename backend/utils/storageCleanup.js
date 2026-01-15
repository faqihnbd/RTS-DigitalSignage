const { Content, Tenant, Package } = require("../models");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

/**
 * Auto cleanup storage ketika melebihi limit
 * Menghapus file dari yang paling akhir di upload sampai storage <= limit
 *
 * @param {number} tenantId - ID tenant yang akan dibersihkan storagenya
 * @param {number} maxStorageGB - Batas storage maksimal dalam GB (opsional, jika tidak ada akan ambil dari package)
 * @returns {Promise<Object>} - Result dengan info cleanup
 */
async function cleanupExcessStorage(tenantId, maxStorageGB = null) {
  try {
    logger.info("Starting storage cleanup", { tenantId, maxStorageGB });

    // Get tenant dan package info
    const tenant = await Tenant.findByPk(tenantId, {
      include: [{ model: Package }],
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Determine storage limit
    let storageLimit = maxStorageGB;
    if (!storageLimit) {
      if (tenant.custom_storage_gb) {
        storageLimit = tenant.custom_storage_gb;
      } else if (tenant.Package) {
        storageLimit = tenant.Package.storage_gb;
      } else {
        storageLimit = 1; // Default 1GB
      }
    }

    logger.info("Storage limit determined", { tenantId, storageLimit });

    // Skip cleanup untuk custom package dengan unlimited storage
    if (tenant.Package && tenant.Package.name === "Custom" && !maxStorageGB) {
      logger.info("Skipping cleanup for Custom package", {
        tenantId,
        packageName: "Custom",
      });
      return {
        success: true,
        message: "No cleanup needed for Custom package",
        deletedFiles: [],
        freedSpace: 0,
      };
    }

    // Get all content sorted by uploaded_at DESC (newest first)
    const contents = await Content.findAll({
      where: { tenant_id: tenantId },
      order: [["uploaded_at", "DESC"]],
      attributes: ["id", "filename", "size", "uploaded_at", "type"],
    });

    if (!contents || contents.length === 0) {
      logger.info("No content found for cleanup", { tenantId });
      return {
        success: true,
        message: "No content to cleanup",
        deletedFiles: [],
        freedSpace: 0,
      };
    }

    // Calculate total storage used
    const totalStorageBytes = contents.reduce((total, content) => {
      return total + (parseInt(content.size) || 0);
    }, 0);

    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const storageLimitBytes = storageLimit * 1024 * 1024 * 1024;

    logger.info("Storage usage calculated", {
      tenantId,
      currentUsageGB: totalStorageGB.toFixed(3),
      limitGB: storageLimit,
    });

    // Check if cleanup is needed
    if (totalStorageBytes <= storageLimitBytes) {
      logger.info("Storage within limit, no cleanup needed", {
        tenantId,
        currentUsageGB: totalStorageGB.toFixed(3),
        limitGB: storageLimit,
      });
      return {
        success: true,
        message: "Storage within limit",
        currentUsageGB: totalStorageGB.toFixed(3),
        limitGB: storageLimit,
        deletedFiles: [],
        freedSpace: 0,
      };
    }

    // Calculate excess storage
    const excessBytes = totalStorageBytes - storageLimitBytes;
    const excessGB = excessBytes / (1024 * 1024 * 1024);

    logger.warn("Excess storage detected, cleanup required", {
      tenantId,
      excessGB: excessGB.toFixed(3),
      currentUsageGB: totalStorageGB.toFixed(3),
      limitGB: storageLimit,
    });

    // Start deleting files from the oldest until BELOW limit
    let currentStorageBytes = totalStorageBytes;
    const deletedFiles = [];
    let totalFreedBytes = 0;

    // Reverse array to delete from oldest first (uploaded_at DESC means newest first, so we go backwards)
    const contentsReversed = [...contents].reverse();

    for (const content of contentsReversed) {
      const fileSize = parseInt(content.size) || 0;

      logger.debug("Checking file for cleanup", {
        tenantId,
        contentId: content.id,
        filename: content.filename,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        currentUsageGB: (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(3),
        limitGB: storageLimit,
      });

      // Check if we need to delete this file
      // Continue deleting if BEFORE deleting we're still over or at limit
      // This ensures we end up BELOW the limit, not just at it
      if (currentStorageBytes <= storageLimitBytes) {
        logger.info("Storage now below limit, stopping cleanup", {
          tenantId,
          currentUsageGB: (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(
            3
          ),
          limitGB: storageLimit,
        });
        break;
      }

      logger.info("Deleting file for storage cleanup", {
        tenantId,
        contentId: content.id,
        filename: content.filename,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
      });

      // Delete from database FIRST to maintain data consistency
      try {
        await content.destroy();
        logger.info("Content deleted from database", {
          tenantId,
          contentId: content.id,
          filename: content.filename,
        });

        // Delete physical file AFTER database is updated
        if (content.filename) {
          const filePath = path.join(__dirname, "../uploads", content.filename);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              logger.info("Physical file deleted", {
                tenantId,
                contentId: content.id,
                filePath,
              });
            } else {
              logger.warn("Physical file not found on disk", {
                tenantId,
                contentId: content.id,
                filePath,
              });
            }
          } catch (fileError) {
            logger.error("Error deleting physical file", {
              tenantId,
              contentId: content.id,
              filePath,
              error: fileError.message,
            });
            // File deletion failed but database is already updated
            // This is safer than the reverse (orphaned DB records cause corrupt UI)
          }
        }

        deletedFiles.push({
          id: content.id,
          filename: content.filename,
          size: fileSize,
          sizeGB: (fileSize / (1024 * 1024 * 1024)).toFixed(4),
          uploadedAt: content.uploaded_at,
        });

        currentStorageBytes -= fileSize;
        totalFreedBytes += fileSize;

        logger.debug("Storage usage after delete", {
          tenantId,
          currentUsageGB: (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(
            3
          ),
          limitGB: storageLimit,
        });
      } catch (dbError) {
        logger.error("Error deleting content from database", {
          tenantId,
          contentId: content.id,
          filename: content.filename,
          error: dbError.message,
        });
        // Skip this file if database delete fails
        continue;
      }
    }

    const finalStorageGB = currentStorageBytes / (1024 * 1024 * 1024);
    const freedSpaceGB = totalFreedBytes / (1024 * 1024 * 1024);

    logger.info("Storage cleanup completed", {
      tenantId,
      deletedCount: deletedFiles.length,
      freedSpaceGB: freedSpaceGB.toFixed(3),
      previousUsageGB: totalStorageGB.toFixed(3),
      finalUsageGB: finalStorageGB.toFixed(3),
      limitGB: storageLimit,
    });

    return {
      success: true,
      message: `Cleanup completed: deleted ${deletedFiles.length} files`,
      deletedCount: deletedFiles.length,
      deletedFiles,
      freedSpaceBytes: totalFreedBytes,
      freedSpaceGB: freedSpaceGB.toFixed(3),
      previousUsageGB: totalStorageGB.toFixed(3),
      currentUsageGB: finalStorageGB.toFixed(3),
      limitGB: storageLimit,
    };
  } catch (error) {
    logger.error("Error during storage cleanup", {
      tenantId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get current storage usage info for a tenant
 *
 * @param {number} tenantId - ID tenant
 * @returns {Promise<Object>} - Storage info
 */
async function getStorageUsage(tenantId) {
  try {
    const tenant = await Tenant.findByPk(tenantId, {
      include: [{ model: Package }],
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Determine storage limit
    let storageLimit;
    if (tenant.custom_storage_gb) {
      storageLimit = tenant.custom_storage_gb;
    } else if (tenant.Package) {
      storageLimit = tenant.Package.storage_gb;
    } else {
      storageLimit = 1; // Default 1GB
    }

    // Get all content
    const contents = await Content.findAll({
      where: { tenant_id: tenantId },
      attributes: ["size"],
    });

    const totalStorageBytes = contents.reduce((total, content) => {
      return total + (parseInt(content.size) || 0);
    }, 0);

    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const storageLimitBytes = storageLimit * 1024 * 1024 * 1024;
    const usagePercentage = (totalStorageBytes / storageLimitBytes) * 100;

    return {
      usedBytes: totalStorageBytes,
      usedGB: totalStorageGB.toFixed(3),
      limitBytes: storageLimitBytes,
      limitGB: storageLimit,
      availableBytes: Math.max(0, storageLimitBytes - totalStorageBytes),
      availableGB: Math.max(
        0,
        (storageLimitBytes - totalStorageBytes) / (1024 * 1024 * 1024)
      ).toFixed(3),
      usagePercentage: Math.min(100, usagePercentage).toFixed(2),
      isOverLimit: totalStorageBytes > storageLimitBytes,
      excessBytes: Math.max(0, totalStorageBytes - storageLimitBytes),
      excessGB: Math.max(
        0,
        (totalStorageBytes - storageLimitBytes) / (1024 * 1024 * 1024)
      ).toFixed(3),
    };
  } catch (error) {
    logger.error("Error getting storage usage", {
      tenantId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  cleanupExcessStorage,
  getStorageUsage,
};
