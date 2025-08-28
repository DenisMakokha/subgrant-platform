#!/usr/bin/env node

// Test API connectivity for Sub-Grant Management Platform

const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// API configuration
const apiConfig = {
  host: process.env.API_HOST || 'localhost',
  port: process.env.API_PORT || 3000,
  path: process.env.API_PATH || '/'
};

async function testApi() {
  console.log('Testing API connectivity...');
  console.log('API configuration:');
  console.log(`  Host: ${apiConfig.host}`);
  console.log(`  Port: ${apiConfig.port}`);
  console.log(`  Path: ${apiConfig.path}`);
  console.log('---------------------------');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: apiConfig.host,
      port: apiConfig.port,
      path: apiConfig.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✓ API connection successful`);
      console.log(`  Status Code: ${res.statusCode}`);
      console.log(`  Status Message: ${res.statusMessage}`);
      
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
              console.log('✓ API is returning expected response');
              console.log(`  API Version: ${jsonData.version || 'Unknown'}`);
            } else {
              console.log('⚠ API response format is unexpected');
            }
            resolve();
          } catch (err) {
            console.log('⚠ API response is not valid JSON');
            resolve();
          }
        });
      } else {
        console.log('⚠ API returned unexpected status code');
        resolve();
      }
    });

    req.on('error', (err) => {
      console.error('✗ API connection failed:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('✗ API connection timed out');
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
      console.log('---------------------------');
      console.log('API connectivity test completed!');
    })
    .catch((err) => {
      console.error('---------------------------');
      console.error('API connectivity test failed!');
      process.exit(1);
    });
}

module.exports = testApi;