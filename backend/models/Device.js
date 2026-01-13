const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Device = sequelize.define(
  "Device",
  {
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    device_id: { type: DataTypes.STRING, allowNull: false, unique: true }, // TV001, PC001, etc
    device_name: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false }, // Keep for backward compatibility
    token: { type: DataTypes.STRING, allowNull: false, unique: true }, // Keep for backward compatibility
    license_key: { type: DataTypes.STRING, allowNull: true, unique: true }, // For new auth system
    device_type: {
      type: DataTypes.ENUM("tv", "display", "tablet", "pc"),
      defaultValue: "tv",
    },
    location: { type: DataTypes.STRING, defaultValue: "Not specified" },
    resolution: { type: DataTypes.STRING, defaultValue: "1920x1080" },
    status: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "online",
        "offline",
        "suspended"
      ),
      defaultValue: "inactive",
    },
    last_seen: { type: DataTypes.DATE },
    last_heartbeat: { type: DataTypes.DATE },
    player_info: { type: DataTypes.TEXT }, // JSON string for player capabilities
    package_id: { type: DataTypes.INTEGER, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "devices",
    timestamps: true,
    createdAt: "registered_at",
    updatedAt: "updated_at",
  }
);

module.exports = Device;
