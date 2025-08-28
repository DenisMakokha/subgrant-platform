#!/usr/bin/env node

// Setup script for Sub-Grant Management Platform database
// This script will create the database, user, and initialize tables

const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Database connection configuration for PostgreSQL superuser
const superuserConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default database first
  password: process.env.POSTGRES_PASSWORD || 'makokha300',
  port: process.env.DB_PORT || 5432,
};

// Database connection configuration for the application
const appConfig = {
  user: process.env.DB_USER || 'subgrant_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'subgrant_password',
  port: process.env.DB_PORT || 5432,
};

async function createDatabaseAndUser() {
  console.log('Creating database and user...');
  
  const client = new Client(superuserConfig);
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL as superuser');
    
    // Create database
    try {
      await client.query(`CREATE DATABASE ${appConfig.database}`);
      console.log(`✓ Database '${appConfig.database}' created successfully`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`✓ Database '${appConfig.database}' already exists`);
      } else {
        throw err;
      }
    }
    
    // Create user
    try {
      await client.query(`CREATE USER ${appConfig.user} WITH PASSWORD '${appConfig.password}'`);
      console.log(`✓ User '${appConfig.user}' created successfully`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`✓ User '${appConfig.user}' already exists`);
        // Update password if user exists
        await client.query(`ALTER USER ${appConfig.user} WITH PASSWORD '${appConfig.password}'`);
        console.log(`✓ Password for user '${appConfig.user}' updated`);
      } else {
        throw err;
      }
    }
    
    // Grant privileges
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${appConfig.database} TO ${appConfig.user}`);
    console.log(`✓ Privileges granted to user '${appConfig.user}'`);
    
  } catch (err) {
    console.error('Error creating database and user:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function enableUUIDExtension() {
  console.log('Enabling UUID extension...');
  
  const client = new Client({
    ...appConfig,
    database: appConfig.database
  });
  
  try {
    await client.connect();
    console.log(`Connected to database '${appConfig.database}'`);
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ UUID extension enabled');
    
  } catch (err) {
    console.error('Error enabling UUID extension:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function initializeTables() {
  console.log('Initializing database tables...');
  
  // Read and execute the init-db.js script
  try {
    const initScriptPath = path.join(__dirname, 'init-db.js');
    if (fs.existsSync(initScriptPath)) {
      // Set environment variables for the init script
      process.env.DB_USER = appConfig.user;
      process.env.DB_HOST = appConfig.host;
      process.env.DB_NAME = appConfig.database;
      process.env.DB_PASSWORD = appConfig.password;
      process.env.DB_PORT = appConfig.port;
      
      // Run the init script
      require('./init-db.js');
    } else {
      console.error('Database initialization script not found');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error initializing tables:', err.message);
    process.exit(1);
  }
}

async function main() {
  console.log('Sub-Grant Management Platform Database Setup');
  console.log('============================================\n');
  
  try {
    // Create database and user
    await createDatabaseAndUser();
    
    // Enable UUID extension
    await enableUUIDExtension();
    
    console.log('\nDatabase setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the table initialization script: node scripts/init-db.js');
    console.log('2. Start the API server: npm start');
    
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  createDatabaseAndUser,
  enableUUIDExtension,
  initializeTables
};