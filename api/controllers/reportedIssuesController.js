const db = require('../config/database');

/**
 * Reported Issues SSOT Controller
 * Handles all operations for reported issues system
 */

// Get all reported issues (Admin sees all, users see only their own)
const getAllIssues = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.auth.sub || req.auth.user_id;
    const userRole = req.auth.role;

    let query = `
      SELECT 
        ri.*,
        u.email as reporter_email_db,
        u.first_name || ' ' || u.last_name as reporter_name_db,
        u.role as reporter_role_db,
        au.email as assigned_to_email,
        au.first_name || ' ' || au.last_name as assigned_to_name,
        (SELECT COUNT(*) FROM reported_issue_comments WHERE issue_id = ri.id) as comment_count
      FROM reported_issues ri
      LEFT JOIN users u ON ri.reported_by_user_id = u.id
      LEFT JOIN users au ON ri.assigned_to_user_id = au.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Non-admin users can only see their own issues
    if (userRole !== 'admin') {
      query += ` AND ri.reported_by_user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (status) {
      query += ` AND ri.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND ri.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (category) {
      query += ` AND ri.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY ri.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM reported_issues WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (priority) {
      countQuery += ` AND priority = $${countParamCount}`;
      countParams.push(priority);
      countParamCount++;
    }
    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }

    const countResult = await db.pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reported issues:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reported issues' });
  }
};

// Get single issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ri.*,
        u.email as reporter_email_db,
        u.first_name || ' ' || u.last_name as reporter_name_db,
        u.role as reporter_role_db,
        au.email as assigned_to_email,
        au.first_name || ' ' || au.last_name as assigned_to_name
      FROM reported_issues ri
      LEFT JOIN users u ON ri.reported_by_user_id = u.id
      LEFT JOIN users au ON ri.assigned_to_user_id = au.id
      WHERE ri.id = $1
    `;

    const result = await db.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    // Get comments
    const commentsQuery = `
      SELECT 
        c.*,
        u.email,
        u.first_name || ' ' || u.last_name as user_name,
        u.role
      FROM reported_issue_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.issue_id = $1
      ORDER BY c.created_at ASC
    `;

    const commentsResult = await db.pool.query(commentsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        comments: commentsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch issue' });
  }
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Create new issue (Any authenticated user)
const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority = 'medium',
      page_url,
      browser_info,
      screenshot_url,
      attachments = []
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and description are required' 
      });
    }

    // Validate title length
    if (title.length > 255) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title must be 255 characters or less' 
      });
    }

    // Validate category
    const validCategories = ['bug', 'feature_request', 'question', 'complaint', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid category' 
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid priority' 
      });
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);

    const userId = req.auth.sub || req.auth.user_id;

    // Get user info
    const userQuery = 'SELECT email, first_name, last_name, role FROM users WHERE id = $1';
    const userResult = await db.pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    const query = `
      INSERT INTO reported_issues (
        title, description, category, priority, status,
        reported_by_user_id, reporter_email, reporter_name, reporter_role,
        page_url, browser_info, screenshot_url, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      sanitizedTitle,
      sanitizedDescription,
      category,
      priority,
      'open',
      userId,
      user.email,
      `${user.first_name} ${user.last_name}`,
      user.role,
      page_url,
      browser_info,
      screenshot_url,
      JSON.stringify(attachments)
    ];

    const result = await db.pool.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Issue reported successfully'
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ success: false, error: 'Failed to create issue' });
  }
};

// Update issue (Admin only)
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assigned_to_user_id,
      admin_notes,
      resolution_notes
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;

      // Set resolved_at or closed_at timestamps
      if (status === 'resolved' || status === 'closed') {
        updates.push(`${status}_at = CURRENT_TIMESTAMP`);
      }
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }

    if (assigned_to_user_id !== undefined) {
      updates.push(`assigned_to_user_id = $${paramCount}`);
      values.push(assigned_to_user_id);
      paramCount++;
    }

    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${paramCount}`);
      values.push(sanitizeInput(admin_notes));
      paramCount++;
    }

    if (resolution_notes !== undefined) {
      updates.push(`resolution_notes = $${paramCount}`);
      values.push(sanitizeInput(resolution_notes));
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No updates provided' });
    }

    values.push(id);
    const query = `
      UPDATE reported_issues 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Issue updated successfully'
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ success: false, error: 'Failed to update issue' });
  }
};

// Add comment to issue
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, is_internal = false } = req.body;
    const userId = req.auth.sub || req.auth.user_id;

    // Validate and sanitize comment
    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comment cannot be empty' 
      });
    }

    const sanitizedComment = sanitizeInput(comment);

    const query = `
      INSERT INTO reported_issue_comments (issue_id, user_id, comment, is_internal)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.pool.query(query, [id, userId, sanitizedComment, is_internal]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
};

// Get issue statistics
const getIssueStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'high') as high,
        COUNT(*) FILTER (WHERE category = 'bug') as bugs,
        COUNT(*) FILTER (WHERE category = 'feature_request') as feature_requests
      FROM reported_issues
    `;

    const result = await db.pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
};

// Delete issue (Admin only - soft delete by closing)
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE reported_issues 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    res.json({
      success: true,
      message: 'Issue closed successfully'
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ success: false, error: 'Failed to delete issue' });
  }
};

module.exports = {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  addComment,
  getIssueStats,
  deleteIssue
};
