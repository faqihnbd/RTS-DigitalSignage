"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("playlists", "layout_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "layouts",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("playlists", "layout_id");
  },
};
