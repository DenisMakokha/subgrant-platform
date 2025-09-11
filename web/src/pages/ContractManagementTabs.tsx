import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getContracts, createContract, updateContract, deleteContract, sendContractForSigning, generateContractPDF, getContractTemplates, getProjectsForContract, getBudgetsForContract } from '../services/contracts';
import { contractDataService, ContractData } from '../services/contractDataService';
import { Contract } from '../types';
import {
  DocumentIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const ContractManagementTabs: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [formData, setFormData] = useState<Partial<Contract>>({
    budget_id: '',
    template_id: '',
    title: '',
    description: '',
  });

  // Create Contract form state
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    template_id: '',
    budget_id: '',
  });
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [availableBudgets, setAvailableBudgets] = useState<any[]>([]);
  const [availablePartners, setAvailablePartners] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [generatedContract, setGeneratedContract] = useState<string>('');
  
  // Template management state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateViewModal, setShowTemplateViewModal] = useState(false);
  
  // Grantor Details modal state
  const [showGrantorModal, setShowGrantorModal] = useState(false);
  const [grantorData, setGrantorData] = useState({
    organization_name: 'Zizi Afrique Foundation',
    contact_person: 'Dr. Sarah Mwangi',
    email: 'grants@ziziafrique.org',
    phone: '+254 20 123 4567',
    address: 'Westlands Road, Nairobi, Kenya',
    website: 'https://www.ziziafrique.org',
    tax_id: 'KRA-PIN-A012345678Z',
    registration_number: 'NGO-2019-001'
  });

  // Data Integration modal state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [integrationData, setIntegrationData] = useState({
    docusign: {
      enabled: false,
      api_key: '',
      account_id: '',
      user_id: '',
      environment: 'sandbox'
    },
    pandadoc: {
      enabled: false,
      api_key: '',
      workspace_id: ''
    },
    quickbooks: {
      enabled: false,
      client_id: '',
      client_secret: '',
      sandbox: true
    },
    sendgrid: {
      enabled: false,
      api_key: '',
      from_email: ''
    },
    twilio: {
      enabled: false,
      account_sid: '',
      auth_token: '',
      phone_number: ''
    }
  });

  // Determine active tab based on URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/create')) return 'create';
    if (path.includes('/templates')) return 'templates';
    if (path.includes('/signing')) return 'signing';
    if (path.includes('/compliance')) return 'compliance';
    if (path.includes('/settings')) return 'settings';
    return 'contracts';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  const tabs = [
    { id: 'contracts', name: 'Active Contracts', icon: DocumentIcon },
    { id: 'create', name: 'Create Contract', icon: PlusIcon },
    { id: 'templates', name: 'Templates', icon: DocumentCheckIcon },
    { id: 'signing', name: 'Digital Signing', icon: PencilIcon },
    { id: 'compliance', name: 'Compliance', icon: ShieldCheckIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
  ];

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    fetchContracts();
    if (activeTab === 'create') {
      loadInitialData();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      // Load projects, budgets, partners, and templates for contract creation
      const [projectsData, budgetsData, partnersData, templatesData] = await Promise.all([
        getProjectsForContract(),
        getBudgetsForContract(),
        contractDataService.getPartners(),
        getContractTemplates()
      ]);
      
      setAvailableProjects(projectsData);
      setAvailableBudgets(budgetsData);
      setAvailablePartners(partnersData);
      setAvailableTemplates(templatesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data');
    }
  };

  useEffect(() => {
    // Filter contracts based on search term and status
    let filtered = contracts;
    
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.budget_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }
    
    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const contractsData = await getContracts();
      setContracts(contractsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch contracts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const basePath = '/contracts';
    const newPath = tabId === 'contracts' ? basePath : `${basePath}/${tabId}`;
    navigate(newPath);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedContract) {
        await updateContract(selectedContract.id, formData);
        setSuccess('Contract updated successfully');
      } else {
        await createContract(formData);
        setSuccess('Contract created successfully');
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedContract(null);
      setFormData({ budget_id: '', template_id: '', title: '', description: '' });
      fetchContracts();
    } catch (err) {
      setError('Failed to save contract');
      console.error(err);
    }
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      budget_id: contract.budget_id,
      template_id: contract.template_id,
      title: contract.title,
      description: contract.description,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await deleteContract(id);
        setSuccess('Contract deleted successfully');
        fetchContracts();
      } catch (err) {
        setError('Failed to delete contract');
        console.error(err);
      }
    }
  };

  const handleSendForSigning = async (contractId: string) => {
    const signerEmail = prompt('Enter signer email:');
    const signerName = prompt('Enter signer name:');
    
    if (signerEmail && signerName) {
      try {
        await sendContractForSigning(contractId, { signerEmail, signerName });
        setSuccess('Contract sent for signing successfully');
        fetchContracts();
      } catch (err) {
        setError('Failed to send contract for signing');
        console.error(err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      ready: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: ClockIcon },
      sent: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: PaperAirplaneIcon },
      partially_signed: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', icon: PencilIcon },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircleIcon },
      filed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: DocumentCheckIcon },
      declined: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: XCircleIcon },
      voided: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-300', icon: ExclamationTriangleIcon },
    };
    
    const config = statusConfig[status] || statusConfig.ready;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderContracts = () => renderActiveContracts();

  const renderActiveContracts = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Contracts</p>
              <p className="text-2xl font-bold">{contracts.length}</p>
            </div>
            <DocumentIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'completed').length}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'sent' || c.status === 'ready').length}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">In Progress</p>
              <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'partially_signed').length}</p>
            </div>
            <PencilIcon className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="ready">Ready</option>
            <option value="sent">Sent</option>
            <option value="partially_signed">Partially Signed</option>
            <option value="completed">Completed</option>
            <option value="filed">Filed</option>
            <option value="declined">Declined</option>
            <option value="voided">Voided</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setActiveTab('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            New Contract
          </button>
        </div>
      </div>

      {/* Contracts List/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredContracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contract Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Budget ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map(contract => (
                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{contract.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {contract.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                          {contract.budget_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="View contract"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(contract)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit contract"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Delete contract"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          {contract.status === 'ready' && (
                            <button
                              onClick={() => handleSendForSigning(contract.id)}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Send for signing"
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No contracts found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by creating your first contract.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create Contract
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map(contract => (
            <div key={contract.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{contract.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{contract.budget_id}</p>
                  </div>
                </div>
                {getStatusBadge(contract.status)}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {contract.description || 'No description'}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedContract(contract);
                    setShowViewModal(true);
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(contract)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTemplates = () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Sub-Grant Agreement Template 2025',
        description: 'Standard sub-grant agreement template for partner organizations',
        category: 'sub-grant',
        created_at: '2025-01-01',
        is_default: true,
        usage_count: 12,
        content: `**SUBGRANT AGREEMENT**

1. **AGREEMENT DETAILS:**
   - Effective Date: {{start_date}}
   - Agreement End Date: {{end_date}}
   - Sub-Grant Agreement Number: {{agreement_number}}

2. **CONTRACTING PARTIES:**

2.1 GRANTOR: {{grantor_name}}
2.2 Registration: {{grantor_registration}}
2.3 Certificate No: {{grantor_certificate}}
2.4 Address: {{grantor_address}}

2.5 GRANTEE: {{partner_organization}}
2.6 Registration: {{grantee_registration}}
2.7 Address: {{grantee_address}}

2.8 Primary Funders: {{primary_funders}}

2.9 The Parties enter into this agreement in a spirit of collaboration, declaring full and mutual commitment to the goals and agreed roles and responsibilities as detailed in this Agreement.

3. **PURPOSE OF AGREEMENT**

The overall objective of this agreement is to support {{project_name}} under the following main objectives:

a) {{objective_1}}
b) {{objective_2}}
c) {{objective_3}}

4. **TERMS OF AGREEMENT**

This Agreement is effective from {{start_date}} and ends on {{end_date}} (the "Term"), unless the parties otherwise agree in writing. This agreement may be reviewed every 12 months in line with donor reporting timelines and annual fund disbursements.

Through this agreement, the grantee commits to:

1. Implement {{project_name}} as per the Terms of Reference (Annex 1).

2. Use these funds solely for the purposes specified in this Agreement.

3. Maintain separate reporting and accounting for the grant funds. Records should account for the grant funds separately from other funds received and maintained by the Grantee.

4. Permit {{grantor_name}} and/or its authorized representatives to monitor and evaluate the project funded by this grant through discussions with staff and others, site visits, and the review of records, as appropriate.

5. Inform {{grantor_name}} in a timely manner of changes in key personnel, significant difficulties in making use of the funds for the purposes described in the grant proposal.

6. Return any unused funds to {{grantor_name}}.

7. At the end of the Grant Period, provide {{grantor_name}} with a copy of any Project Material developed using the Grant Award.

8. Grantee hereby transfers and assigns to {{grantor_name}} an irrevocable, perpetual, non-exclusive license to disseminate and sublicense any materials created in the course of implementing the project.

9. Grantee will not use any of the grant funds to influence the outcome of any specific public election or otherwise attempt to influence legislation.

10. The Grantee consents to any monitoring that {{grantor_name}} may reasonably require with prior written notice, including site visits, periodic reviews, audits, and other monitoring activities.

5. **AGREEMENT AMOUNT AND PAYMENT TERMS**

1. The total estimated funds required for the entire life of the Project is {{total_amount}} as shown on the Budget attached as Annex 2.

2. This amount consists of direct program costs, personnel and administrative costs, staff training costs and equipment based on the approved budget.

3. All payments under this Project shall be disbursed as an imprest to be accounted for by {{partner_organization}} in full.

4. The payments and funding will be subject to available funding and will be revised on a half-yearly basis.

5. The Grantee may hold cash disbursements in an interest-bearing account and any income generated will be used exclusively for implementing the Project.

6. The grantee shall maintain clear and accurate records of receipts and expenditures for this grant, and make such records available to {{grantor_name}} upon request.

6. **REPORTING AND EVALUATION**

All reports submitted by {{partner_organization}} shall be in a format and contain content as required by {{grantor_name}}.

a) **Program Performance Reports:**
Within 15 calendar days after the end of each quarter, the Grantee shall submit narrative progress reports that provide:
- Description of results compared against established targets
- Assessment of progress compared to plans
- Reflections on lessons learned, challenges, and opportunities for improvement

b) **Financial Reports:**
Within 15 calendar days after the end of each half year, {{partner_organization}} shall submit:
- Completed Cash and Expenditure Status Report
- Amount budgeted vs. expended for each line item
- Grant funds received, expenditures, and remaining balances
- Prior written approval required for budget shifts exceeding approved totals

c) **Special Reports:**
- Immediate notification of developments impacting project activities
- Notification of problems, delays, or adverse conditions
- Report any instances of fraud with action taken and assistance needed

7. **FINAL REPORTS**

Within 30 calendar days after termination or expiration, {{partner_organization}} shall submit a final report describing:
- Project's final financial status
- Detailed summary of activities and results
- Assessment of progress toward accomplishing results
- Important research findings and recommendations

8. **PAYMENT AND DISBURSEMENTS**

a) **Disbursement:**
- {{grantor_name}} shall make payments on a disbursement basis
- Initial disbursement limited to minimum amount for first six months
- Subsequent disbursements based on full retirement of previous amounts
- Funds disbursed semi-annually per attached schedule (Annex 3)

b) **Cash Management and Close-Out:**
Final payments made on reimbursement basis when final reports submitted and verified.

c) **Bank Account Details:**
Bank Name: {{bank_name}}
Account Name: {{account_name}}
Branch: {{bank_branch}}
Account No.: {{account_number}}
Swift Code: {{swift_code}}

9. **TERMINATION AND SUSPENSION**

{{grantor_name}} may terminate or suspend this Agreement if:
- Grantee materially fails to comply with terms
- Donors fail to fund, terminate, or suspend the Grant
- Grantee unable to carry out purposes satisfactorily
- Material breach of Agreement terms

10. **SAFEGUARDING AND COMPLIANCE**

Both parties commit to:
- Maintaining highest standards of safeguarding
- Zero tolerance for abuse, exploitation, or harassment
- Compliance with all applicable laws and regulations
- Regular safeguarding training for all staff

11. **DISPUTE RESOLUTION**

Any disputes arising shall be resolved through:
1. Direct negotiation between parties
2. Mediation if negotiation fails
3. Arbitration as final resort
This Agreement shall be governed by the laws of {{governing_law}}.

12. **CONTACT INFORMATION**

**Grantor Contact:**
Name: {{grantor_contact_person}}
Email: {{grantor_contact_email}}
Phone: {{grantor_contact_phone}}

**Grantee Contact:**
Name: {{contact_person}}
Email: {{contact_email}}
Phone: {{contact_phone}}

**SIGNATURES**

For {{grantor_name}}:
_________________________    Date: {{signature_date}}
{{grantor_signatory_name}}
{{grantor_signatory_title}}

For {{partner_organization}}:
_________________________    Date: {{signature_date}}
{{grantee_signatory_name}}
{{grantee_signatory_title}}

**ATTACHMENTS:**
- Annex 1: Terms of Reference
- Annex 2: Project Budget
- Annex 3: Disbursement Schedule`
      },
      {
        id: '2',
        name: 'Research Partnership Agreement',
        description: 'Template for research collaboration agreements with academic institutions',
        category: 'research',
        created_at: '2024-12-15',
        is_default: false,
        usage_count: 5,
        content: 'Research partnership agreement template content...'
      },
      {
        id: '3',
        name: 'Service Provider Contract',
        description: 'Standard contract template for service providers and consultants',
        category: 'service',
        created_at: '2024-11-20',
        is_default: false,
        usage_count: 8,
        content: 'Service provider contract template content...'
      }
    ];

    const getCategoryBadge = (category: string) => {
      const categoryConfig: Record<string, { bg: string; text: string }> = {
        'sub-grant': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
        'research': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
        'service': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
      };
      
      const config = categoryConfig[category] || categoryConfig['sub-grant'];
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          {category.replace('-', ' ')}
        </span>
      );
    };

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contract Templates</h2>
            <p className="text-gray-600 dark:text-gray-400">Professional templates for all your contract needs</p>
          </div>
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-colors font-medium shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            New Template
          </button>
        </div>


        {/* Enhanced Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {mockTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              
              <div className="relative z-10">
                {/* Template Header */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex flex-col items-start gap-2 flex-shrink-0">
                    {template.is_default && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                        ⭐ Default
                      </span>
                    )}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <DocumentTextIcon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                      {template.name}
                    </h3>
                    {getCategoryBadge(template.category)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {template.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{template.usage_count} uses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowTemplateViewModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg group-hover:scale-105"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      setCreateFormData({
                        ...createFormData,
                        template_id: template.id,
                        title: `New Contract from ${template.name}`
                      });
                      setActiveTab('create');
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl group-hover:scale-105"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need a custom template?</h3>
              <p className="text-gray-600 dark:text-gray-400">Create a new template tailored to your specific requirements</p>
            </div>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Create Custom Template
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSigning = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Signing</h2>
          <p className="text-gray-600 dark:text-gray-400">Track and manage DocuSign workflows for your contracts</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <PlusIcon className="w-5 h-5" />
          Send for Signing
        </button>
      </div>

      {/* Signing Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <PaperAirplaneIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sent for Signing</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Signature</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Declined</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Awaiting Signature */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contracts Awaiting Signature</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sent Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Education Research Grant</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">SGA-2025-001</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Luigi Giussani Institute
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Jan 15, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending Signature
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                    View in DocuSign
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                    Remind
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DocuSign Integration Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DocuSign Integration</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Connected
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">14</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Envelopes</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">92%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">3.2</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Days to Sign</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Monitoring</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor compliance status and requirements for all active contracts</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <DocumentCheckIcon className="w-5 h-5" />
          Review Compliance
        </button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliant</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Needs Attention</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Non-Compliant</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Requirements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Requirements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Education Research Grant</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">SGA-2025-001</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Quarterly Financial Report
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Mar 31, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Due Soon
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                    Review
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                    Remind
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Community Development</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">SGA-2025-002</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Impact Assessment Report
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Feb 15, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Overdue
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-3">
                    Escalate
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                    Contact
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Standard Compliance Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-900 dark:text-white">Contract signed and executed</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-900 dark:text-white">Initial disbursement completed</span>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-gray-900 dark:text-white">Quarterly reporting schedule established</span>
          </div>
          <div className="flex items-center gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-gray-900 dark:text-white">Audit documentation pending</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grantor Details</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure organization information and contact details used in contract generation.
          </p>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowGrantorModal(true);
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer hover:underline"
          >
            Manage Details →
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Template Variables</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Define custom placeholders and variables for dynamic contract content.
          </p>
          <button 
            onClick={() => setActiveTab('templates')}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            Manage Templates →
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Integration</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure API connections and data sources for contract automation.
          </p>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Data Integration clicked');
              setShowIntegrationModal(true);
            }}
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium cursor-pointer hover:underline"
          >
            Configure Integration →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('templates')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <DocumentDuplicateIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <div className="font-medium text-gray-900 dark:text-white">Manage Templates</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Create and edit contract templates</div>
          </button>
          
          <button 
            onClick={() => setActiveTab('create')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <PlusIcon className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <div className="font-medium text-gray-900 dark:text-white">Create Contract</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Generate new contract from template</div>
          </button>
          
          <button className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <div className="font-medium text-gray-900 dark:text-white">User Permissions</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Manage access and roles</div>
          </button>
          
          <button className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowDownTrayIcon className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
            <div className="font-medium text-gray-900 dark:text-white">Export Data</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Download contracts and reports</div>
          </button>
        </div>
      </div>

      {/* Grantor Details Modal */}
      {showGrantorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Grantor Details</h3>
                  <p className="text-blue-100 text-sm">Configure organization information for contracts</p>
                </div>
                <button
                  onClick={() => setShowGrantorModal(false)}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Body */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={grantorData.organization_name}
                      onChange={(e) => setGrantorData({...grantorData, organization_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="SubGrant Foundation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={grantorData.contact_person}
                      onChange={(e) => setGrantorData({...grantorData, contact_person: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={grantorData.email}
                      onChange={(e) => setGrantorData({...grantorData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="contact@organization.org"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={grantorData.phone}
                      onChange={(e) => setGrantorData({...grantorData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={grantorData.website}
                      onChange={(e) => setGrantorData({...grantorData, website: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="https://www.organization.org"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      value={grantorData.tax_id}
                      onChange={(e) => setGrantorData({...grantorData, tax_id: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="12-3456789"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={grantorData.address}
                    onChange={(e) => setGrantorData({...grantorData, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="123 Grant Street, Foundation City, FC 12345"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={grantorData.registration_number}
                    onChange={(e) => setGrantorData({...grantorData, registration_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="REG-2024-001"
                  />
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowGrantorModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      setSuccess('Grantor details updated successfully');
                      setShowGrantorModal(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Save Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGrantorInputChange = (field: string, value: string) => {
    setGrantorData(prev => ({ ...prev, [field]: value }));
  };

  const generateContractPreview = async () => {
    if (!createFormData.budget_id || !createFormData.template_id) {
      return;
    }

    // Get the selected budget to extract project and partner info
    const selectedBudget = availableBudgets.find(b => b.id === createFormData.budget_id);
    if (!selectedBudget || selectedBudget.status !== 'approved') {
      setError('Selected budget is not approved');
      return;
    }

    try {
      setLoading(true);
      const data = await contractDataService.compileContractData(
        selectedBudget.project_id,
        createFormData.budget_id,
        selectedBudget.organization_id
      );
      setContractData(data);

      const generated = await contractDataService.generateContract(
        createFormData.template_id,
        selectedBudget.project_id,
        createFormData.budget_id,
        selectedBudget.organization_id
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
    if (activeTab === 'create') {
      generateContractPreview();
    }
  }, [createFormData.budget_id, createFormData.template_id, activeTab]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create contract with generated content
      const contractPayload = {
        ...createFormData,
        content: generatedContract,
        status: 'draft' as const
      };
      
      const newContract = await createContract(contractPayload);
      
      // Generate PDF for the new contract
      if (newContract.id) {
        await generateContractPDF(newContract.id);
      }
      
      setSuccess('Contract created successfully with PDF generated');
      setCreateFormData({
        title: '',
        description: '',
        template_id: '',
        budget_id: '',
      });
      setGeneratedContract('');
      setContractData(null);
      fetchContracts();
    } catch (err) {
      setError('Failed to create contract');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderCreate = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Contract</h2>
          <p className="text-gray-600 dark:text-gray-400">Generate a new contract from templates with project data</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <DocumentTextIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contract Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Contract Title *
              </label>
              <input
                type="text"
                name="title"
                value={createFormData.title}
                onChange={handleCreateInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Sub-Grant Agreement 2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Contract Template *
              </label>
              <select
                name="template_id"
                value={createFormData.template_id}
                onChange={handleCreateInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={createFormData.description}
                onChange={handleCreateInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                placeholder="Describe the purpose and objectives of this agreement..."
              />
            </div>
          </div>
        </div>

        {/* Approved Budget Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Approved Budget Selection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Only organizations with approved budgets can have contracts created</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Approved Budget *
              </label>
              <select
                name="budget_id"
                value={createFormData.budget_id}
                onChange={handleCreateInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              >
                <option value="">Select Approved Budget</option>
                {availableBudgets.filter(budget => budget.status === 'approved').map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.organization_name} - ${budget.total_amount.toLocaleString()} {budget.currency} ({budget.project_name})
                  </option>
                ))}
              </select>
              {availableBudgets.filter(budget => budget.status === 'approved').length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  No approved budgets available. Budgets must be approved before contracts can be created.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contract Preview */}
        {generatedContract && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <EyeIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contract Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Auto-Generated
                </span>
              </div>
            </div>

            {contractData && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Project</h4>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {contractData.project_name}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">Budget</h4>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    {contractData.total_amount}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <UserGroupIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Partner</h4>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                    {contractData.partner_organization}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {generatedContract}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {generatedContract ? 'Contract ready for creation' : 'Fill all fields to generate preview'}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !generatedContract}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Create Contract
              </>
            )}
          </button>
          </div>
        </div>
      </form>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contracts':
        return renderContracts();
      case 'create':
        return renderCreate();
      case 'templates':
        return renderTemplates();
      case 'signing':
        return renderSigning();
      case 'compliance':
        return renderCompliance();
      case 'settings':
        return renderSettings();
      default:
        return renderContracts();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Contract Management
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Manage contracts, templates, and digital signatures
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedContract ? 'Edit Contract' : 'Create New Contract'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedContract(null);
                      setFormData({ budget_id: '', template_id: '', title: '', description: '' });
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="budget_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Associated Budget
                      </label>
                      <select
                        id="budget_id"
                        name="budget_id"
                        value={formData.budget_id || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Budget</option>
                        <option value="budget-001">Education Program Budget - $150,000</option>
                        <option value="budget-002">Healthcare Initiative - $200,000</option>
                        <option value="budget-003">Water Access Project - $100,000</option>
                        <option value="budget-004">Community Development - $75,000</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="template_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contract Template
                      </label>
                      <select
                        id="template_id"
                        name="template_id"
                        value={formData.template_id || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Template</option>
                        <option value="template-standard">Standard Grant Agreement</option>
                        <option value="template-education">Education Program Contract</option>
                        <option value="template-healthcare">Healthcare Services Agreement</option>
                        <option value="template-infrastructure">Infrastructure Development Contract</option>
                        <option value="template-research">Research Grant Agreement</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contract Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter contract description..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setSelectedContract(null);
                        setFormData({ budget_id: '', template_id: '', title: '', description: '' });
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {selectedContract ? 'Update Contract' : 'Create Contract'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedContract && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Contract Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedContract(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedContract.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    {getStatusBadge(selectedContract.status)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget ID
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedContract.budget_id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template ID
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedContract.template_id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedContract.description || 'No description'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Created
                    </label>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedContract.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(selectedContract);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Edit Contract
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template View Modal */}
        {showTemplateViewModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
              {/* Compact Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {selectedTemplate.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-blue-100 text-sm">
                          {selectedTemplate.description}
                        </p>
                        {selectedTemplate.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-100 border border-yellow-400/30">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplateViewModal(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Enhanced Content Area */}
              <div className="flex flex-col h-[calc(95vh-100px)]">
                {/* Compact Stats Bar */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {selectedTemplate.category.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">{selectedTemplate.usage_count} uses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">{new Date(selectedTemplate.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content - Full Height */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1.5 border-b border-gray-300 dark:border-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
                            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 ml-1">Contract Template</span>
                        </div>
                      </div>
                      <div className="p-4 overflow-y-auto" style={{maxHeight: 'calc(95vh - 200px)'}}>
                        <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                          {selectedTemplate.content || 'No content available'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Action Bar */}
                <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <CheckCircleIcon className="w-3 h-3 text-green-500" />
                      <span>Ready to use</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTemplateViewModal(false)}
                        className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setCreateFormData({
                            ...createFormData,
                            template_id: selectedTemplate.id,
                            title: `New Contract from ${selectedTemplate.name}`
                          });
                          setShowTemplateViewModal(false);
                          setActiveTab('create');
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-1.5 text-sm"
                      >
                        <PlusIcon className="w-3 h-3" />
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Data Integration Modal */}
      {showIntegrationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Data Integration</h2>
                  <p className="text-green-100 text-sm mt-1">Configure API connections for contract automation</p>
                </div>
                <button
                  onClick={() => setShowIntegrationModal(false)}
                  className="text-white hover:text-green-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-8">
                
                {/* DocuSign Integration */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DocuSign</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Electronic signature platform</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationData.docusign.enabled}
                        onChange={(e) => setIntegrationData({
                          ...integrationData,
                          docusign: { ...integrationData.docusign, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {integrationData.docusign.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Integration Key (API Key)
                        </label>
                        <input
                          type="password"
                          value={integrationData.docusign.api_key}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            docusign: { ...integrationData.docusign, api_key: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter DocuSign Integration Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Account ID
                        </label>
                        <input
                          type="text"
                          value={integrationData.docusign.account_id}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            docusign: { ...integrationData.docusign, account_id: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter Account ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          User ID
                        </label>
                        <input
                          type="text"
                          value={integrationData.docusign.user_id}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            docusign: { ...integrationData.docusign, user_id: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter User ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Environment
                        </label>
                        <select
                          value={integrationData.docusign.environment}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            docusign: { ...integrationData.docusign, environment: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="sandbox">Sandbox</option>
                          <option value="production">Production</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Xero Integration */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xero</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Accounting and disbursement platform</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationData.quickbooks.enabled}
                        onChange={(e) => setIntegrationData({
                          ...integrationData,
                          quickbooks: { ...integrationData.quickbooks, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  {integrationData.quickbooks.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={integrationData.quickbooks.client_id}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            quickbooks: { ...integrationData.quickbooks, client_id: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter Xero Client ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={integrationData.quickbooks.client_secret}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            quickbooks: { ...integrationData.quickbooks, client_secret: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter Client Secret"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={integrationData.quickbooks.sandbox}
                            onChange={(e) => setIntegrationData({
                              ...integrationData,
                              quickbooks: { ...integrationData.quickbooks, sandbox: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Use Sandbox Environment</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* SendGrid Integration */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <EnvelopeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SendGrid</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email delivery service</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationData.sendgrid.enabled}
                        onChange={(e) => setIntegrationData({
                          ...integrationData,
                          sendgrid: { ...integrationData.sendgrid, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  {integrationData.sendgrid.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={integrationData.sendgrid.api_key}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            sendgrid: { ...integrationData.sendgrid, api_key: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter SendGrid API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From Email
                        </label>
                        <input
                          type="email"
                          value={integrationData.sendgrid.from_email}
                          onChange={(e) => setIntegrationData({
                            ...integrationData,
                            sendgrid: { ...integrationData.sendgrid, from_email: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="noreply@ziziafrique.org"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setShowIntegrationModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Saving integration data:', integrationData);
                    alert('Integration settings saved successfully!');
                    setShowIntegrationModal(false);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-medium transition-all duration-200"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ContractManagementTabs;
