const db = require('../config/database');
const ContractSSOTRepository = require('./contractSSOTRepository');

const CONTRACT_COLUMNS = [
  'id',
  'project_id',
  'partner_id',
  'partner_budget_id',
  'template_id',
  'number',
  'title',
  'state',
  'substatus_json',
  'approval_provider',
  'approval_ref',
  'docusign_envelope_id',
  'generated_docx_key',
  'approved_docx_key',
  'signed_pdf_key',
  'metadata_json',
  'created_by',
  'created_at',
  'updated_at'
];

class ContractRepository {
  static async create(contract, client = db.pool) {
    const useTransaction = !client.query.name; // Check if we're already in a transaction
    const dbClient = useTransaction ? await db.pool.connect() : client;
    
    try {
      if (useTransaction) await dbClient.query('BEGIN');

      const result = await dbClient.query(
        `
          INSERT INTO contracts (
            id,
            project_id,
            partner_id,
            partner_budget_id,
            template_id,
            number,
            title,
            state,
            substatus_json,
            metadata_json,
            created_by,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            COALESCE($8, 'DRAFT'),
            COALESCE($9, '{}'::jsonb),
            COALESCE($10, '{}'::jsonb),
            $11,
            now(),
            now()
          )
          RETURNING ${CONTRACT_COLUMNS.join(', ')}
        `,
        [
          contract.id,
          contract.projectId,
          contract.partnerId,
          contract.partnerBudgetId,
          contract.templateId,
          contract.number,
          contract.title,
          contract.state,
          contract.substatusJson,
          contract.metadataJson,
          contract.createdBy
        ]
      );

      const createdContract = ContractRepository.mapRow(result.rows[0]);

      // Create SSOT record
      const ssotPayload = {
        id: createdContract.id,
        projectId: createdContract.projectId,
        partnerId: createdContract.partnerId,
        title: createdContract.title,
        description: null, // contracts table doesn't have description
        startDate: null, // would need to be added if required
        endDate: null, // would need to be added if required
        currency: null, // would need to be added if required
        totalAmount: null, // would need to be added if required
        status: createdContract.state,
        templateId: createdContract.templateId,
        createdBy: createdContract.createdBy,
        createdAt: createdContract.createdAt,
        updatedAt: createdContract.updatedAt
      };

      await ContractSSOTRepository.create(ssotPayload, dbClient);

      if (useTransaction) await dbClient.query('COMMIT');
      return createdContract;
    } catch (error) {
      if (useTransaction) await dbClient.query('ROLLBACK');
      throw error;
    } finally {
      if (useTransaction) dbClient.release();
    }
  }

  static async findById(id, client = db.pool) {
    const result = await client.query(
      `SELECT ${CONTRACT_COLUMNS.join(', ')} FROM contracts WHERE id = $1`,
      [id]
    );
    return result.rows.length ? ContractRepository.mapRow(result.rows[0]) : null;
  }

  static async list(filters = {}, client = db.pool) {
    const conditions = [];
    const values = [];

    if (filters.projectId) {
      values.push(filters.projectId);
      conditions.push(`project_id = $${values.length}`);
    }
    if (filters.partnerId) {
      values.push(filters.partnerId);
      conditions.push(`partner_id = $${values.length}`);
    }
    if (filters.state) {
      values.push(filters.state);
      conditions.push(`state = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT ${CONTRACT_COLUMNS.join(', ')}
      FROM contracts
      ${where}
      ORDER BY updated_at DESC
    `;
    const result = await client.query(query, values);
    return result.rows.map(ContractRepository.mapRow);
  }

  static async update(id, updates, client = db.pool) {
    const useTransaction = !client.query.name;
    const dbClient = useTransaction ? await db.pool.connect() : client;
    
    try {
      if (useTransaction) await dbClient.query('BEGIN');

      const fields = [];
      const values = [];
      let index = 1;

      if (updates.projectId !== undefined) {
        fields.push(`project_id = $${index++}`);
        values.push(updates.projectId);
      }
      if (updates.partnerId !== undefined) {
        fields.push(`partner_id = $${index++}`);
        values.push(updates.partnerId);
      }
      if (updates.partnerBudgetId !== undefined) {
        fields.push(`partner_budget_id = $${index++}`);
        values.push(updates.partnerBudgetId);
      }
      if (updates.templateId !== undefined) {
        fields.push(`template_id = $${index++}`);
        values.push(updates.templateId);
      }
      if (updates.number !== undefined) {
        fields.push(`number = $${index++}`);
        values.push(updates.number);
      }
      if (updates.title !== undefined) {
        fields.push(`title = $${index++}`);
        values.push(updates.title);
      }
      if (updates.state !== undefined) {
        fields.push(`state = $${index++}`);
        values.push(updates.state);
      }
      if (updates.substatusJson !== undefined) {
        fields.push(`substatus_json = $${index++}`);
        values.push(updates.substatusJson);
      }
      if (updates.approvalProvider !== undefined) {
        fields.push(`approval_provider = $${index++}`);
        values.push(updates.approvalProvider);
      }
      if (updates.approvalRef !== undefined) {
        fields.push(`approval_ref = $${index++}`);
        values.push(updates.approvalRef);
      }
      if (updates.docusignEnvelopeId !== undefined) {
        fields.push(`docusign_envelope_id = $${index++}`);
        values.push(updates.docusignEnvelopeId);
      }
      if (updates.generatedDocxKey !== undefined) {
        fields.push(`generated_docx_key = $${index++}`);
        values.push(updates.generatedDocxKey);
      }
      if (updates.approvedDocxKey !== undefined) {
        fields.push(`approved_docx_key = $${index++}`);
        values.push(updates.approvedDocxKey);
      }
      if (updates.signedPdfKey !== undefined) {
        fields.push(`signed_pdf_key = $${index++}`);
        values.push(updates.signedPdfKey);
      }
      if (updates.metadataJson !== undefined) {
        fields.push(`metadata_json = $${index++}`);
        values.push(updates.metadataJson);
      }

      if (fields.length === 0) {
        return ContractRepository.findById(id, dbClient);
      }

      const query = `
        UPDATE contracts
        SET ${fields.join(', ')}, updated_at = now()
        WHERE id = $${index}
        RETURNING ${CONTRACT_COLUMNS.join(', ')}
      `;
      values.push(id);

      const result = await dbClient.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      
      const updatedContract = ContractRepository.mapRow(result.rows[0]);

      // Update SSOT record
      const ssotUpdates = {
        projectId: updatedContract.projectId,
        partnerId: updatedContract.partnerId,
        title: updatedContract.title,
        status: updatedContract.state,
        templateId: updatedContract.templateId,
        updatedAt: updatedContract.updatedAt
      };

      await ContractSSOTRepository.update(id, ssotUpdates, dbClient);

      if (useTransaction) await dbClient.query('COMMIT');
      return updatedContract;
    } catch (error) {
      if (useTransaction) await dbClient.query('ROLLBACK');
      throw error;
    } finally {
      if (useTransaction) dbClient.release();
    }
  }

  static async findByPartnerAndProject(partnerId, projectId, client = db.pool) {
    const result = await client.query(
      `SELECT ${CONTRACT_COLUMNS.join(', ')} FROM contracts WHERE partner_id = $1 AND project_id = $2 ORDER BY updated_at DESC`,
      [partnerId, projectId]
    );
    return result.rows.map(ContractRepository.mapRow);
  }

  static async updateFields(id, updates, client = db.pool) {
    const setters = [];
    const values = [];
    let index = 1;

    Object.entries(updates).forEach(([column, value]) => {
      setters.push(`${column} = $${index}`);
      values.push(value);
      index += 1;
    });

    if (!setters.length) {
      return ContractRepository.findById(id, client);
    }

    values.push(id);
    const result = await client.query(
      `
        UPDATE contracts
        SET ${setters.join(', ')}, updated_at = now()
        WHERE id = $${values.length}
        RETURNING ${CONTRACT_COLUMNS.join(', ')}
      `,
      values
    );

    return result.rows.length ? ContractRepository.mapRow(result.rows[0]) : null;
  }

  static async updateState(id, state, client = db.pool) {
    const result = await client.query(
      `
        UPDATE contracts
        SET state = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING ${CONTRACT_COLUMNS.join(', ')}
      `,
      [id, state]
    );
    return result.rows.length ? ContractRepository.mapRow(result.rows[0]) : null;
  }

  static async updateSubstatus(id, substatusJson, client = db.pool) {
    const result = await client.query(
      `
        UPDATE contracts
        SET substatus_json = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING ${CONTRACT_COLUMNS.join(', ')}
      `,
      [id, substatusJson]
    );
    return result.rows.length ? ContractRepository.mapRow(result.rows[0]) : null;
  }

  static async setApproval(id, provider, reference, client = db.pool) {
    return ContractRepository.updateFields(
      id,
      {
        approval_provider: provider,
        approval_ref: reference
      },
      client
    );
  }

  static async setEnvelope(id, envelopeId, client = db.pool) {
    return ContractRepository.updateFields(
      id,
      {
        docusign_envelope_id: envelopeId
      },
      client
    );
  }

  static async setDocumentKey(id, column, key, client = db.pool) {
    return ContractRepository.updateFields(
      id,
      {
        [column]: key
      },
      client
    );
  }

  static async setMetadata(id, metadataJson, client = db.pool) {
    return ContractRepository.updateFields(
      id,
      {
        metadata_json: metadataJson
      },
      client
    );
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      projectId: row.project_id,
      partnerId: row.partner_id,
      partnerBudgetId: row.partner_budget_id,
      templateId: row.template_id,
      number: row.number,
      title: row.title,
      state: row.state,
      substatusJson: row.substatus_json,
      approvalProvider: row.approval_provider,
      approvalRef: row.approval_ref,
      docusignEnvelopeId: row.docusign_envelope_id,
      generatedDocxKey: row.generated_docx_key,
      approvedDocxKey: row.approved_docx_key,
      signedPdfKey: row.signed_pdf_key,
      metadataJson: row.metadata_json,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = ContractRepository;