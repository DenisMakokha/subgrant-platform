#!/usr/bin/env node

// Seed test data for Sub-Grant Management Platform
// This script creates test users for each role

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection configuration
const client = new Client({
  user: process.env.DB_USER || 'subgrant_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'subgrant_password',
  port: process.env.DB_PORT || 5432,
});

// Test users data
const testUsers = [
  {
    first_name: 'System',
    last_name: 'Administrator',
    email: 'admin@example.com',
    role: 'system_administrator',
    password: 'admin123'
  },
  {
    first_name: 'Regular',
    last_name: 'Admin',
    email: 'regular.admin@example.com',
    role: 'admin',
    password: 'admin123'
  },
  {
    first_name: 'Account',
    last_name: 'Manager',
    email: 'accountant@example.com',
    role: 'accountant',
    password: 'accountant123'
  },
  {
    first_name: 'Budget',
    last_name: 'Holder',
    email: 'budget.holder@example.com',
    role: 'budget_holder',
    password: 'budget123'
  },
  {
    first_name: 'Finance',
    last_name: 'Manager',
    email: 'finance.manager@example.com',
    role: 'finance_manager',
    password: 'finance123'
  },
  {
    first_name: 'Partner',
    last_name: 'User',
    email: 'partner.user@example.com',
    role: 'partner_user',
    password: 'partner123'
  },
  {
    first_name: 'Compliance',
    last_name: 'Officer',
    email: 'compliance.officer@example.com',
    role: 'compliance_officer',
    password: 'compliance123'
  },
  {
    first_name: 'External',
    last_name: 'Auditor',
    email: 'auditor@example.com',
    role: 'auditor',
    password: 'auditor123'
  },
  {
    first_name: 'Donor',
    last_name: 'Representative',
    email: 'donor@example.com',
    role: 'donor',
    password: 'donor123'
  }
];

// Function to hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Function to insert a user
async function insertUser(user) {
  const password_hash = await hashPassword(user.password);
  
  const query = `
    INSERT INTO users (
      first_name, last_name, email, role, password_hash, status
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      password_hash = EXCLUDED.password_hash,
      status = EXCLUDED.status
    RETURNING *;
  `;
  
  const values = [
    user.first_name,
    user.last_name,
    user.email,
    user.role,
    password_hash,
    'active'
  ];
  
  try {
    const result = await client.query(query, values);
    console.log(`✓ Created/Updated user: ${user.email} (${user.role})`);
    return result.rows[0];
  } catch (err) {
    console.error(`✗ Error creating user ${user.email}:`, err);
    throw err;
  }
}

// Function to create a default organization
async function createDefaultOrganization() {
  const query = `
    INSERT INTO organizations (
      name, legal_name, status, compliance_status
    ) VALUES ($1, $2, $3, $4)
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;
  
  const values = [
    'Test Organization',
    'Test Organization Ltd',
    'active',
    'approved'
  ];
  
  try {
    const result = await client.query(query, values);
    if (result.rows.length > 0) {
      console.log('✓ Created default organization');
      return result.rows[0];
    } else {
      console.log('✓ Default organization already exists');
      // Get the existing organization
      const existingQuery = 'SELECT * FROM organizations LIMIT 1';
      const existingResult = await client.query(existingQuery);
      return existingResult.rows[0];
    }
  } catch (err) {
    console.error('✗ Error creating default organization:', err);
    throw err;
  }
}

// Function to associate partner user with organization
async function associatePartnerUserWithOrganization(userId, organizationId) {
  const query = `
    UPDATE users 
    SET organization_id = $1 
    WHERE id = $2 AND role = 'partner_user'
    RETURNING *;
  `;
  
  const values = [organizationId, userId];
  
  try {
    const result = await client.query(query, values);
    if (result.rows.length > 0) {
      console.log('✓ Associated partner user with organization');
    }
  } catch (err) {
    console.error('✗ Error associating partner user with organization:', err);
    throw err;
  }
}

// Main function to seed test data
async function seedTestData() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');
    
    // Create default organization
    const organization = await createDefaultOrganization();
    
    // Insert test users
    console.log('Creating test users...');
    const users = [];
    for (const userData of testUsers) {
      const user = await insertUser(userData);
      users.push(user);
    }
    
    // Associate partner user with organization
    const partnerUser = users.find(user => user.role === 'partner_user');
    if (partnerUser) {
      await associatePartnerUserWithOrganization(partnerUser.id, organization.id);
    }
    
    console.log('Test data seeding completed successfully');
    console.log('\nTest Credentials:');
    console.log('==================');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });
    
  } catch (err) {
    console.error('Error seeding test data:', err);
  } finally {
    await client.end();
  }
}

// Run the seeding
if (require.main === module) {
  seedTestData();
}

module.exports = seedTestData;