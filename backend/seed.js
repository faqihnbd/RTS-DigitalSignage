const { Tenant, Package, User } = require("./models");
const bcrypt = require("bcryptjs");

async function seedData() {
  try {
    // Create packages according to the requirement
    const basicPackage = await Package.findOrCreate({
      where: { name: "Basic Plan" },
      defaults: {
        name: "Basic Plan",
        max_devices: 2,
        price: 200000,
        duration_month: 1,
        is_active: true,
        description: "Perfect for small businesses with 2 TV displays",
      },
    });

    const standardPackage = await Package.findOrCreate({
      where: { name: "Standard Plan" },
      defaults: {
        name: "Standard Plan",
        max_devices: 6,
        price: 400000,
        duration_month: 1,
        is_active: true,
        description: "Great for medium businesses with 6 TV displays",
      },
    });

    const proPackage = await Package.findOrCreate({
      where: { name: "Pro Plan" },
      defaults: {
        name: "Pro Plan",
        max_devices: 10,
        price: 600000,
        duration_month: 1,
        is_active: true,
        description: "Ideal for large businesses with 10 TV displays",
      },
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
    const testTenant = await Tenant.findOrCreate({
      where: { name: "Test Tenant" },
      defaults: {
        name: "Test Tenant",
        email: "tenant@rts.com",
        subdomain: "test-tenant",
        package_id: basicPackage[0].id,
        expired_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        package_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "active",
      },
    });

    // Create a super admin user
    const superAdminPassword = await bcrypt.hash("admin123", 10);
    const superAdmin = await User.findOrCreate({
      where: { email: "admin@rts.com" },
      defaults: {
        name: "Super Admin",
        email: "admin@rts.com",
        password_hash: superAdminPassword,
        role: "super_admin",
        tenant_id: null,
        is_active: true,
      },
    });

    // Create a tenant admin user
    const tenantAdminPassword = await bcrypt.hash("tenant123", 10);
    const tenantAdmin = await User.findOrCreate({
      where: { email: "tenant@rts.com" },
      defaults: {
        name: "Tenant Admin",
        email: "tenant@rts.com",
        password_hash: tenantAdminPassword,
        role: "tenant_admin",
        tenant_id: testTenant[0].id,
        is_active: true,
      },
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
