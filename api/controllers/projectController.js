const Project = require('../models/project');
const BudgetCategory = require('../models/budgetCategory');
const auditLogger = require('../middleware/auditLogger');
const logger = require('../utils/logger');

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, open_date, close_date, currency } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !open_date || !close_date) {
      return res.status(400).json({ 
        error: 'Name, open_date, and close_date are required' 
      });
    }

    // Validate date order
    if (new Date(close_date) <= new Date(open_date)) {
      return res.status(400).json({ 
        error: 'Close date must be after open date' 
      });
    }

    const projectData = {
      name,
      description: description || '',
      open_date,
      close_date,
      currency: currency || 'USD',
      created_by: userId,
      updated_by: userId
    };

    const project = await Project.create(projectData);
    
    // Log the project creation
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'CREATE_PROJECT',
        entity_type: 'project',
        entity_id: project.id,
        before_state: null,
        after_state: project,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Error creating audit log:', auditError);
    }
    
    res.status(201).json(project);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get budget categories for this project
    const categories = await Project.getBudgetCategories(id);
    
    res.json({
      ...project,
      budget_categories: categories
    });
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, open_date, close_date, currency, status } = req.body;
    const userId = req.user.id;

    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate date order if both dates are provided
    if (open_date && close_date && new Date(close_date) <= new Date(open_date)) {
      return res.status(400).json({ 
        error: 'Close date must be after open date' 
      });
    }

    const projectData = {
      name: name || existingProject.name,
      description: description !== undefined ? description : existingProject.description,
      open_date: open_date || existingProject.open_date,
      close_date: close_date || existingProject.close_date,
      currency: currency || existingProject.currency,
      status: status || existingProject.status,
      updated_by: userId
    };

    const project = await Project.update(id, projectData);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Log the project update
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'UPDATE_PROJECT',
        entity_type: 'project',
        entity_id: id,
        before_state: existingProject,
        after_state: project,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Error creating audit log:', auditError);
    }
    
    res.json(project);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = await Project.delete(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Log the project deletion
    try {
      await auditLogger.create({
        actor_id: req.user.id,
        action: 'DELETE_PROJECT',
        entity_type: 'project',
        entity_id: id,
        before_state: existingProject,
        after_state: null,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Error creating audit log:', auditError);
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get projects by status
exports.getProjectsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const projects = await Project.findByStatus(status);
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects by status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add budget category to project
exports.addBudgetCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, cap_amount, cap_percentage, is_active } = req.body;
    const userId = req.user.id;

    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        error: 'Name is required' 
      });
    }

    const categoryData = {
      project_id: id,
      name,
      description: description || '',
      cap_amount: cap_amount || null,
      cap_percentage: cap_percentage || null,
      is_active: is_active !== undefined ? is_active : true,
      created_by: userId,
      updated_by: userId
    };

    const category = await BudgetCategory.create(categoryData);
    
    // Log the budget category creation
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'CREATE_BUDGET_CATEGORY',
        entity_type: 'budget_category',
        entity_id: category.id,
        before_state: null,
        after_state: category,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Error creating audit log:', auditError);
    }
    
    res.status(201).json(category);
  } catch (error) {
    logger.error('Error adding budget category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget categories for project
exports.getProjectBudgetCategories = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const categories = await Project.getBudgetCategories(id);
    res.json(categories);
  } catch (error) {
    logger.error('Error fetching budget categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Archive a project
exports.archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if project is already archived
    if (existingProject.status === 'archived') {
      return res.status(400).json({ error: 'Project is already archived' });
    }
    
    // Archive the project
    const project = await Project.archive(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Log the project archiving
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'ARCHIVE_PROJECT',
        entity_type: 'project',
        entity_id: id,
        before_state: existingProject,
        after_state: project,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Error creating audit log:', auditError);
    }
    
    res.json({ message: 'Project archived successfully', project });
  } catch (error) {
    logger.error('Error archiving project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Close a project
exports.closeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if project is already closed or archived
    if (existingProject.status === 'closed' || existingProject.status === 'archived') {
      return res.status(400).json({ error: 'Project is already closed or archived' });
    }
    
    // Close the project
    const project = await Project.close(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Log the project closing
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'CLOSE_PROJECT',
        entity_type: 'project',
        entity_id: id,
        before_state: existingProject,
        after_state: project,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      logger.error('Error creating audit log:', auditError);
    }
    
    res.json({ message: 'Project closed successfully', project });
  } catch (error) {
    logger.error('Error closing project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get archived projects
exports.getArchivedProjects = async (req, res) => {
  try {
    const projects = await Project.findArchived();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching archived projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get closed projects
exports.getClosedProjects = async (req, res) => {
  try {
    const projects = await Project.findClosed();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching closed projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search projects
exports.searchProjects = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const projects = await Project.search(q);
    res.json(projects);
  } catch (error) {
    logger.error('Error searching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};