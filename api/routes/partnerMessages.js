const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../middleware/onboarding');
const db = require('../config/database');

const router = express.Router();

// Guard stack for all partner message routes
const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// List messages/notifications for organization
router.get('/', ...guard, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const unread_only = req.query.unread === 'true';
    
    let query = `
      SELECT id, title, message, type, read_at, created_at, priority
      FROM notifications 
      WHERE organization_id = $1
    `;
    
    const params = [req.userOrganization.id];
    
    if (unread_only) {
      query += ' AND read_at IS NULL';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const result = await db.pool.query(query, params);
    
    const countQuery = unread_only 
      ? 'SELECT COUNT(*) FROM notifications WHERE organization_id = $1 AND read_at IS NULL'
      : 'SELECT COUNT(*) FROM notifications WHERE organization_id = $1';
    
    const countResult = await db.pool.query(countQuery, [req.userOrganization.id]);
    
    res.json({ 
      messages: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read
router.post('/:id/read', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify message belongs to organization
    const checkResult = await db.pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND organization_id = $2',
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const result = await db.pool.query(
      `UPDATE notifications 
       SET read_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND read_at IS NULL
       RETURNING id, read_at`,
      [id, req.userOrganization.id]
    );
    
    res.json({ 
      message_id: id,
      read_at: result.rows[0]?.read_at,
      was_unread: result.rows.length > 0
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Mark all messages as read
router.post('/read-all', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `UPDATE notifications 
       SET read_at = NOW()
       WHERE organization_id = $1 AND read_at IS NULL
       RETURNING id`,
      [req.userOrganization.id]
    );
    
    res.json({ 
      marked_read: result.rows.length,
      message: `Marked ${result.rows.length} messages as read`
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router;
