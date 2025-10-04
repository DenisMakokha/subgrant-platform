const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const GrantRepository = require('../../repositories/grantRepository');
const GrantSSOTRepository = require('../../repositories/grantSSOTRepository');
const GrantEventHooksService = require('./grantEventHooksService');
const logger = require('../../utils/logger');

/**
 * Comprehensive Grant Creation Service with full SSOT implementation
 * Creates grants with reporting dates, category allocations, attachments, and optional envelope
 */
class CreateGrantService {
  /**
   * Create a comprehensive grant with all related entities in a single transaction
   */
  static async createGrant(dto, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const grantId = uuidv4();
      const projectId = dto.project_id || uuidv4();
      const grantNumber = dto.grant_number || this.generateGrantNumber();

      // 1. Create the canonical grant record
      const grantPayload = {
        id: grantId,
        projectId: projectId,
        grantNumber: grantNumber,
        name: dto.name,
        description: dto.description,
        openDate: dto.open_date,
        closeDate: dto.close_date,
        currency: dto.currency,
        budgetAmount: dto.budget_amount,
        programManager: dto.program_manager,
        donorName: dto.donor_name,
        donorContactName: dto.donor_contact_name,
        donorContactEmail: dto.donor_contact_email,
        donorContactPhone: dto.donor_contact_phone,
        status: dto.status || 'ACTIVE',
        createdBy: actorId
      };

      const createdGrant = await GrantRepository.create(grantPayload, client);

      // 2. Create the SSOT record
      const ssotPayload = {
        id: createdGrant.id,
        projectId: createdGrant.projectId,
        grantNumber: createdGrant.grantNumber,
        name: createdGrant.name,
        description: createdGrant.description,
        openDate: createdGrant.openDate,
        closeDate: createdGrant.closeDate,
        currency: createdGrant.currency,
        budgetAmount: createdGrant.budgetAmount,
        programManager: createdGrant.programManager,
        donorName: createdGrant.donorName,
        donorContactName: createdGrant.donorContactName,
        donorContactEmail: createdGrant.donorContactEmail,
        donorContactPhone: createdGrant.donorContactPhone,
        status: createdGrant.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
        createdBy: createdGrant.createdBy,
        createdAt: createdGrant.createdAt,
        updatedAt: createdGrant.updatedAt
      };

      await GrantSSOTRepository.create(ssotPayload, client);

      // 3. Create reporting dates (financial & narrative)
      const reportingDateIds = [];
      if (dto.financial_reporting_dates && dto.financial_reporting_dates.length > 0) {
        for (const reportingDate of dto.financial_reporting_dates) {
          const reportingDateId = uuidv4();
          await client.query(`
            INSERT INTO grant_reporting_dates (id, grant_id, kind, due_date, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [reportingDateId, grantId, 'financial', reportingDate.date, reportingDate.description || '', 'due']);
          reportingDateIds.push(reportingDateId);
        }
      }

      if (dto.narrative_reporting_dates && dto.narrative_reporting_dates.length > 0) {
        for (const reportingDate of dto.narrative_reporting_dates) {
          const reportingDateId = uuidv4();
          await client.query(`
            INSERT INTO grant_reporting_dates (id, grant_id, kind, due_date, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [reportingDateId, grantId, 'narrative', reportingDate.date, reportingDate.description || '', 'due']);
          reportingDateIds.push(reportingDateId);
        }
      }

      // 4. Create category allocations
      const allocationIds = [];
      if (dto.budget_category_allocations && dto.budget_category_allocations.length > 0) {
        for (const allocation of dto.budget_category_allocations) {
          const allocationId = uuidv4();
          await client.query(`
            INSERT INTO grant_category_allocations (id, grant_id, category_id, amount)
            VALUES ($1, $2, $3, $4)
          `, [allocationId, grantId, allocation.category_id, allocation.amount]);
          allocationIds.push(allocationId);
        }
      }

      // 5. Create attachments
      const attachmentIds = [];
      if (dto.attachments && dto.attachments.length > 0) {
        for (const attachment of dto.attachments) {
          const attachmentId = uuidv4();
          await client.query(`
            INSERT INTO grant_attachments (id, grant_id, name, uri, mime, size_bytes, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [attachmentId, grantId, attachment.name, attachment.uri, attachment.mime, attachment.size_bytes || null, actorId]);
          attachmentIds.push(attachmentId);
        }
      }

      // 6. Create optional partner envelope
      let envelopeId = null;
      if (dto.envelope) {
        envelopeId = uuidv4();
        await client.query(`
          INSERT INTO allocation_envelopes (id, grant_id, project_id, currency, ceiling_amount, status, notes, created_by, decided_by, decided_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          envelopeId,
          grantId,
          projectId,
          dto.envelope.currency,
          dto.envelope.ceiling_amount,
          dto.envelope.status || 'APPROVED',
          dto.envelope.notes || null,
          actorId,
          actorId,
          new Date()
        ]);
      }

      await client.query('COMMIT');

      // Emit events and schedule notifications (outside transaction)
      try {
        const allReportingDates = [
          ...(dto.financial_reporting_dates || []).map(rd => ({ ...rd, kind: 'financial' })),
          ...(dto.narrative_reporting_dates || []).map(rd => ({ ...rd, kind: 'narrative' }))
        ];

        await GrantEventHooksService.onGrantCreated(createdGrant, allReportingDates, actorId);

        if (envelopeId) {
          await GrantEventHooksService.onEnvelopeCreated({
            id: envelopeId,
            projectId: projectId,
            ceilingAmount: dto.envelope.ceiling_amount,
            currency: dto.envelope.currency
          }, actorId);
        }
      } catch (eventError) {
        logger.error('Event hooks failed (grant created successfully):', eventError);
        // Don't fail the main operation if events fail
      }

      return {
        grant: createdGrant,
        project_id: projectId,
        grant_number: grantNumber,
        envelope_id: envelopeId,
        reporting_date_ids: reportingDateIds,
        allocation_ids: allocationIds,
        attachment_ids: attachmentIds
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update grant and propagate to SSOT
   */
  static async updateGrant(id, updates, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update canonical grant
      const updatedGrant = await GrantRepository.update(id, updates, client);
      if (!updatedGrant) {
        throw new Error('Grant not found');
      }

      // Propagate to SSOT
      const ssotUpdates = {
        projectId: updatedGrant.projectId,
        grantNumber: updatedGrant.grantNumber,
        name: updatedGrant.name,
        description: updatedGrant.description,
        openDate: updatedGrant.openDate,
        closeDate: updatedGrant.closeDate,
        currency: updatedGrant.currency,
        budgetAmount: updatedGrant.budgetAmount,
        programManager: updatedGrant.programManager,
        donorName: updatedGrant.donorName,
        donorContactName: updatedGrant.donorContactName,
        donorContactEmail: updatedGrant.donorContactEmail,
        donorContactPhone: updatedGrant.donorContactPhone,
        status: updatedGrant.status === 'ACTIVE' ? 'ACTIVE' : updatedGrant.status === 'ARCHIVED' ? 'CLOSED' : 'DRAFT',
        updatedAt: new Date()
      };

      await GrantSSOTRepository.update(id, ssotUpdates, client);

      await client.query('COMMIT');

      // Log deletion event (outside transaction)
      try {
        await GrantEventHooksService.logEvent(null, 'grant.deleted', 'grant', id, {}, actorId);
      } catch (eventError) {
        logger.error('Event logging failed (grant deleted successfully):', eventError);
      }

      // Emit update event (outside transaction)
      try {
        await GrantEventHooksService.onGrantUpdated(id, updates, actorId);
      } catch (eventError) {
        logger.error('Event hooks failed (grant updated successfully):', eventError);
      }

      return updatedGrant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete grant and remove from SSOT
   */
  static async deleteGrant(id, actorId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete from SSOT first (due to potential FK constraints)
      await GrantSSOTRepository.delete(id, client);
      
      // Delete canonical grant (CASCADE will handle related records)
      await GrantRepository.delete(id, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate grant number in format GRN-YYYYMM-####
   */
  static generateGrantNumber(now = new Date()) {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GRN-${yyyy}${mm}-${rand}`;
  }

  /**
   * Generate suggested reporting dates based on frequency
   */
  static suggestReportingDates(openDate, closeDate, frequency = 'quarterly') {
    const suggestions = [];
    const start = new Date(openDate);
    const end = new Date(closeDate);
    const stepMonths = frequency === 'quarterly' ? 3 : 6;
    
    let current = new Date(start);
    let index = 1;
    
    while (current <= end) {
      const periodEnd = new Date(current);
      periodEnd.setMonth(periodEnd.getMonth() + stepMonths);
      periodEnd.setDate(0); // Last day of previous month
      
      if (periodEnd > end) break;
      
      const dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + 15); // 15 days after period end
      
      suggestions.push({
        date: dueDate.toISOString().split('T')[0],
        description: `${frequency === 'quarterly' ? 'Q' : 'H'}${index} Report`
      });
      
      current.setMonth(current.getMonth() + stepMonths);
      index++;
    }
    
    return suggestions;
  }

  /**
   * Validate grant data before creation
   */
  static validateGrantData(dto) {
    const errors = [];

    if (!dto.name || dto.name.trim().length < 2) {
      errors.push('Grant name is required and must be at least 2 characters');
    }

    if (!dto.open_date || !dto.close_date) {
      errors.push('Start date and end date are required');
    }

    if (dto.open_date && dto.close_date && new Date(dto.close_date) < new Date(dto.open_date)) {
      errors.push('End date must be on or after start date');
    }

    if (!dto.currency || dto.currency.length !== 3) {
      errors.push('Valid 3-letter currency code is required');
    }

    if (dto.budget_amount !== undefined && dto.budget_amount < 0) {
      errors.push('Budget amount must be non-negative');
    }

    if (dto.budget_category_allocations && dto.budget_amount) {
      const totalAllocations = dto.budget_category_allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      if (totalAllocations > dto.budget_amount) {
        errors.push('Category allocations exceed total budget amount');
      }
    }

    if (dto.donor_contact_email && !this.isValidEmail(dto.donor_contact_email)) {
      errors.push('Invalid donor contact email format');
    }

    return errors;
  }

  /**
   * Simple email validation
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = CreateGrantService;
