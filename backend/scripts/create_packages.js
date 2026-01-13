const { Package } = require("../models");

async function createPackages() {
  try {
    // Delete existing packages first
    await Package.destroy({ where: {} });

    // Create new packages with storage
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
      await Package.create(pkg);
    }
  } catch (error) {
    console.error("❌ Error creating packages:", error);
  }
}

if (require.main === module) {
  createPackages().then(() => process.exit(0));
}

module.exports = createPackages;
