"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add Midtrans-related columns to payments table
    await queryInterface.addColumn("payments", "midtrans_order_id", {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "midtrans_transaction_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "midtrans_token", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "midtrans_redirect_url", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Update payment_method enum to include midtrans
    await queryInterface.changeColumn("payments", "payment_method", {
      type: Sequelize.ENUM(
        "bank_transfer",
        "credit_card",
        "e_wallet",
        "manual",
        "midtrans"
      ),
      defaultValue: "manual",
    });

    // Update status enum to include cancel
    await queryInterface.changeColumn("payments", "status", {
      type: Sequelize.ENUM("pending", "paid", "failed", "expired", "cancel"),
      defaultValue: "pending",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove Midtrans columns
    await queryInterface.removeColumn("payments", "midtrans_order_id");
    await queryInterface.removeColumn("payments", "midtrans_transaction_id");
    await queryInterface.removeColumn("payments", "midtrans_token");
    await queryInterface.removeColumn("payments", "midtrans_redirect_url");

    // Revert payment_method enum
    await queryInterface.changeColumn("payments", "payment_method", {
      type: Sequelize.ENUM(
        "bank_transfer",
        "credit_card",
        "e_wallet",
        "manual"
      ),
      defaultValue: "manual",
    });

    // Revert status enum
    await queryInterface.changeColumn("payments", "status", {
      type: Sequelize.ENUM("pending", "paid", "failed", "expired"),
      defaultValue: "pending",
    });
  },
};
