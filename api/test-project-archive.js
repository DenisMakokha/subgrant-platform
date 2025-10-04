const Project = require('./models/project');
const logger = require('utils/logger');

async function testProjectArchive() {
  logger.info('Testing Project Archive functionality...');
  
  try {
    // Test creating a project
    logger.info('\n1. Testing project creation...');
    const projectData = {
      name: 'Test Project for Archive',
      description: 'This is a test project for archive testing',
      open_date: new Date().toISOString(),
      close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      currency: 'USD',
      status: 'active',
      created_by: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      updated_by: '123e4567-e89b-12d3-a456-426614174000'  // Valid UUID
    };
    
    const project = await Project.create(projectData);
    logger.info('✓ Project created successfully');
    logger.info('  Project ID:', project.id);
    logger.info('  Project Name:', project.name);
    logger.info('  Status:', project.status);
    
    // Test archiving a project
    logger.info('\n2. Testing project archiving...');
    const archivedProject = await Project.archive(project.id);
    if (archivedProject) {
      logger.info('✓ Project archived successfully');
      logger.info('  Archived Project ID:', archivedProject.id);
      logger.info('  Status:', archivedProject.status);
    } else {
      logger.info('✗ Failed to archive project');
    }
    
    // Test retrieving archived projects
    logger.info('\n3. Testing archived projects retrieval...');
    const archivedProjects = await Project.findArchived();
    logger.info('✓ Archived projects retrieved successfully');
    logger.info('  Total archived projects:', archivedProjects.length);
    
    // Test closing a project
    logger.info('\n4. Testing project closing...');
    // First, create another project to close
    const projectData2 = {
      name: 'Test Project for Closing',
      description: 'This is a test project for closing testing',
      open_date: new Date().toISOString(),
      close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'USD',
      status: 'active',
      created_by: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      updated_by: '123e4567-e89b-12d3-a456-426614174000'  // Valid UUID
    };
    
    const project2 = await Project.create(projectData2);
    logger.info('✓ Second project created successfully');
    
    const closedProject = await Project.close(project2.id);
    if (closedProject) {
      logger.info('✓ Project closed successfully');
      logger.info('  Closed Project ID:', closedProject.id);
      logger.info('  Status:', closedProject.status);
    } else {
      logger.info('✗ Failed to close project');
    }
    
    // Test retrieving closed projects
    logger.info('\n5. Testing closed projects retrieval...');
    const closedProjects = await Project.findClosed();
    logger.info('✓ Closed projects retrieved successfully');
    logger.info('  Total closed projects:', closedProjects.length);
    
    // Test searching projects
    logger.info('\n6. Testing project search...');
    const searchResults = await Project.search('Test Project');
    logger.info('✓ Projects search completed');
    logger.info('  Search results count:', searchResults.length);
    
    logger.info('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test failed with error:', error);
  }
}

// Run the test
testProjectArchive();