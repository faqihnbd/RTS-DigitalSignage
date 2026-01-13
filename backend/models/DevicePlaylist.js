const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const DevicePlaylist = sequelize.define(
  "DevicePlaylist",
  {
    device_id: { type: DataTypes.INTEGER, allowNull: false },
    playlist_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "device_playlists",
    timestamps: false,
  }
);

module.exports = DevicePlaylist;
