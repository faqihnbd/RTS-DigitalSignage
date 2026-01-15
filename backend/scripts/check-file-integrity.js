const { Content } = require("../models");
const path = require("path");
const fs = require("fs");

async function checkFileIntegrity() {
  try {
    console.log("\n=== CHECKING FILE INTEGRITY ===\n");

    const contents = await Content.findAll({
      where: { tenant_id: 1 },
      attributes: ["id", "filename", "size", "type", "uploaded_at"],
      order: [["uploaded_at", "DESC"]],
    });

    console.log(`Total records in database: ${contents.length}\n`);

    let missingFiles = [];
    let validFiles = [];
    let corruptRecords = [];

    for (const content of contents) {
      if (!content.filename) {
        corruptRecords.push(content);
        console.log(`⚠️  ID ${content.id}: No filename in database`);
        continue;
      }

      const filePath = path.join(__dirname, "../uploads", content.filename);

      if (!fs.existsSync(filePath)) {
        missingFiles.push({
          id: content.id,
          filename: content.filename,
          size: content.size,
          uploaded_at: content.uploaded_at,
        });
        console.log(
          `❌ ID ${content.id}: File MISSING - ${content.filename} (${(
            content.size /
            1024 /
            1024
          ).toFixed(2)} MB)`
        );
      } else {
        // File exists, check size matches
        const stat = fs.statSync(filePath);
        const actualSize = stat.size;
        const dbSize = parseInt(content.size) || 0;

        if (Math.abs(actualSize - dbSize) > 100) {
          // Tolerance 100 bytes
          console.log(
            `⚠️  ID ${content.id}: Size mismatch - ${content.filename}`
          );
          console.log(
            `   DB: ${(dbSize / 1024 / 1024).toFixed(2)} MB, Disk: ${(
              actualSize /
              1024 /
              1024
            ).toFixed(2)} MB`
          );
        } else {
          validFiles.push(content);
        }
      }
    }

    console.log("\n=== SUMMARY ===\n");
    console.log(`✅ Valid files: ${validFiles.length}`);
    console.log(
      `❌ Missing files (in DB but not on disk): ${missingFiles.length}`
    );
    console.log(`⚠️  Corrupt records: ${corruptRecords.length}`);

    if (missingFiles.length > 0) {
      console.log("\n=== CLEANUP ORPHANED RECORDS ===\n");
      console.log("Deleting database records for missing files...\n");

      for (const file of missingFiles) {
        try {
          await Content.destroy({ where: { id: file.id } });
          console.log(`✅ Deleted record ID ${file.id}: ${file.filename}`);
        } catch (err) {
          console.log(`❌ Error deleting ID ${file.id}:`, err.message);
        }
      }

      console.log(`\n✅ Cleaned up ${missingFiles.length} orphaned records`);
    }

    if (corruptRecords.length > 0) {
      console.log("\n=== CLEANUP CORRUPT RECORDS ===\n");
      for (const record of corruptRecords) {
        try {
          await record.destroy();
          console.log(`✅ Deleted corrupt record ID ${record.id}`);
        } catch (err) {
          console.log(`❌ Error deleting ID ${record.id}:`, err.message);
        }
      }
    }

    // Check for orphaned files on disk
    console.log("\n=== CHECKING ORPHANED FILES ON DISK ===\n");
    const uploadsDir = path.join(__dirname, "../uploads");
    const filesOnDisk = fs.readdirSync(uploadsDir);

    const dbFilenames = contents.map((c) => c.filename).filter(Boolean);
    const orphanedFiles = filesOnDisk.filter((f) => {
      // Skip directories and system files
      if (f.startsWith(".")) return false;
      const filePath = path.join(uploadsDir, f);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) return false;

      return !dbFilenames.includes(f);
    });

    if (orphanedFiles.length > 0) {
      console.log(`Found ${orphanedFiles.length} orphaned files on disk:\n`);
      orphanedFiles.forEach((f) => {
        const filePath = path.join(uploadsDir, f);
        const stat = fs.statSync(filePath);
        console.log(`  - ${f} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      });

      console.log("\n⚠️  These files are on disk but not in database.");
      console.log(
        "You can manually delete them from uploads/ folder if needed."
      );
    } else {
      console.log("✅ No orphaned files found on disk");
    }

    console.log("\n=== DONE ===\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkFileIntegrity();
