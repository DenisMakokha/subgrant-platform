const db = require('../config/database');

class Organization {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.legal_name = data.legal_name;
    this.registration_number = data.registration_number;
    this.tax_id = data.tax_id;
    this.address = data.address;
    this.country = data.country;
    this.phone = data.phone;
    this.email = data.email;
    this.website = data.website;
    this.description = data.description;
    this.status = data.status || 'pending';
    this.compliance_status = data.compliance_status || 'pending';
    this.due_diligence_completed = data.due_diligence_completed || false;
    this.due_diligence_date = data.due_diligence_date;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  // Create a new organization
  static async create(organizationData) {
    const query = `
      INSERT INTO organizations (
        name, legal_name, registration_number, tax_id, address, country, phone, email,
        website, description, status, compliance_status, due_diligence_completed,
        due_diligence_date, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;
    
    const values = [
      organizationData.name,
      organizationData.legal_name,
      organizationData.registration_number,
      organizationData.tax_id,
      organizationData.address,
      organizationData.country,
      organizationData.phone,
      organizationData.email,
      organizationData.website,
      organizationData.description,
      organizationData.status || 'pending',
      organizationData.compliance_status || 'pending',
      organizationData.due_diligence_completed || false,
      organizationData.due_diligence_date,
      organizationData.created_by,
      organizationData.updated_by
    ];
    
    const result = await db.query(query, values);
    return new Organization(result.rows[0]);
  }

  // Find organization by ID
  static async findById(id) {
    const query = 'SELECT * FROM organizations WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length ? new Organization(result.rows[0]) : null;
  }

  // Find organization by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM organizations WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows.length ? new Organization(result.rows[0]) : null;
  }

  // Find all organizations
  static async findAll() {
    const query = 'SELECT * FROM organizations ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows.map(org => new Organization(org));
  }

  // Update organization
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in updateData) {
      if (updateData.hasOwnProperty(key) && key !== 'id') {
        fields.push(`${key} = $${index}`);
        values.push(updateData[key]);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE organizations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows.length ? new Organization(result.rows[0]) : null;
  }

  // Delete organization
  static async delete(id) {
    const query = 'DELETE FROM organizations WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows.length ? new Organization(result.rows[0]) : null;
  }
}

module.exports = Organization;