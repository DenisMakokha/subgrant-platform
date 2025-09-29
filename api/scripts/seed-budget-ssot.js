const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Sample data for seeding
const budgetTemplates = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Standard Grant Budget',
    description: 'Standard budget template for grant-funded projects',
    rules_json: JSON.stringify({
      "maxTotalAmount": 100000,
      "requiredCategories": ["Personnel", "Travel", "Equipment", "Supplies"],
      "categoryLimits": {
        "Personnel": 0.6,
        "Travel": 0.1,
        "Equipment": 0.2,
        "Supplies": 0.1
      }
    }),
    version: 1,
    active: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Research Grant Budget',
    description: 'Budget template for research-focused grants',
    rules_json: JSON.stringify({
      "maxTotalAmount": 500000,
      "requiredCategories": ["Personnel", "Equipment", "Supplies", "Travel", "Indirect Costs"],
      "categoryLimits": {
        "Personnel": 0.5,
        "Equipment": 0.2,
        "Supplies": 0.1,
        "Travel": 0.1,
        "Indirect Costs": 0.1
      }
    }),
    version: 1,
    active: true
  }
];

const budgetLineCategories = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Personnel',
    description: 'Personnel costs including salaries and benefits',
    active: true
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Travel',
    description: 'Travel expenses for project activities',
    active: true
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Equipment',
    description: 'Equipment and technology purchases',
    active: true
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Supplies',
    description: 'Office supplies and materials',
    active: true
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    name: 'Indirect Costs',
    description: 'Indirect costs and overhead',
    active: true
  }
];

async function seedBudgetSSOT() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert budget templates
    for (const template of budgetTemplates) {
      const query = `
        INSERT INTO budget_templates (id, name, description, rules_json, version, active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          rules_json = EXCLUDED.rules_json,
          version = EXCLUDED.version,
          active = EXCLUDED.active,
          updated_at = NOW()
      `;
      
      await client.query(query, [
        template.id,
        template.name,
        template.description,
        template.rules_json,
        template.version,
        template.active
      ]);
      
      console.log(`Inserted/Updated budget template: ${template.name}`);
    }
    
    // Insert budget line categories
    for (const category of budgetLineCategories) {
      const query = `
        INSERT INTO budget_line_categories (id, name, description, active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          active = EXCLUDED.active,
          updated_at = NOW()
      `;
      
      await client.query(query, [
        category.id,
        category.name,
        category.description,
        category.active
      ]);
      
      console.log(`Inserted/Updated budget line category: ${category.name}`);
    }
    
    await client.query('COMMIT');
    console.log('Budget SSOT seed data inserted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding budget SSOT data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed function
seedBudgetSSOT()
  .then(() => {
    console.log('Budget SSOT seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Budget SSOT seeding failed:', error);
    process.exit(1);
  });