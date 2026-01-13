const { Package } = require("../models");

async function updatePackages() {
  try {
    // Delete existing packages
    await Package.destroy({ where: {} });

    // Create new packages with proper storage limits
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

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating packages:", error);
    process.exit(1);
  }
}

updatePackages();
