"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make duration_sec nullable and remove effect column
    await queryInterface.changeColumn("playlist_items", "duration_sec", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.removeColumn("playlist_items", "effect");
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes
    await queryInterface.changeColumn("playlist_items", "duration_sec", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10,
    });

    await queryInterface.addColumn("playlist_items", "effect", {
      type: Sequelize.ENUM("none", "blur", "grayscale", "sepia", "brightness"),
      defaultValue: "none",
      allowNull: true,
    });
  },
};
