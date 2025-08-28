const Budget = require('../models/budget');
const BudgetLine = require('../models/budgetLine');
const Project = require('../models/project');
const Organization = require('../models/organization');
const auditLogger = require('../middleware/auditLogger');

// Create a new budget
exports.createBudget = async (req, res) => {
  try {
    const { organization_id, project_id, title, description, currency, budget_lines } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!organization_id || !project_id || !title) {
      return res.status(400).json({ 
        error: 'Organization ID, project ID, and title are required' 
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(organization_id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate total amount from budget lines
    let totalAmount = 0;
    if (budget_lines && Array.isArray(budget_lines)) {
      totalAmount = budget_lines.reduce((sum, line) => sum + (line.total_cost || 0), 0);
    }

    const budgetData = {
      organization_id,
      project_id,
      title,
      description: description || '',
      total_amount: totalAmount,
      currency: currency || 'USD',
      created_by: userId,
      updated_by: userId
    };

    const budget = await Budget.create(budgetData);
    
    // Create budget lines if provided
    if (budget_lines && Array.isArray(budget_lines)) {
      for (const line of budget_lines) {
        const lineData = {
          budget_id: budget.id,
          category_id: line.category_id,
          description: line.description,
          unit: line.unit || null,
          quantity: line.quantity || null,
          unit_cost: line.unit_cost || null,
          total_cost: line.total_cost,
          notes: line.notes || '',
          created_by: userId,
          updated_by: userId
        };
        
        await BudgetLine.create(lineData);
      }
    }
    
    // Get the created budget with its lines
    const createdBudget = await Budget.findById(budget.id);
    const budgetLines = await Budget.getBudgetLines(budget.id);
    
    // Log the budget creation
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'CREATE_BUDGET',
        entity_type: 'budget',
        entity_id: budget.id,
        before_state: null,
        after_state: {
          ...createdBudget,
          budget_lines: budgetLines
        },
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.status(201).json({
      ...createdBudget,
      budget_lines: budgetLines
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all budgets
exports.getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.findAll();
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget by ID
exports.getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Get budget lines for this budget
    const budgetLines = await Budget.getBudgetLines(id);
    
    res.json({
      ...budget,
      budget_lines: budgetLines
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budgets by organization ID
exports.getBudgetsByOrganizationId = async (req, res) => {
  try {
    const { organization_id } = req.params;
    
    // Check if organization exists
    const organization = await Organization.findById(organization_id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const budgets = await Budget.findByOrganizationId(organization_id);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets by organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budgets by project ID
exports.getBudgetsByProjectId = async (req, res) => {
  try {
    const { project_id } = req.params;
    
    // Check if project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const budgets = await Budget.findByProjectId(project_id);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets by project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update budget
exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, currency, budget_lines } = req.body;
    const userId = req.user.id;

    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Calculate total amount from budget lines if provided
    let totalAmount = existingBudget.total_amount;
    if (budget_lines && Array.isArray(budget_lines)) {
      totalAmount = budget_lines.reduce((sum, line) => sum + (line.total_cost || 0), 0);
    }

    const budgetData = {
      title: title || existingBudget.title,
      description: description !== undefined ? description : existingBudget.description,
      currency: currency || existingBudget.currency,
      total_amount: totalAmount,
      updated_by: userId
    };

    const budget = await Budget.update(id, budgetData);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Update budget lines if provided
    if (budget_lines && Array.isArray(budget_lines)) {
      // Delete existing budget lines
      await BudgetLine.deleteByBudgetId(id);
      
      // Create new budget lines
      for (const line of budget_lines) {
        const lineData = {
          budget_id: id,
          category_id: line.category_id,
          description: line.description,
          unit: line.unit || null,
          quantity: line.quantity || null,
          unit_cost: line.unit_cost || null,
          total_cost: line.total_cost,
          notes: line.notes || '',
          created_by: userId,
          updated_by: userId
        };
        
        await BudgetLine.create(lineData);
      }
    }
    
    // Get the updated budget with its lines
    const updatedBudget = await Budget.findById(id);
    const budgetLines = await Budget.getBudgetLines(id);
    
    // Log the budget update
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'UPDATE_BUDGET',
        entity_type: 'budget',
        entity_id: id,
        before_state: existingBudget,
        after_state: {
          ...updatedBudget,
          budget_lines: budgetLines
        },
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.json({
      ...updatedBudget,
      budget_lines: budgetLines
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Delete budget lines first
    await BudgetLine.deleteByBudgetId(id);
    
    const budget = await Budget.delete(id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Log the budget deletion
    try {
      await auditLogger.create({
        actor_id: req.user.id,
        action: 'DELETE_BUDGET',
        entity_type: 'budget',
        entity_id: id,
        before_state: existingBudget,
        after_state: null,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit budget for approval
exports.submitBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in draft status
    if (existingBudget.status !== 'draft') {
      return res.status(400).json({ error: 'Budget must be in draft status to submit' });
    }
    
    const budget = await Budget.submit(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Log the budget submission
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'SUBMIT_BUDGET',
        entity_type: 'budget',
        entity_id: id,
        before_state: existingBudget,
        after_state: budget,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error submitting budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request revisions for budget
exports.requestRevisions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in submitted status
    if (existingBudget.status !== 'submitted') {
      return res.status(400).json({ error: 'Budget must be in submitted status to request revisions' });
    }
    
    const budget = await Budget.requestRevisions(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Log the budget revision request
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'REQUEST_BUDGET_REVISIONS',
        entity_type: 'budget',
        entity_id: id,
        before_state: existingBudget,
        after_state: budget,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error requesting revisions for budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve budget
exports.approveBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in submitted status
    if (existingBudget.status !== 'submitted') {
      return res.status(400).json({ error: 'Budget must be in submitted status to approve' });
    }
    
    const budget = await Budget.approve(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Log the budget approval
    try {
      await auditLogger.create({
        actor_id: userId,
        action: 'APPROVE_BUDGET',
        entity_type: 'budget',
        entity_id: id,
        before_state: existingBudget,
        after_state: budget,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error approving budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budgets by status
exports.getBudgetsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const budgets = await Budget.findByStatus(status);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets by status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};