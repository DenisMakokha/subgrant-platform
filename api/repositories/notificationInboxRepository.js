const db = require('../config/database');

class NotificationInboxRepository {
  static async create(inboxItem, client = db.pool) {
    const query = `
      INSERT INTO notif_inbox (
        id,
        user_id,
        tenant_id,
        event_key,
        title,
        body,
        link_url,
        unread,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      inboxItem.id,
      inboxItem.userId,
      inboxItem.tenantId || null,
      inboxItem.eventKey,
      inboxItem.title,
      inboxItem.body,
      inboxItem.linkUrl || null,
      inboxItem.unread !== undefined ? inboxItem.unread : true,
      inboxItem.createdAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.userId !== undefined) {
      fields.push(`user_id = $${index++}`);
      values.push(updates.userId);
    }
    if (updates.tenantId !== undefined) {
      fields.push(`tenant_id = $${index++}`);
      values.push(updates.tenantId);
    }
    if (updates.eventKey !== undefined) {
      fields.push(`event_key = $${index++}`);
      values.push(updates.eventKey);
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(updates.title);
    }
    if (updates.body !== undefined) {
      fields.push(`body = $${index++}`);
      values.push(updates.body);
    }
    if (updates.linkUrl !== undefined) {
      fields.push(`link_url = $${index++}`);
      values.push(updates.linkUrl);
    }
    if (updates.unread !== undefined) {
      fields.push(`unread = $${index++}`);
      values.push(updates.unread);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE notif_inbox
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
      FROM notif_inbox
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUser(userId, limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_inbox
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await client.query(query, [userId, limit]);
    return result.rows;
  }
  
  static async findByUserAndUnread(userId, limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_inbox
      WHERE user_id = $1 AND unread = true
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await client.query(query, [userId, limit]);
    return result.rows;
  }
  
  static async markAsRead(id, client = db.pool) {
    const query = `
      UPDATE notif_inbox
      SET unread = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async markAllAsRead(userId, client = db.pool) {
    const query = `
      UPDATE notif_inbox
      SET unread = false
      WHERE user_id = $1 AND unread = true
      RETURNING *
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  }
  
  static async countUnreadByUser(userId, client = db.pool) {
    const query = `
      SELECT COUNT(*) as count
      FROM notif_inbox
      WHERE user_id = $1 AND unread = true
    `;
    const result = await client.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM notif_inbox
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = NotificationInboxRepository;