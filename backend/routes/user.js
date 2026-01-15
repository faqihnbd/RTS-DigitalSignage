const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Tenant } = require("../models");
const router = express.Router();

// Helper: Only super admin or tenant admin for own tenant
function canManageUser(req, user) {
  if (req.user.role === "super_admin") return true;
  if (req.user.role === "tenant_admin" && user.tenant_id === req.user.tenant_id)
    return true;
  return false;
}

// GET /users
router.get("/", async (req, res) => {
  const where =
    req.user.role === "super_admin" ? {} : { tenant_id: req.user.tenant_id };
  const users = await User.findAll({
    where,
    attributes: { exclude: ["password_hash"] },
    include: [Tenant],
  });
  res.json(users);
});

// POST /users
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, tenant_id } = req.body;
    if (req.user.role === "tenant_admin" && tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password_hash: hash,
      role,
      tenant_id: tenant_id || req.user.tenant_id,
    });
    res.status(201).json({ ...user.toJSON(), password_hash: undefined });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /users/:id
router.get("/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ["password_hash"] },
    include: [Tenant],
  });
  if (!user || !canManageUser(req, user))
    return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// PUT /users/:id
router.put("/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user || !canManageUser(req, user))
    return res.status(404).json({ message: "Not found" });
  try {
    const { name, email, password, role, is_active, tenant_id } = req.body;
    if (password) user.password_hash = await bcrypt.hash(password, 10);
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && req.user.role === "super_admin") user.role = role;
    if (is_active !== undefined) user.is_active = is_active;
    // Allow super_admin to change tenant_id
    if (tenant_id && req.user.role === "super_admin")
      user.tenant_id = tenant_id;
    await user.save();
    res.json({ ...user.toJSON(), password_hash: undefined });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /users/:id
router.delete("/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user || !canManageUser(req, user))
    return res.status(404).json({ message: "Not found" });
  await user.destroy();
  res.json({ message: "Deleted" });
});

module.exports = router;
