import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getArchivedProjects, 
  getClosedProjects, 
  archiveProject, 
  closeProject, 
  searchProjects 
} from '../services/projects';
import { Project } from '../services/projects';
import './ProjectArchive.css';

const ProjectArchive: React.FC = () => {
  const { user } = useAuth();
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [closedProjects, setClosedProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'archived' | 'closed' | 'search'>('archived');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [archived, closed] = await Promise.all([
        getArchivedProjects(),
        getClosedProjects()
      ]);
      setArchivedProjects(archived);
      setClosedProjects(closed);
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      const archivedProject = await archiveProject(projectId);
      // Update the project in the list
      setArchivedProjects(prev => [...prev, archivedProject]);
      // Remove from closed projects if it was there
      setClosedProjects(prev => prev.filter(p => p.id !== projectId));
      // Update search results if needed
      if (activeTab === 'search') {
        setSearchResults(prev => prev.map(p => p.id === projectId ? archivedProject : p));
      }
    } catch (err) {
      setError('Failed to archive project');
      console.error(err);
    }
  };

  const handleCloseProject = async (projectId: string) => {
    try {
      const closedProject = await closeProject(projectId);
      // Update the project in the list
      setClosedProjects(prev => [...prev, closedProject]);
      // Remove from archived projects if it was there
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      // Update search results if needed
      if (activeTab === 'search') {
        setSearchResults(prev => prev.map(p => p.id === projectId ? closedProject : p));
      }
    } catch (err) {
      setError('Failed to close project');
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await searchProjects(searchTerm);
      setSearchResults(results);
      setActiveTab('search');
    } catch (err) {
      setError('Failed to search projects');
      console.error(err);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusClasses: Record<string, string> = {
      draft: 'status-draft',
      active: 'status-active',
      closed: 'status-closed',
      archived: 'status-archived',
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="project-archive-container">
        <div className="project-archive-card">
          <p>Please log in to view archived projects.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="project-archive-container">
        <div className="project-archive-card">
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-archive-container">
      <div className="project-archive-card">
        <div className="project-archive-header">
          <h1>Project Archive</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tabs">
          <button 
            className={activeTab === 'archived' ? 'active' : ''}
            onClick={() => setActiveTab('archived')}
          >
            Archived Projects ({archivedProjects.length})
          </button>
          <button 
            className={activeTab === 'closed' ? 'active' : ''}
            onClick={() => setActiveTab('closed')}
          >
            Closed Projects ({closedProjects.length})
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
            disabled={searchResults.length === 0}
          >
            Search Results ({searchResults.length})
          </button>
        </div>

        <div className="projects-content">
          {activeTab === 'archived' && (
            <div className="projects-list">
              <h2>Archived Projects</h2>
              {archivedProjects.length === 0 ? (
                <p className="no-projects">No archived projects found.</p>
              ) : (
                <div className="projects-grid">
                  {archivedProjects.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-header">
                        <h3>{project.name}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="project-details">
                        <p>{project.description}</p>
                        <div className="project-dates">
                          <span>Open: {new Date(project.open_date).toLocaleDateString()}</span>
                          <span>Close: {new Date(project.close_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="project-actions">
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleCloseProject(project.id)}
                        >
                          Close Project
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'closed' && (
            <div className="projects-list">
              <h2>Closed Projects</h2>
              {closedProjects.length === 0 ? (
                <p className="no-projects">No closed projects found.</p>
              ) : (
                <div className="projects-grid">
                  {closedProjects.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-header">
                        <h3>{project.name}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="project-details">
                        <p>{project.description}</p>
                        <div className="project-dates">
                          <span>Open: {new Date(project.open_date).toLocaleDateString()}</span>
                          <span>Close: {new Date(project.close_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="project-actions">
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleArchiveProject(project.id)}
                        >
                          Archive Project
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="projects-list">
              <h2>Search Results</h2>
              {searchResults.length === 0 ? (
                <p className="no-projects">No projects found matching your search.</p>
              ) : (
                <div className="projects-grid">
                  {searchResults.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-header">
                        <h3>{project.name}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="project-details">
                        <p>{project.description}</p>
                        <div className="project-dates">
                          <span>Open: {new Date(project.open_date).toLocaleDateString()}</span>
                          <span>Close: {new Date(project.close_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="project-actions">
                        {project.status !== 'archived' && (
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleArchiveProject(project.id)}
                          >
                            Archive Project
                          </button>
                        )}
                        {project.status !== 'closed' && project.status !== 'archived' && (
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleCloseProject(project.id)}
                          >
                            Close Project
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectArchive;