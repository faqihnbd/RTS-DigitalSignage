/**
 * Create New User Script
 * 
 * Usage:
 * docker-compose exec backend node scripts/create_user.js
 * 
 * Then follow the prompts to create a new user
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../db");
const { User, Tenant } = require("../models");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createUser() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Get user input
    console.log("=".repeat(60));
    console.log("CREATE NEW USER");
    console.log("=".repeat(60) + "\n");

    const name = await question("Enter name: ");
    const email = await question("Enter email: ");
    const password = await question("Enter password: ");
    const roleInput = await question(
      "Enter role (1=super_admin, 2=tenant_admin): "
    );

    const role = roleInput === "1" ? "super_admin" : "tenant_admin";

    let tenantId = null;

    if (role === "tenant_admin") {
      // Show available tenants
      const tenants = await Tenant.findAll({
        attributes: ["id", "name", "email"],
      });

      if (tenants.length === 0) {
        console.log("\n❌ No tenants found. Please create a tenant first.");
        rl.close();
        process.exit(1);
      }

      console.log("\nAvailable Tenants:");
      tenants.forEach((t) => {
        console.log(`  ${t.id}. ${t.name} (${t.email})`);
      });

      const tenantIdInput = await question("\nEnter tenant ID: ");
      tenantId = parseInt(tenantIdInput);

      const tenant = tenants.find((t) => t.id === tenantId);
      if (!tenant) {
        console.log("\n❌ Invalid tenant ID");
        rl.close();
        process.exit(1);
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`\n❌ User with email ${email} already exists`);
      rl.close();
      process.exit(1);
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      role,
      tenant_id: tenantId,
      is_active: true,
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ USER CREATED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\nName: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    if (tenantId) {
      console.log(`Tenant ID: ${tenantId}`);
    }
    console.log(
      `\nLogin URL: http://your-server:8080/${
        role === "super_admin" ? "central" : "admin"
      }/`
    );
    console.log("=".repeat(60) + "\n");

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating user:", error);
    rl.close();
    process.exit(1);
  }
}

createUser();
