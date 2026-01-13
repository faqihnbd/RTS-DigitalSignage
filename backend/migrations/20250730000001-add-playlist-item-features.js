"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("playlist_items", "orientation", {
      type: Sequelize.ENUM("landscape", "portrait", "auto"),
      defaultValue: "landscape",
      allowNull: true,
    });

    await queryInterface.addColumn("playlist_items", "transition", {
      type: Sequelize.ENUM("fade", "slide", "zoom", "none"),
      defaultValue: "fade",
      allowNull: true,
    });

    await queryInterface.addColumn("playlist_items", "effect", {
      type: Sequelize.ENUM("none", "blur", "grayscale", "sepia", "brightness"),
      defaultValue: "none",
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("playlist_items", "orientation");
    await queryInterface.removeColumn("playlist_items", "transition");
    await queryInterface.removeColumn("playlist_items", "effect");
  },
};
