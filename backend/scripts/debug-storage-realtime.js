require("dotenv").config();
const { Tenant, Package, Content } = require("../models");

async function debugStorage() {
  try {
    console.log("\n=== DEBUG STORAGE CALCULATION ===\n");

    // Get tenant
    const tenant = await Tenant.findOne({
      where: { email: "central@rts.com" },
      include: [{ model: Package }],
    });

    if (!tenant) {
      console.log("❌ Tenant not found");
      return;
    }

    console.log(`Tenant: ${tenant.name}`);
    console.log(
      `Package: ${tenant.Package?.name} (${tenant.Package?.storage_gb}GB)`
    );
    console.log(`Custom Storage: ${tenant.custom_storage_gb || "None"}`);

    // Determine storage limit
    let maxStorageGB = tenant.custom_storage_gb || tenant.Package.storage_gb;
    const maxStorageBytes = maxStorageGB * 1024 * 1024 * 1024;

    console.log(
      `\nStorage Limit: ${maxStorageGB}GB (${maxStorageBytes.toLocaleString()} bytes)`
    );

    // Get all contents
    const contents = await Content.findAll({
      where: { tenant_id: tenant.id },
      attributes: ["id", "filename", "size", "uploaded_at"],
      order: [["uploaded_at", "DESC"]],
    });

    console.log(`\nTotal files in database: ${contents.length}\n`);

    let totalBytes = 0;
    contents.forEach((content, index) => {
      const sizeBytes = parseInt(content.size) || 0;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
      totalBytes += sizeBytes;

      console.log(
        `${index + 1}. ID ${content.id}: ${
          content.filename
        } - ${sizeMB} MB (${sizeBytes.toLocaleString()} bytes)`
      );
    });

    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const totalMB = totalBytes / (1024 * 1024);
    const percentage = ((totalBytes / maxStorageBytes) * 100).toFixed(1);

    console.log(`\n=== STORAGE SUMMARY ===`);
    console.log(`Total: ${totalBytes.toLocaleString()} bytes`);
    console.log(`Total: ${totalMB.toFixed(2)} MB`);
    console.log(`Total: ${totalGB.toFixed(3)} GB`);
    console.log(`Limit: ${maxStorageGB} GB`);
    console.log(`Used: ${percentage}%`);

    const availableBytes = maxStorageBytes - totalBytes;
    const availableMB = availableBytes / (1024 * 1024);
    const availableGB = availableBytes / (1024 * 1024 * 1024);

    console.log(
      `\nAvailable: ${availableMB.toFixed(2)} MB (${availableGB.toFixed(3)} GB)`
    );

    if (totalBytes > maxStorageBytes) {
      console.log(
        `\n❌ OVER LIMIT by ${(
          (totalBytes - maxStorageBytes) /
          (1024 * 1024)
        ).toFixed(2)} MB`
      );
    } else {
      console.log(`\n✅ Within limit (${availableMB.toFixed(2)} MB available)`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

debugStorage();
