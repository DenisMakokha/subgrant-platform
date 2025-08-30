import api from './api';

export interface Document {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string;
  document_uri: string;
  document_name: string;
  mime_type: string;
  version: number;
  checksum: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFormData {
  entity_type: string;
  entity_id: string;
  title: string;
  description: string;
  document_uri: string;
  document_name: string;
  mime_type: string;
  version?: number;
  checksum?: string;
  uploaded_by?: string;
}

class DocumentService {
  // Get all documents with optional filters
  async getAllDocuments(filters: Record<string, any> = {}): Promise<Document[]> {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.fetchWithAuth(`/documents?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  // Get a document by ID
  async getDocumentById(id: string): Promise<Document> {
    try {
      const response = await api.fetchWithAuth(`/documents/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  // Get documents by entity
  async getDocumentsByEntity(entityType: string, entityId: string): Promise<Document[]> {
    try {
      const response = await api.fetchWithAuth(`/documents/entity/${entityType}/${entityId}`);
      return response;
    } catch (error) {
      console.error('Error fetching documents by entity:', error);
      throw error;
    }
  }

  // Get documents by user
  async getDocumentsByUser(userId: string): Promise<Document[]> {
    try {
      const response = await api.fetchWithAuth(`/documents/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching documents by user:', error);
      throw error;
    }
  }

  // Create a new document
  async createDocument(documentData: DocumentFormData): Promise<Document> {
    try {
      const response = await api.fetchWithAuth('/documents', {
        method: 'POST',
        body: JSON.stringify(documentData),
      });
      return response;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Update a document
  async updateDocument(id: string, documentData: Partial<DocumentFormData>): Promise<Document> {
    try {
      const response = await api.fetchWithAuth(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(documentData),
      });
      return response;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document
  async deleteDocument(id: string): Promise<void> {
    try {
      await api.fetchWithAuth(`/documents/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get version history for a document entity
  async getVersionHistory(entityType: string, entityId: string): Promise<Document[]> {
    try {
      const response = await api.fetchWithAuth(`/documents/history/${entityType}/${entityId}`);
      return response;
    } catch (error) {
      console.error('Error fetching version history:', error);
      throw error;
    }
  }

  // Get the latest version of a document for a specific entity
  async getLatestVersion(entityType: string, entityId: string): Promise<Document> {
    try {
      const response = await api.fetchWithAuth(`/documents/latest/${entityType}/${entityId}`);
      return response;
    } catch (error) {
      console.error('Error fetching latest version:', error);
      throw error;
    }
  }

  // Verify document checksum
  async verifyChecksum(id: string, fileContent: string): Promise<boolean> {
    try {
      const response = await api.fetchWithAuth(`/documents/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ fileContent }),
      });
      return response.valid;
    } catch (error) {
      console.error('Error verifying checksum:', error);
      throw error;
    }
  }
}

const documentService = new DocumentService();
export default documentService;