const db = require('../config/database');

async function fixFinancialAssessmentsConstraint() {
  try {
    console.log('Starting financial_assessments constraint fix...');
    
    // First, remove any duplicate records (keep the most recent one)
    console.log('Removing duplicate records...');
    await db.pool.query(`
      DELETE FROM financial_assessments 
      WHERE id NOT IN (
          SELECT DISTINCT ON (organization_id) id
          FROM financial_assessments 
          ORDER BY organization_id, updated_at DESC
      )
    `);
    
    // Add the unique constraint
    console.log('Adding unique constraint...');
    await db.pool.query(`
      ALTER TABLE financial_assessments 
      ADD CONSTRAINT unique_financial_assessment_org_id UNIQUE (organization_id)
    `);
    
    // Verify the constraint was added
    console.log('Verifying constraint...');
    const result = await db.pool.query(`
      SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'financial_assessments' 
          AND tc.constraint_type = 'UNIQUE'
    `);
    
    console.log('Unique constraints found:', result.rows);
    console.log('✅ Financial assessments constraint fix completed successfully!');
    
  } catch (error) {
    if (error.code === '23505' || error.message.includes('already exists')) {
      console.log('✅ Constraint already exists, no action needed');
    } else {
      console.error('❌ Error fixing financial assessments constraint:', error);
      throw error;
    }
  } finally {
    await db.pool.end();
  }
}

// Run the migration
fixFinancialAssessmentsConstraint()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
