const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PlayerStat = sequelize.define(
  "PlayerStat",
  {
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    device_id: { type: DataTypes.INTEGER, allowNull: false },
    content_id: { type: DataTypes.INTEGER, allowNull: false },
    played_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    duration_sec: { type: DataTypes.INTEGER },
  },
  { tableName: "player_stats", timestamps: false }
);

module.exports = PlayerStat;
