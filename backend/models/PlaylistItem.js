const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PlaylistItem = sequelize.define(
  "PlaylistItem",
  {
    playlist_id: { type: DataTypes.INTEGER, allowNull: false },
    content_id: { type: DataTypes.INTEGER, allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false },
    duration_sec: { type: DataTypes.INTEGER, allowNull: true },
    orientation: {
      type: DataTypes.ENUM("landscape", "portrait", "auto"),
      defaultValue: "landscape",
    },
    transition: {
      type: DataTypes.ENUM("fade", "slide", "zoom", "none"),
      defaultValue: "fade",
    },
  },
  { tableName: "playlist_items", timestamps: false }
);

module.exports = PlaylistItem;
