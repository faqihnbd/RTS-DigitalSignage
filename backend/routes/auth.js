const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, Tenant } = require("../models");
const logger = require("../utils/logger");

const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    logger.logAuth("Login Attempt", true, req, { email });

    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user) {
      logger.logAuth("Login Failed", false, req, {
        email,
        reason: "User not found or inactive",
      });
      return res.status(401).json({ message: "User not found or inactive" });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      logger.logAuth("Login Failed", false, req, {
        email,
        userId: user.id,
        reason: "Invalid password",
      });
      return res.status(401).json({ message: "Invalid password" });
    }

    const tenant = user.tenant_id
      ? await Tenant.findByPk(user.tenant_id)
      : null;

    // Check if tenant is suspended
    if (tenant && tenant.status === "suspended") {
      logger.logAuth("Login Blocked", false, req, {
        email,
        userId: user.id,
        tenantId: tenant.id,
        reason: "Tenant suspended",
      });
      return res.status(403).json({
        message:
          "Akun Anda telah ditangguhkan oleh administrator. Silakan hubungi administrator untuk informasi lebih lanjut.",
        warning: {
          type: "tenant_suspended",
          status: "suspended",
        },
      });
    }

    // Check if tenant package has expired
    let isExpired = false;
    let expiredMessage = null;

    if (tenant && tenant.expired_at) {
      const now = new Date();
      const expiryDate = new Date(tenant.expired_at);

      if (now > expiryDate) {
        isExpired = true;
        expiredMessage = `Paket Anda telah habis pada ${expiryDate.toLocaleDateString(
          "id-ID"
        )}. Silakan hubungi administrator untuk memperpanjang paket.`;

        // Auto-update tenant status to expired if not already
        if (tenant.status !== "expired") {
          await tenant.update({ status: "expired" });
        }
      }
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant_status: tenant ? tenant.status : null,
      is_expired: isExpired,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "rtssecret", {
      expiresIn: "24h", // Token expires in 24 hours
    });

    logger.logAuth("Login Success", true, req, {
      email,
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      isExpired,
    });

    // Return with expiry warning if applicable
    const response = {
      token,
      user: payload,
    };

    if (isExpired) {
      response.warning = {
        type: "package_expired",
        message: expiredMessage,
        expired_at: tenant.expired_at,
      };
    }

    res.json(response);
  } catch (err) {
    logger.logError(err, req, { action: "Login", email: req.body.email });
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

module.exports = router;
