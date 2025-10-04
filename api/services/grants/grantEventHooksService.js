const db = require('../../config/database');
const notificationService = require('../notificationService');
const logger = require('../../utils/logger');

/**
 * Event hooks service for grants SSOT
 * Handles event emission and notification scheduling for grant lifecycle events
 */
class GrantEventHooksService {
  
  /**
   * Emit grant.created event and schedule notifications
   */
  static async onGrantCreated(grantData, reportingDates = [], actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Log the event
      await this.logEvent(client, 'grant.created', 'grant', grantData.id, {
        grant_number: grantData.grantNumber,
        project_id: grantData.projectId,
        budget_amount: grantData.budgetAmount,
        currency: grantData.currency,
        donor: grantData.donorName
      }, actorId);

      // 2. Schedule reporting date reminders
      if (reportingDates.length > 0) {
        await this.scheduleReportingReminders(client, grantData, reportingDates, actorId);
      }

      // 3. Notify stakeholders
      await this.notifyGrantCreated(client, grantData, actorId);

      // 4. Trigger analytics refresh
      await this.triggerAnalyticsRefresh(client, grantData.projectId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Emit grant.updated event
   */
  static async onGrantUpdated(grantId, updates, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'grant.updated', 'grant', grantId, {
        updates: updates
      }, actorId);

      // Trigger analytics refresh if budget or dates changed
      if (updates.budget_amount || updates.open_date || updates.close_date) {
        const grant = await client.query('SELECT project_id FROM grants WHERE id = $1', [grantId]);
        if (grant.rows.length > 0) {
          await this.triggerAnalyticsRefresh(client, grant.rows[0].project_id);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Emit envelope.created event
   */
  static async onEnvelopeCreated(envelopeData, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'envelope.created', 'allocation_envelope', envelopeData.id, {
        project_id: envelopeData.projectId,
        ceiling_amount: envelopeData.ceilingAmount,
        currency: envelopeData.currency
      }, actorId);

      await this.triggerAnalyticsRefresh(client, envelopeData.projectId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Emit envelope.amended event
   */
  static async onEnvelopeAmended(envelopeId, delta, reason, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'envelope.amended', 'allocation_envelope', envelopeId, {
        delta: delta,
        reason: reason
      }, actorId);

      // Get project ID for analytics refresh
      const envelope = await client.query('SELECT project_id FROM allocation_envelopes WHERE id = $1', [envelopeId]);
      if (envelope.rows.length > 0) {
        await this.triggerAnalyticsRefresh(client, envelope.rows[0].project_id);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Schedule reporting date reminders
   */
  static async scheduleReportingReminders(client, grantData, reportingDates, actorId) {
    for (const reportingDate of reportingDates) {
      const dueDate = new Date(reportingDate.date);
      
      // Schedule reminders at T-30, T-14, T-7, and T-1 days
      const reminderOffsets = [30, 14, 7, 1];
      
      for (const offset of reminderOffsets) {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - offset);
        
        // Only schedule if reminder date is in the future
        if (reminderDate > new Date()) {
          await this.scheduleNotification(client, {
            scheduled_at: reminderDate,
            template_key: 'grant_reporting_reminder',
            user_id: grantData.programManager || actorId,
            payload: {
              grant_name: grantData.name,
              grant_number: grantData.grantNumber,
              report_type: reportingDate.kind,
              due_date: reportingDate.date,
              days_until_due: offset,
              description: reportingDate.description
            }
          });
        }
      }
    }
  }

  /**
   * Notify stakeholders of grant creation
   */
  static async notifyGrantCreated(client, grantData, actorId) {
    // Notify program manager if different from creator
    if (grantData.programManager && grantData.programManager !== actorId) {
      await notificationService.create({
        user_id: grantData.programManager,
        channel: 'IN_APP',
        template_key: 'grant_assigned',
        payload_json: {
          grant_name: grantData.name,
          grant_number: grantData.grantNumber,
          budget_amount: grantData.budgetAmount,
          currency: grantData.currency,
          assigned_by: actorId
        }
      }, client);
    }

    // Notify admin/finance team
    const adminUsers = await client.query(`
      SELECT DISTINCT ur.user_id 
      FROM users_roles ur 
      WHERE ur.role_id IN ('admin', 'finance_officer')
    `);

    for (const admin of adminUsers.rows) {
      if (admin.user_id !== actorId) {
        await notificationService.create({
          user_id: admin.user_id,
          channel: 'IN_APP',
          template_key: 'grant_created',
          payload_json: {
            grant_name: grantData.name,
            grant_number: grantData.grantNumber,
            project_id: grantData.projectId,
            budget_amount: grantData.budgetAmount,
            currency: grantData.currency,
            created_by: actorId
          }
        }, client);
      }
    }
  }

  /**
   * Schedule a notification
   */
  static async scheduleNotification(client, notificationData) {
    await client.query(`
      INSERT INTO notification_schedule (
        id,
        scheduled_at,
        template_key,
        user_id,
        payload_json,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      require('uuid').v4(),
      notificationData.scheduled_at,
      notificationData.template_key,
      notificationData.user_id,
      notificationData.payload,
      'SCHEDULED',
      new Date()
    ]);
  }

  /**
   * Log domain event
   */
  static async logEvent(client, eventType, entityType, entityId, payload, actorId) {
    await client.query(`
      INSERT INTO event_logs (
        id,
        event_type,
        entity_type,
        entity_id,
        actor_user_id,
        payload_json,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      require('uuid').v4(),
      eventType,
      entityType,
      entityId,
      actorId,
      payload,
      new Date()
    ]);
  }

  /**
   * Trigger analytics refresh for a project
   */
  static async triggerAnalyticsRefresh(client, projectId) {
    // Add to analytics refresh queue
    await client.query(`
      INSERT INTO analytics_refresh_queue (
        id,
        project_id,
        refresh_type,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (project_id, refresh_type) 
      DO UPDATE SET 
        status = 'PENDING',
        created_at = EXCLUDED.created_at
    `, [
      require('uuid').v4(),
      projectId,
      'grants_analytics',
      'PENDING',
      new Date()
    ]);
  }

  /**
   * Process analytics refresh queue (called by background worker)
   */
  static async processAnalyticsRefresh() {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Get pending refresh jobs
      const pendingJobs = await client.query(`
        SELECT id, project_id, refresh_type
        FROM analytics_refresh_queue
        WHERE status = 'PENDING'
        ORDER BY created_at
        LIMIT 10
      `);

      for (const job of pendingJobs.rows) {
        try {
          // Mark as processing
          await client.query(`
            UPDATE analytics_refresh_queue 
            SET status = 'PROCESSING', updated_at = now()
            WHERE id = $1
          `, [job.id]);

          // Refresh materialized views
          await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_grants_overview');

          // Update fact tables for the specific project
          await this.refreshFactTables(client, job.project_id);

          // Mark as completed
          await client.query(`
            UPDATE analytics_refresh_queue 
            SET status = 'COMPLETED', updated_at = now()
            WHERE id = $1
          `, [job.id]);

        } catch (error) {
          logger.error(`Failed to refresh analytics for job ${job.id}:`, error);
          await client.query(`
            UPDATE analytics_refresh_queue 
            SET status = 'FAILED', error_message = $2, updated_at = now()
            WHERE id = $1
          `, [job.id, error.message]);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Refresh fact tables for a specific project
   */
  static async refreshFactTables(client, projectId) {
    const today = new Date().toISOString().split('T')[0];

    // Refresh envelope daily facts
    await client.query(`
      INSERT INTO fact_envelope_daily (date_key, project_id, envelope_total, approved_partner_sum, headroom, amendments_cum)
      SELECT 
        $1::date,
        $2,
        COALESCE(e.ceiling_amount, 0),
        COALESCE(SUM(pb.ceiling_total), 0),
        COALESCE(e.ceiling_amount, 0) - COALESCE(SUM(pb.ceiling_total), 0),
        COALESCE(SUM(ea.delta), 0)
      FROM allocation_envelopes e
      LEFT JOIN partner_budgets pb ON pb.project_id = e.project_id AND pb.status = 'APPROVED'
      LEFT JOIN envelope_amendments ea ON ea.envelope_id = e.id
      WHERE e.project_id = $2 AND e.status IN ('APPROVED', 'LOCKED')
      GROUP BY e.id, e.ceiling_amount
      ON CONFLICT (date_key, project_id) DO UPDATE SET
        envelope_total = EXCLUDED.envelope_total,
        approved_partner_sum = EXCLUDED.approved_partner_sum,
        headroom = EXCLUDED.headroom,
        amendments_cum = EXCLUDED.amendments_cum
    `, [today, projectId]);

    // Refresh partner budget daily facts
    await client.query(`
      INSERT INTO fact_partner_budget_daily (date_key, project_id, partner_id, ceiling, budgeted, spent, remaining, utilization_pct)
      SELECT 
        $1::date,
        pb.project_id,
        pb.partner_id,
        pb.ceiling_total,
        COALESCE(SUM(pbl.total), 0),
        COALESCE(SUM(re.amount), 0),
        pb.ceiling_total - COALESCE(SUM(re.amount), 0),
        CASE 
          WHEN pb.ceiling_total > 0 
          THEN (COALESCE(SUM(re.amount), 0) / pb.ceiling_total * 100)
          ELSE 0 
        END
      FROM partner_budgets pb
      LEFT JOIN partner_budget_lines pbl ON pbl.partner_budget_id = pb.id AND pbl.status = 'APPROVED'
      LEFT JOIN recon_line_evidence re ON re.partner_budget_line_id = pbl.id
      WHERE pb.project_id = $2 AND pb.status = 'APPROVED'
      GROUP BY pb.id, pb.project_id, pb.partner_id, pb.ceiling_total
      ON CONFLICT (date_key, project_id, partner_id) DO UPDATE SET
        ceiling = EXCLUDED.ceiling,
        budgeted = EXCLUDED.budgeted,
        spent = EXCLUDED.spent,
        remaining = EXCLUDED.remaining,
        utilization_pct = EXCLUDED.utilization_pct
    `, [today, projectId]);
  }

  /**
   * Handle partner budget approval event
   */
  static async onPartnerBudgetApproved(budgetId, projectId, partnerId, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'partner.budget.approved', 'partner_budget', budgetId, {
        project_id: projectId,
        partner_id: partnerId
      }, actorId);

      // Check envelope headroom and alert if low
      const headroom = await client.query(`
        SELECT headroom FROM vw_envelope_headroom WHERE project_id = $1
      `, [projectId]);

      if (headroom.rows.length > 0 && headroom.rows[0].headroom < 0) {
        await this.alertEnvelopeOverrun(client, projectId, headroom.rows[0].headroom, actorId);
      }

      await this.triggerAnalyticsRefresh(client, projectId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle reconciliation uploaded event
   */
  static async onReconciliationUploaded(reconId, projectId, partnerId, amount, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'recon.uploaded', 'recon_line_evidence', reconId, {
        project_id: projectId,
        partner_id: partnerId,
        amount: amount
      }, actorId);

      await this.triggerAnalyticsRefresh(client, projectId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle fund request approved event
   */
  static async onFundRequestApproved(fundRequestId, projectId, partnerId, amount, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'fund_request.approved', 'fund_request', fundRequestId, {
        project_id: projectId,
        partner_id: partnerId,
        amount: amount
      }, actorId);

      // Update fact table
      await client.query(`
        INSERT INTO fact_fund_requests (fund_request_id, project_id, partner_id, amount, approved_at, state)
        VALUES ($1, $2, $3, $4, now(), 'approved')
        ON CONFLICT (fund_request_id) DO UPDATE SET
          approved_at = now(),
          state = 'approved'
      `, [fundRequestId, projectId, partnerId, amount]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle contract signed event
   */
  static async onContractSigned(contractId, projectId, partnerId, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'contract.signed', 'contract', contractId, {
        project_id: projectId,
        partner_id: partnerId
      }, actorId);

      // Update fact table
      await client.query(`
        INSERT INTO fact_contracts (contract_id, project_id, partner_id, signed_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (contract_id) DO UPDATE SET
          signed_at = now()
      `, [contractId, projectId, partnerId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle report submitted event
   */
  static async onReportSubmitted(reportId, projectId, partnerId, reportType, dueDate, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await this.logEvent(client, 'report.submitted', 'report', reportId, {
        project_id: projectId,
        partner_id: partnerId,
        type: reportType
      }, actorId);

      // Calculate if on time
      const submittedAt = new Date();
      const onTime = submittedAt <= new Date(dueDate);
      const daysToSubmit = Math.ceil((submittedAt - new Date(dueDate)) / (1000 * 60 * 60 * 24));

      // Update fact table
      await client.query(`
        INSERT INTO fact_reports (id, project_id, partner_id, type, due_date, submitted_at, on_time, days_to_submit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          submitted_at = EXCLUDED.submitted_at,
          on_time = EXCLUDED.on_time,
          days_to_submit = EXCLUDED.days_to_submit
      `, [reportId, projectId, partnerId, reportType, dueDate, submittedAt, onTime, daysToSubmit]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Alert when envelope is overrun
   */
  static async alertEnvelopeOverrun(client, projectId, overrunAmount, actorId) {
    // Get all admin/finance users
    const alertUsers = await client.query(`
      SELECT DISTINCT ur.user_id 
      FROM users_roles ur 
      WHERE ur.role_id IN ('admin', 'finance_officer', 'program_manager')
    `);

    for (const user of alertUsers.rows) {
      await notificationService.create({
        user_id: user.user_id,
        channel: 'EMAIL', // High priority - send email
        template_key: 'envelope_overrun_alert',
        payload_json: {
          project_id: projectId,
          overrun_amount: Math.abs(overrunAmount),
          triggered_by: actorId,
          severity: 'HIGH'
        }
      }, client);
    }
  }

  /**
   * Log domain event to event_logs table
   */
  static async logEvent(client, eventType, entityType, entityId, payload, actorId) {
    await client.query(`
      INSERT INTO event_logs (
        id,
        event_type,
        entity_type,
        entity_id,
        actor_user_id,
        payload_json,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      require('uuid').v4(),
      eventType,
      entityType,
      entityId,
      actorId,
      JSON.stringify(payload),
      new Date()
    ]);
  }

  /**
   * Trigger analytics refresh (adds to queue)
   */
  static async triggerAnalyticsRefresh(client, projectId) {
    await client.query(`
      INSERT INTO analytics_refresh_queue (
        id,
        project_id,
        refresh_type,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (project_id, refresh_type) 
      DO UPDATE SET 
        status = 'PENDING',
        created_at = EXCLUDED.created_at
    `, [
      require('uuid').v4(),
      projectId,
      'grants_analytics',
      'PENDING',
      new Date()
    ]);
  }
}

module.exports = GrantEventHooksService;