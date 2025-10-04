const db = require('../config/database');
const logger = require('../utils/logger');

async function seedSectionCDocuments() {
  try {
    logger.info('Starting Section C document requirements seeding...');
    
    // Clear existing document requirements
    logger.info('Clearing existing document requirements...');
    await db.pool.query('DELETE FROM document_requirements');
    
    // Insert the complete document requirements list
    logger.info('Inserting complete document requirements...');
    
    const documents = [
      // LEGAL DOCUMENTS
      {
        code: 'CERT_REG_INCORP',
        name: 'Certificate of Registration/Incorporation',
        title: 'Certificate of Registration/Incorporation',
        description: 'Official document proving legal registration or incorporation of the organization',
        category: 'legal',
        is_required: true,
        is_optional: false,
        sort_order: 1
      },
      {
        code: 'CONSTITUTION_AOA',
        name: 'Constitution/Articles of Association',
        title: 'Constitution/Articles of Association',
        description: 'Founding documents outlining the organization\'s purpose, structure, and governance',
        category: 'legal',
        is_required: true,
        is_optional: false,
        sort_order: 2
      },
      {
        code: 'TAX_REG_CERT',
        name: 'Tax Registration Certificate',
        title: 'Tax Registration Certificate',
        description: 'Certificate showing the organization is registered with tax authorities',
        category: 'legal',
        is_required: true,
        is_optional: false,
        sort_order: 3
      },
      {
        code: 'TAX_EXEMPT_CERT',
        name: 'Tax Exemption Certificate',
        title: 'Tax Exemption Certificate',
        description: 'Document proving tax-exempt status (if applicable)',
        category: 'legal',
        is_required: false,
        is_optional: true,
        sort_order: 4
      },
      {
        code: 'BUSINESS_LICENSE',
        name: 'Current Business/Operating License',
        title: 'Current Business/Operating License',
        description: 'Valid license to operate in your jurisdiction',
        category: 'legal',
        is_required: true,
        is_optional: false,
        sort_order: 5
      },
      
      // GOVERNANCE
      {
        code: 'BOARD_LIST_CVS',
        name: 'Current Board of Directors List with CVs',
        title: 'Current Board of Directors List with CVs',
        description: 'Complete list of current board members with their curriculum vitae',
        category: 'governance',
        is_required: true,
        is_optional: false,
        sort_order: 6
      },
      {
        code: 'ORG_CHART',
        name: 'Organizational Chart',
        title: 'Organizational Chart',
        description: 'Visual representation of the organization\'s structure and reporting lines',
        category: 'governance',
        is_required: true,
        is_optional: false,
        sort_order: 7
      },
      {
        code: 'BOARD_CHARTER',
        name: 'Board Charter/Governance Policy',
        title: 'Board Charter/Governance Policy',
        description: 'Document outlining board responsibilities and governance procedures',
        category: 'governance',
        is_required: true,
        is_optional: false,
        sort_order: 8
      },
      
      // FINANCIAL
      {
        code: 'AUDITED_FINANCIALS',
        name: 'Audited Financial Statements (last 2 years)',
        title: 'Audited Financial Statements (last 2 years)',
        description: 'Independently audited financial statements for the most recent two years',
        category: 'financial',
        is_required: true,
        is_optional: false,
        sort_order: 9
      },
      {
        code: 'CURRENT_BUDGET',
        name: 'Current Year Budget',
        title: 'Current Year Budget',
        description: 'Approved budget for the current financial year',
        category: 'financial',
        is_required: true,
        is_optional: false,
        sort_order: 10
      },
      {
        code: 'FINANCIAL_POLICIES',
        name: 'Financial Policies and Procedures Manual',
        title: 'Financial Policies and Procedures Manual',
        description: 'Comprehensive manual outlining financial management policies and procedures',
        category: 'financial',
        is_required: true,
        is_optional: false,
        sort_order: 11
      },
      
      // OPERATIONAL
      {
        code: 'STRATEGIC_PLAN',
        name: 'Current Strategic Plan',
        title: 'Current Strategic Plan',
        description: 'Organization\'s current strategic plan outlining goals and objectives',
        category: 'operational',
        is_required: true,
        is_optional: false,
        sort_order: 12
      },
      {
        code: 'ANNUAL_REPORTS',
        name: 'Annual Reports (last 2 years)',
        title: 'Annual Reports (last 2 years)',
        description: 'Annual reports for the most recent two years',
        category: 'operational',
        is_required: true,
        is_optional: false,
        sort_order: 13
      },
      
      // COMPLIANCE
      {
        code: 'CHILD_PROTECTION',
        name: 'Child Protection Policy and Procedures',
        title: 'Child Protection Policy and Procedures',
        description: 'Comprehensive policy and procedures for child protection and safeguarding',
        category: 'compliance',
        is_required: true,
        is_optional: false,
        sort_order: 14
      },
      {
        code: 'ANTI_CORRUPTION',
        name: 'Anti-Corruption and Ethics Policy',
        title: 'Anti-Corruption and Ethics Policy',
        description: 'Policy outlining anti-corruption measures and ethical standards',
        category: 'compliance',
        is_required: true,
        is_optional: false,
        sort_order: 15
      },
      {
        code: 'CODE_OF_CONDUCT',
        name: 'Code of Conduct for Staff',
        title: 'Code of Conduct for Staff',
        description: 'Code of conduct and behavioral expectations for all staff members',
        category: 'compliance',
        is_required: true,
        is_optional: false,
        sort_order: 16
      },
      {
        code: 'GENDER_INCLUSION',
        name: 'Gender and Inclusion Policy',
        title: 'Gender and Inclusion Policy',
        description: 'Policy promoting gender equality and inclusive practices',
        category: 'compliance',
        is_required: true,
        is_optional: false,
        sort_order: 17
      },
      {
        code: 'DATA_PROTECTION',
        name: 'Data Protection and Privacy Policy',
        title: 'Data Protection and Privacy Policy',
        description: 'Policy governing data protection, privacy, and information security',
        category: 'compliance',
        is_required: true,
        is_optional: false,
        sort_order: 18
      },
      {
        code: 'HR_POLICY',
        name: 'Human Resource Policy',
        title: 'Human Resource Policy',
        description: 'Comprehensive human resource management policy',
        category: 'compliance',
        is_required: true,
        is_optional: false,
        sort_order: 19
      },
      
      // ADDITIONAL
      {
        code: 'ADDITIONAL_DOCS',
        name: 'Additional Important Documents',
        title: 'Additional Important Documents',
        description: 'Any additional documents you feel are important and not included in this checklist',
        category: 'additional',
        is_required: false,
        is_optional: true,
        sort_order: 20
      }
    ];
    
    // Insert all documents
    for (const doc of documents) {
      await db.pool.query(`
        INSERT INTO document_requirements (
          code, name, title, description, category, 
          is_required, is_optional, is_active, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        doc.code, doc.name, doc.title, doc.description, doc.category,
        doc.is_required, doc.is_optional, true, doc.sort_order
      ]);
    }
    
    // Verify the results
    const countResult = await db.pool.query('SELECT COUNT(*) FROM document_requirements');
    logger.info(`✅ Successfully inserted ${countResult.rows[0].count} document requirements`);
    
    // Show breakdown by category
    const categoryBreakdown = await db.pool.query(`
      SELECT category, COUNT(*) as count 
      FROM document_requirements 
      GROUP BY category 
      ORDER BY category
    `);
    
    logger.info('\nDocument requirements by category:');
    categoryBreakdown.rows.forEach(row => {
      logger.info(`  ${row.category}: ${row.count} documents`);
    });
    
    logger.info('\n✅ Section C document requirements seeding completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error seeding Section C documents:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

// Run the seeding
seedSectionCDocuments()
  .then(() => {
    logger.info('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
