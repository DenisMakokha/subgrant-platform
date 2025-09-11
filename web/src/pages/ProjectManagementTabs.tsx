import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api, { budgetCategoryApi } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  open_date: string;
  close_date: string;
  currency: string;
  status: string;
  budget_amount?: number;
  total_disbursed?: number;
  partner_count?: number;
  donor_name?: string;
  grant_number?: string;
  project_manager?: string;
  created_at: string;
  updated_at: string;
}

interface NewProject {
  name: string;
  description: string;
  open_date: string;
  close_date: string;
  currency: string;
  budget_amount: string;
  donor_name: string;
  grant_number: string;
  project_manager: string;
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

const ProjectManagementTabs: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    cap_amount: '',
    cap_percentage: '',
    is_active: true
  });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [budgetAllocations, setBudgetAllocations] = useState<{[categoryId: string]: string}>({});
  const [selectedBudgetCategories, setSelectedBudgetCategories] = useState<string[]>([]);
  const [isGeneratingGrantNumber, setIsGeneratingGrantNumber] = useState(false);
  
  // Determine active tab based on URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/create')) return 'create';
    if (path.includes('/timeline')) return 'timeline';
    if (path.includes('/categories')) return 'categories';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  const [newProject, setNewProject] = useState<NewProject>({
    name: '',
    description: '',
    open_date: '',
    close_date: '',
    currency: 'USD',
    budget_amount: '',
    donor_name: '',
    grant_number: '',
    project_manager: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  // Auto-generate grant number when switching to create tab
  useEffect(() => {
    if (activeTab === 'create' && !newProject.grant_number) {
      generateGrantNumber();
    }
  }, [activeTab, newProject.grant_number]);

  // Filter projects based on search and status
  useEffect(() => {
    let filtered = projects;
    
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.grant_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.projects.getAll();
      setProjects(response.projects || []);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await budgetCategoryApi.getAll();
      console.log('Categories response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.warn('Unexpected categories response format:', response);
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleCreateProject = async () => {
    try {
      // Validate budget allocations against category caps
      const totalBudget = parseFloat(newProject.budget_amount) || 0;
      const totalAllocated = Object.values(budgetAllocations).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
      
      for (const [categoryId, amount] of Object.entries(budgetAllocations)) {
        if (!amount) continue;
        const allocatedAmount = parseFloat(amount);
        const category = categories.find(cat => cat.id === categoryId);
        
        if (category?.cap_amount && allocatedAmount > category.cap_amount) {
          setError(`Allocation for ${category.name} exceeds maximum cap of ${newProject.currency} ${category.cap_amount.toLocaleString()}`);
          return;
        }
        
        if (category?.cap_percentage && totalBudget > 0) {
          const maxAllowed = (totalBudget * category.cap_percentage) / 100;
          if (allocatedAmount > maxAllowed) {
            setError(`Allocation for ${category.name} exceeds ${category.cap_percentage}% cap (${newProject.currency} ${maxAllowed.toLocaleString()})`);
            return;
          }
        }
      }

      const projectData = {
        ...newProject,
        budget_amount: totalBudget,
        budget_allocations: budgetAllocations
      };

      await api.projects.create(projectData);
      
      setNewProject({
        name: '',
        description: '',
        open_date: '',
        close_date: '',
        currency: 'USD',
        budget_amount: '',
        donor_name: '',
        grant_number: '',
        project_manager: ''
      });
      setBudgetAllocations({});
      setSelectedBudgetCategories([]);
      
      await fetchProjects();
      setSuccess('Project created successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowCreateModal(false);
      setActiveTab('overview');
    } catch (err) {
      setError('Failed to create project');
      console.error('Error creating project:', err);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      open_date: project.open_date.split('T')[0],
      close_date: project.close_date.split('T')[0],
      currency: project.currency,
      budget_amount: project.budget_amount?.toString() || '',
      donor_name: project.donor_name || '',
      grant_number: project.grant_number || '',
      project_manager: project.project_manager || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    
    try {
      await api.projects.update(selectedProject.id, {
        ...newProject,
        budget_amount: parseFloat(newProject.budget_amount) || 0
      });
      
      await fetchProjects();
      setSuccess('Project updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowEditModal(false);
      setSelectedProject(null);
    } catch (err) {
      setError('Failed to update project');
      console.error('Error updating project:', err);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete ${project.name}? This action cannot be undone.`)) {
      try {
        await api.projects.delete(project.id);
        setSuccess('Project deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        await fetchProjects();
      } catch (err) {
        setError('Failed to delete project');
        console.error('Error deleting project:', err);
      }
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  // Generate grant number function
  const generateGrantNumber = () => {
    setIsGeneratingGrantNumber(true);
    
    // Simulate API call delay for better UX
    setTimeout(() => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
      const grantNumber = `GRN-${year}${month}-${randomNum}`;
      
      setNewProject({...newProject, grant_number: grantNumber});
      setIsGeneratingGrantNumber(false);
    }, 800);
  };

  const exportProjects = () => {
    const csvContent = [
      ['Name', 'Description', 'Status', 'Budget', 'Currency', 'Donor', 'Start Date', 'End Date', 'Manager'].join(','),
      ...filteredProjects.map(project => [
        project.name,
        project.description,
        project.status,
        project.budget_amount || 0,
        project.currency,
        project.donor_name || '',
        project.open_date,
        project.close_date,
        project.project_manager || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleCreateCategory = async () => {
    if (isCreatingCategory) return;
    
    try {
      setIsCreatingCategory(true);
      setError(null);
      
      console.log('Creating category with data:', newCategory);
      
      // Check authentication
      const token = localStorage.getItem('auth_token');
      console.log('Auth token present:', !!token);
      
      if (!token) {
        console.log('No auth token found, redirecting to login');
        navigate('/login');
        return;
      }

      // Validate required fields
      if (!newCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      // Prepare category data
      const categoryData = {
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || '',
        cap_amount: newCategory.cap_amount && newCategory.cap_amount.trim() ? parseFloat(newCategory.cap_amount) : null,
        cap_percentage: newCategory.cap_percentage && newCategory.cap_percentage.trim() ? parseFloat(newCategory.cap_percentage) : null,
        is_active: newCategory.is_active
      };

      console.log('Sending category data to API:', categoryData);
      console.log('API URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/budget-categories`);
      
      const response = await budgetCategoryApi.create(categoryData);
      console.log('API response:', response);
      
      if (response && response.id) {
        setSuccess('Budget category created successfully!');
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        
        // Close modal and reset form
        setShowCreateCategoryModal(false);
        setNewCategory({
          name: '',
          description: '',
          cap_amount: '',
          cap_percentage: '',
          is_active: true
        });
        
        // Refresh categories list
        await fetchCategories();
        
        // Auto-select the new category in the project form
        setSelectedBudgetCategories(prev => [...prev, response.id]);
        
        // Clear any previous errors
        setError(null);
        
        console.log('Category created successfully with ID:', response.id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof Error) {
        setError(`Failed to create category: ${error.message}`);
      } else {
        setError('Failed to create category. Please try again.');
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      cap_amount: category.cap_amount?.toString() || '',
      cap_percentage: category.cap_percentage?.toString() || '',
      is_active: category.is_active
    });
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      await api.budgetCategories.update(selectedCategory.id, {
        ...newCategory,
        cap_amount: newCategory.cap_amount ? parseFloat(newCategory.cap_amount) : null,
        cap_percentage: newCategory.cap_percentage ? parseFloat(newCategory.cap_percentage) : null
      });
      
      await fetchCategories();
      setSuccess('Budget category updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
    } catch (err) {
      setError('Failed to update budget category');
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (category: BudgetCategory) => {
    if (window.confirm(`Are you sure you want to delete ${category.name}? This action cannot be undone.`)) {
      try {
        await api.budgetCategories.delete(category.id);
        setSuccess('Budget category deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        await fetchCategories();
      } catch (err) {
        setError('Failed to delete budget category');
        console.error('Error deleting category:', err);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'draft': return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'cancelled': return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default: return <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'active':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`}>Active</span>;
      case 'draft':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`}>Draft</span>;
      case 'completed':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}>Completed</span>;
      case 'cancelled':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`}>Cancelled</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportProjects}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Export
                  </button>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    New Project
                  </button>
                </div>
              </div>
            </div>

            {/* Projects Grid/List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {viewMode === 'grid' ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(project.status)}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
                          </div>
                          {getStatusBadge(project.status)}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <CurrencyDollarIcon className="w-4 h-4" />
                              Budget:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {project.currency} {project.budget_amount?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <BuildingOfficeIcon className="w-4 h-4" />
                              Donor:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{project.donor_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              Manager:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{project.project_manager || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleViewProject(project)}
                              className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="View project details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProject(project)}
                              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit project"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project)}
                              className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete project"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(project.open_date).toLocaleDateString()} - {new Date(project.close_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Donor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timeline</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(project.status)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{project.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(project.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {project.currency} {project.budget_amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {project.donor_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(project.open_date).toLocaleDateString()} - {new Date(project.close_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewProject(project)}
                                className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="View project details"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditProject(project)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Edit project"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project)}
                                className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Delete project"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {filteredProjects.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <ChartBarIcon className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first project.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Project</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set up a new grant project with budget allocations</p>
                  </div>
                </div>
              </div>
              
              {/* Form Content */}
              <div className="p-8">
                <div className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          placeholder="Enter project name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Grant Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newProject.grant_number}
                            onChange={(e) => setNewProject({...newProject, grant_number: e.target.value})}
                            className="w-full px-4 py-3 pr-32 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                            placeholder="Auto-generate or enter manually"
                          />
                          <button
                            type="button"
                            onClick={generateGrantNumber}
                            disabled={isGeneratingGrantNumber}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
                          >
                            {isGeneratingGrantNumber ? (
                              <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Regenerate</span>
                              </>
                            )}
                          </button>
                        </div>
                        {newProject.grant_number && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Grant number ready: {newProject.grant_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
              
                  {/* Description Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Project Description
                    </h4>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Description
                      </label>
                      <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm resize-none"
                        placeholder="Describe the project objectives, scope, and key activities..."
                      />
                    </div>
                  </div>
              
                  {/* Timeline Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Project Timeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newProject.open_date}
                          onChange={(e) => setNewProject({...newProject, open_date: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newProject.close_date}
                          onChange={(e) => setNewProject({...newProject, close_date: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
              
                  {/* Financial & Management Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Financial & Management Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Currency
                        </label>
                        <select
                          value={newProject.currency}
                          onChange={(e) => setNewProject({...newProject, currency: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="KES">KES - Kenyan Shilling</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Total Budget Amount
                        </label>
                        <input
                          type="number"
                          value={newProject.budget_amount}
                          onChange={(e) => setNewProject({...newProject, budget_amount: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Project Manager
                        </label>
                        <input
                          type="text"
                          value={newProject.project_manager}
                          onChange={(e) => setNewProject({...newProject, project_manager: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                          placeholder="Enter manager name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Donor Organization
                      </label>
                      <input
                        type="text"
                        value={newProject.donor_name}
                        onChange={(e) => setNewProject({...newProject, donor_name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="Enter donor organization name"
                      />
                    </div>
                  </div>

                  {/* Budget Category Allocations */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <TagIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Category Allocations</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Allocate your project budget across different categories</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateCategoryModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Create Category
                      </button>
                    </div>
                
                    {/* Total Allocation Display */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Allocated</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {newProject.currency} {Object.values(budgetAllocations).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Budget Remaining</p>
                          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            {newProject.currency} {((parseFloat(newProject.budget_amount) || 0) - Object.values(budgetAllocations).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Add Category Dropdown */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Add Budget Category
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value && !selectedBudgetCategories.includes(e.target.value)) {
                            setSelectedBudgetCategories([...selectedBudgetCategories, e.target.value]);
                            setBudgetAllocations({...budgetAllocations, [e.target.value]: ''});
                          }
                          e.target.value = '';
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select a category to add...</option>
                        {categories.filter(cat => cat.is_active && !selectedBudgetCategories.includes(cat.id)).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                            {category.cap_amount && ` (Max: ${newProject.currency} ${category.cap_amount.toLocaleString()})`}
                            {category.cap_percentage && ` (Cap: ${category.cap_percentage}%)`}
                          </option>
                        ))}
                      </select>
                    </div>

                {/* Selected Categories */}
                {selectedBudgetCategories.length > 0 && (
                  <div className="space-y-4">
                    {selectedBudgetCategories.map((categoryId) => {
                      const category = categories.find(cat => cat.id === categoryId);
                      if (!category) return null;
                      
                      return (
                        <div key={categoryId} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                  <TagIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 dark:text-white">{category.name}</h5>
                                  {category.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {(category.cap_amount || category.cap_percentage) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                                  {category.cap_amount && <div>Max: {newProject.currency} {category.cap_amount.toLocaleString()}</div>}
                                  {category.cap_percentage && <div>Cap: {category.cap_percentage}%</div>}
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedBudgetCategories(selectedBudgetCategories.filter(id => id !== categoryId));
                                  const newAllocations = {...budgetAllocations};
                                  delete newAllocations[categoryId];
                                  setBudgetAllocations(newAllocations);
                                }}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                title="Remove category"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                              <CurrencyDollarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Allocation Amount ({newProject.currency})
                              </label>
                              <input
                                type="number"
                                value={budgetAllocations[categoryId] || ''}
                                onChange={(e) => setBudgetAllocations({
                                  ...budgetAllocations,
                                  [categoryId]: e.target.value
                                })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm text-lg font-medium"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                    {selectedBudgetCategories.length === 0 && (
                      <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <TagIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No budget categories selected</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                          {categories.filter(cat => cat.is_active).length > 0 
                            ? "Select categories above or create new ones"
                            : "Create your first budget category"
                          }
                        </p>
                        {categories.filter(cat => cat.is_active).length === 0 && (
                          <button
                            onClick={() => setShowCreateCategoryModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Category
                          </button>
                        )}
                      </div>
                    )}
                  </div>
              
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateProject}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Project Timeline</h3>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <span className="font-medium">Start:</span>
                      <span className="ml-1">{new Date(project.open_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">End:</span>
                      <span className="ml-1">{new Date(project.close_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Duration:</span>
                      <span className="ml-1">
                        {Math.ceil((new Date(project.close_date).getTime() - new Date(project.open_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: project.status === 'completed' ? '100%' : 
                                 project.status === 'active' ? '60%' : '20%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No projects to display in timeline view.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            {/* Categories Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Categories</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage budget categories for project allocation</p>
                </div>
                <button
                  onClick={() => setShowCreateCategoryModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Category
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            category.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{category.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {category.cap_amount && (
                            <span>Cap Amount: ${category.cap_amount.toLocaleString()}</span>
                          )}
                          {category.cap_percentage && (
                            <span>Cap Percentage: {category.cap_percentage}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 dark:text-gray-500 mb-4">
                        <DocumentTextIcon className="w-16 h-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No budget categories found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first budget category to get started.</p>
                      <button
                        onClick={() => setShowCreateCategoryModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add Category
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header with Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Grants & Projects Management
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Manage grant projects, budgets, and categories
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

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-1">
          <nav className="flex space-x-1" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Projects Overview', icon: <ChartBarIcon className="w-4 h-4" /> },
              { id: 'create', name: 'Create Project', icon: <PlusIcon className="w-4 h-4" /> },
              { id: 'timeline', name: 'Project Timeline', icon: <CalendarIcon className="w-4 h-4" /> },
              { id: 'categories', name: 'Budget Categories', icon: <TagIcon className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                } flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="glass-card p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
          <p className="text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Tab Content */}
      {renderTabContent()}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grant Number
                    </label>
                    <input
                      type="text"
                      value={newProject.grant_number}
                      onChange={(e) => setNewProject({...newProject, grant_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newProject.open_date}
                      onChange={(e) => setNewProject({...newProject, open_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newProject.close_date}
                      onChange={(e) => setNewProject({...newProject, close_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={newProject.currency}
                      onChange={(e) => setNewProject({...newProject, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="KES">KES</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget Amount
                    </label>
                    <input
                      type="number"
                      value={newProject.budget_amount}
                      onChange={(e) => setNewProject({...newProject, budget_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Manager
                    </label>
                    <input
                      type="text"
                      value={newProject.project_manager}
                      onChange={(e) => setNewProject({...newProject, project_manager: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Donor Name
                  </label>
                  <input
                    type="text"
                    value={newProject.donor_name}
                    onChange={(e) => setNewProject({...newProject, donor_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Project</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProject(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grant Number
                    </label>
                    <input
                      type="text"
                      value={newProject.grant_number}
                      onChange={(e) => setNewProject({...newProject, grant_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newProject.open_date}
                      onChange={(e) => setNewProject({...newProject, open_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newProject.close_date}
                      onChange={(e) => setNewProject({...newProject, close_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={newProject.currency}
                      onChange={(e) => setNewProject({...newProject, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="KES">KES</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget Amount
                    </label>
                    <input
                      type="number"
                      value={newProject.budget_amount}
                      onChange={(e) => setNewProject({...newProject, budget_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Manager
                    </label>
                    <input
                      type="text"
                      value={newProject.project_manager}
                      onChange={(e) => setNewProject({...newProject, project_manager: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Donor Name
                  </label>
                  <input
                    type="text"
                    value={newProject.donor_name}
                    onChange={(e) => setNewProject({...newProject, donor_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProject(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Project Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedProject.status)}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProject.name}</h3>
                {getStatusBadge(selectedProject.status)}
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProject(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Project Details</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Grant Number:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.grant_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Project Manager:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.project_manager || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Donor:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.donor_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Timeline</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Start Date:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedProject.open_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">End Date:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedProject.close_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {Math.ceil((new Date(selectedProject.close_date).getTime() - new Date(selectedProject.open_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Budget Information</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Budget:</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedProject.currency} {selectedProject.budget_amount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Currency:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.currency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedProject.description || 'No description provided.'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditProject(selectedProject);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TagIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Create Budget Category</h3>
                    <p className="text-blue-100 text-sm">Define a new budget category for project allocation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h4>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium shadow-sm"
                        placeholder="e.g., Personnel, Equipment, Travel"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Description
                      </label>
                      <textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                        rows={5}
                        className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-base font-medium shadow-sm"
                        placeholder="Describe what this category covers and any specific guidelines..."
                      />
                    </div>
                  </div>
                </div>

                {/* Budget Constraints Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Constraints</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Optional limits to control spending in this category</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Maximum Amount ($)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 text-lg">$</span>
                        </div>
                        <input
                          type="number"
                          value={newCategory.cap_amount}
                          onChange={(e) => setNewCategory({...newCategory, cap_amount: e.target.value})}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                          placeholder="50,000"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Maximum Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newCategory.cap_percentage}
                          onChange={(e) => setNewCategory({...newCategory, cap_percentage: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                          placeholder="25"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 text-lg">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Category Status</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Control availability for project allocation</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={newCategory.is_active}
                        onChange={(e) => setNewCategory({...newCategory, is_active: e.target.checked})}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all duration-200"
                      />
                      <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active category
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowCreateCategoryModal(false)}
                    className="px-8 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategory.name.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {isCreatingCategory ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        Create Category
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TagIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Edit Budget Category</h3>
                    <p className="text-blue-100 text-sm">Modify budget category settings and allocation</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setSelectedCategory(null);
                  }}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Personnel, Equipment, Travel"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what this category covers..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cap Amount ($)
                    </label>
                    <input
                      type="number"
                      value={newCategory.cap_amount}
                      onChange={(e) => setNewCategory({...newCategory, cap_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional maximum amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cap Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={newCategory.cap_percentage}
                      onChange={(e) => setNewCategory({...newCategory, cap_percentage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional percentage cap"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={newCategory.is_active}
                    onChange={(e) => setNewCategory({...newCategory, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active category (available for use in projects)
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowEditCategoryModal(false);
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCategory}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementTabs;
