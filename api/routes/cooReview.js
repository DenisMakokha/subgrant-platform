// routes/cooReview.js
const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { checkPermission } = require('../middleware/rbacMatrix');
const db = require('../config/database');
const { ORG_STATUS } = require('../shared/constants/orgStatus');
const { assertTransition } = require('../services/orgStateMachine');
const EmailService = require('../services/emailService');

const router = express.Router();

// RBAC guard for COO review operations
const guard = [
  requireAuth, 
  (req, res, next) => {
    if (!checkPermission(req.user?.role, 'review_queue_coo', 'manage')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  }
];

// Get COO review queue
router.get('/queue', guard, async (req, res) => {
  try {
    const items = await db.pool.query(
      `SELECT 
        o.id, o.name, o.status, o.created_at, o.updated_at,
        o.sector, o.country, o.owner_email, o.owner_first_name, o.owner_last_name,
        COUNT(d.id) as document_count,
        EXTRACT(DAYS FROM NOW() - o.updated_at) as days_in_coo_queue
      FROM organizations o
      LEFT JOIN compliance_documents d ON d.organization_id = o.id
      WHERE o.status = $1
      GROUP BY o.id
      ORDER BY o.updated_at ASC`,
      [ORG_STATUS.UNDER_REVIEW_COO]
    );

    res.json({ items: items.rows });
  } catch (error) {
    console.error('Error fetching COO queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// Get organization details for COO review
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
      [req.params.orgId, ORG_STATUS.UNDER_REVIEW_COO]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found in COO queue' });
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

    // Get GM approval history
    const historyResult = await db.pool.query(
      `SELECT created_at as gm_approved_at
      FROM audit_logs 
      WHERE entity_type = 'organization' 
        AND entity_id = $1 
        AND action = 'status_change'
        AND new_value = $2
      ORDER BY created_at DESC
      LIMIT 1`,
      [req.params.orgId, ORG_STATUS.UNDER_REVIEW_COO]
    );

    res.json({
      organization: org,
      documents: docsResult.rows,
      gm_approved_at: historyResult.rows[0]?.gm_approved_at || null
    });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({ error: 'Failed to fetch organization details' });
  }
});

// COO decision endpoint
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

    if (org.rows.length === 0 || org.rows[0].status !== ORG_STATUS.UNDER_REVIEW_COO) {
      return res.status(400).json({ error: 'Organization not in COO queue' });
    }

    const organization = org.rows[0];

    if (decision === 'approve') {
      assertTransition(organization.status, ORG_STATUS.FINALIZED);
      
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
        [ORG_STATUS.FINALIZED, req.params.orgId]
      );

      // Send onboarding completed email
      await EmailService.sendOnboardingCompletedEmail({
        to: organization.owner_email,
        firstName: organization.owner_first_name,
        orgName: organization.name
      });

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.FINALIZED,
        message: 'Organization approved and onboarding completed'
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
        reason: reason || 'Application does not meet final requirements'
      });

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.REJECTED,
        message: 'Organization rejected, partner notified'
      });
    }

  } catch (error) {
    console.error('Error processing COO decision:', error);
    res.status(500).json({ error: 'Failed to process decision' });
  }
});

module.exports = router;
