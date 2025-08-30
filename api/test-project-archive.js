const Project = require('./models/project');

async function testProjectArchive() {
  console.log('Testing Project Archive functionality...');
  
  try {
    // Test creating a project
    console.log('\n1. Testing project creation...');
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
    console.log('✓ Project created successfully');
    console.log('  Project ID:', project.id);
    console.log('  Project Name:', project.name);
    console.log('  Status:', project.status);
    
    // Test archiving a project
    console.log('\n2. Testing project archiving...');
    const archivedProject = await Project.archive(project.id);
    if (archivedProject) {
      console.log('✓ Project archived successfully');
      console.log('  Archived Project ID:', archivedProject.id);
      console.log('  Status:', archivedProject.status);
    } else {
      console.log('✗ Failed to archive project');
    }
    
    // Test retrieving archived projects
    console.log('\n3. Testing archived projects retrieval...');
    const archivedProjects = await Project.findArchived();
    console.log('✓ Archived projects retrieved successfully');
    console.log('  Total archived projects:', archivedProjects.length);
    
    // Test closing a project
    console.log('\n4. Testing project closing...');
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
    console.log('✓ Second project created successfully');
    
    const closedProject = await Project.close(project2.id);
    if (closedProject) {
      console.log('✓ Project closed successfully');
      console.log('  Closed Project ID:', closedProject.id);
      console.log('  Status:', closedProject.status);
    } else {
      console.log('✗ Failed to close project');
    }
    
    // Test retrieving closed projects
    console.log('\n5. Testing closed projects retrieval...');
    const closedProjects = await Project.findClosed();
    console.log('✓ Closed projects retrieved successfully');
    console.log('  Total closed projects:', closedProjects.length);
    
    // Test searching projects
    console.log('\n6. Testing project search...');
    const searchResults = await Project.search('Test Project');
    console.log('✓ Projects search completed');
    console.log('  Search results count:', searchResults.length);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testProjectArchive();