import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './ProjectManagement.css';

interface Project {
  id: string;
  name: string;
  description: string;
  open_date: string;
  close_date: string;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BudgetCategory {
  id: string;
  project_id: string;
  name: string;
  description: string;
  cap_amount: number | null;
  cap_percentage: number | null;
  is_active: boolean;
}

const ProjectManagement: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    cap_amount: '',
    cap_percentage: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.projects.getAll();
      setProjects(response.data || response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (projectId: string) => {
    try {
      const response = await api.projects.getBudgetCategories(projectId);
      setCategories(response.data || response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch budget categories');
      console.error('Error fetching categories:', err);
    }
  };

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project);
    await fetchCategories(project.id);
  };

  const handleAddCategory = async () => {
    if (!selectedProject || !newCategory.name) {
      setError('Please fill in the category name');
      return;
    }

    try {
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        cap_amount: newCategory.cap_amount ? parseFloat(newCategory.cap_amount) : null,
        cap_percentage: newCategory.cap_percentage ? parseFloat(newCategory.cap_percentage) : null,
        is_active: true
      };

      await api.projects.addBudgetCategory(selectedProject.id, categoryData);
      
      // Reset form
      setNewCategory({
        name: '',
        description: '',
        cap_amount: '',
        cap_percentage: ''
      });
      
      // Refresh categories
      await fetchCategories(selectedProject.id);
      
      setSuccess('Category added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add category');
      console.error('Error adding category:', err);
    }
  };

  const handleToggleCategory = async (categoryId: string, isActive: boolean) => {
    try {
      // Find the category in the local state
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      // Update the category status
      const updatedCategory = { ...category, is_active: !isActive };
      
      // Update the local state
      const updatedCategories = categories.map(c => 
        c.id === categoryId ? updatedCategory : c
      );
      setCategories(updatedCategories);
      
      // Update the category on the server
      await api.budgetCategories.update(categoryId, updatedCategory);
      
      setSuccess(`Category ${isActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update category');
      console.error('Error updating category:', err);
      
      // Revert the local state change if the server update fails
      const revertedCategories = categories.map(c => 
        c.id === categoryId ? { ...c, is_active: isActive } : c
      );
      setCategories(revertedCategories);
    }
  };

  if (loading) {
    return <div className="project-management">Loading projects...</div>;
  }

  return (
    <div className="project-management">
      <div className="page-header">
        <h1>Project Management</h1>
        <p>Manage projects and budget categories</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="management-content">
        {!selectedProject ? (
          <div className="project-list">
            <h2>Projects</h2>
            {projects.length === 0 ? (
              <p>No projects found.</p>
            ) : (
              <div className="project-cards">
                {projects.map(project => (
                  <div key={project.id} className="project-card" onClick={() => handleProjectSelect(project)}>
                    <h3>{project.name}</h3>
                    <p className="description">{project.description}</p>
                    <div className="project-details">
                      <span className={`status ${project.status}`}>{project.status}</span>
                      <span className="dates">
                        {new Date(project.open_date).toLocaleDateString()} - {new Date(project.close_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="project-detail">
            <div className="detail-header">
              <button className="back-button" onClick={() => setSelectedProject(null)}>
                &larr; Back to Projects
              </button>
              <h2>{selectedProject.name}</h2>
              <p className="description">{selectedProject.description}</p>
              <div className="project-details">
                <span className={`status ${selectedProject.status}`}>{selectedProject.status}</span>
                <span className="dates">
                  {new Date(selectedProject.open_date).toLocaleDateString()} - {new Date(selectedProject.close_date).toLocaleDateString()}
                </span>
                <span className="currency">Currency: {selectedProject.currency}</span>
              </div>
            </div>
            
            <div className="categories-section">
              <h3>Budget Categories</h3>
              
              <div className="add-category-form">
                <h4>Add New Category</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category-name">Category Name *</label>
                    <input
                      type="text"
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category-description">Description</label>
                    <input
                      type="text"
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cap-amount">Cap Amount</label>
                    <input
                      type="number"
                      id="cap-amount"
                      value={newCategory.cap_amount}
                      onChange={(e) => setNewCategory({...newCategory, cap_amount: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cap-percentage">Cap Percentage</label>
                    <input
                      type="number"
                      id="cap-percentage"
                      value={newCategory.cap_percentage}
                      onChange={(e) => setNewCategory({...newCategory, cap_percentage: e.target.value})}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <button className="btn btn-primary" onClick={handleAddCategory}>
                  Add Category
                </button>
              </div>
              
              <div className="categories-list">
                <h4>Existing Categories</h4>
                {categories.length === 0 ? (
                  <p>No categories found for this project.</p>
                ) : (
                  <table className="categories-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Cap Amount</th>
                        <th>Cap Percentage</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => (
                        <tr key={category.id}>
                          <td>{category.name}</td>
                          <td>{category.description}</td>
                          <td>{category.cap_amount !== null ? category.cap_amount : 'N/A'}</td>
                          <td>{category.cap_percentage !== null ? `${category.cap_percentage}%` : 'N/A'}</td>
                          <td>
                            <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className={`btn btn-sm ${category.is_active ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleToggleCategory(category.id, category.is_active)}
                            >
                              {category.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagement;