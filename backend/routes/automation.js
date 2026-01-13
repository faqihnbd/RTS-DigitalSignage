const express = require("express");
const { Tenant, Payment } = require("../models");
const { Op } = require("sequelize");
const router = express.Router();

// PATCH /automation/renewal
// Cek tenant yang expired, update status, auto-suspend jika belum bayar, auto-activate jika sudah bayar
router.patch("/renewal", async (req, res) => {
  // 1. Suspend tenant yang expired dan belum bayar
  const now = new Date();
  const expiredTenants = await Tenant.findAll({
    where: {
      expired_at: { [Op.lt]: now },
      status: "active",
    },
  });
  let suspended = 0,
    activated = 0;
  for (const tenant of expiredTenants) {
    // Cek pembayaran terakhir
    const lastPayment = await Payment.findOne({
      where: { tenant_id: tenant.id, status: "paid" },
      order: [["paid_at", "DESC"]],
    });
    if (!lastPayment || new Date(lastPayment.expired_at) < now) {
      tenant.status = "suspended";
      await tenant.save();
      suspended++;
    }
  }
  // 2. Auto-activate tenant yang sudah bayar dan statusnya suspended
  const suspendedTenants = await Tenant.findAll({
    where: { status: "suspended" },
  });
  for (const tenant of suspendedTenants) {
    const lastPayment = await Payment.findOne({
      where: { tenant_id: tenant.id, status: "paid" },
      order: [["paid_at", "DESC"]],
    });
    if (lastPayment && new Date(lastPayment.expired_at) > now) {
      tenant.status = "active";
      tenant.expired_at = lastPayment.expired_at;
      await tenant.save();
      activated++;
    }
  }
  res.json({ suspended, activated });
});

// GET /automation/reminder
// List tenant yang akan expired dalam 3 hari ke depan (untuk notifikasi manual/otomatis)
router.get("/reminder", async (req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const tenants = await Tenant.findAll({
    where: {
      expired_at: { [Op.between]: [now, soon] },
      status: "active",
    },
  });
  res.json(tenants);
});

module.exports = router;
