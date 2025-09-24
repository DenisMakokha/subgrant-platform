const db = require('../config/database');

class OrganizationRepository {
  
  async create(dto, opts = {}) {
    const dataWithMetadata = this.addMetadata(dto, opts);
    
    const result = await db.pool.query(
      `INSERT INTO organizations (
        owner_user_id, name, legal_name, registration_number, tax_id, legal_structure, year_established,
        email, phone, website,
        primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
        address, city, state_province, postal_code, country,
        bank_name, bank_branch, account_name, account_number, swift_code,
        status, version, created_at, updated_at, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *`,
      [
        dataWithMetadata.owner_user_id,
        dataWithMetadata.name,
        dataWithMetadata.legal_name,
        dataWithMetadata.registration_number,
        dataWithMetadata.tax_id,
        dataWithMetadata.legal_structure,
        dataWithMetadata.year_established,
        dataWithMetadata.email,
        dataWithMetadata.phone,
        dataWithMetadata.website,
        dataWithMetadata.primary_contact_name,
        dataWithMetadata.primary_contact_title,
        dataWithMetadata.primary_contact_email,
        dataWithMetadata.primary_contact_phone,
        dataWithMetadata.address,
        dataWithMetadata.city,
        dataWithMetadata.state_province,
        dataWithMetadata.postal_code,
        dataWithMetadata.country,
        dataWithMetadata.bank_name,
        dataWithMetadata.bank_branch,
        dataWithMetadata.account_name,
        dataWithMetadata.account_number,
        dataWithMetadata.swift_code,
        dataWithMetadata.status || 'a_pending',
        dataWithMetadata.version || 0,
        dataWithMetadata.created_at,
        dataWithMetadata.updated_at,
        dataWithMetadata.created_by,
        dataWithMetadata.updated_by
      ]
    );
    
    return this.mapFromDb(result.rows[0]);
  }
  
  async read(id) {
    const q = 'SELECT * FROM organizations WHERE id = $1';
    console.log('🔎 OrgRepo.read SQL:', q, 'params:', [id]);
    const result = await db.pool.query(q, [id]);
    
    return result.rows.length > 0 ? this.mapFromDb(result.rows[0]) : null;
  }
  
  async readByUserId(userId) {
    const q = `SELECT o.*
               FROM organizations o
               JOIN users u ON u.organization_id = o.id
               WHERE u.id = $1`;
    console.log('🔎 OrgRepo.readByUserId SQL:', q, 'params:', [userId]);
    const result = await db.pool.query(q, [userId]);
    
    return result.rows.length > 0 ? this.mapFromDb(result.rows[0]) : null;
  }
  
  async update(id, dto, opts = {}) {
    console.log('🔧 OrganizationRepository.update called with:', { id, dto, opts });

    const dataWithMetadata = this.addMetadata(dto, opts);

    // 1) Normalize input to avoid undefined -> NULL clobbering
    const normalized = this.normalizeForUpdate(dataWithMetadata);
    const invalidNonNullables = this.validateNonNullableFields(normalized);
    if (invalidNonNullables.length > 0) {
      // Signal to routes to return 400
      const err = new Error(`VALIDATION_NON_NULL:${invalidNonNullables.join(',')}`);
      throw err;
    }

    // 2) OCC WHERE clause with numeric etag
    const whereClause = opts.etag !== undefined
      ? 'WHERE id = $1 AND version = $2'
      : 'WHERE id = $1';
    const params = opts.etag !== undefined ? [id, Number(opts.etag)] : [id];

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = params.length + 1;

    const fieldMappings = {
      name: 'name',
      legal_name: 'legal_name',
      registration_number: 'registration_number',
      tax_id: 'tax_id',
      legal_structure: 'legal_structure',
      year_established: 'year_established',
      email: 'email',
      phone: 'phone',
      website: 'website',
      primary_contact_name: 'primary_contact_name',
      primary_contact_title: 'primary_contact_title',
      primary_contact_email: 'primary_contact_email',
      primary_contact_phone: 'primary_contact_phone',
      address: 'address',
      city: 'city',
      state_province: 'state_province',
      postal_code: 'postal_code',
      country: 'country',
      bank_name: 'bank_name',
      bank_branch: 'bank_branch',
      account_name: 'account_name',
      account_number: 'account_number',
      swift_code: 'swift_code',
      status: 'status',
      financial_assessment: 'financial_assessment',
      document_responses: 'document_responses'
    };

    // 3) Only include keys that exist AND are not undefined
    for (const [schemaField, dbField] of Object.entries(fieldMappings)) {
      if (Object.prototype.hasOwnProperty.call(normalized, schemaField) &&
          normalized[schemaField] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(normalized[schemaField]);
        paramIndex++;
      }
    }

    // 4) Always bump version and timestamps
    updateFields.push(`version = version + 1`);
    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(normalized.updated_at);
    paramIndex++;

    if (normalized.updated_by) {
      updateFields.push(`updated_by = $${paramIndex}`);
      updateValues.push(normalized.updated_by);
      paramIndex++;
    }

    const query = `
      UPDATE organizations
      SET ${updateFields.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    console.log('🔍 SQL Query:', query);
    console.log('🔍 SQL Params:', [...params, ...updateValues]);

    const result = await db.pool.query(query, [...params, ...updateValues]);

    if (result.rows.length === 0) throw new Error('CONFLICT');
    return this.mapFromDb(result.rows[0]);
  }
  
  async list(query = {}) {
    const result = await db.pool.query(
      'SELECT * FROM organizations ORDER BY updated_at DESC'
    );
    
    const data = result.rows.map(row => this.mapFromDb(row));
    return { data, total: data.length };
  }
  
  async delete(id, opts = {}) {
    const result = await db.pool.query(
      `DELETE FROM organizations WHERE id = $1`,
      [id]
    );
    // Optional: if (result.rowCount === 0) throw new Error('NOT_FOUND');
  }
  
  // Add metadata to data
  addMetadata(dto, opts = {}) {
    const now = new Date().toISOString();
    return {
      ...dto,
      updated_at: now,
      ...(opts.userId && { updated_by: opts.userId }),
      ...(dto.id ? {} : { 
        created_at: now,
        ...(opts.userId && { created_by: opts.userId })
      })
    };
  }

  // Normalize input for safe updates
  normalizeForUpdate(obj) {
    const out = { ...obj };

    // Ensure numeric where applicable
    if (out.year_established !== undefined && out.year_established !== null) {
      const n = Number(out.year_established);
      out.year_established = Number.isFinite(n) ? n : null;
    }

    // If DB columns are JSONB, plain objects are fine.
    // If TEXT, uncomment to stringify:
    // if (out.financial_assessment && typeof out.financial_assessment === 'object') {
    //   out.financial_assessment = JSON.stringify(out.financial_assessment);
    // }
    // if (out.document_responses && typeof out.document_responses === 'object') {
    //   out.document_responses = JSON.stringify(out.document_responses);
    // }

    // Convert empty strings to null for nullable columns only (not for required fields)
    const maybeNull = [
      'phone','website','primary_contact_title','primary_contact_phone',
      'address','city','state_province','postal_code','country',
      'bank_name','bank_branch','account_name','account_number','swift_code'
    ];
    for (const k of maybeNull) {
      if (Object.prototype.hasOwnProperty.call(out, k) && out[k] === '') out[k] = null;
    }

    return out;
  }

  // Identify non-nullable fields set to null/undefined/empty string
  validateNonNullableFields(obj) {
    const nonNullable = ['name','legal_name','email','status'];
    const invalid = [];
    for (const k of nonNullable) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue; // not part of this update
      const v = obj[k];
      if (v === null || v === undefined) invalid.push(k);
      else if (typeof v === 'string' && v.trim().length === 0) invalid.push(k);
    }
    return invalid;
  }
  
  // Handle concurrency conflicts
  handleConcurrencyConflict(expectedVersion, actualVersion) {
    if (expectedVersion !== undefined && actualVersion !== undefined && expectedVersion !== actualVersion) {
      throw new Error('CONFLICT');
    }
  }
  
  // Map database row to Organization object
  mapFromDb(row) {
    return {
      id: row.id,
      version: row.version || 0,
      status: row.status,
      name: row.name || '',
      legal_name: row.legal_name || '',
      registration_number: row.registration_number || '',
      tax_id: row.tax_id || '',
      legal_structure: row.legal_structure,
      year_established: row.year_established,
      email: row.email || '',
      phone: row.phone || '',
      website: row.website || '',
      primary_contact_name: row.primary_contact_name || '',
      primary_contact_title: row.primary_contact_title || '',
      primary_contact_email: row.primary_contact_email || '',
      primary_contact_phone: row.primary_contact_phone || '',
      address: row.address || '',
      city: row.city || '',
      state_province: row.state_province || '',
      postal_code: row.postal_code || '',
      country: row.country || '',
      bank_name: row.bank_name,
      bank_branch: row.bank_branch,
      account_name: row.account_name,
      account_number: row.account_number,
      swift_code: row.swift_code,
      financial_assessment: row.financial_assessment,
      document_responses: row.document_responses,
      owner_user_id: row.owner_user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
    };
  }
}

module.exports = { OrganizationRepository };
