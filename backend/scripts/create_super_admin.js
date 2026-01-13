// Jalankan script ini sekali untuk membuat user super admin
require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../db");
const User = require("../models/User");

async function createSuperAdmin() {
  await sequelize.authenticate();
  await sequelize.sync();
  const email = "central@rts.com";
  const password = "central123";
  const name = "Central Super Admin";
  const hash = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      name,
      email,
      password_hash: hash,
      role: "super_admin",
      is_active: true,
      tenant_id: null,
    },
  });
  if (created) {
  } else {
  }
  process.exit(0);
}

createSuperAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
