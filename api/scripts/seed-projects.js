const logger = require('../utils/logger');

// Seed script to create sample projects for testing
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

// Sample projects to create
const sampleProjects = [
  {
    name: 'Education Access Initiative',
    description: 'Improving access to quality education in rural communities through infrastructure development and teacher training programs.',
    open_date: '2024-01-15',
    close_date: '2025-12-31',
    currency: 'USD',
    status: 'active'
  },
  {
    name: 'Healthcare Infrastructure Project',
    description: 'Building and equipping healthcare facilities to serve underserved populations in remote areas.',
    open_date: '2024-03-01',
    close_date: '2026-02-28',
    currency: 'USD',
    status: 'active'
  },
  {
    name: 'Clean Water Access Program',
    description: 'Installing water purification systems and drilling wells to provide clean drinking water to communities.',
    open_date: '2024-02-01',
    close_date: '2025-08-31',
    currency: 'USD',
    status: 'planning'
  },
  {
    name: 'Agricultural Development Initiative',
    description: 'Supporting smallholder farmers with modern farming techniques, seeds, and equipment to improve food security.',
    open_date: '2024-04-01',
    close_date: '2025-10-31',
    currency: 'USD',
    status: 'draft'
  }
];

// Sample budget categories for projects
const sampleBudgetCategories = [
  { name: 'Personnel', description: 'Staff salaries and benefits', cap_percentage: 40.00 },
  { name: 'Equipment', description: 'Machinery, tools, and technology', cap_percentage: 25.00 },
  { name: 'Training', description: 'Capacity building and education programs', cap_percentage: 15.00 },
  { name: 'Operations', description: 'Day-to-day operational expenses', cap_percentage: 15.00 },
  { name: 'Administration', description: 'Administrative and overhead costs', cap_percentage: 5.00 }
];

// Function to create a project
async function createProject(projectData, createdBy) {
  try {
    const insertQuery = `
      INSERT INTO projects (
        name, description, open_date, close_date, currency, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name;
    `;
    
    const values = [
      projectData.name,
      projectData.description,
      projectData.open_date,
      projectData.close_date,
      projectData.currency,
      projectData.status,
      createdBy
    ];
    
    const result = await client.query(insertQuery, values);
    logger.info(`✓ Created project: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    return result.rows[0].id;
    
  } catch (error) {
    logger.error(`✗ Error creating project ${projectData.name}:`, error.message);
    return null;
  }
}

// Function to create budget categories for a project
async function createBudgetCategories(projectId, createdBy) {
  try {
    for (const category of sampleBudgetCategories) {
      const insertQuery = `
        INSERT INTO budget_categories (
          project_id, name, description, cap_percentage, created_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name;
      `;
      
      const values = [
        projectId,
        category.name,
        category.description,
        category.cap_percentage,
        createdBy
      ];
      
      const result = await client.query(insertQuery, values);
      logger.info(`  ✓ Created budget category: ${result.rows[0].name}`);
    }
  } catch (error) {
    logger.error(`✗ Error creating budget categories for project ${projectId}:`, error.message);
  }
}

// Main function to seed projects
async function seedProjects() {
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to the database');

    // Get the admin user ID to use as creator
    const userQuery = 'SELECT id FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, ['admin@test.com']);
    
    if (userResult.rows.length === 0) {
      logger.error('Admin user not found. Please run seed-users.js first.');
      return;
    }
    
    const adminUserId = userResult.rows[0].id;
    logger.info(`Using admin user ID: ${adminUserId}`);

    // Check if projects already exist
    const existingProjectsQuery = 'SELECT COUNT(*) as count FROM projects';
    const existingResult = await client.query(existingProjectsQuery);
    const existingCount = parseInt(existingResult.rows[0].count);
    
    if (existingCount > 0) {
      logger.info(`Found ${existingCount} existing projects. Skipping project creation.`);
      return;
    }

    // Create sample projects
    logger.info('Creating sample projects...');
    for (const projectData of sampleProjects) {
      const projectId = await createProject(projectData, adminUserId);
      if (projectId) {
        await createBudgetCategories(projectId, adminUserId);
      }
    }

    logger.info('Project seeding completed successfully');
  } catch (err) {
    logger.error('Error seeding projects:', err);
  } finally {
    await client.end();
  }
}

// Run the seeding
seedProjects();
