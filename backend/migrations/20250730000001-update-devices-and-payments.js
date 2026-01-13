"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to devices table
    await queryInterface.addColumn("devices", "device_type", {
      type: Sequelize.ENUM("tv", "display", "tablet"),
      defaultValue: "tv",
      allowNull: false,
    });

    await queryInterface.addColumn("devices", "location", {
      type: Sequelize.STRING,
      defaultValue: "Not specified",
    });

    await queryInterface.addColumn("devices", "resolution", {
      type: Sequelize.STRING,
      defaultValue: "1920x1080",
    });

    await queryInterface.addColumn("devices", "updated_at", {
      type: Sequelize.DATE,
    });

    // Update status enum values for devices
    await queryInterface.changeColumn("devices", "status", {
      type: Sequelize.ENUM("online", "offline", "suspended"),
      defaultValue: "offline",
    });

    // Add new columns to payments table
    await queryInterface.addColumn("payments", "payment_method", {
      type: Sequelize.ENUM(
        "bank_transfer",
        "credit_card",
        "e_wallet",
        "manual"
      ),
      defaultValue: "manual",
    });

    await queryInterface.addColumn("payments", "invoice_number", {
      type: Sequelize.STRING,
      unique: true,
    });

    await queryInterface.addColumn("payments", "description", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("payments", "created_at", {
      type: Sequelize.DATE,
    });

    await queryInterface.addColumn("payments", "updated_at", {
      type: Sequelize.DATE,
    });

    // Add package_expires_at to tenants table
    await queryInterface.addColumn("tenants", "package_expires_at", {
      type: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from devices table
    await queryInterface.removeColumn("devices", "device_type");
    await queryInterface.removeColumn("devices", "location");
    await queryInterface.removeColumn("devices", "resolution");
    await queryInterface.removeColumn("devices", "updated_at");

    // Revert status enum for devices
    await queryInterface.changeColumn("devices", "status", {
      type: Sequelize.ENUM("active", "inactive", "suspended"),
      defaultValue: "active",
    });

    // Remove columns from payments table
    await queryInterface.removeColumn("payments", "payment_method");
    await queryInterface.removeColumn("payments", "invoice_number");
    await queryInterface.removeColumn("payments", "description");
    await queryInterface.removeColumn("payments", "created_at");
    await queryInterface.removeColumn("payments", "updated_at");

    // Remove column from tenants table
    await queryInterface.removeColumn("tenants", "package_expires_at");
  },
};
