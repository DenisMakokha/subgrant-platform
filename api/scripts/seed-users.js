// Seed script to create test users for development
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
require('dotenv').config();

// Database connection configuration
const client = new Client({
  user: process.env.DB_USER || 'subgrant_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'subgrant_password',
  port: process.env.DB_PORT || 5432,
});

// Test users to create
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    organization_id: null
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    organization_id: null
  },
  {
    email: 'partner@test.com',
    password: 'partner123',
    first_name: 'Partner',
    last_name: 'User',
    role: 'partner_user',
    organization_id: null
  }
];

// Function to create a user
async function createUser(userData) {
  try {
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);
    
    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await client.query(checkQuery, [userData.email]);
    
    if (existingUser.rows.length > 0) {
      logger.info(`User ${userData.email} already exists, skipping...`);
      return;
    }
    
    // Insert the user
    const insertQuery = `
      INSERT INTO users (
        organization_id, first_name, last_name, email, role, status, 
        mfa_enabled, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email;
    `;
    
    const values = [
      userData.organization_id,
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.role,
      'active',
      false,
      password_hash
    ];
    
    const result = await client.query(insertQuery, values);
    logger.info(`✓ Created user: ${result.rows[0].email} (ID: ${result.rows[0].id})`);
    
  } catch (error) {
    logger.error(`✗ Error creating user ${userData.email}:`, error.message);
  }
}

// Main function to seed users
async function seedUsers() {
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to the database');

    // Create test users
    for (const userData of testUsers) {
      await createUser(userData);
    }

    logger.info('User seeding completed successfully');
  } catch (err) {
    logger.error('Error seeding users:', err);
  } finally {
    await client.end();
  }
}

// Run the seeding
seedUsers();
