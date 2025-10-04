// routes/cooReview.js
const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { checkPermission } = require('../middleware/rbacMatrix');
const db = require('../config/database');
const { ORG_STATUS } = require('../shared/constants/orgStatus');
const { assertTransition } = require('../services/orgStateMachine');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

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
        o.country,
        u.email AS owner_email, u.first_name AS owner_first_name, u.last_name AS owner_last_name,
        COALESCE(od.doc_count, 0) AS document_count,
        EXTRACT(DAY FROM (NOW() - o.updated_at))::int AS days_in_coo_queue
      FROM organizations o
      LEFT JOIN users u ON u.id = o.owner_user_id
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS doc_count
        FROM org_documents
        GROUP BY organization_id
      ) od ON od.organization_id = o.id
      WHERE o.status = $1
      ORDER BY o.updated_at ASC`,
      [ORG_STATUS.UNDER_REVIEW_COO]
    );

    res.json({ items: items.rows });
  } catch (error) {
    logger.error('Error fetching COO queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// Get organization details for COO review
router.get('/organization/:orgId', guard, async (req, res) => {
  try {
    const orgResult = await db.pool.query(
      `SELECT o.*,
        COALESCE(od.doc_count, 0) AS document_count
      FROM organizations o
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS doc_count
        FROM org_documents
        GROUP BY organization_id
      ) od ON od.organization_id = o.id
      WHERE o.id = $1 AND o.status = $2`,
      [req.params.orgId, ORG_STATUS.UNDER_REVIEW_COO]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found in COO queue' });
    }

    const org = orgResult.rows[0];

    // Get uploaded documents
    const docsResult = await db.pool.query(
      `SELECT requirement_code, available, na_explanation, note, files_json, updated_at
      FROM org_documents 
      WHERE organization_id = $1
      ORDER BY requirement_code`,
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
    logger.error('Error fetching organization details:', error);
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
      try {
        const ownerRes = await db.pool.query('SELECT email, first_name FROM users WHERE id = $1', [organization.owner_user_id]);
        const owner = ownerRes.rows[0];
        if (owner) {
          await EmailService.sendOnboardingCompletedEmail({
            to: owner.email,
            firstName: owner.first_name,
            orgName: organization.name
          });
        }
      } catch (e) {
        logger.warn('COO approve: failed to send completion email:', e.message || e);
      }

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
      try {
        const ownerRes = await db.pool.query('SELECT email, first_name FROM users WHERE id = $1', [organization.owner_user_id]);
        const owner = ownerRes.rows[0];
        if (owner) {
          await EmailService.sendChangesRequestedEmail({
            to: owner.email,
            firstName: owner.first_name,
            orgName: organization.name,
            sections: sections || [],
            reason: reason || 'Please review and update the requested sections'
          });
        }
      } catch (e) {
        logger.warn('COO changes_requested: failed to send email:', e.message || e);
      }

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
      try {
        const ownerRes = await db.pool.query('SELECT email, first_name FROM users WHERE id = $1', [organization.owner_user_id]);
        const owner = ownerRes.rows[0];
        if (owner) {
          await EmailService.sendRejectedEmail({
            to: owner.email,
            firstName: owner.first_name,
            orgName: organization.name,
            reason: reason || 'Application does not meet final requirements'
          });
        }
      } catch (e) {
        logger.warn('COO reject: failed to send email:', e.message || e);
      }

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.REJECTED,
        message: 'Organization rejected, partner notified'
      });
    }

  } catch (error) {
    logger.error('Error processing COO decision:', error);
    res.status(500).json({ error: 'Failed to process decision' });
  }
});

module.exports = router;
