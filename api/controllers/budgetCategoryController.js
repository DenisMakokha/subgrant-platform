const pool = require('../config/database');

/**
 * Create a new budget category
 */
exports.createCategory = async (req, res) => {
  try {
    const { project_id, name, description, cap_percentage, is_active } = req.body;

    // Validation
    if (!project_id || !name) {
      return res.status(400).json({ 
        error: 'Project ID and category name are required' 
      });
    }

    const query = `
      INSERT INTO budget_categories (project_id, name, description, cap_percentage, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      project_id,
      name,
      description || null,
      cap_percentage || null,
      is_active !== undefined ? is_active : true
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating budget category:', error);
    res.status(500).json({ 
      error: 'Failed to create budget category',
      details: error.message 
    });
  }
};

/**
 * Get all budget categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const query = `
      SELECT bc.*, p.name as project_name
      FROM budget_categories bc
      LEFT JOIN projects p ON bc.project_id = p.id
      ORDER BY bc.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching budget categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget categories',
      details: error.message 
    });
  }
};

/**
 * Get budget category by ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT bc.*, p.name as project_name
      FROM budget_categories bc
      LEFT JOIN projects p ON bc.project_id = p.id
      WHERE bc.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Budget category not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching budget category:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget category',
      details: error.message 
    });
  }
};

/**
 * Get budget categories by project ID
 */
exports.getCategoriesByProjectId = async (req, res) => {
  try {
    const { project_id } = req.params;

    const query = `
      SELECT *
      FROM budget_categories
      WHERE project_id = $1
      ORDER BY name ASC
    `;

    const result = await pool.query(query, [project_id]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching budget categories by project:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget categories',
      details: error.message 
    });
  }
};

/**
 * Get active budget categories by project ID
 */
exports.getActiveCategoriesByProjectId = async (req, res) => {
  try {
    const { project_id } = req.params;

    const query = `
      SELECT *
      FROM budget_categories
      WHERE project_id = $1 AND is_active = true
      ORDER BY name ASC
    `;

    const result = await pool.query(query, [project_id]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching active budget categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active budget categories',
      details: error.message 
    });
  }
};

/**
 * Update budget category
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, cap_percentage, is_active } = req.body;

    // Check if category exists
    const checkQuery = 'SELECT * FROM budget_categories WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Budget category not found' 
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (cap_percentage !== undefined) {
      updates.push(`cap_percentage = $${paramCount++}`);
      values.push(cap_percentage);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update' 
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE budget_categories
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating budget category:', error);
    res.status(500).json({ 
      error: 'Failed to update budget category',
      details: error.message 
    });
  }
};

/**
 * Delete budget category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const checkQuery = 'SELECT * FROM budget_categories WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Budget category not found' 
      });
    }

    // Check if category is being used in budget lines
    const usageQuery = `
      SELECT COUNT(*) as count 
      FROM partner_budget_lines 
      WHERE category = $1
    `;
    const usageResult = await pool.query(usageQuery, [checkResult.rows[0].name]);

    if (parseInt(usageResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete budget category that is being used in budget lines',
        usage_count: usageResult.rows[0].count
      });
    }

    // Delete the category
    const deleteQuery = 'DELETE FROM budget_categories WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Budget category deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting budget category:', error);
    res.status(500).json({ 
      error: 'Failed to delete budget category',
      details: error.message 
    });
  }
};
