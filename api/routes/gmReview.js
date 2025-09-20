// routes/gmReview.js
const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { checkPermission } = require('../middleware/rbacMatrix');
const db = require('../config/database');
const { ORG_STATUS } = require('../shared/constants/orgStatus');
const { assertTransition } = require('../services/orgStateMachine');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// RBAC guard for GM review operations
const guard = [
  requireAuth, 
  (req, res, next) => {
    if (!checkPermission(req.user?.role, 'review_queue_gm', 'manage')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  }
];

// Get GM review queue
router.get('/queue', guard, async (req, res) => {
  try {
    const items = await db.pool.query(
      `SELECT 
        o.id, o.name, o.status, o.created_at, o.updated_at,
        o.sector, o.country, o.owner_email, o.owner_first_name, o.owner_last_name,
        COUNT(d.id) as document_count
      FROM organizations o
      LEFT JOIN compliance_documents d ON d.organization_id = o.id
      WHERE o.status = $1
      ORDER BY o.created_at ASC`,
      [ORG_STATUS.UNDER_REVIEW_GM]
    );

    res.json({ items: items.rows });
  } catch (error) {
    console.error('Error fetching GM queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// Get organization details for review
router.get('/organization/:orgId', guard, async (req, res) => {
  try {
    const orgResult = await db.pool.query(
      `SELECT o.*, 
        COUNT(d.id) as document_count,
        COUNT(d.id) FILTER (WHERE d.status = 'approved') as approved_docs
      FROM organizations o
      LEFT JOIN compliance_documents d ON d.organization_id = o.id
      WHERE o.id = $1 AND o.status = $2
      GROUP BY o.id`,
      [req.params.orgId, ORG_STATUS.UNDER_REVIEW_GM]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found in GM queue' });
    }

    const org = orgResult.rows[0];

    // Get compliance documents
    const docsResult = await db.pool.query(
      `SELECT id, document_type, file_name, status, uploaded_at, file_url
      FROM compliance_documents 
      WHERE organization_id = $1
      ORDER BY document_type`,
      [req.params.orgId]
    );

    res.json({
      organization: org,
      documents: docsResult.rows
    });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({ error: 'Failed to fetch organization details' });
  }
});

// GM decision endpoint
router.post('/:orgId/decision', guard, async (req, res) => {
  try {
    const { decision, reason, sections } = req.body; // 'approve' | 'changes_requested' | 'reject'
    
    if (!['approve', 'changes_requested', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const org = await db.pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [req.params.orgId]
    );

    if (org.rows.length === 0 || org.rows[0].status !== ORG_STATUS.UNDER_REVIEW_GM) {
      return res.status(400).json({ error: 'Organization not in GM queue' });
    }

    const organization = org.rows[0];

    if (decision === 'approve') {
      assertTransition(organization.status, ORG_STATUS.UNDER_REVIEW_COO);
      
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
        [ORG_STATUS.UNDER_REVIEW_COO, req.params.orgId]
      );

      // Notify COO queue
      await NotificationService.notifyRole('chief_operations_officer', {
        type: 'review_incoming',
        orgId: organization.id,
        orgName: organization.name,
        message: `Organization ${organization.name} approved by GM and ready for COO review`
      });

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.UNDER_REVIEW_COO,
        message: 'Organization approved and moved to COO queue'
      });
    }

    if (decision === 'changes_requested') {
      assertTransition(organization.status, ORG_STATUS.CHANGES_REQUESTED);
      
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
        [ORG_STATUS.CHANGES_REQUESTED, req.params.orgId]
      );

      // Send email to partner
      await EmailService.sendChangesRequestedEmail({
        to: organization.owner_email,
        firstName: organization.owner_first_name,
        orgName: organization.name,
        sections: sections || [],
        reason: reason || 'Please review and update the requested sections'
      });

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.CHANGES_REQUESTED,
        message: 'Changes requested, partner notified'
      });
    }

    if (decision === 'reject') {
      assertTransition(organization.status, ORG_STATUS.REJECTED);
      
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
        [ORG_STATUS.REJECTED, req.params.orgId]
      );

      // Send rejection email
      await EmailService.sendRejectedEmail({
        to: organization.owner_email,
        firstName: organization.owner_first_name,
        orgName: organization.name,
        reason: reason || 'Application does not meet requirements'
      });

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.REJECTED,
        message: 'Organization rejected, partner notified'
      });
    }

  } catch (error) {
    console.error('Error processing GM decision:', error);
    res.status(500).json({ error: 'Failed to process decision' });
  }
});

module.exports = router;
