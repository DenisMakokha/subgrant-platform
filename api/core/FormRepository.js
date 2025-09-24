// Universal Form Repository Interface - Single Source of Truth for CRUD operations

// Standard API envelope for consistent transport
const createEnvelope = (data, meta = {}) => ({
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

// Standard error shape
const createApiError = (status, errors) => ({
  status,
  errors
});

// Base repository with common functionality
class BaseRepository {
  async create(dto, opts = {}) {
    throw new Error('create method must be implemented');
  }
  
  async read(id) {
    throw new Error('read method must be implemented');
  }
  
  async update(id, dto, opts = {}) {
    throw new Error('update method must be implemented');
  }
  
  async list(query = {}) {
    throw new Error('list method must be implemented');
  }
  
  async delete(id, opts = {}) {
    throw new Error('delete method must be implemented');
  }
  
  // Common utility methods
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
  
  handleConcurrencyConflict(expectedVersion, actualVersion) {
    if (expectedVersion !== undefined && actualVersion !== undefined && expectedVersion !== actualVersion) {
      throw new Error('CONFLICT');
    }
  }
}

module.exports = {
  BaseRepository,
  createEnvelope,
  createApiError
};
