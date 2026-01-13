"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if columns already exist
      const tableDesc = await queryInterface.describeTable("devices");

      if (!tableDesc.device_id) {
        await queryInterface.addColumn("devices", "device_id", {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true,
        });
      }

      if (!tableDesc.device_name) {
        await queryInterface.addColumn("devices", "device_name", {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }

      if (!tableDesc.license_key) {
        await queryInterface.addColumn("devices", "license_key", {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true,
        });
      }

      if (!tableDesc.last_heartbeat) {
        await queryInterface.addColumn("devices", "last_heartbeat", {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }

      if (!tableDesc.player_info) {
        await queryInterface.addColumn("devices", "player_info", {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }

      if (!tableDesc.package_id) {
        await queryInterface.addColumn("devices", "package_id", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "packages",
            key: "id",
          },
        });
      }

      if (!tableDesc.expires_at) {
        await queryInterface.addColumn("devices", "expires_at", {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }

      // Update device_type enum to include 'pc'
      await queryInterface.changeColumn("devices", "device_type", {
        type: Sequelize.ENUM("tv", "display", "tablet", "pc"),
        defaultValue: "tv",
      });

      // Update status enum to include 'active' and 'inactive'
      await queryInterface.changeColumn("devices", "status", {
        type: Sequelize.ENUM(
          "active",
          "inactive",
          "online",
          "offline",
          "suspended"
        ),
        defaultValue: "inactive",
      });

      // Populate device_id and device_name from existing data if they don't exist
      const devices = await queryInterface.sequelize.query(
        'SELECT id, name, token FROM devices WHERE device_id IS NULL OR device_id = ""',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      for (const device of devices) {
        await queryInterface.sequelize.query(
          "UPDATE devices SET device_id = ?, device_name = ?, license_key = ? WHERE id = ?",
          {
            replacements: [
              `DEV${device.id.toString().padStart(3, "0")}`, // DEV001, DEV002, etc
              device.name,
              device.token, // Use existing token as license key
              device.id,
            ],
          }
        );
      }
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn("devices", "device_id");
    await queryInterface.removeColumn("devices", "device_name");
    await queryInterface.removeColumn("devices", "license_key");
    await queryInterface.removeColumn("devices", "last_heartbeat");
    await queryInterface.removeColumn("devices", "player_info");
    await queryInterface.removeColumn("devices", "package_id");
    await queryInterface.removeColumn("devices", "expires_at");

    // Revert enum changes
    await queryInterface.changeColumn("devices", "device_type", {
      type: Sequelize.ENUM("tv", "display", "tablet"),
      defaultValue: "tv",
    });

    await queryInterface.changeColumn("devices", "status", {
      type: Sequelize.ENUM("online", "offline", "suspended"),
      defaultValue: "offline",
    });
  },
};
