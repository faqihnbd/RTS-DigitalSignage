const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Tenant = sequelize.define(
  "Tenant",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    subdomain: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM("active", "suspended", "expired"),
      defaultValue: "active",
    },
    package_id: { type: DataTypes.INTEGER },
    expired_at: { type: DataTypes.DATE },
    custom_max_devices: { type: DataTypes.INTEGER, allowNull: true },
    custom_storage_gb: { type: DataTypes.INTEGER, allowNull: true },
    duration_months: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "tenants",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Tenant;
