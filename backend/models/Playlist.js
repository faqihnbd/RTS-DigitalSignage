const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Playlist = sequelize.define(
  "Playlist",
  {
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    layout_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "layouts",
        key: "id",
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "playlists",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Playlist;
