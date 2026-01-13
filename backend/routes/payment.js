const express = require("express");
const { Payment, Package, Tenant } = require("../models");
const { snap, coreApi } = require("../config/midtrans");
const router = express.Router();

// Only super admin or tenant admin for their tenant
function canManagePayment(req, payment) {
  if (req.user.role === "super_admin") return true;
  if (
    req.user.role === "tenant_admin" &&
    payment.tenant_id === req.user.tenant_id
  )
    return true;
  return false;
}

// GET /payments (super admin: all, tenant admin: own tenant)
router.get("/", async (req, res) => {
  const where =
    req.user.role === "super_admin" ? {} : { tenant_id: req.user.tenant_id };
  const payments = await Payment.findAll({ where, include: [Package, Tenant] });
  res.json(payments);
});

// POST /payments (tenant admin: create payment request)
router.post("/", async (req, res) => {
  if (req.user.role !== "tenant_admin")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { package_id, amount, payment_method, description } = req.body;

    // Generate invoice number
    const invoiceCount = (await Payment.count()) + 1;
    const invoice_number = `INV-${new Date().getFullYear()}-${String(
      invoiceCount
    ).padStart(3, "0")}`;

    const payment = await Payment.create({
      tenant_id: req.user.tenant_id,
      package_id,
      amount,
      status: "pending",
      payment_method: payment_method || "manual",
      description: description || "Package payment",
      invoice_number: invoice_number,
      expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    const paymentWithDetails = await Payment.findByPk(payment.id, {
      include: [Package, Tenant],
    });

    res.status(201).json(paymentWithDetails);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /payments/midtrans - Create Midtrans payment
router.post("/midtrans", async (req, res) => {
  if (req.user.role !== "tenant_admin")
    return res.status(403).json({ message: "Forbidden" });

  try {
    const { package_id, amount, description } = req.body;

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${req.user.tenant_id}`;

    // Generate invoice number
    const invoiceCount = (await Payment.count()) + 1;
    const invoice_number = `INV-${new Date().getFullYear()}-${String(
      invoiceCount
    ).padStart(3, "0")}`;

    // Get package and tenant details
    const packageDetails = await Package.findByPk(package_id);
    const tenant = await Tenant.findByPk(req.user.tenant_id);

    if (!packageDetails || !tenant) {
      return res.status(404).json({ message: "Package or tenant not found" });
    }

    // Create payment record first
    const payment = await Payment.create({
      tenant_id: req.user.tenant_id,
      package_id,
      amount,
      status: "pending",
      payment_method: "midtrans",
      description: description || `Payment for ${packageDetails.name} package`,
      invoice_number: invoice_number,
      midtrans_order_id: orderId,
      expired_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    });

    // Calculate expiry time (10 minutes from now)
    const now = new Date();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    // Format date for Midtrans (YYYY-MM-DD HH:mm:ss +ZZZZ)
    const formatMidtransDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0700`;
    };

    // Prepare Midtrans transaction parameters
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(amount),
      },
      credit_card: {
        secure: true,
      },
      expiry: {
        start_time: formatMidtransDate(now),
        unit: "minutes",
        duration: 10,
      },
      customer_details: {
        first_name: tenant.name || "Customer",
        email: tenant.email || "customer@example.com",
        phone: tenant.phone || "+62812345678",
      },
      item_details: [
        {
          id: package_id,
          price: parseInt(amount),
          quantity: 1,
          name: packageDetails.name,
          category: "Digital Signage Package",
        },
      ],
      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:3001"
        }/admin/payment/success`,
        error: `${
          process.env.FRONTEND_URL || "http://localhost:3001"
        }/admin/payment/error`,
        pending: `${
          process.env.FRONTEND_URL || "http://localhost:3001"
        }/admin/payment/pending`,
      },
    };

    // Create transaction token
    const transaction = await snap.createTransaction(parameter);

    // Update payment with Midtrans details
    payment.midtrans_token = transaction.token;
    payment.midtrans_redirect_url = transaction.redirect_url;
    await payment.save();

    res.json({
      payment_id: payment.id,
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      payment: payment,
    });
  } catch (err) {
    console.error("Midtrans payment creation error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /payments/midtrans/notification - Handle Midtrans notification
router.post("/midtrans/notification", async (req, res) => {
  try {
    const statusResponse = await coreApi.transaction.notification(req.body);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Find payment by order ID
    const payment = await Payment.findOne({
      where: { midtrans_order_id: orderId },
      include: [Package, Tenant],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment based on transaction status
    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        payment.status = "pending";
      } else if (fraudStatus === "accept") {
        payment.status = "paid";
        payment.paid_at = new Date();
      }
    } else if (transactionStatus === "settlement") {
      payment.status = "paid";
      payment.paid_at = new Date();
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      payment.status = "failed";
    } else if (transactionStatus === "pending") {
      payment.status = "pending";
    }

    // Update transaction ID
    payment.midtrans_transaction_id = statusResponse.transaction_id;
    await payment.save();

    // If payment is successful, activate package for tenant
    if (payment.status === "paid") {
      try {
        const tenant = payment.Tenant;

        tenant.package_id = payment.package_id;
        tenant.package_expires_at = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ); // 30 days
        await tenant.save();
      } catch (upgradeError) {
        console.error(`Error upgrading package for tenant:`, upgradeError);
      }
    }

    res.json({ message: "Notification processed successfully" });
  } catch (err) {
    console.error("Midtrans notification error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /payments/midtrans/status/:order_id - Check payment status
router.get("/midtrans/status/:order_id", async (req, res) => {
  try {
    const orderId = req.params.order_id;

    // Get status from Midtrans
    const statusResponse = await coreApi.transaction.status(orderId);

    // Find local payment record
    const payment = await Payment.findOne({
      where: { midtrans_order_id: orderId },
      include: [Package, Tenant],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update local payment status based on Midtrans status
    const transactionStatus = statusResponse.transaction_status;
    const previousStatus = payment.status;

    if (transactionStatus === "settlement" && payment.status !== "paid") {
      payment.status = "paid";
      payment.paid_at = new Date();
      payment.midtrans_transaction_id = statusResponse.transaction_id;
      await payment.save();

      // If payment just became paid, upgrade the package
      if (previousStatus !== "paid") {
        try {
          const tenant = payment.Tenant;

          tenant.package_id = payment.package_id;
          tenant.package_expires_at = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ); // 30 days
          await tenant.save();
        } catch (upgradeError) {
          console.error(
            `Error upgrading package via status check:`,
            upgradeError
          );
        }
      }
    }

    res.json({
      payment: payment,
      midtrans_status: statusResponse,
    });
  } catch (err) {
    console.error("Check payment status error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /payments/:id/confirm (super admin: confirm payment)
router.put("/:id/confirm", async (req, res) => {
  if (req.user.role !== "super_admin")
    return res.status(403).json({ message: "Forbidden" });

  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [Package, Tenant],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ message: "Payment is not pending" });
    }

    // Update payment status
    payment.status = "paid";
    payment.paid_at = new Date();
    await payment.save();

    // Update tenant's package
    const tenant = payment.Tenant;
    tenant.package_id = payment.package_id;
    tenant.package_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await tenant.save();

    res.json({ message: "Payment confirmed and package activated", payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /payments/stats - Get payment statistics
router.get("/stats", async (req, res) => {
  const where =
    req.user.role === "super_admin" ? {} : { tenant_id: req.user.tenant_id };

  try {
    const totalPaid =
      (await Payment.sum("amount", {
        where: { ...where, status: "paid" },
      })) || 0;

    const totalPending =
      (await Payment.sum("amount", {
        where: { ...where, status: "pending" },
      })) || 0;

    const totalUnpaid =
      (await Payment.sum("amount", {
        where: { ...where, status: "failed" },
      })) || 0;

    const totalTransactions = await Payment.count({ where });

    res.json({
      totalPaid,
      totalPending,
      totalUnpaid,
      totalTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /payments/:id
router.get("/:id", async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, {
    include: [Package, Tenant],
  });
  if (!payment || !canManagePayment(req, payment))
    return res.status(404).json({ message: "Not found" });
  res.json(payment);
});

// PUT /payments/:id (update status, invoice, dsb)
router.put("/:id", async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment || !canManagePayment(req, payment))
    return res.status(404).json({ message: "Not found" });
  try {
    const { status, invoice_url, paid_at, expired_at } = req.body;
    if (status) payment.status = status;
    if (invoice_url) payment.invoice_url = invoice_url;
    if (paid_at) payment.paid_at = paid_at;
    if (expired_at) payment.expired_at = expired_at;
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /payments/:id (super admin only)
router.delete("/:id", async (req, res) => {
  if (req.user.role !== "super_admin")
    return res.status(403).json({ message: "Forbidden" });
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return res.status(404).json({ message: "Not found" });
  await payment.destroy();
  res.json({ message: "Deleted" });
});

module.exports = router;
