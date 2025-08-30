import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import auditLogService from '../services/auditLogs';
import { AuditLog, AuditLogFilters } from '../services/auditLogs';
import './AuditLogs.css';

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogService.getAuditLogs(filters, page, 20);
      setAuditLogs(response.data);
      setTotalPages(response.pagination.pages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value || undefined }));
    setPage(1); // Reset to first page when filters change
  };

  const handleExport = async () => {
    try {
      const blob = await auditLogService.exportAuditLogs(filters, exportFormat);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export audit logs');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="audit-logs-container">
        <div className="audit-logs-card">
          <p>Please log in to view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-header">
        <h1>Audit Logs</h1>
        <p>View and export system audit logs</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="audit-logs-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="actor_id">Actor ID</label>
            <input
              type="text"
              id="actor_id"
              name="actor_id"
              value={filters.actor_id || ''}
              onChange={handleFilterChange}
              placeholder="Filter by actor ID"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="entity_type">Entity Type</label>
            <select
              id="entity_type"
              name="entity_type"
              value={filters.entity_type || ''}
              onChange={handleFilterChange}
            >
              <option value="">All Entity Types</option>
              <option value="budget">Budget</option>
              <option value="contract">Contract</option>
              <option value="disbursement">Disbursement</option>
              <option value="document">Document</option>
              <option value="project">Project</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="entity_id">Entity ID</label>
            <input
              type="text"
              id="entity_id"
              name="entity_id"
              value={filters.entity_id || ''}
              onChange={handleFilterChange}
              placeholder="Filter by entity ID"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="action">Action</label>
            <select
              id="action"
              name="action"
              value={filters.action || ''}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="SUBMIT">Submit</option>
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="start_date">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={filters.start_date || ''}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="end_date">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={filters.end_date || ''}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="export">Export</label>
            <div className="export-controls">
              <select
                id="export"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button className="btn btn-secondary" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <div className="audit-logs-content">
          <div className="audit-logs-table-container">
            <table className="audit-logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>{log.actor_id}</td>
                      <td>{log.action}</td>
                      <td>{log.entity_type}</td>
                      <td>{log.entity_id}</td>
                      <td>{log.ip_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {auditLogs.length > 0 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;