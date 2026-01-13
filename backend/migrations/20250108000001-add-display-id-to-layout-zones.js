"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("layout_zones", "display_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Display ID for multi-display layouts",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("layout_zones", "display_id");
  },
};
