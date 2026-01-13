"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tenants", "custom_max_devices", {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Custom device limit for custom packages",
    });
    await queryInterface.addColumn("tenants", "custom_storage_gb", {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Custom storage limit in GB for custom packages",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("tenants", "custom_max_devices");
    await queryInterface.removeColumn("tenants", "custom_storage_gb");
  },
};
