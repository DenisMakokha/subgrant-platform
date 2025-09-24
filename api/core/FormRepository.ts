// Universal Form Repository Interface - Single Source of Truth for CRUD operations

export interface FormRepository<T> {
  create(dto: T, opts?: { idempotencyKey?: string; userId?: string }): Promise<T>;
  read(id: string): Promise<T | null>;
  update(id: string, dto: Partial<T>, opts?: { etag?: number; idempotencyKey?: string; userId?: string }): Promise<T>;
  list(query?: Record<string, unknown>): Promise<{ data: T[]; total: number }>;
  delete(id: string, opts?: { userId?: string }): Promise<void>;
}

// Standard API envelope for consistent transport
export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    etag?: number;
    version?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

// Standard error shape
export interface ApiError {
  status: number;
  errors: Record<string, string[]>;
}

// Helper functions for consistent API responses
export const createEnvelope = <T>(data: T, meta: any = {}): ApiEnvelope<T> => ({
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

export const createApiError = (status: number, errors: Record<string, string[]>): ApiError => ({
  status,
  errors
});

// Repository options
export interface RepositoryOptions {
  userId?: string;
  idempotencyKey?: string;
  etag?: number;
}

// Base repository with common functionality
export abstract class BaseRepository<T> implements FormRepository<T> {
  abstract create(dto: T, opts?: RepositoryOptions): Promise<T>;
  abstract read(id: string): Promise<T | null>;
  abstract update(id: string, dto: Partial<T>, opts?: RepositoryOptions): Promise<T>;
  abstract list(query?: Record<string, unknown>): Promise<{ data: T[]; total: number }>;
  abstract delete(id: string, opts?: RepositoryOptions): Promise<void>;
  
  // Common utility methods
  protected addMetadata(dto: any, opts?: RepositoryOptions): any {
    const now = new Date().toISOString();
    return {
      ...dto,
      updated_at: now,
      ...(opts?.userId && { updated_by: opts.userId }),
      ...(dto.id ? {} : { 
        created_at: now,
        ...(opts?.userId && { created_by: opts.userId })
      })
    };
  }
  
  protected handleConcurrencyConflict(expectedVersion?: number, actualVersion?: number): void {
    if (expectedVersion !== undefined && actualVersion !== undefined && expectedVersion !== actualVersion) {
      throw new Error('CONFLICT');
    }
  }
}
