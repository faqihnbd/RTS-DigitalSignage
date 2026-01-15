/**
 * Simple Storage Cleanup Test
 *
 * Test basic cleanup functionality:
 * 1. Login as super admin
 * 2. Get tenant info
 * 3. Trigger force cleanup
 * 4. Verify results
 */

const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

async function test() {
  try {
    console.log("=".repeat(60));
    console.log("STORAGE CLEANUP TEST");
    console.log("=".repeat(60));

    // 1. Login as super admin
    console.log("\n1. Logging in as super admin...");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@rts.com",
      password: "admin123",
    });
    const token = loginRes.data.token;
    console.log("✅ Logged in successfully");

    // 2. Get all tenants
    console.log("\n2. Getting tenants...");
    const tenantsRes = await axios.get(`${API_BASE}/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenants = tenantsRes.data;
    console.log(`✅ Found ${tenants.length} tenants`);

    if (tenants.length === 0) {
      console.log("❌ No tenants found. Please create a tenant first.");
      return;
    }

    // Find tenant with data
    const tenant = tenants.find((t) => t.package_id) || tenants[0];
    console.log(`\n📋 Testing with tenant: ${tenant.name} (ID: ${tenant.id})`);
    console.log(`   Package ID: ${tenant.package_id}`);

    // 3. Get storage info
    console.log("\n3. Getting storage info...");

    // Login as tenant admin to get storage
    const tenantUsers = await axios.get(
      `${API_BASE}/users?tenant_id=${tenant.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const tenantAdmin = tenantUsers.data.find(
      (u) => u.role === "tenant_admin" && u.tenant_id === tenant.id
    );

    if (!tenantAdmin) {
      console.log("⚠️  No tenant admin found, using super admin...");
    } else {
      console.log(`   Tenant admin: ${tenantAdmin.email}`);
    }

    // Get tenant package info
    const tenantDetail = await axios.get(`${API_BASE}/tenants/${tenant.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const storageLimit =
      tenantDetail.data.custom_storage_gb ||
      tenantDetail.data.Package?.storage_gb ||
      1;
    console.log(`   Storage limit: ${storageLimit}GB`);

    // 4. Force cleanup
    console.log("\n4. Triggering force cleanup...");
    const cleanupRes = await axios.post(
      `${API_BASE}/tenants/${tenant.id}/cleanup-storage`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("\n✅ Cleanup completed!");
    console.log("\n📊 Results:");
    const result = cleanupRes.data;

    if (result.cleanup) {
      console.log(`   Message: ${result.cleanup.message}`);
      console.log(`   Files deleted: ${result.cleanup.deletedCount || 0}`);
      console.log(`   Space freed: ${result.cleanup.freedSpaceGB || 0}GB`);
      console.log(
        `   Previous usage: ${result.cleanup.previousUsageGB || 0}GB`
      );
      console.log(`   Current usage: ${result.cleanup.currentUsageGB || 0}GB`);
      console.log(
        `   Storage limit: ${result.cleanup.limitGB || storageLimit}GB`
      );

      if (
        result.cleanup.deletedFiles &&
        result.cleanup.deletedFiles.length > 0
      ) {
        console.log("\n   Deleted files:");
        result.cleanup.deletedFiles.forEach((file, i) => {
          console.log(`   ${i + 1}. ${file.filename} (${file.sizeGB}GB)`);
        });
      }
    } else {
      console.log("   No cleanup data returned");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST COMPLETED");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Message:",
        error.response.data?.message || error.response.data
      );
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

test();
