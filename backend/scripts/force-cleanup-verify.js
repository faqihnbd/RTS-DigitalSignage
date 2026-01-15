const { Content, Tenant, Package } = require("../models");
const path = require("path");
const fs = require("fs");

async function checkAndForceCleanup() {
  try {
    console.log("\n=== FORCE CLEANUP & VERIFY ===\n");

    // Get tenant 1
    const tenant = await Tenant.findByPk(1, {
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

    const storageLimit =
      tenant.custom_storage_gb || tenant.Package?.storage_gb || 1;
    const storageLimitBytes = storageLimit * 1024 * 1024 * 1024;

    console.log(
      `\nStorage Limit: ${storageLimit}GB (${storageLimitBytes.toLocaleString()} bytes)`
    );

    // Get all content
    const contents = await Content.findAll({
      where: { tenant_id: 1 },
      order: [["uploaded_at", "DESC"]],
      attributes: ["id", "filename", "size", "uploaded_at"],
    });

    console.log(`\nTotal files: ${contents.length}`);

    // Calculate total size
    let totalBytes = 0;
    contents.forEach((c) => {
      totalBytes += parseInt(c.size) || 0;
    });

    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const totalMB = totalBytes / (1024 * 1024);

    console.log(`\nCurrent Storage:`);
    console.log(`  Bytes: ${totalBytes.toLocaleString()}`);
    console.log(`  MB: ${totalMB.toFixed(2)}`);
    console.log(`  GB: ${totalGB.toFixed(3)}`);

    if (totalBytes > storageLimitBytes) {
      const excessBytes = totalBytes - storageLimitBytes;
      const excessMB = excessBytes / (1024 * 1024);
      console.log(`\n⚠️  OVER LIMIT by ${excessMB.toFixed(2)} MB`);
      console.log("\n🗑️  Starting FORCE cleanup...\n");

      // Reverse to delete oldest first
      const contentsReversed = [...contents].reverse();
      let currentBytes = totalBytes;
      let deletedCount = 0;

      for (const content of contentsReversed) {
        // Keep deleting until we're comfortably below limit
        if (currentBytes < storageLimitBytes * 0.95) {
          console.log(
            `\n✅ Storage now at ${(currentBytes / (1024 * 1024)).toFixed(
              2
            )} MB (below 95% of limit)`
          );
          break;
        }

        const fileSize = parseInt(content.size) || 0;

        console.log(
          `Deleting: ${content.filename} (${(fileSize / (1024 * 1024)).toFixed(
            2
          )} MB)`
        );

        // Delete physical file
        if (content.filename) {
          const filePath = path.join(__dirname, "../uploads", content.filename);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log("  ✅ File deleted from disk");
            }
          } catch (err) {
            console.log("  ⚠️  File delete error:", err.message);
          }
        }

        // Delete from database
        await content.destroy();
        console.log("  ✅ Deleted from database");

        currentBytes -= fileSize;
        deletedCount++;
      }

      console.log(`\n✅ Cleanup completed!`);
      console.log(`   Deleted: ${deletedCount} files`);
      console.log(
        `   Final size: ${(currentBytes / (1024 * 1024)).toFixed(2)} MB`
      );
      console.log(
        `   Final size: ${(currentBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`
      );
    } else {
      console.log(
        `\n✅ Storage within limit (${(
          (totalBytes / storageLimitBytes) *
          100
        ).toFixed(1)}% used)`
      );
    }

    // Final verification
    console.log("\n=== FINAL VERIFICATION ===\n");
    const finalContents = await Content.findAll({
      where: { tenant_id: 1 },
      attributes: ["size"],
    });

    const finalBytes = finalContents.reduce(
      (sum, c) => sum + (parseInt(c.size) || 0),
      0
    );
    const finalMB = finalBytes / (1024 * 1024);
    const finalGB = finalBytes / (1024 * 1024 * 1024);

    console.log(`Final Storage:`);
    console.log(`  ${finalMB.toFixed(2)} MB`);
    console.log(`  ${finalGB.toFixed(3)} GB`);
    console.log(
      `  ${((finalBytes / storageLimitBytes) * 100).toFixed(
        1
      )}% of ${storageLimit}GB limit`
    );

    if (finalBytes < storageLimitBytes) {
      console.log(`\n✅ SUCCESS! Storage is below limit`);
    } else {
      console.log(`\n❌ STILL OVER LIMIT!`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAndForceCleanup();
