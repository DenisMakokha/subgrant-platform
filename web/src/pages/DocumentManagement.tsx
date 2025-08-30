import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import documentService from '../services/documents';
import { Document, DocumentFormData } from '../services/documents';
import './DocumentManagement.css';

const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>({
    entity_type: '',
    entity_id: '',
    title: '',
    description: '',
    document_uri: '',
    document_name: '',
    mime_type: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionHistory, setVersionHistory] = useState<Document[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [historyEntity, setHistoryEntity] = useState<{ type: string; id: string } | null>(null);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await documentService.getAllDocuments();
        setDocuments(data);
      } catch (err) {
        setError('Failed to fetch documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        document_name: file.name,
        mime_type: file.type,
        document_uri: URL.createObjectURL(file)
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload the file to a storage service and get a proper document_uri
      
      if (editingDocument) {
        // Update existing document
        const updatedDocument = await documentService.updateDocument(editingDocument.id, formData);
        setDocuments(prev => 
          prev.map(d => d.id === editingDocument.id ? updatedDocument : d)
        );
      } else {
        // Create new document
        const newDocument = await documentService.createDocument(formData);
        setDocuments(prev => [...prev, newDocument]);
      }
      
      // Reset form
      setFormData({
        entity_type: '',
        entity_id: '',
        title: '',
        description: '',
        document_uri: '',
        document_name: '',
        mime_type: ''
      });
      setSelectedFile(null);
      setShowForm(false);
      setEditingDocument(null);
    } catch (err) {
      setError('Failed to save document');
      console.error(err);
    }
  };

  // Handle edit document
  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      entity_type: document.entity_type,
      entity_id: document.entity_id,
      title: document.title,
      description: document.description,
      document_uri: document.document_uri,
      document_name: document.document_name,
      mime_type: document.mime_type
    });
    setShowForm(true);
  };

  // Handle delete document
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  // Handle view version history
  const handleViewHistory = async (entityType: string, entityId: string) => {
    try {
      const history = await documentService.getVersionHistory(entityType, entityId);
      setVersionHistory(history);
      setHistoryEntity({ type: entityType, id: entityId });
      setShowVersionHistory(true);
    } catch (err) {
      setError('Failed to fetch version history');
      console.error(err);
    }
  };

  // Handle view latest version
  const handleViewLatest = async (entityType: string, entityId: string) => {
    try {
      const latestDocument = await documentService.getLatestVersion(entityType, entityId);
      if (latestDocument) {
        // Open the latest document in a new tab
        window.open(latestDocument.document_uri, '_blank');
      } else {
        alert('No document found');
      }
    } catch (err) {
      setError('Failed to fetch latest version');
      console.error(err);
    }
  };

  // Handle verify checksum
  const handleVerifyChecksum = async (id: string) => {
    try {
      // In a real implementation, you would get the actual file content from the document
      // For now, we'll use a placeholder string to simulate the file content
      const fileContent = 'This is a placeholder for the actual file content';
      const isValid = await documentService.verifyChecksum(id, fileContent);
      
      if (isValid) {
        alert('Document checksum is valid');
      } else {
        alert('Document checksum is invalid');
      }
    } catch (err) {
      setError('Failed to verify checksum');
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingDocument(null);
    setFormData({
      entity_type: '',
      entity_id: '',
      title: '',
      description: '',
      document_uri: '',
      document_name: '',
      mime_type: ''
    });
    setSelectedFile(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="document-management">
        <div className="document-card">
          <p>Please log in to manage documents.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="document-management">Loading...</div>;
  }

  return (
    <div className="document-management">
      <div className="header">
        <h1>Document Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Upload Document
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm ? (
        <div className="form-container">
          <h2>{editingDocument ? 'Edit Document' : 'Upload Document'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="entity_type">Entity Type</label>
                <select
                  id="entity_type"
                  name="entity_type"
                  value={formData.entity_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Entity Type</option>
                  <option value="budget">Budget</option>
                  <option value="contract">Contract</option>
                  <option value="disbursement">Disbursement</option>
                  <option value="project">Project</option>
                  <option value="report">Report</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="entity_id">Entity ID</label>
                <input
                  type="text"
                  id="entity_id"
                  name="entity_id"
                  value={formData.entity_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="document">Document</label>
              <input
                type="file"
                id="document"
                name="document"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                required={!editingDocument}
              />
              {formData.document_name && (
                <div className="file-info">
                  Selected file: {formData.document_name}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingDocument ? 'Update' : 'Upload'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : showVersionHistory ? (
        <div className="version-history-container">
          <div className="header">
            <h2>Version History</h2>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowVersionHistory(false)}
            >
              Back to Documents
            </button>
          </div>
          
          {versionHistory.length === 0 ? (
            <p>No version history found.</p>
          ) : (
            <div className="version-history-list">
              <table className="table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>File Name</th>
                    <th>Uploaded By</th>
                    <th>Uploaded At</th>
                    <th>Checksum</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versionHistory.map(doc => (
                    <tr key={`${doc.id}-${doc.version}`}>
                      <td>{doc.version}</td>
                      <td>{doc.title}</td>
                      <td>{doc.description}</td>
                      <td>{doc.document_name}</td>
                      <td>{doc.uploaded_by}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>{doc.checksum.substring(0, 8)}...</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleVerifyChecksum(doc.id)}
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="documents-list">
          <h2>Documents</h2>
          {documents.length === 0 ? (
            <p>No documents found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>File Name</th>
                  <th>Version</th>
                  <th>Uploaded By</th>
                  <th>Uploaded At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(document => (
                  <tr key={document.id}>
                    <td>{document.title}</td>
                    <td>{document.entity_type}</td>
                    <td>{document.entity_id.substring(0, 8)}...</td>
                    <td>{document.document_name}</td>
                    <td>{document.version}</td>
                    <td>{document.uploaded_by}</td>
                    <td>{formatDate(document.created_at)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(document)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(document.id)}
                      >
                        Delete
                      </button>
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => handleViewHistory(document.entity_type, document.entity_id)}
                      >
                        History
                      </button>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewLatest(document.entity_type, document.entity_id)}
                      >
                        Latest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;