const express = require('express');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Debug endpoint to check organization status
router.get('/debug/org-status', async (req, res) => {
  try {
    // Get user from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.id;

    console.log('Debug: User ID from token:', userId);

    // Get user info
    const userResult = await db.pool.query(
      'SELECT id, email, organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    console.log('Debug: User data:', user);

    // Get organization by owner_user_id (like getUserOrganization middleware)
    const orgByOwnerResult = await db.pool.query(
      'SELECT id, status, owner_user_id, name FROM organizations WHERE owner_user_id = $1',
      [userId]
    );

    console.log('Debug: Organization by owner_user_id:', orgByOwnerResult.rows);

    // Get organization by user.organization_id (like session endpoint)
    let orgByUserIdResult = { rows: [] };
    if (user.organization_id) {
      orgByUserIdResult = await db.pool.query(
        'SELECT id, status, owner_user_id, name FROM organizations WHERE id = $1',
        [user.organization_id]
      );
    }

    console.log('Debug: Organization by user.organization_id:', orgByUserIdResult.rows);

    res.json({
      user: user,
      organizationByOwner: orgByOwnerResult.rows[0] || null,
      organizationByUserId: orgByUserIdResult.rows[0] || null,
      debug: {
        userId,
        userOrganizationId: user.organization_id,
        organizationsByOwner: orgByOwnerResult.rows.length,
        organizationsByUserId: orgByUserIdResult.rows.length
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

module.exports = router;
