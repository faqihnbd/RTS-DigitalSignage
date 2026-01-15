// Utility untuk mengecek dan mengupdate status tenant yang expired
const { Tenant, Device } = require("../models");
const { Op } = require("sequelize");
const logger = require("./logger");

/**
 * Check and update expired tenants
 * This function will check all tenants and update their status to 'expired'
 * if their expired_at date has passed
 */
async function checkAndUpdateExpiredTenants() {
  try {
    const now = new Date();

    // Find all tenants that have expired but status is still 'active'
    const expiredTenants = await Tenant.findAll({
      where: {
        status: "active",
        expired_at: {
          [Op.not]: null,
          [Op.lt]: now, // expired_at is less than current time
        },
      },
    });

    if (expiredTenants.length > 0) {
      logger.info("Found expired tenants. Updating status...", {
        module: "tenant-expiry",
        count: expiredTenants.length,
      });

      // Update all expired tenants to 'expired' status
      for (const tenant of expiredTenants) {
        await tenant.update({ status: "expired" });
        logger.info("Updated tenant to expired status", {
          module: "tenant-expiry",
          tenantId: tenant.id,
          tenantName: tenant.name,
        });

        // Also mark all devices of this tenant as suspended
        await Device.update(
          { status: "suspended" },
          {
            where: {
              tenant_id: tenant.id,
              status: {
                [Op.in]: ["active", "online", "offline"],
              },
            },
          }
        );
      }

      logger.info("Successfully updated expired tenants", {
        module: "tenant-expiry",
        count: expiredTenants.length,
      });
    }

    return expiredTenants.length;
  } catch (error) {
    logger.error("Error checking expired tenants", {
      module: "tenant-expiry",
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Check tenants that will expire soon (within next 7 days)
 * Returns list of tenants for notification purposes
 */
async function getTenantsExpiringSoon(daysAhead = 7) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringTenants = await Tenant.findAll({
      where: {
        status: "active",
        expired_at: {
          [Op.not]: null,
          [Op.between]: [now, futureDate],
        },
      },
    });

    return expiringTenants;
  } catch (error) {
    logger.error("Error checking expiring tenants", {
      module: "tenant-expiry",
      daysAhead,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get days remaining until expiry for a tenant
 */
function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

module.exports = {
  checkAndUpdateExpiredTenants,
  getTenantsExpiringSoon,
  getDaysUntilExpiry,
};
