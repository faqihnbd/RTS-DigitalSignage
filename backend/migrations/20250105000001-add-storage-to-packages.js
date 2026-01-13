"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if column already exists
      const tableDesc = await queryInterface.describeTable("packages");

      if (!tableDesc.storage_gb) {
        await queryInterface.addColumn("packages", "storage_gb", {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        });
      }
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("packages", "storage_gb");
  },
};
