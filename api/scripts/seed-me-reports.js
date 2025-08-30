#!/usr/bin/env node

// Seed ME reports for Sub-Grant Management Platform
// This script creates sample ME reports for testing

const { Client } = require('pg');
require('dotenv').config();

// Database connection configuration
const client = new Client({
  user: process.env.DB_USER || 'subgrant_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'subgrant_password',
  port: process.env.DB_PORT || 5432,
});

// Sample ME reports data
const sampleMeReports = [
  {
    title: 'Q1 2023 ME Report',
    description: 'Monitoring and Evaluation report for Q1 2023',
    report_date: '2023-03-31',
    status: 'approved',
    budget_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    title: 'Q2 2023 ME Report',
    description: 'Monitoring and Evaluation report for Q2 2023',
    report_date: '2023-06-30',
    status: 'submitted',
    budget_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    title: 'Q3 2023 ME Report',
    description: 'Monitoring and Evaluation report for Q3 2023',
    report_date: '2023-09-30',
    status: 'draft',
    budget_id: '11111111-1111-1111-1111-111111111111'
  }
];

// Function to insert an ME report
async function insertMeReport(meReport) {
  const query = `
    INSERT INTO me_reports (
      budget_id, title, description, report_date, status, created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  
  const values = [
    meReport.budget_id,
    meReport.title,
    meReport.description,
    meReport.report_date,
    meReport.status,
    '11111111-1111-1111-1111-111111111111', // Using a dummy user ID
    '11111111-1111-1111-1111-111111111111'  // Using a dummy user ID
  ];
  
  try {
    const result = await client.query(query, values);
    console.log(`✓ Created ME report: ${meReport.title}`);
    return result.rows[0];
  } catch (err) {
    console.error(`✗ Error creating ME report ${meReport.title}:`, err);
    throw err;
  }
}

// Main function to seed ME reports
async function seedMeReports() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');
    
    // Insert sample ME reports
    console.log('Creating sample ME reports...');
    for (const meReportData of sampleMeReports) {
      await insertMeReport(meReportData);
    }
    
    console.log('Sample ME reports seeding completed successfully');
    
  } catch (err) {
    console.error('Error seeding ME reports:', err);
  } finally {
    await client.end();
  }
}

// Run the seeding
if (require.main === module) {
  seedMeReports();
}

module.exports = seedMeReports;