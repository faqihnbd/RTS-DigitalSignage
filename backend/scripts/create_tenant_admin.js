// Script untuk membuat user tenant admin untuk testing device registration
require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../db");
const { User, Tenant } = require("../models");

async function createTenantAdmin() {
  await sequelize.authenticate();
  await sequelize.sync();

  // Find existing tenant
  const tenant = await Tenant.findOne();
  if (!tenant) {
    return;
  }

  const email = "admin@test.com";
  const password = "admin123";
  const name = "Tenant Admin";
  const hash = await bcrypt.hash(password, 10);

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      name,
      email,
      password_hash: hash,
      role: "tenant_admin",
      is_active: true,
      tenant_id: tenant.id,
    },
  });

  if (created) {
  } else {
  }

  process.exit(0);
}

createTenantAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
