/**
 * Grant Admin Access Script
 * Ensures admin@subgrant.com has wizard.admin capabilities
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { seedRoles } = require('./seedRoles');

async function grantAdminAccess() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🔧 Granting admin access to admin@subgrant.com...');

    // Step 1: Ensure roles are seeded
    console.log('📋 Step 1: Ensuring roles are seeded...');
    await seedRoles();
    console.log('✅ Roles seeded successfully');

    // Step 2: Check if admin user exists
    console.log('👤 Step 2: Checking admin user...');
    let userResult = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['admin@subgrant.com']
    );

    let userId;
    if (userResult.rows.length === 0) {
      // Create admin user if it doesn't exist
      console.log('Creating admin user...');
      const passwordHash = await bcrypt.hash('password', 10);

      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, role, password_hash, status, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, ['admin@subgrant.com', 'System', 'Administrator', 'admin', passwordHash, 'active', true]);

      userId = createResult.rows[0].id;
      console.log('✅ Admin user created');
    } else {
      userId = userResult.rows[0].id;
      console.log('✅ Admin user already exists');

      // Update user role to admin if it's not already
      if (userResult.rows[0].role !== 'admin') {
        await client.query(
          'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
          ['admin', userId]
        );
        console.log('✅ Admin user role updated to admin');
      }
    }

    // Step 3: Verify admin role has wizard.admin capability
    console.log('🔐 Step 3: Verifying admin role capabilities...');
    const roleResult = await client.query(
      'SELECT caps FROM roles WHERE id = $1',
      ['admin']
    );

    if (roleResult.rows.length === 0) {
      throw new Error('Admin role not found after seeding');
    }

    const capabilities = roleResult.rows[0].caps || [];
    if (!capabilities.includes('wizard.admin')) {
      console.log('⚠️  Admin role missing wizard.admin capability, adding it...');
      const updatedCaps = [...capabilities, 'wizard.admin'];

      await client.query(
        'UPDATE roles SET caps = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedCaps), 'admin']
      );
      console.log('✅ Added wizard.admin capability to admin role');
    } else {
      console.log('✅ Admin role already has wizard.admin capability');
    }

    // Step 4: Verify user capabilities via runtime API simulation
    console.log('🔍 Step 4: Verifying user capabilities...');

    // Get user role capabilities
    const userRoleResult = await client.query(`
      SELECT r.caps, r.scopes
      FROM users u
      JOIN roles r ON u.role = r.id
      WHERE u.id = $1 AND u.is_active = true AND r.active = true
    `, [userId]);

    if (userRoleResult.rows.length === 0) {
      throw new Error('User role not found or inactive');
    }

    const userCapabilities = userRoleResult.rows[0].caps || [];
    const userScopes = userRoleResult.rows[0].scopes || {};

    console.log('📊 User Capabilities:', userCapabilities);
    console.log('📊 User Scopes:', userScopes);

    if (userCapabilities.includes('wizard.admin')) {
      console.log('✅ User has wizard.admin capability');
    } else {
      throw new Error('User does not have wizard.admin capability');
    }

    // Step 5: Test admin dashboard access
    console.log('🧪 Step 5: Testing admin dashboard access...');

    const testResult = {
      userId,
      email: 'admin@subgrant.com',
      role: 'admin',
      capabilities: userCapabilities,
      scopes: userScopes,
      hasWizardAdmin: userCapabilities.includes('wizard.admin'),
      canAccessAdminDashboard: userCapabilities.includes('wizard.admin')
    };

    console.log('✅ Admin access test results:', testResult);

    await client.query('COMMIT');
    console.log('🎉 Admin access granted successfully!');

    return testResult;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error granting admin access:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Function to check current admin user status
async function checkAdminUserStatus() {
  try {
    console.log('🔍 Checking current admin user status...');

    const result = await db.pool.query(`
      SELECT
        u.id, u.email, u.role, u.is_active, u.created_at,
        r.caps, r.scopes
      FROM users u
      LEFT JOIN roles r ON u.role = r.id
      WHERE u.email = $1
    `, ['admin@subgrant.com']);

    if (result.rows.length === 0) {
      console.log('❌ Admin user not found');
      return null;
    }

    const user = result.rows[0];
    console.log('📊 Current admin user status:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Active: ${user.is_active}`);
    console.log(`  - Capabilities: ${JSON.stringify(user.caps || [])}`);
    console.log(`  - Has wizard.admin: ${(user.caps || []).includes('wizard.admin')}`);

    return user;
  } catch (error) {
    console.error('❌ Error checking admin user status:', error);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Admin Access Management Script\n');

  try {
    // First check current status
    await checkAdminUserStatus();

    // Then grant/ensure admin access
    const result = await grantAdminAccess();

    console.log('\n🎯 Final Status:');
    console.log(`✅ User: ${result.email}`);
    console.log(`✅ Role: ${result.role}`);
    console.log(`✅ Has Admin Access: ${result.hasWizardAdmin}`);
    console.log(`✅ Can Access Admin Dashboard: ${result.canAccessAdminDashboard}`);

    console.log('\n🎉 Admin access setup complete!');
    console.log('You can now login with:');
    console.log('  Email: admin@subgrant.com');
    console.log('  Password: password');
    console.log('  Dashboard: http://localhost:3001/admin');

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Admin access script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Admin access script failed:', error);
      process.exit(1);
    });
}

module.exports = { grantAdminAccess, checkAdminUserStatus };
