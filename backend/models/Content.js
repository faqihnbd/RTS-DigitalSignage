const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Content = sequelize.define(
  "Content",
  {
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("image", "video", "text"), allowNull: false },
    filename: { type: DataTypes.STRING },
    url: { type: DataTypes.STRING },
    size: { type: DataTypes.INTEGER },
    duration_sec: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "contents",
    timestamps: true,
    createdAt: "uploaded_at",
    updatedAt: false,
  }
);

module.exports = Content;
