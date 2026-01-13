const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const LayoutZone = sequelize.define(
  "LayoutZone",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    layout_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "layouts",
        key: "id",
      },
    },
    zone_name: {
      type: DataTypes.STRING,
      allowNull: false, // main, secondary, ticker, logo, etc.
    },
    position: {
      type: DataTypes.JSON,
      allowNull: false,
      // {x: 0, y: 0, width: 100, height: 100, unit: 'percentage'}
    },
    content_type: {
      type: DataTypes.ENUM(
        "video",
        "image",
        "text",
        "webpage",
        "playlist",
        "ticker",
        "clock",
        "weather",
        "qr_code",
        "logo"
      ),
      allowNull: false,
    },
    content_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable jika zone kosong
      references: {
        model: "contents",
        key: "id",
      },
    },
    playlist_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "playlists",
        key: "id",
      },
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      // {duration: 30, loop: true, mute: false, autoplay: true, etc.}
    },
    z_index: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    display_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Display ID for multi-display layouts",
    },
  },
  {
    tableName: "layout_zones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = LayoutZone;
