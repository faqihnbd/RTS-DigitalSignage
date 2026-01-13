const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Layout = sequelize.define(
  "Layout",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tenants",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "split_vertical", // Kiri-kanan
        "split_horizontal", // Atas-bawah
        "multi_zone", // 3-4 zona
        "l_shape", // L-shape layout
        "carousel", // Fullscreen carousel
        "webpage_embed", // Web embed
        "custom", // Custom template
        "picture_in_picture" // PIP layout
      ),
      allowNull: false,
    },
    configuration: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    preview_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "layouts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Layout;
