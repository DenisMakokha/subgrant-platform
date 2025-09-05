const BudgetCategory = require('../models/budgetCategory');

// Create a new budget category
exports.createCategory = async (req, res) => {
  try {
    const { project_id, name, description, cap_amount, cap_percentage, is_active } = req.body;
    const userId = req.user?.sub || req.user?.id || null;

    console.log('Request body:', req.body);
    console.log('User from request:', req.user);
    console.log('User ID:', userId);

    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        error: 'Name is required' 
      });
    }

    const categoryData = {
      project_id,
      name,
      description: description || '',
      cap_amount: cap_amount || null,
      cap_percentage: cap_percentage || null,
      is_active: is_active !== undefined ? is_active : true,
      created_by: userId,
      updated_by: userId
    };

    const category = await BudgetCategory.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating budget category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all budget categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await BudgetCategory.findAll();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching budget categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await BudgetCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Budget category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching budget category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget categories by project ID
exports.getCategoriesByProjectId = async (req, res) => {
  try {
    const { project_id } = req.params;
    const categories = await BudgetCategory.findByProjectId(project_id);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching budget categories by project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active budget categories by project ID
exports.getActiveCategoriesByProjectId = async (req, res) => {
  try {
    const { project_id } = req.params;
    const categories = await BudgetCategory.findActiveByProjectId(project_id);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching active budget categories by project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update budget category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, cap_amount, cap_percentage, is_active } = req.body;
    const userId = req.user.id;

    // Check if category exists
    const existingCategory = await BudgetCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Budget category not found' });
    }

    const categoryData = {
      name: name || existingCategory.name,
      description: description !== undefined ? description : existingCategory.description,
      cap_amount: cap_amount !== undefined ? cap_amount : existingCategory.cap_amount,
      cap_percentage: cap_percentage !== undefined ? cap_percentage : existingCategory.cap_percentage,
      is_active: is_active !== undefined ? is_active : existingCategory.is_active,
      updated_by: userId
    };

    const category = await BudgetCategory.update(id, categoryData);
    if (!category) {
      return res.status(404).json({ error: 'Budget category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error updating budget category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete budget category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const existingCategory = await BudgetCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Budget category not found' });
    }
    
    const category = await BudgetCategory.delete(id);
    if (!category) {
      return res.status(404).json({ error: 'Budget category not found' });
    }
    
    res.json({ message: 'Budget category deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};