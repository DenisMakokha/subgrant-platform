const db = require('../config/database');

const THREAD_COLUMNS = [
  'id',
  'entity_type',
  'entity_id',
  'created_by',
  'created_at'
];

const COMMENT_COLUMNS = [
  'id',
  'thread_id',
  'author_user_id',
  'kind',
  'body',
  'attachments',
  'legacy_parent_id',
  'legacy_is_resolved',
  'legacy_resolved_at',
  'legacy_resolved_by',
  'legacy_updated_at',
  'created_at'
];

class ReviewThreadRepository {
  static async ensureThread(entityType, entityId, actorId, client = db.pool) {
    const selectQuery = `
      SELECT ${THREAD_COLUMNS.join(', ')}
      FROM review_threads
      WHERE entity_type = $1 AND entity_id = $2
      LIMIT 1
    `;
    const existing = await client.query(selectQuery, [entityType, entityId]);
    if (existing.rows.length > 0) {
      return ReviewThreadRepository.mapThread(existing.rows[0]);
    }

    const insertQuery = `
      INSERT INTO review_threads (id, entity_type, entity_id, created_by, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, now())
      RETURNING ${THREAD_COLUMNS.join(', ')}
    `;
    const result = await client.query(insertQuery, [entityType, entityId, actorId]);
    return ReviewThreadRepository.mapThread(result.rows[0]);
  }

  static async addComment({ threadId, authorUserId, kind, body, attachments, legacy }, client = db.pool) {
    const query = `
      INSERT INTO review_comments (
        id,
        thread_id,
        author_user_id,
        kind,
        body,
        attachments,
        legacy_parent_id,
        legacy_is_resolved,
        legacy_resolved_at,
        legacy_resolved_by,
        legacy_updated_at,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4,
        COALESCE($5, '[]'::jsonb),
        $6,
        $7,
        $8,
        $9,
        $10,
        now()
      )
      RETURNING ${COMMENT_COLUMNS.join(', ')}
    `;
    const values = [
      threadId,
      authorUserId,
      kind,
      body,
      attachments,
      legacy?.parentId || null,
      legacy?.isResolved ?? null,
      legacy?.resolvedAt || null,
      legacy?.resolvedBy || null,
      legacy?.updatedAt || null
    ];
    const result = await client.query(query, values);
    return ReviewThreadRepository.mapComment(result.rows[0]);
  }

  static async findThreadWithComments(entityType, entityId, client = db.pool) {
    const threadQuery = `
      SELECT ${THREAD_COLUMNS.join(', ')}
      FROM review_threads
      WHERE entity_type = $1 AND entity_id = $2
      LIMIT 1
    `;
    const threadResult = await client.query(threadQuery, [entityType, entityId]);
    if (threadResult.rows.length === 0) {
      return null;
    }

    const thread = ReviewThreadRepository.mapThread(threadResult.rows[0]);

    const commentsQuery = `
      SELECT ${COMMENT_COLUMNS.join(', ')}
      FROM review_comments
      WHERE thread_id = $1
      ORDER BY created_at ASC
    `;
    const commentsResult = await client.query(commentsQuery, [thread.id]);
    thread.comments = commentsResult.rows.map(ReviewThreadRepository.mapComment);
    return thread;
  }

  static async resolveComments(commentIds, resolverId, client = db.pool) {
    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return [];
    }

    const placeholders = commentIds.map((_, idx) => `$${idx + 2}`).join(', ');
    const query = `
      UPDATE review_comments
      SET legacy_is_resolved = true,
          legacy_resolved_at = now(),
          legacy_resolved_by = $1,
          legacy_updated_at = now()
      WHERE id IN (${placeholders})
      RETURNING ${COMMENT_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [resolverId, ...commentIds]);
    return result.rows.map(ReviewThreadRepository.mapComment);
  }

  static mapThread(row) {
    if (!row) return null;
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      comments: []
    };
  }

  static mapComment(row) {
    if (!row) return null;
    return {
      id: row.id,
      threadId: row.thread_id,
      authorUserId: row.author_user_id,
      kind: row.kind,
      body: row.body,
      attachments: row.attachments,
      legacy: {
        parentId: row.legacy_parent_id,
        isResolved: row.legacy_is_resolved,
        resolvedAt: row.legacy_resolved_at,
        resolvedBy: row.legacy_resolved_by,
        updatedAt: row.legacy_updated_at
      },
      createdAt: row.created_at
    };
  }
}

module.exports = ReviewThreadRepository;