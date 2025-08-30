const db = require('../config/database');

class AuditLog {
  constructor(data) {
    this.id = data.id;
    this.actor_id = data.actor_id;
    this.action = data.action;
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.before_state = data.before_state;
    this.after_state = data.after_state;
    this.ip_address = data.ip_address;
    this.user_agent = data.user_agent;
    this.created_at = data.created_at;
  }

  static async create(auditData) {
    const query = `
      INSERT INTO audit_logs (
        actor_id, action, entity_type, entity_id, before_state, after_state, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    const values = [
      auditData.actor_id,
      auditData.action,
      auditData.entity_type,
      auditData.entity_id,
      auditData.before_state,
      auditData.after_state,
      auditData.ip_address,
      auditData.user_agent
    ];
    
    const result = await db.pool.query(query, values);
    return new AuditLog(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM audit_logs WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new AuditLog(result.rows[0]);
  }

  static async findByEntity(entityType, entityId) {
    const query = 'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [entityType, entityId]);
    
    return result.rows.map(row => new AuditLog(row));
  }

  static async findByActor(actorId) {
    const query = 'SELECT * FROM audit_logs WHERE actor_id = $1 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [actorId]);
    
    return result.rows.map(row => new AuditLog(row));
  }

  static async findByAction(action) {
    const query = 'SELECT * FROM audit_logs WHERE action = $1 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [action]);
    
    return result.rows.map(row => new AuditLog(row));
  }

  static async findAll(filters = {}, limit = 50, offset = 0) {
    let query = 'SELECT * FROM audit_logs';
    const values = [];
    const conditions = [];
    
    if (filters.actor_id) {
      values.push(filters.actor_id);
      conditions.push(`actor_id = $${values.length}`);
    }
    
    if (filters.entity_type) {
      values.push(filters.entity_type);
      conditions.push(`entity_type = $${values.length}`);
    }
    
    if (filters.entity_id) {
      values.push(filters.entity_id);
      conditions.push(`entity_id = $${values.length}`);
    }
    
    if (filters.action) {
      values.push(filters.action);
      conditions.push(`action = $${values.length}`);
    }
    
    if (filters.start_date) {
      values.push(filters.start_date);
      conditions.push(`created_at >= $${values.length}`);
    }
    
    if (filters.end_date) {
      values.push(filters.end_date);
      conditions.push(`created_at <= $${values.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new AuditLog(row));
  }

  static async getCount(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM audit_logs';
    const values = [];
    const conditions = [];
    
    if (filters.actor_id) {
      values.push(filters.actor_id);
      conditions.push(`actor_id = $${values.length}`);
    }
    
    if (filters.entity_type) {
      values.push(filters.entity_type);
      conditions.push(`entity_type = $${values.length}`);
    }
    
    if (filters.entity_id) {
      values.push(filters.entity_id);
      conditions.push(`entity_id = $${values.length}`);
    }
    
    if (filters.action) {
      values.push(filters.action);
      conditions.push(`action = $${values.length}`);
    }
    
    if (filters.start_date) {
      values.push(filters.start_date);
      conditions.push(`created_at >= $${values.length}`);
    }
    
    if (filters.end_date) {
      values.push(filters.end_date);
      conditions.push(`created_at <= $${values.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await db.pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  // Get audit logs with unusual patterns (multiple actions in short time period)
  static async getAnomalyLogs() {
    const query = `
      SELECT *
      FROM audit_logs
      WHERE action IN ('DELETE_BUDGET', 'DELETE_PROJECT', 'DELETE_ORGANIZATION')
        AND created_at >= CURRENT_DATE - INTERVAL '1 hour'
      GROUP BY actor_id, action, entity_type, entity_id,
               before_state, after_state, ip_address, user_agent, created_at, id
      HAVING COUNT(*) > 5
    `;
    
    const result = await db.pool.query(query);
    return result.rows.map(row => new AuditLog(row));
  }
}

module.exports = AuditLog;