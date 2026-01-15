require("dotenv").config();
const { Content } = require("../models");
const fs = require("fs");
const path = require("path");

async function cleanupOrphanedRecords() {
  try {
    console.log("\n=== CLEANUP ORPHANED RECORDS ===\n");

    const contents = await Content.findAll({
      order: [["id", "ASC"]],
    });

    console.log(`Total records in database: ${contents.length}\n`);

    let deletedCount = 0;
    const deletedRecords = [];

    for (const content of contents) {
      if (!content.filename) {
        console.log(`⚠️  Skipping ID ${content.id}: No filename`);
        continue;
      }

      const filePath = path.join(__dirname, "../uploads", content.filename);
      const exists = fs.existsSync(filePath);

      if (!exists) {
        console.log(
          `❌ ID ${content.id}: File MISSING - ${content.filename} (${(
            content.size /
            (1024 * 1024)
          ).toFixed(2)} MB)`
        );

        // Delete orphaned record
        await content.destroy();
        deletedCount++;
        deletedRecords.push({
          id: content.id,
          filename: content.filename,
          size: content.size,
        });

        console.log(`   ✅ Deleted orphaned record`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Deleted ${deletedCount} orphaned records`);

    if (deletedRecords.length > 0) {
      console.log(`\nDeleted records:`);
      deletedRecords.forEach((r) => {
        console.log(
          `  - ID ${r.id}: ${r.filename} (${(r.size / (1024 * 1024)).toFixed(
            2
          )} MB)`
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanupOrphanedRecords();
