/**
 * Test Script for Auto Delete Storage Implementation
 *
 * This script tests the auto-delete storage feature:
 * 1. Create test tenant with 2GB package
 * 2. Upload files to reach 1.5GB
 * 3. Downgrade to 1GB package
 * 4. Verify auto cleanup occurred
 * 5. Test upload with auto cleanup
 *
 * Usage: node backend/scripts/test-storage-cleanup.js
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const API_BASE = "http://localhost:3000/api";
let authToken = "";
let testTenantId = null;
let testUserId = null;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log("\n" + "=".repeat(60), "cyan");
  log(title, "cyan");
  log("=".repeat(60), "cyan");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Login as super admin
async function loginAsSuperAdmin() {
  logSection("Step 1: Login as Super Admin");
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@rts.com",
      password: "admin123",
    });
    authToken = response.data.token;
    logSuccess("Logged in as super admin");
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError("Failed to login as super admin");
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Create test tenant with 2GB package
async function createTestTenant() {
  logSection("Step 2: Create Test Tenant with 2GB Package");
  try {
    // First, get 2GB package ID
    const packagesResponse = await axios.get(`${API_BASE}/packages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const package2GB = packagesResponse.data.find((p) => p.storage_gb === 2);
    if (!package2GB) {
      logWarning("2GB package not found, creating one...");
      const createPackageResponse = await axios.post(
        `${API_BASE}/packages`,
        {
          name: "Test 2GB Package",
          max_devices: 5,
          price: 200000,
          duration_month: 1,
          storage_gb: 2,
          is_active: true,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      package2GB = createPackageResponse.data;
    }

    logInfo(`Using package: ${package2GB.name} (ID: ${package2GB.id})`);

    // Create tenant
    const timestamp = Date.now();
    const tenantResponse = await axios.post(
      `${API_BASE}/tenants`,
      {
        name: `Test Tenant ${timestamp}`,
        email: `test${timestamp}@test.com`,
        subdomain: `test${timestamp}`,
        package_id: package2GB.id,
        expired_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "active",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    testTenantId = tenantResponse.data.id;
    logSuccess(
      `Created tenant: ${tenantResponse.data.name} (ID: ${testTenantId})`
    );
    logInfo(`Package: ${package2GB.name} - ${package2GB.storage_gb}GB`);

    return package2GB;
  } catch (error) {
    logError("Failed to create test tenant");
    console.error(error.response?.data || error.message);
    return null;
  }
}

// Create test user for tenant
async function createTestUser() {
  logSection("Step 3: Create Test User (Tenant Admin)");
  try {
    const timestamp = Date.now();
    const userResponse = await axios.post(
      `${API_BASE}/users`,
      {
        name: `Test Admin ${timestamp}`,
        email: `admin${timestamp}@test.com`,
        password: "test123",
        role: "tenant_admin",
        tenant_id: testTenantId,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    testUserId = userResponse.data.id;
    logSuccess(`Created user: ${userResponse.data.name} (ID: ${testUserId})`);

    // Login as this user
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: `admin${timestamp}@test.com`,
      password: "test123",
    });

    authToken = loginResponse.data.token;
    logSuccess("Logged in as tenant admin");

    return true;
  } catch (error) {
    logError("Failed to create test user");
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Create dummy file of specific size
function createDummyFile(filename, sizeInMB) {
  // Use .mp4 extension instead of .dat to pass file type validation
  const videoFilename = filename.replace(".dat", ".mp4");
  const buffer = Buffer.alloc(sizeInMB * 1024 * 1024, "A");
  const filepath = path.join(__dirname, "..", "uploads", videoFilename);
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

// Upload files to reach target size
async function uploadFilesToReachSize(targetGB) {
  logSection(`Step 4: Upload Files to Reach ~${targetGB}GB`);

  const targetBytes = targetGB * 1024 * 1024 * 1024;
  let uploadedBytes = 0;
  const uploadedFiles = [];

  try {
    // Check current storage - try both endpoints
    let storageResponse;
    try {
      storageResponse = await axios.get(`${API_BASE}/contents/storage-usage`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      uploadedBytes = parseInt(storageResponse.data.storage.usedBytes);
      logInfo(`Current storage: ${storageResponse.data.storage.usedGB}GB`);
    } catch (err) {
      // Fallback to storage-info endpoint
      logWarning("storage-usage endpoint not available, using storage-info");
      storageResponse = await axios.get(`${API_BASE}/contents/storage-info`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      uploadedBytes = parseInt(storageResponse.data.usedStorage || 0);
      const usedGB = uploadedBytes / (1024 * 1024 * 1024);
      logInfo(`Current storage: ${usedGB.toFixed(3)}GB`);
    }

    const remainingBytes = targetBytes - uploadedBytes;
    const remainingMB = Math.floor(remainingBytes / (1024 * 1024));

    logInfo(`Need to upload ~${remainingMB}MB more`);

    // Upload files in chunks
    const chunkSizeMB = 50; // 50MB per file
    let fileCount = 0;

    while (uploadedBytes < targetBytes * 0.95) {
      // Target 95% to be safe
      fileCount++;
      const filename = `test-file-${Date.now()}-${fileCount}.mp4`;
      logInfo(`Uploading ${filename} (${chunkSizeMB}MB)...`);

      // Create dummy file
      const filepath = createDummyFile(filename, chunkSizeMB);

      // Upload
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filepath));

      try {
        const uploadResponse = await axios.post(
          `${API_BASE}/contents`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${authToken}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );

        uploadedFiles.push(uploadResponse.data);
        uploadedBytes += chunkSizeMB * 1024 * 1024;

        const currentGB = uploadedBytes / (1024 * 1024 * 1024);
        logSuccess(`Uploaded ${filename} - Total: ${currentGB.toFixed(3)}GB`);

        // Check if cleanup was triggered
        if (uploadResponse.data.storageCleanup) {
          logWarning(`Auto cleanup triggered during upload!`);
          logInfo(
            `Deleted ${uploadResponse.data.storageCleanup.deletedCount} files`
          );
          logInfo(`Freed ${uploadResponse.data.storageCleanup.freedSpaceGB}GB`);
        }
      } catch (uploadError) {
        if (uploadError.response?.status === 413) {
          logWarning("Storage quota exceeded, stopping upload");
          break;
        } else {
          throw uploadError;
        }
      }

      // Add small delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Final storage check
    let finalStorageResponse;
    try {
      finalStorageResponse = await axios.get(
        `${API_BASE}/contents/storage-usage`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      logSuccess(
        `Final storage: ${finalStorageResponse.data.storage.usedGB}GB`
      );
    } catch (err) {
      finalStorageResponse = await axios.get(
        `${API_BASE}/contents/storage-info`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const usedBytes = parseInt(finalStorageResponse.data.usedStorage || 0);
      const usedGB = usedBytes / (1024 * 1024 * 1024);
      logSuccess(`Final storage: ${usedGB.toFixed(3)}GB`);
    }

    logInfo(`Uploaded ${uploadedFiles.length} files`);

    return uploadedFiles;
  } catch (error) {
    logError("Failed to upload files");
    console.error(error.response?.data || error.message);
    return uploadedFiles;
  }
}

// Downgrade to 1GB package
async function downgradePackage() {
  logSection("Step 5: Downgrade Package from 2GB to 1GB");

  try {
    // Get 1GB package
    const packagesResponse = await axios.get(`${API_BASE}/packages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    let package1GB = packagesResponse.data.find((p) => p.storage_gb === 1);

    if (!package1GB) {
      logWarning("1GB package not found, creating one...");

      // Re-login as super admin
      await loginAsSuperAdmin();

      const createPackageResponse = await axios.post(
        `${API_BASE}/packages`,
        {
          name: "Test 1GB Package",
          max_devices: 3,
          price: 100000,
          duration_month: 1,
          storage_gb: 1,
          is_active: true,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      package1GB = createPackageResponse.data;
    } else {
      // Re-login as super admin for tenant update
      await loginAsSuperAdmin();
    }

    logInfo(`Downgrading to: ${package1GB.name} (ID: ${package1GB.id})`);

    // Check storage before downgrade
    const beforeResponse = await axios.get(
      `${API_BASE}/tenants/${testTenantId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logInfo("Storage before downgrade:");

    // Get storage info as tenant admin first
    const tenantLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: beforeResponse.data.email,
      password: "test123",
    });

    // Login back as super admin
    await loginAsSuperAdmin();

    // Downgrade package
    logInfo("Initiating downgrade...");
    const updateResponse = await axios.put(
      `${API_BASE}/tenants/${testTenantId}`,
      {
        ...beforeResponse.data,
        package_id: package1GB.id,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess("Package downgraded successfully!");

    // Check if cleanup was triggered
    if (updateResponse.data.storageCleanup) {
      logSuccess("✨ Auto cleanup was triggered!");
      const cleanup = updateResponse.data.storageCleanup;

      log("\nCleanup Details:", "yellow");
      log(`  Files deleted: ${cleanup.deletedCount}`, "yellow");
      log(`  Space freed: ${cleanup.freedSpaceGB}GB`, "yellow");
      log(`  Storage before: ${cleanup.previousUsageGB}GB`, "yellow");
      log(`  Storage after: ${cleanup.currentUsageGB}GB`, "yellow");
      log(`  New limit: ${cleanup.limitGB}GB`, "yellow");

      if (cleanup.deletedFiles && cleanup.deletedFiles.length > 0) {
        log("\n  Deleted files:", "yellow");
        cleanup.deletedFiles.forEach((file, index) => {
          log(
            `    ${index + 1}. ${file.filename} (${file.sizeGB}GB)`,
            "yellow"
          );
        });
      }

      return cleanup;
    } else {
      logWarning("No cleanup was triggered (storage was within limit)");
      return null;
    }
  } catch (error) {
    logError("Failed to downgrade package");
    console.error(error.response?.data || error.message);
    return null;
  }
}

// Verify storage after downgrade
async function verifyStorageAfterDowngrade() {
  logSection("Step 6: Verify Storage After Downgrade");

  try {
    // Login as tenant admin
    const tenantsResponse = await axios.get(
      `${API_BASE}/tenants/${testTenantId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: tenantsResponse.data.email,
      password: "test123",
    });

    authToken = loginResponse.data.token;

    // Get storage usage
    let storageResponse;
    try {
      storageResponse = await axios.get(`${API_BASE}/contents/storage-usage`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const storage = storageResponse.data.storage;

      log("\nCurrent Storage Status:", "cyan");
      log(`  Used: ${storage.usedGB}GB`, "cyan");
      log(`  Limit: ${storage.limitGB}GB`, "cyan");
      log(`  Available: ${storage.availableGB}GB`, "cyan");
      log(`  Usage: ${storage.usagePercentage}%`, "cyan");
      log(`  Over limit: ${storage.isOverLimit ? "YES ❌" : "NO ✅"}`, "cyan");

      if (parseFloat(storage.usedGB) <= storage.limitGB) {
        logSuccess("✅ Storage is within limit!");
        return true;
      } else {
        logError("❌ Storage still exceeds limit!");
        return false;
      }
    } catch (err) {
      // Fallback
      storageResponse = await axios.get(`${API_BASE}/contents/storage-info`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const usedBytes = parseInt(storageResponse.data.usedStorage || 0);
      const limitBytes = parseInt(
        storageResponse.data.storageLimit || 1073741824
      );
      const usedGB = usedBytes / (1024 * 1024 * 1024);
      const limitGB = limitBytes / (1024 * 1024 * 1024);

      log("\nCurrent Storage Status:", "cyan");
      log(`  Used: ${usedGB.toFixed(3)}GB`, "cyan");
      log(`  Limit: ${limitGB.toFixed(3)}GB`, "cyan");
      log(
        `  Usage: ${storageResponse.data.usagePercentage?.toFixed(2) || "0"}%`,
        "cyan"
      );

      if (usedGB <= limitGB) {
        logSuccess("✅ Storage is within limit!");
        return true;
      } else {
        logError("❌ Storage still exceeds limit!");
        return false;
      }
    }
  } catch (error) {
    logError("Failed to verify storage");
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Test upload with auto cleanup
async function testUploadWithAutoCleanup() {
  logSection("Step 7: Test Upload with Auto Cleanup");

  try {
    // Check current storage
    let beforeResponse;
    try {
      beforeResponse = await axios.get(`${API_BASE}/contents/storage-usage`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      logInfo(
        `Current storage: ${beforeResponse.data.storage.usedGB}GB / ${beforeResponse.data.storage.limitGB}GB`
      );
    } catch (err) {
      beforeResponse = await axios.get(`${API_BASE}/contents/storage-info`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const usedGB =
        parseInt(beforeResponse.data.usedStorage || 0) / (1024 * 1024 * 1024);
      const limitGB =
        parseInt(beforeResponse.data.storageLimit || 0) / (1024 * 1024 * 1024);
      logInfo(
        `Current storage: ${usedGB.toFixed(3)}GB / ${limitGB.toFixed(3)}GB`
      );
    }

    // Try to upload a file that will exceed limit
    const uploadSizeMB = 200; // 200MB
    const filename = `test-large-file-${Date.now()}.mp4`;

    logInfo(`Attempting to upload ${uploadSizeMB}MB file...`);

    const filepath = createDummyFile(filename, uploadSizeMB);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filepath));

    try {
      const uploadResponse = await axios.post(
        `${API_BASE}/contents`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      logSuccess("Upload successful!");

      // Check if cleanup was triggered
      if (uploadResponse.data.storageCleanup) {
        logSuccess("✨ Auto cleanup was triggered during upload!");
        const cleanup = uploadResponse.data.storageCleanup;

        log("\nCleanup Details:", "yellow");
        log(`  Files deleted: ${cleanup.deletedCount}`, "yellow");
        log(`  Space freed: ${cleanup.freedSpaceGB}GB`, "yellow");

        return true;
      } else {
        logInfo("No cleanup needed (storage was within limit)");
        return true;
      }
    } catch (uploadError) {
      if (uploadError.response?.status === 413) {
        logWarning("Upload rejected due to insufficient storage");

        const errorData = uploadError.response.data;
        if (errorData.cleanupPerformed) {
          logInfo("Auto cleanup was attempted");
          log(`  Files deleted: ${errorData.filesDeleted}`, "yellow");
          log(`  Space freed: ${errorData.freedSpace}GB`, "yellow");
          logWarning("But still not enough space for this file");
        }

        return false;
      } else {
        throw uploadError;
      }
    }
  } catch (error) {
    logError("Failed to test upload with auto cleanup");
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log(
    "\n╔══════════════════════════════════════════════════════════════╗",
    "cyan"
  );
  log(
    "║   AUTO DELETE STORAGE - INTEGRATION TEST                    ║",
    "cyan"
  );
  log(
    "╚══════════════════════════════════════════════════════════════╝",
    "cyan"
  );

  try {
    // Step 1: Login
    if (!(await loginAsSuperAdmin())) return;

    // Step 2: Create test tenant
    const package2GB = await createTestTenant();
    if (!package2GB) return;

    // Step 3: Create test user
    if (!(await createTestUser())) return;

    // Step 4: Upload files to ~1.5GB
    const uploadedFiles = await uploadFilesToReachSize(1.5);
    if (uploadedFiles.length === 0) {
      logError("No files uploaded, test cannot continue");
      return;
    }

    // Step 5: Downgrade to 1GB
    const cleanupResult = await downgradePackage();

    // Step 6: Verify storage
    const storageOk = await verifyStorageAfterDowngrade();

    // Step 7: Test upload with auto cleanup
    await testUploadWithAutoCleanup();

    // Summary
    logSection("TEST SUMMARY");

    if (cleanupResult && storageOk) {
      logSuccess("✅ ALL TESTS PASSED!");
      log("\nTest Results:", "green");
      log(`  ✅ Downgrade triggered auto cleanup`, "green");
      log(`  ✅ Storage reduced to within limit`, "green");
      log(`  ✅ ${cleanupResult.deletedCount} files were deleted`, "green");
      log(`  ✅ ${cleanupResult.freedSpaceGB}GB space freed`, "green");
    } else {
      logWarning("⚠️  TESTS COMPLETED WITH WARNINGS");
    }
  } catch (error) {
    logError("Test execution failed");
    console.error(error);
  }
}

// Run tests
runTests()
  .then(() => {
    log("\n✨ Test completed\n", "cyan");
  })
  .catch((error) => {
    logError("Fatal error during test");
    console.error(error);
    process.exit(1);
  });
