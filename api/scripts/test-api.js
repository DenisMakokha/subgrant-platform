#!/usr/bin/env node

// Test API connectivity for Sub-Grant Management Platform

const http = require('http');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

// API configuration
const apiConfig = {
  host: process.env.API_HOST || 'localhost',
  port: process.env.API_PORT || 3000,
  path: process.env.API_PATH || '/'
};

async function testApi() {
  logger.info('Testing API connectivity...');
  logger.info('API configuration:');
  logger.info(`  Host: ${apiConfig.host}`);
  logger.info(`  Port: ${apiConfig.port}`);
  logger.info(`  Path: ${apiConfig.path}`);
  logger.info('---------------------------');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: apiConfig.host,
      port: apiConfig.port,
      path: apiConfig.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      logger.info(`✓ API connection successful`);
      logger.info(`  Status Code: ${res.statusCode}`);
      logger.info(`  Status Message: ${res.statusMessage}`);
      
      // Check if it's the expected API response
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.message && jsonData.message.includes('Sub-Grant Management Platform API')) {
              logger.info('✓ API is returning expected response');
              logger.info(`  API Version: ${jsonData.version || 'Unknown'}`);
            } else {
              logger.info('⚠ API response format is unexpected');
            }
            resolve();
          } catch (err) {
            logger.info('⚠ API response is not valid JSON');
            resolve();
          }
        });
      } else {
        logger.info('⚠ API returned unexpected status code');
        resolve();
      }
    });

    req.on('error', (err) => {
      logger.error('✗ API connection failed:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      logger.error('✗ API connection timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Run the test if this script is executed directly
if (require.main === module) {
  testApi()
    .then(() => {
      logger.info('---------------------------');
      logger.info('API connectivity test completed!');
    })
    .catch((err) => {
      logger.error('---------------------------');
      logger.error('API connectivity test failed!');
      process.exit(1);
    });
}

module.exports = testApi;