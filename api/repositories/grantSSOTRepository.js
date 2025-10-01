const db = require('../config/database');

const GRANT_SSOT_COLUMNS = [
  'id',
  'project_id',
  'grant_number',
  'name',
  'description',
  'open_date',
  'close_date',
  'currency',
  'budget_amount',
  'program_manager',
  'donor_name',
  'donor_contact_name',
  'donor_contact_email',
  'donor_contact_phone',
  'status',
  'created_by',
  'created_at',
  'updated_at'
];

class GrantSSOTRepository {
  static async create(grant, client = db.pool) {
    const query = `
      INSERT INTO grants_ssot (
        id,
        project_id,
        grant_number,
        name,
        description,
        open_date,
        close_date,
        currency,
        budget_amount,
        program_manager,
        donor_name,
        donor_contact_name,
        donor_contact_email,
        donor_contact_phone,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING ${GRANT_SSOT_COLUMNS.join(', ')}
    `;

    const values = [
      grant.id,
      grant.projectId,
      grant.grantNumber,
      grant.name || null,
      grant.description || null,
      grant.openDate || null,
      grant.closeDate || null,
      grant.currency || null,
      grant.budgetAmount || null,
      grant.programManager || null,
      grant.donorName || null,
      grant.donorContactName || null,
      grant.donorContactEmail || null,
      grant.donorContactPhone || null,
      grant.status || 'DRAFT',
      grant.createdBy,
      grant.createdAt || new Date(),
      grant.updatedAt || new Date()
    ];

    const result = await client.query(query, values);
    return GrantSSOTRepository.mapRow(result.rows[0]);
  }

  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.projectId !== undefined) {
      fields.push(`project_id = $${index++}`);
      values.push(updates.projectId);
    }
    if (updates.grantNumber !== undefined) {
      fields.push(`grant_number = $${index++}`);
      values.push(updates.grantNumber);
    }
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.openDate !== undefined) {
      fields.push(`open_date = $${index++}`);
      values.push(updates.openDate);
    }
    if (updates.closeDate !== undefined) {
      fields.push(`close_date = $${index++}`);
      values.push(updates.closeDate);
    }
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.budgetAmount !== undefined) {
      fields.push(`budget_amount = $${index++}`);
      values.push(updates.budgetAmount);
    }
    if (updates.programManager !== undefined) {
      fields.push(`program_manager = $${index++}`);
      values.push(updates.programManager);
    }
    if (updates.donorName !== undefined) {
      fields.push(`donor_name = $${index++}`);
      values.push(updates.donorName);
    }
    if (updates.donorContactName !== undefined) {
      fields.push(`donor_contact_name = $${index++}`);
      values.push(updates.donorContactName);
    }
    if (updates.donorContactEmail !== undefined) {
      fields.push(`donor_contact_email = $${index++}`);
      values.push(updates.donorContactEmail);
    }
    if (updates.donorContactPhone !== undefined) {
      fields.push(`donor_contact_phone = $${index++}`);
      values.push(updates.donorContactPhone);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.updatedAt !== undefined) {
      fields.push(`updated_at = $${index++}`);
      values.push(updates.updatedAt);
    } else {
      fields.push(`updated_at = now()`);
    }

    if (fields.length === 0) {
      return GrantSSOTRepository.findById(id, client);
    }

    values.push(id);

    const query = `
      UPDATE grants_ssot
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT *
      FROM grants_ssot
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  }

  static async findByProject(projectId, client = db.pool) {
    const query = `
      SELECT *
      FROM grants_ssot
      WHERE project_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [projectId]);
    return result.rows;
  }

  static async findByGrantNumber(grantNumber, client = db.pool) {
    const query = `
      SELECT *
      FROM grants_ssot
      WHERE grant_number = $1
    `;
    const result = await client.query(query, [grantNumber]);
    return result.rows.length ? result.rows[0] : null;
  }

  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM grants_ssot
      WHERE status = $1
      ORDER BY updated_at DESC
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }

  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM grants_ssot
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }

  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      grantNumber: row.grant_number,
      name: row.name,
      description: row.description,
      openDate: row.open_date,
      closeDate: row.close_date,
      currency: row.currency,
      budgetAmount: row.budget_amount,
      programManager: row.program_manager,
      donorName: row.donor_name,
      donorContactName: row.donor_contact_name,
      donorContactEmail: row.donor_contact_email,
      donorContactPhone: row.donor_contact_phone,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = GrantSSOTRepository;