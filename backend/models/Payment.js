const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Payment = sequelize.define(
  "Payment",
  {
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    package_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed", "expired", "cancel"),
      defaultValue: "pending",
    },
    payment_method: {
      type: DataTypes.ENUM(
        "bank_transfer",
        "credit_card",
        "e_wallet",
        "manual",
        "midtrans"
      ),
      defaultValue: "manual",
    },
    invoice_number: { type: DataTypes.STRING, unique: true },
    description: { type: DataTypes.STRING },
    invoice_url: { type: DataTypes.STRING },
    midtrans_order_id: { type: DataTypes.STRING, unique: true },
    midtrans_transaction_id: { type: DataTypes.STRING },
    midtrans_token: { type: DataTypes.STRING },
    midtrans_redirect_url: { type: DataTypes.STRING },
    paid_at: { type: DataTypes.DATE },
    expired_at: { type: DataTypes.DATE },
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Payment;
