const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Schedule = sequelize.define(
  "Schedule",
  {
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    playlist_id: { type: DataTypes.INTEGER, allowNull: false },
    device_id: { type: DataTypes.INTEGER, allowNull: false },
    day_of_week: { type: DataTypes.STRING },
    time_start: { type: DataTypes.TIME },
    time_end: { type: DataTypes.TIME },
    is_loop: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "schedules", timestamps: false }
);

module.exports = Schedule;
