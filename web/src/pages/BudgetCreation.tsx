import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/format';

// SVG Icons
const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalculatorIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

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
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalBudget = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Create New Budget
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Fill in the details below to create a comprehensive project budget
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-sm text-blue-100 font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Budget Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalculatorIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalBudget, budgetForm.currency)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {budgetLines.length} budget line{budgetLines.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="glass-card p-4 border-l-4 border-green-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Budget Information */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Budget Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={budgetForm.title}
                onChange={handleFormChange}
                className="input-field"
                placeholder="Enter budget title..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={budgetForm.description}
                onChange={handleFormChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Describe the budget purpose and scope..."
              />
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project *
              </label>
              <select
                id="project_id"
                name="project_id"
                value={budgetForm.project_id}
                onChange={handleFormChange}
                className="input-field"
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

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={budgetForm.currency}
                onChange={handleFormChange}
                className="input-field"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Budget Lines */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Budget Lines</h2>
            <button 
              type="button" 
              className="btn-secondary flex items-center gap-2"
              onClick={addBudgetLine}
            >
              <PlusIcon />
              Add Line
            </button>
          </div>
          
          <div className="space-y-6">
            {budgetLines.map((line, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Budget Line {index + 1}
                  </h3>
                  {budgetLines.length > 1 && (
                    <button 
                      type="button" 
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => removeBudgetLine(index)}
                      title="Remove budget line"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      id={`description-${index}`}
                      value={line.description}
                      onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      className="input-field"
                      placeholder="Enter budget line description..."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`category-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      id={`category-${index}`}
                      value={line.category_id}
                      onChange={(e) => handleLineChange(index, 'category_id', e.target.value)}
                      className="input-field"
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

                  <div>
                    <label htmlFor={`unit-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      id={`unit-${index}`}
                      value={line.unit}
                      onChange={(e) => handleLineChange(index, 'unit', e.target.value)}
                      className="input-field"
                      placeholder="e.g., hours, pieces, months"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id={`quantity-${index}`}
                      value={line.quantity}
                      onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor={`unit_cost-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit Cost *
                    </label>
                    <input
                      type="number"
                      id={`unit_cost-${index}`}
                      value={line.unit_cost}
                      onChange={(e) => handleLineChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Cost
                    </label>
                    <div className="input-field bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium">
                      {formatCurrency(line.total_cost, budgetForm.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Submit Actions */}
        <div className="glass-card p-6">
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              Reset Form
            </button>
            <button 
              type="submit" 
              className="btn-primary flex items-center gap-2"
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              Create Budget
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BudgetCreation;