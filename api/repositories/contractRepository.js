const db = require('../config/database');

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
    const result = await client.query(
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

    return ContractRepository.mapRow(result.rows[0]);
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