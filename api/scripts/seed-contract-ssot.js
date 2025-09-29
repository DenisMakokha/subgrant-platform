const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Sample data for seeding
const contractTemplates = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Standard Grant Agreement',
    description: 'Standard contract template for grant-funded projects',
    docx_template_key: 'templates/standard-grant-agreement.docx',
    merge_fields_json: JSON.stringify({
      "fields": [
        "project_title",
        "recipient_name",
        "recipient_address",
        "grant_amount",
        "start_date",
        "end_date",
        "project_description",
        "reporting_requirements"
      ]
    }),
    version: 1,
    active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Research Grant Agreement',
    description: 'Contract template for research-focused grants',
    docx_template_key: 'templates/research-grant-agreement.docx',
    merge_fields_json: JSON.stringify({
      "fields": [
        "project_title",
        "principal_investigator",
        "institution_name",
        "institution_address",
        "grant_amount",
        "start_date",
        "end_date",
        "research_objectives",
        "deliverables",
        "reporting_requirements"
      ]
    }),
    version: 1,
    active: true
  }
];

async function seedContractSSOT() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert contract templates
    for (const template of contractTemplates) {
      const query = `
        INSERT INTO contract_templates (id, name, description, docx_template_key, merge_fields_json, version, active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          docx_template_key = EXCLUDED.docx_template_key,
          merge_fields_json = EXCLUDED.merge_fields_json,
          version = EXCLUDED.version,
          active = EXCLUDED.active,
          updated_at = NOW()
      `;
      
      await client.query(query, [
        template.id,
        template.name,
        template.description,
        template.docx_template_key,
        template.merge_fields_json,
        template.version,
        template.active
      ]);
      
      console.log(`Inserted/Updated contract template: ${template.name}`);
    }
    
    await client.query('COMMIT');
    console.log('Contract SSOT seed data inserted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding contract SSOT data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed function
seedContractSSOT()
  .then(() => {
    console.log('Contract SSOT seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Contract SSOT seeding failed:', error);
    process.exit(1);
  });