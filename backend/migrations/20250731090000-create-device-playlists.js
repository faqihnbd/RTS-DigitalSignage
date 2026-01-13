"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("device_playlists", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      device_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "devices", key: "id" },
        onDelete: "CASCADE",
      },
      playlist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "playlists", key: "id" },
        onDelete: "CASCADE",
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("device_playlists");
  },
};
