const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Package = sequelize.define(
  "Package",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    max_devices: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    duration_month: { type: DataTypes.INTEGER, allowNull: false },
    storage_gb: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "packages", timestamps: false }
);

module.exports = Package;
