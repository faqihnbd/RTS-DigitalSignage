const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, Tenant } = require("../models");

const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user)
      return res.status(401).json({ message: "User not found or inactive" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid password" });
    const tenant = user.tenant_id
      ? await Tenant.findByPk(user.tenant_id)
      : null;
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant_status: tenant ? tenant.status : null,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "rtssecret", {
      expiresIn: "12h",
    });
    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

module.exports = router;
