// routes/gmReview.js
const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { checkPermission } = require('../middleware/rbacMatrix');
const db = require('../config/database');
const { ORG_STATUS } = require('../shared/constants/orgStatus');
const { normalizeRole } = require('../shared/constants/roles');
const { assertTransition } = require('../services/orgStateMachine');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// RBAC guard for GM review operations
const guard = [
  requireAuth, 
  (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (!checkPermission(role, 'review_queue_gm', 'manage')) {
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
        o.country,
        COALESCE(u.email, uf.email) AS owner_email,
        COALESCE(u.first_name, uf.first_name) AS owner_first_name,
        COALESCE(u.last_name, uf.last_name) AS owner_last_name,
        COALESCE(od.doc_count, 0) AS document_count
      FROM organizations o
      LEFT JOIN users u ON u.id = o.owner_user_id
      LEFT JOIN LATERAL (
        SELECT email, first_name, last_name
        FROM users uu
        WHERE uu.organization_id = o.id
        ORDER BY uu.created_at ASC
        LIMIT 1
      ) uf ON TRUE
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS doc_count
        FROM org_documents
        GROUP BY organization_id
      ) od ON od.organization_id = o.id
      WHERE o.status = ANY($1::text[])
      ORDER BY o.created_at ASC`,
      [[ORG_STATUS.UNDER_REVIEW_GM, 'under_review']]
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
      `SELECT 
        o.*,
        COALESCE(od.doc_count, 0) AS document_count,
        COALESCE(u.email, uf.email) AS owner_email,
        COALESCE(u.first_name, uf.first_name) AS owner_first_name,
        COALESCE(u.last_name, uf.last_name) AS owner_last_name
      FROM organizations o
      LEFT JOIN users u ON u.id = o.owner_user_id
      LEFT JOIN LATERAL (
        SELECT email, first_name, last_name
        FROM users uu
        WHERE uu.organization_id = o.id
        ORDER BY uu.created_at ASC
        LIMIT 1
      ) uf ON TRUE
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS doc_count
        FROM org_documents
        GROUP BY organization_id
      ) od ON od.organization_id = o.id
      WHERE o.id = $1 AND o.status = ANY($2::text[])`,
      [req.params.orgId, [ORG_STATUS.UNDER_REVIEW_GM, 'under_review']]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found in GM queue' });
    }

    const org = orgResult.rows[0];

    // Get documents joined with requirements (include missing ones)
    const docsResult = await db.pool.query(
      `SELECT 
        dr.code,
        dr.title,
        dr.category,
        dr.is_optional,
        od.available,
        od.na_explanation,
        od.note,
        od.files_json,
        od.updated_at
      FROM document_requirements dr
      LEFT JOIN org_documents od
        ON od.organization_id = $1
       AND od.requirement_code = dr.code
      WHERE dr.is_active = true
      ORDER BY dr.category, dr.sort_order`,
      [req.params.orgId]
    );

    const documents = docsResult.rows.map(row => ({
      code: row.code,
      title: row.title,
      category: row.category,
      is_optional: row.is_optional,
      available: row.available || null,
      na_explanation: row.na_explanation || null,
      note: row.note || null,
      files: (() => { try { return JSON.parse(row.files_json || '[]'); } catch { return []; } })(),
      updated_at: row.updated_at
    }));

    // Load financial assessment snapshot
    let financial = null;
    try {
      const fr = await db.pool.query(
        `SELECT current_annual_budget_amount_usd, current_annual_budget_year,
                next_year_annual_budget_estimate_amount_usd, next_year_annual_budget_estimate_year,
                largest_grant_ever_managed_amount_usd, largest_grant_ever_managed_year,
                current_donor_funding_amount_usd, current_donor_funding_year,
                other_funds_amount_usd, other_funds_year
         FROM financial_assessments WHERE organization_id = $1 
         ORDER BY updated_at DESC LIMIT 1`,
        [req.params.orgId]
      );
      if (fr.rows.length > 0) {
        const f = fr.rows[0];
        financial = {
          currentAnnualBudget: { amountUsd: f.current_annual_budget_amount_usd, year: f.current_annual_budget_year },
          nextYearAnnualBudgetEstimate: { amountUsd: f.next_year_annual_budget_estimate_amount_usd, year: f.next_year_annual_budget_estimate_year },
          largestGrantEverManaged: { amountUsd: f.largest_grant_ever_managed_amount_usd, year: f.largest_grant_ever_managed_year },
          currentDonorFunding: { amountUsd: f.current_donor_funding_amount_usd, year: f.current_donor_funding_year },
          otherFunds: { amountUsd: f.other_funds_amount_usd, year: f.other_funds_year }
        };
      }
    } catch (e) {
      console.warn('GM org financial load failed:', e.message || e);
    }

    // Document summary for required items
    const reqDocs = documents.filter(d => !d.is_optional);
    const required_total = reqDocs.length;
    const required_complete = reqDocs.filter(d => (d.available === 'yes' && d.files && d.files.length > 0) || (d.available === 'na' && d.na_explanation)).length;
    const required_missing = required_total - required_complete;

    res.json({
      organization: org,
      owner: {
        email: org.owner_email,
        first_name: org.owner_first_name,
        last_name: org.owner_last_name
      },
      financial_assessment: financial,
      documents,
      document_summary: { required_total, required_complete, required_missing }
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

    const currentStatus = org.rows[0]?.status;
    if (
      org.rows.length === 0 ||
      ![ORG_STATUS.UNDER_REVIEW_GM, 'under_review'].includes(currentStatus)
    ) {
      return res.status(400).json({ error: 'Organization not in GM queue' });
    }

    const organization = org.rows[0];
    // Load owner contact for email notifications
    let owner = null;
    try {
      const ownerRes = await db.pool.query('SELECT email, first_name FROM users WHERE id = $1', [organization.owner_user_id]);
      owner = ownerRes.rows[0] || null;
    } catch (e) {
      console.warn('GM decision: failed to load owner user for email:', e.message || e);
    }
    const fromStatusForSM = currentStatus === 'under_review' ? ORG_STATUS.UNDER_REVIEW_GM : currentStatus;

    if (decision === 'approve') {
      assertTransition(fromStatusForSM, ORG_STATUS.UNDER_REVIEW_COO);
      
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
      assertTransition(fromStatusForSM, ORG_STATUS.CHANGES_REQUESTED);
      
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
        [ORG_STATUS.CHANGES_REQUESTED, req.params.orgId]
      );

      // Send email to partner
      try {
        await EmailService.sendChangesRequestedEmail({
          to: owner?.email,
          firstName: owner?.first_name,
          orgName: organization.name,
          sections: sections || [],
          reason: reason || 'Please review and update the requested sections'
        });
      } catch (e) {
        console.warn('GM changes_requested: failed to send email:', e.message || e);
      }

      return res.json({ 
        ok: true, 
        status: ORG_STATUS.CHANGES_REQUESTED,
        message: 'Changes requested, partner notified'
      });
    }

    if (decision === 'reject') {
      assertTransition(fromStatusForSM, ORG_STATUS.REJECTED);
      
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
        [ORG_STATUS.REJECTED, req.params.orgId]
      );

      // Send rejection email
      try {
        await EmailService.sendRejectedEmail({
          to: owner?.email,
          firstName: owner?.first_name,
          orgName: organization.name,
          reason: reason || 'Application does not meet requirements'
        });
      } catch (e) {
        console.warn('GM reject: failed to send rejection email:', e.message || e);
      }

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
