const { Device, Tenant, Package } = require("../models");
const { v4: uuidv4 } = require("uuid");

async function createDemoDevices() {
  try {
    // Find first tenant and package
    const tenant = await Tenant.findOne();
    const package = await Package.findOne();

    if (!tenant) {
      return;
    }

    if (!package) {
      return;
    }

    // Create demo devices
    const demoDevices = [
      {
        tenant_id: tenant.id,
        device_id: "TV001",
        device_name: "Main Lobby TV",
        name: "Main Lobby TV",
        token: uuidv4(),
        license_key:
          "DEMO-TV001-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        device_type: "tv",
        location: "Main Lobby",
        resolution: "1920x1080",
        status: "active",
        package_id: package.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        tenant_id: tenant.id,
        device_id: "TV002",
        device_name: "Reception Display",
        name: "Reception Display",
        token: uuidv4(),
        license_key:
          "DEMO-TV002-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        device_type: "display",
        location: "Reception Area",
        resolution: "1920x1080",
        status: "active",
        package_id: package.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        tenant_id: tenant.id,
        device_id: "PC001",
        device_name: "Conference Room PC",
        name: "Conference Room PC",
        token: uuidv4(),
        license_key:
          "DEMO-PC001-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        device_type: "pc",
        location: "Conference Room A",
        resolution: "1920x1080",
        status: "active",
        package_id: package.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    ];

    for (const deviceData of demoDevices) {
      // Check if device already exists
      const existing = await Device.findOne({
        where: { device_id: deviceData.device_id },
      });

      if (existing) {
        await existing.update(deviceData);
      } else {
        await Device.create(deviceData);
      }
    }

    // Display license keys for testing
    const devices = await Device.findAll({
      where: {
        device_id: ["TV001", "TV002", "PC001"],
      },
    });
  } catch (error) {
    console.error("Error creating demo devices:", error);
  }
}

// Run if called directly
if (require.main === module) {
  createDemoDevices()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error setting up demo devices:", error);
      process.exit(1);
    });
}

module.exports = { createDemoDevices };
