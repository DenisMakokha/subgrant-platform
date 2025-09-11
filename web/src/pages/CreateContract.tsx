import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { contractDataService, ContractData } from '../services/contractDataService'; 
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface ContractFormData {
  title: string;
  description: string;
  template_id: string;
  budget_id: string;
  project_id: string;
  partner_id: string;
}

const CreateContract: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ContractFormData>({
    title: '',
    description: '',
    template_id: '',
    budget_id: '',
    project_id: '',
    partner_id: '',
  });

  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [availableBudgets, setAvailableBudgets] = useState<any[]>([]);
  const [availablePartners, setAvailablePartners] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [generatedContract, setGeneratedContract] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load available options for dropdowns
      const [projects, budgets, partners, templates] = await Promise.all([
        // Mock data for now - replace with real API calls
        Promise.resolve([
          { id: 'proj-001', name: 'Assessment of Life-Skills and Values in East Africa', description: 'Educational research project' },
          { id: 'proj-002', name: 'Community Health Initiative', description: 'Healthcare access program' },
          { id: 'proj-003', name: 'Water Access Project', description: 'Clean water infrastructure' },
        ]),
        Promise.resolve([
          { id: 'budget-001', project_id: 'proj-001', total_amount: 738948, currency: 'USD', description: 'Education Program Budget' },
          { id: 'budget-002', project_id: 'proj-002', total_amount: 200000, currency: 'USD', description: 'Healthcare Initiative Budget' },
          { id: 'budget-003', project_id: 'proj-003', total_amount: 100000, currency: 'USD', description: 'Water Access Budget' },
        ]),
        Promise.resolve([
          { id: 'partner-001', name: 'Luigi Giussani Institute of Higher Education', registration: 'Indigenous NGO Reg. No. 4760' },
          { id: 'partner-002', name: 'Community Health Partners', registration: 'NGO Reg. No. 5821' },
          { id: 'partner-003', name: 'Water for All Foundation', registration: 'NGO Reg. No. 6432' },
        ]),
        Promise.resolve([
          { id: 'template-001', name: 'Standard Sub-Grant Agreement', category: 'Standard' },
          { id: 'template-002', name: 'Education Program Contract', category: 'Education' },
          { id: 'template-003', name: 'Healthcare Services Agreement', category: 'Healthcare' },
        ])
      ]);

      setAvailableProjects(projects);
      setAvailableBudgets(budgets);
      setAvailablePartners(partners);
      setAvailableTemplates(templates);
    } catch (err) {
      setError('Failed to load initial data');
      console.error(err);
    }
  };

  const generateContractPreview = async () => {
    if (!formData.project_id || !formData.budget_id || !formData.partner_id || !formData.template_id) {
      return;
    }

    try {
      setLoading(true);
      const data = await contractDataService.compileContractData(
        formData.project_id,
        formData.budget_id,
        formData.partner_id
      );
      setContractData(data);

      const generated = await contractDataService.generateContract(
        formData.template_id,
        formData.project_id,
        formData.budget_id,
        formData.partner_id
      );
      setGeneratedContract(generated);
    } catch (err) {
      setError('Failed to generate contract preview');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateContractPreview();
  }, [formData.project_id, formData.budget_id, formData.partner_id, formData.template_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create contract with generated content
      const contractPayload = {
        ...formData,
        content: generatedContract,
        status: 'draft'
      };
      
      // Mock API call - replace with real implementation
      console.log('Creating contract:', contractPayload);
      
      setSuccess('Contract created successfully');
      setTimeout(() => {
        navigate('/contracts');
      }, 2000);
    } catch (err) {
      setError('Failed to create contract');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Contract</h1>
                <p className="text-blue-100">Generate a new sub-grant agreement</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/contracts')}
              className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contract Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Contract Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium shadow-sm"
                  placeholder="Sub-Grant Agreement 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Contract Template *
                </label>
                <select
                  name="template_id"
                  value={formData.template_id}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium shadow-sm"
                  required
                >
                  <option value="">Select Template</option>
                  {availableTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-base font-medium shadow-sm"
                  placeholder="Describe the purpose and objectives of this agreement..."
                />
              </div>
            </div>
          </div>

          {/* Data Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <BuildingOfficeIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project & Partner Selection</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Project *
                </label>
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium shadow-sm"
                  required
                >
                  <option value="">Select Project</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Partner Organization *
                </label>
                <select
                  name="partner_id"
                  value={formData.partner_id}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium shadow-sm"
                  required
                >
                  <option value="">Select Partner</option>
                  {availablePartners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Budget *
                </label>
                <select
                  name="budget_id"
                  value={formData.budget_id}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium shadow-sm"
                  required
                >
                  <option value="">Select Budget</option>
                  {availableBudgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.description} - ${budget.total_amount.toLocaleString()} {budget.currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contract Preview */}
          {generatedContract && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contract Preview</h2>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 max-h-96 overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200">
                    {generatedContract}
                  </pre>
                </div>
              </div>

              {contractData && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Project Details</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {contractData.project_name}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Budget Amount</h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {contractData.total_amount}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Partner</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      {contractData.partner_organization}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Create Contract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContract;
