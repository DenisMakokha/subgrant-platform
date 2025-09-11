const { Pool } = require('pg');
const dotenv = require('dotenv');
const mockDb = require('./mockDatabase');

// Load environment variables
dotenv.config();

// Check if we're using mock database for testing
const useMockDatabase = process.env.USE_MOCK_DATABASE === 'true';

if (useMockDatabase) {
  console.log('Using mock database for testing');
  module.exports = {
    pool: mockDb,
    testConnection: async () => {
      try {
        await mockDb.connect();
        console.log('Mock database connection successful');
      } catch (error) {
        console.error('Mock database connection failed:', error.message);
        process.exit(1);
      }
    }
  };
} else {
  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'subgrant_platform',
    user: process.env.DB_USER || 'subgrant_user',
    password: process.env.DB_PASSWORD || 'subgrant_password',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };

  // Create a pool of database connections
  const pool = new Pool(dbConfig);

  // Test the database connection
  const testConnection = async () => {
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      client.release();
    } catch (error) {
      console.error('Database connection failed:', error.message);
      process.exit(1);
    }
  };

  // Export the pool and test function
  module.exports = {
    pool,
    testConnection,
  };
}