/**
 * Setup Initial Data for Production
 * 
 * This script creates:
 * 1. Packages (Starter, Premium, Business, Custom)
 * 2. Super Admin account for Central Dashboard
 * 3. Demo Tenant with Tenant Admin account
 * 
 * Run this ONCE after first deployment:
 * docker-compose exec backend node scripts/setup_initial_data.js
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../db");
const { Tenant, Package, User } = require("../models");

async function setupInitialData() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Models synced");

    // ==========================================
    // 1. CREATE PACKAGES
    // ==========================================
    console.log("\n📦 Creating packages...");

    const packages = [
      {
        name: "Starter",
        max_devices: 2,
        price: 200000,
        duration_month: 1,
        storage_gb: 1,
        is_active: true,
      },
      {
        name: "Premium",
        max_devices: 4,
        price: 350000,
        duration_month: 1,
        storage_gb: 2,
        is_active: true,
      },
      {
        name: "Business",
        max_devices: 8,
        price: 600000,
        duration_month: 1,
        storage_gb: 4,
        is_active: true,
      },
      {
        name: "Custom",
        max_devices: 999,
        price: 0,
        duration_month: 1,
        storage_gb: 999,
        is_active: true,
      },
    ];

    for (const pkg of packages) {
      const [packageRecord, created] = await Package.findOrCreate({
        where: { name: pkg.name },
        defaults: pkg,
      });

      if (created) {
        console.log(`  ✅ Created package: ${pkg.name}`);
      } else {
        console.log(`  ℹ️  Package already exists: ${pkg.name}`);
      }
    }

    // ==========================================
    // 2. CREATE SUPER ADMIN (for Central Dashboard)
    // ==========================================
    console.log("\n👤 Creating Super Admin...");

    const superAdminEmail = "central@rts.com";
    const superAdminPassword = "central123";
    const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

    const [superAdmin, superAdminCreated] = await User.findOrCreate({
      where: { email: superAdminEmail },
      defaults: {
        name: "Central Super Admin",
        email: superAdminEmail,
        password_hash: superAdminHash,
        role: "super_admin",
        is_active: true,
        tenant_id: null,
      },
    });

    if (superAdminCreated) {
      console.log("  ✅ Super Admin created");
      console.log(`     Email: ${superAdminEmail}`);
      console.log(`     Password: ${superAdminPassword}`);
      console.log(`     Login at: /central/`);
    } else {
      console.log("  ℹ️  Super Admin already exists");
    }

    // ==========================================
    // 3. CREATE DEMO TENANT
    // ==========================================
    console.log("\n🏢 Creating Demo Tenant...");

    // Get Starter package
    const starterPackage = await Package.findOne({
      where: { name: "Starter" },
    });

    if (!starterPackage) {
      throw new Error("Starter package not found. Please create packages first.");
    }

    const [demoTenant, tenantCreated] = await Tenant.findOrCreate({
      where: { email: "demo@tenant.com" },
      defaults: {
        name: "Demo Tenant",
        email: "demo@tenant.com",
        subdomain: "demo",
        package_id: starterPackage.id,
        package_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "active",
      },
    });

    if (tenantCreated) {
      console.log("  ✅ Demo Tenant created");
      console.log(`     Name: Demo Tenant`);
      console.log(`     Email: demo@tenant.com`);
      console.log(`     Package: Starter (2 devices, 1GB storage)`);
      console.log(`     Expires: ${demoTenant.package_expires_at.toLocaleDateString()}`);
    } else {
      console.log("  ℹ️  Demo Tenant already exists");
    }

    // ==========================================
    // 4. CREATE TENANT ADMIN (for Admin Dashboard)
    // ==========================================
    console.log("\n👤 Creating Tenant Admin...");

    const tenantAdminEmail = "admin@demo.com";
    const tenantAdminPassword = "admin123";
    const tenantAdminHash = await bcrypt.hash(tenantAdminPassword, 10);

    const [tenantAdmin, tenantAdminCreated] = await User.findOrCreate({
      where: { email: tenantAdminEmail },
      defaults: {
        name: "Demo Tenant Admin",
        email: tenantAdminEmail,
        password_hash: tenantAdminHash,
        role: "tenant_admin",
        is_active: true,
        tenant_id: demoTenant.id,
      },
    });

    if (tenantAdminCreated) {
      console.log("  ✅ Tenant Admin created");
      console.log(`     Email: ${tenantAdminEmail}`);
      console.log(`     Password: ${tenantAdminPassword}`);
      console.log(`     Login at: /admin/`);
    } else {
      console.log("  ℹ️  Tenant Admin already exists");
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ INITIAL DATA SETUP COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 LOGIN CREDENTIALS:\n");
    console.log("1️⃣  SUPER ADMIN (Central Dashboard)");
    console.log(`   URL: http://your-server:8080/central/`);
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Password: ${superAdminPassword}`);
    console.log("");
    console.log("2️⃣  TENANT ADMIN (Admin Dashboard)");
    console.log(`   URL: http://your-server:8080/admin/`);
    console.log(`   Email: ${tenantAdminEmail}`);
    console.log(`   Password: ${tenantAdminPassword}`);
    console.log("");
    console.log("⚠️  IMPORTANT: Change these passwords after first login!");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up initial data:", error);
    process.exit(1);
  }
}

setupInitialData();
