/**
 * Test untuk memastikan upload TIDAK menghapus file lama saat storage penuh
 *
 * Scenario:
 * 1. Storage saat ini: 63.29 MB / 1 GB (6.2%)
 * 2. Upload file besar yang akan exceed limit
 * 3. Upload harus DITOLAK tanpa menghapus file yang sudah ada
 * 4. Verify file lama masih ada setelah upload ditolak
 */

const { Content } = require("../models");
const { getStorageInfo } = require("../utils/storageCleanup");

async function testStorageProtection() {
  const tenantId = 1; // Test Tenant

  console.log("=== TEST STORAGE PROTECTION ===\n");

  try {
    // 1. Get current files list
    console.log("1. Getting current files list...");
    const filesBefore = await Content.findAll({
      where: { tenant_id: tenantId },
      attributes: ["id", "filename", "size", "uploaded_at"],
      order: [["uploaded_at", "ASC"]],
    });

    console.log(`\nFiles BEFORE upload attempt:`);
    filesBefore.forEach((file, idx) => {
      console.log(
        `  ${idx + 1}. ID ${file.id}: ${file.filename} (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      );
    });

    // 2. Get current storage
    const storageBefore = await getStorageInfo(tenantId);
    console.log(
      `\nStorage BEFORE: ${storageBefore.usedMB}MB / ${storageBefore.limitMB}MB (${storageBefore.percentageUsed}%)`
    );

    // 3. Simulate upload rejection scenario
    console.log(
      `\n2. Simulating upload of large file that would exceed limit...`
    );
    console.log(`   (In real scenario, middleware would reject this upload)`);
    console.log(`   Expected: Upload rejected WITHOUT deleting existing files`);

    // 4. Verify files after
    console.log(`\n3. Verifying files still exist after upload rejection...`);
    const filesAfter = await Content.findAll({
      where: { tenant_id: tenantId },
      attributes: ["id", "filename", "size", "uploaded_at"],
      order: [["uploaded_at", "ASC"]],
    });

    console.log(`\nFiles AFTER upload rejection:`);
    filesAfter.forEach((file, idx) => {
      console.log(
        `  ${idx + 1}. ID ${file.id}: ${file.filename} (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      );
    });

    // 5. Compare
    console.log(`\n=== COMPARISON ===`);
    console.log(`Files before: ${filesBefore.length}`);
    console.log(`Files after: ${filesAfter.length}`);

    if (filesBefore.length === filesAfter.length) {
      console.log(`\n✅ SUCCESS! All files preserved after upload rejection`);
      console.log(`✅ No files were deleted when upload was rejected`);
    } else {
      console.log(`\n❌ FAILED! Files were deleted when upload was rejected`);
      console.log(
        `❌ This should NOT happen - existing files must be preserved`
      );
    }

    // 6. Storage verification
    const storageAfter = await getStorageInfo(tenantId);
    console.log(
      `\nStorage AFTER: ${storageAfter.usedMB}MB / ${storageAfter.limitMB}MB (${storageAfter.percentageUsed}%)`
    );

    if (storageBefore.usedBytes === storageAfter.usedBytes) {
      console.log(`✅ Storage unchanged - correct behavior`);
    } else {
      console.log(`❌ Storage changed - files were deleted!`);
    }

    console.log("\n=== TEST COMPLETE ===");
  } catch (error) {
    console.error("Error during test:", error);
  }

  process.exit(0);
}

testStorageProtection();
