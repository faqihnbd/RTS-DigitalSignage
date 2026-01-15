/**
 * Manual Trigger Storage Cleanup
 * Run this to force cleanup storage for a specific tenant
 */

const { Tenant, Package, Content } = require("../models");
const { cleanupExcessStorage } = require("../utils/storageCleanup");

async function manualCleanup() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("MANUAL STORAGE CLEANUP");
    console.log("=".repeat(60));

    // Get all tenants
    const tenants = await Tenant.findAll({
      include: [{ model: Package }],
    });

    console.log(`\nFound ${tenants.length} tenants\n`);

    for (const tenant of tenants) {
      console.log(`\n${"─".repeat(60)}`);
      console.log(`Tenant: ${tenant.name} (ID: ${tenant.id})`);

      // Get storage limit
      let storageLimit;
      if (tenant.custom_storage_gb) {
        storageLimit = tenant.custom_storage_gb;
      } else if (tenant.Package) {
        storageLimit = tenant.Package.storage_gb;
      } else {
        console.log("⚠️  No package/storage limit found, skipping...");
        continue;
      }

      console.log(`Storage limit: ${storageLimit}GB`);

      // Get current usage
      const contents = await Content.findAll({
        where: { tenant_id: tenant.id },
        attributes: ["size"],
      });

      const usedBytes = contents.reduce((total, content) => {
        return total + (parseInt(content.size) || 0);
      }, 0);

      const usedGB = usedBytes / (1024 * 1024 * 1024);
      const limitBytes = storageLimit * 1024 * 1024 * 1024;

      console.log(`Current usage: ${usedGB.toFixed(3)}GB`);

      if (usedBytes > limitBytes) {
        const excessGB = (usedBytes - limitBytes) / (1024 * 1024 * 1024);
        console.log(`⚠️  OVER LIMIT by ${excessGB.toFixed(3)}GB`);
        console.log("\n🔧 Starting cleanup...");

        const result = await cleanupExcessStorage(tenant.id, storageLimit);

        if (result.success) {
          console.log("✅ Cleanup completed!");
          console.log(`   Files deleted: ${result.deletedCount}`);
          console.log(`   Space freed: ${result.freedSpaceGB}GB`);
          console.log(`   Previous: ${result.previousUsageGB}GB`);
          console.log(`   Current: ${result.currentUsageGB}GB`);
        } else {
          console.log("❌ Cleanup failed");
        }
      } else {
        console.log("✅ Storage within limit, no cleanup needed");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("CLEANUP COMPLETED FOR ALL TENANTS");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

manualCleanup();
