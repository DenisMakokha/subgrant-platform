const BudgetLine = require('../models/budgetLine');
const Budget = require('../models/budget');

// Create a new budget line
exports.createBudgetLine = async (req, res) => {
  try {
    const { budget_id, category_id, description, unit, quantity, unit_cost, total_cost, notes } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!budget_id || !category_id || !description || !total_cost) {
      return res.status(400).json({ 
        error: 'Budget ID, category ID, description, and total cost are required' 
      });
    }

    // Check if budget exists
    const budget = await Budget.findById(budget_id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const lineData = {
      budget_id,
      category_id,
      description,
      unit: unit || null,
      quantity: quantity || null,
      unit_cost: unit_cost || null,
      total_cost,
      notes: notes || '',
      created_by: userId,
      updated_by: userId
    };

    const budgetLine = await BudgetLine.create(lineData);
    res.status(201).json(budgetLine);
  } catch (error) {
    console.error('Error creating budget line:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all budget lines
exports.getAllBudgetLines = async (req, res) => {
  try {
    const budgetLines = await BudgetLine.findAll();
    res.json(budgetLines);
  } catch (error) {
    console.error('Error fetching budget lines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget line by ID
exports.getBudgetLineById = async (req, res) => {
  try {
    const { id } = req.params;
    const budgetLine = await BudgetLine.findById(id);
    
    if (!budgetLine) {
      return res.status(404).json({ error: 'Budget line not found' });
    }
    
    res.json(budgetLine);
  } catch (error) {
    console.error('Error fetching budget line:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget lines by budget ID
exports.getBudgetLinesByBudgetId = async (req, res) => {
  try {
    const { budget_id } = req.params;
    
    // Check if budget exists
    const budget = await Budget.findById(budget_id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budgetLines = await BudgetLine.findByBudgetId(budget_id);
    res.json(budgetLines);
  } catch (error) {
    console.error('Error fetching budget lines by budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update budget line
exports.updateBudgetLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, unit, quantity, unit_cost, total_cost, notes } = req.body;
    const userId = req.user.id;

    // Check if budget line exists
    const existingBudgetLine = await BudgetLine.findById(id);
    if (!existingBudgetLine) {
      return res.status(404).json({ error: 'Budget line not found' });
    }

    const lineData = {
      description: description || existingBudgetLine.description,
      unit: unit !== undefined ? unit : existingBudgetLine.unit,
      quantity: quantity !== undefined ? quantity : existingBudgetLine.quantity,
      unit_cost: unit_cost !== undefined ? unit_cost : existingBudgetLine.unit_cost,
      total_cost: total_cost || existingBudgetLine.total_cost,
      notes: notes !== undefined ? notes : existingBudgetLine.notes,
      updated_by: userId
    };

    const budgetLine = await BudgetLine.update(id, lineData);
    if (!budgetLine) {
      return res.status(404).json({ error: 'Budget line not found' });
    }
    
    res.json(budgetLine);
  } catch (error) {
    console.error('Error updating budget line:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete budget line
exports.deleteBudgetLine = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if budget line exists
    const existingBudgetLine = await BudgetLine.findById(id);
    if (!existingBudgetLine) {
      return res.status(404).json({ error: 'Budget line not found' });
    }
    
    const budgetLine = await BudgetLine.delete(id);
    if (!budgetLine) {
      return res.status(404).json({ error: 'Budget line not found' });
    }
    
    res.json({ message: 'Budget line deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget line:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};