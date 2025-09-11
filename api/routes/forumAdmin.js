const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to verify JWT token and admin role
const verifyAdminToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Check if user is admin (you may need to adjust this based on your user model)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Get all forum categories
router.get('/categories', verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM forum_categories ORDER BY order_index ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new forum category
router.post('/categories', verifyAdminToken, async (req, res) => {
  try {
    const { name, slug, description, visibility = 'public', order_index } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const result = await pool.query(
      `INSERT INTO forum_categories (name, slug, description, visibility, order_index, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slug, description, visibility, order_index || 999, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating forum category:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Category slug already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update forum category
router.put('/categories/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, visibility, order_index } = req.body;
    
    const result = await pool.query(
      `UPDATE forum_categories 
       SET name = $1, slug = $2, description = $3, visibility = $4, order_index = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, slug, description, visibility, order_index, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating forum category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete forum category
router.delete('/categories/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM forum_categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all forum tags
router.get('/tags', verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forum_tags ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching forum tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new forum tag
router.post('/tags', verifyAdminToken, async (req, res) => {
  try {
    const { name, slug, description, color = '#3B82F6' } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const result = await pool.query(
      `INSERT INTO forum_tags (name, slug, description, color, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description, color, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating forum tag:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Tag slug already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update forum tag
router.put('/tags/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color } = req.body;
    
    const result = await pool.query(
      `UPDATE forum_tags 
       SET name = $1, slug = $2, description = $3, color = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, slug, description, color, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating forum tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete forum tag
router.delete('/tags/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM forum_tags WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize default forum data
router.post('/initialize', verifyAdminToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert default categories
      const categories = [
        { name: 'General Discussion', slug: 'general', description: 'General discussions about grants management', order_index: 1 },
        { name: 'Grant Management', slug: 'grants', description: 'Grant applications, budgeting, and financial management', order_index: 2 },
        { name: 'Partner & Contract Management', slug: 'partners-contracts', description: 'Partner onboarding, contracts, and compliance topics', order_index: 3 },
        { name: 'Monitoring & Reporting', slug: 'monitoring-reporting', description: 'M&E reports, KPI tracking, and progress monitoring', order_index: 4 },
        { name: 'Technical Support', slug: 'support', description: 'Get help with platform technical issues', order_index: 5 },
        { name: 'Announcements', slug: 'announcements', description: 'Official announcements and platform updates', order_index: 6 }
      ];
      
      for (const category of categories) {
        await client.query(
          `INSERT INTO forum_categories (name, slug, description, visibility, order_index, created_by) 
           VALUES ($1, $2, $3, 'public', $4, $5) ON CONFLICT (slug) DO NOTHING`,
          [category.name, category.slug, category.description, category.order_index, req.user.id]
        );
      }
      
      // Insert default tags
      const tags = [
        { name: 'grants', slug: 'grants', description: 'Topics related to grant management', color: '#3B82F6' },
        { name: 'applications', slug: 'applications', description: 'Grant application processes', color: '#10B981' },
        { name: 'budgeting', slug: 'budgeting', description: 'Budget planning and management', color: '#F59E0B' },
        { name: 'reporting', slug: 'reporting', description: 'Financial and progress reporting', color: '#8B5CF6' },
        { name: 'compliance', slug: 'compliance', description: 'Regulatory and policy compliance', color: '#EF4444' },
        { name: 'partnerships', slug: 'partnerships', description: 'Partner management and onboarding', color: '#06B6D4' },
        { name: 'contracts', slug: 'contracts', description: 'Contract management and signing', color: '#84CC16' },
        { name: 'disbursements', slug: 'disbursements', description: 'Fund disbursement processes', color: '#F97316' },
        { name: 'monitoring', slug: 'monitoring', description: 'Project monitoring and evaluation', color: '#A855F7' },
        { name: 'kpi', slug: 'kpi', description: 'Key Performance Indicators', color: '#22C55E' },
        { name: 'training', slug: 'training', description: 'Training and capacity building', color: '#6366F1' },
        { name: 'documentation', slug: 'documentation', description: 'Documentation and guides', color: '#8B5A2B' },
        { name: 'best-practices', slug: 'best-practices', description: 'Best practices and lessons learned', color: '#059669' },
        { name: 'technical-support', slug: 'technical-support', description: 'Platform technical issues', color: '#DC2626' },
        { name: 'platform-updates', slug: 'platform-updates', description: 'Platform updates and announcements', color: '#9B56A2' },
        { name: 'sub-grants', slug: 'sub-grants', description: 'Sub-grant management', color: '#52944E' }
      ];
      
      for (const tag of tags) {
        await client.query(
          `INSERT INTO forum_tags (name, slug, description, color, created_by) 
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING`,
          [tag.name, tag.slug, tag.description, tag.color, req.user.id]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Forum data initialized successfully' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error initializing forum data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
