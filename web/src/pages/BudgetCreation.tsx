import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/format';
import './BudgetCreation.css';

interface BudgetForm {
  title: string;
  description: string;
  project_id: string;
  currency: string;
}

interface BudgetLine {
  id?: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  category_id: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  open_date: string;
  close_date: string;
  currency: string;
  status: string;
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

const BudgetCreation: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>({
    title: '',
    description: '',
    project_id: '',
    currency: 'USD'
  });
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([
    {
      description: '',
      unit: '',
      quantity: 0,
      unit_cost: 0,
      total_cost: 0,
      category_id: ''
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (budgetForm.project_id) {
      fetchCategories(budgetForm.project_id);
    }
  }, [budgetForm.project_id]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.projects.getAll();
      const openProjects = (response.data || response).filter((project: Project) => project.status === 'open');
      setProjects(openProjects);
      
      // Set default project if only one is available
      if (openProjects.length === 1) {
        setBudgetForm({ ...budgetForm, project_id: openProjects[0].id });
      }
      
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
      
      // Set default category for all budget lines if only one category is available
      if (response.data?.length === 1) {
        const updatedLines = budgetLines.map(line => ({
          ...line,
          category_id: response.data[0].id
        }));
        setBudgetLines(updatedLines);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch budget categories');
      console.error('Error fetching categories:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBudgetForm({ ...budgetForm, [name]: value });
  };

  const handleLineChange = (index: number, field: keyof BudgetLine, value: string | number) => {
    const updatedLines = [...budgetLines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    
    // Calculate total cost when quantity or unit cost changes
    if (field === 'quantity' || field === 'unit_cost') {
      const quantity = field === 'quantity' ? Number(value) : updatedLines[index].quantity;
      const unitCost = field === 'unit_cost' ? Number(value) : updatedLines[index].unit_cost;
      updatedLines[index].total_cost = quantity * unitCost;
    }
    
    setBudgetLines(updatedLines);
  };

  const addBudgetLine = () => {
    setBudgetLines([
      ...budgetLines,
      {
        description: '',
        unit: '',
        quantity: 0,
        unit_cost: 0,
        total_cost: 0,
        category_id: categories.length > 0 ? categories[0].id : ''
      }
    ]);
  };

  const removeBudgetLine = (index: number) => {
    if (budgetLines.length > 1) {
      const updatedLines = [...budgetLines];
      updatedLines.splice(index, 1);
      setBudgetLines(updatedLines);
    }
  };

  const calculateTotal = () => {
    return budgetLines.reduce((sum, line) => sum + line.total_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!budgetForm.title || !budgetForm.project_id) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Validate budget lines
      for (const line of budgetLines) {
        if (!line.description || !line.category_id || line.quantity <= 0 || line.unit_cost <= 0) {
          setError('Please fill in all required fields for each budget line');
          return;
        }
      }
      
      // Prepare budget data
      const budgetData = {
        ...budgetForm,
        organization_id: user?.organization?.id,
        budget_lines: budgetLines
      };
      
      // Submit budget
      await api.budgets.create(budgetData);
      
      setSuccess('Budget created successfully');
      setError(null);
      
      // Reset form
      setBudgetForm({
        title: '',
        description: '',
        project_id: '',
        currency: 'USD'
      });
      setBudgetLines([
        {
          description: '',
          unit: '',
          quantity: 0,
          unit_cost: 0,
          total_cost: 0,
          category_id: ''
        }
      ]);
      
      // Refresh projects and categories
      fetchProjects();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create budget');
      console.error('Error creating budget:', err);
    }
  };

  if (loading) {
    return <div className="budget-creation">Loading...</div>;
  }

  return (
    <div className="budget-creation">
      <div className="page-header">
        <h1>Create New Budget</h1>
        <p>Fill in the details below to create a new budget</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="budget-form">
        <div className="form-section">
          <h2>Budget Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Budget Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={budgetForm.title}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={budgetForm.description}
              onChange={handleFormChange}
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="project_id">Project *</label>
              <select
                id="project_id"
                name="project_id"
                value={budgetForm.project_id}
                onChange={handleFormChange}
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={budgetForm.currency}
                onChange={handleFormChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h2>Budget Lines</h2>
            <button type="button" className="btn btn-secondary" onClick={addBudgetLine}>
              Add Line
            </button>
          </div>
          
          {budgetLines.map((line, index) => (
            <div key={index} className="budget-line">
              <div className="line-header">
                <h3>Budget Line {index + 1}</h3>
                {budgetLines.length > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm"
                    onClick={() => removeBudgetLine(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`description-${index}`}>Description *</label>
                  <input
                    type="text"
                    id={`description-${index}`}
                    value={line.description}
                    onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`category-${index}`}>Category *</label>
                  <select
                    id={`category-${index}`}
                    value={line.category_id}
                    onChange={(e) => handleLineChange(index, 'category_id', e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`unit-${index}`}>Unit</label>
                  <input
                    type="text"
                    id={`unit-${index}`}
                    value={line.unit}
                    onChange={(e) => handleLineChange(index, 'unit', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`quantity-${index}`}>Quantity *</label>
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    value={line.quantity}
                    onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`unit_cost-${index}`}>Unit Cost *</label>
                  <input
                    type="number"
                    id={`unit_cost-${index}`}
                    value={line.unit_cost}
                    onChange={(e) => handleLineChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Cost</label>
                  <input
                    type="text"
                    value={formatCurrency(line.total_cost, budgetForm.currency)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="total-section">
            <div className="total-row">
              <span>Total Budget Amount:</span>
              <span className="total-amount">{formatCurrency(calculateTotal(), budgetForm.currency)}</span>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Create Budget
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetCreation;