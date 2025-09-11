import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_default: boolean;
}

const ContractTemplates: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'sub-grant',
  });

  // Default template content based on the Sub-Grant Agreement
  const defaultTemplateContent = `**SUBGRANT AGREEMENT**

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
- Annex 3: Disbursement Schedule`;

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Check if we should auto-open a template view
    const viewTemplateId = searchParams.get('view');
    console.log('useEffect triggered - viewTemplateId:', viewTemplateId, 'templates.length:', templates.length);
    console.log('Current showViewModal state:', showViewModal);
    
    if (viewTemplateId && templates.length > 0) {
      // Find and show the template
      const template = templates.find(t => t.id === viewTemplateId);
      console.log('Template found in useEffect:', template);
      if (template) {
        console.log('Setting template and modal in useEffect');
        setSelectedTemplate(template);
        setShowViewModal(true);
      }
    }
  }, [searchParams, templates, showViewModal]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockTemplates: ContractTemplate[] = [
        {
          id: '1',
          name: 'Sub-Grant Agreement Template 2025',
          description: 'Standard sub-grant agreement template for partner organizations',
          content: defaultTemplateContent,
          category: 'sub-grant',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id || '',
          is_default: true,
        },
        {
          id: '2',
          name: 'Research Partnership Agreement',
          description: 'Template for research collaboration agreements',
          content: 'Research partnership template content...',
          category: 'research',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id || '',
          is_default: false,
        },
      ];
      setTemplates(mockTemplates);
      setError(null);
      
      // After templates are loaded, check for view parameter
      const viewTemplateId = searchParams.get('view');
      console.log('View template ID from URL:', viewTemplateId);
      console.log('Available templates:', mockTemplates.map(t => ({ id: t.id, name: t.name })));
      
      if (viewTemplateId) {
        const template = mockTemplates.find(t => t.id === viewTemplateId);
        console.log('Found template:', template);
        if (template) {
          console.log('Setting selected template and showing modal');
          setSelectedTemplate(template);
          setShowViewModal(true);
        } else {
          console.log('Template not found for ID:', viewTemplateId);
        }
      }
    } catch (err) {
      setError('Failed to fetch templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock API call - replace with actual implementation
      const newTemplate: ContractTemplate = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || '',
        is_default: false,
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      setSuccess('Template created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', content: '', category: 'sub-grant' });
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    }
  };

  const handleEdit = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setTemplates(prev => prev.filter(t => t.id !== id));
        setSuccess('Template deleted successfully');
      } catch (err) {
        setError('Failed to delete template');
        console.error(err);
      }
    }
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    try {
      const duplicatedTemplate: ContractTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_default: false,
      };
      
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      setSuccess('Template duplicated successfully');
    } catch (err) {
      setError('Failed to duplicate template');
      console.error(err);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { bg: string; text: string }> = {
      'sub-grant': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
      'research': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
      'partnership': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Contract Templates</h1>
                <p className="text-purple-100">Manage and create contract templates</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              New Template
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

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {template.name}
                      </h3>
                      {template.is_default && (
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    {getCategoryBadge(template.category)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowViewModal(true);
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 p-2 rounded-lg transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 p-2 rounded-lg transition-colors"
                    disabled={template.is_default}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first template'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-5 h-5" />
              Create Template
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <DocumentTextIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {showCreateModal ? 'Create New Template' : 'Edit Template'}
                      </h3>
                      <p className="text-purple-100 text-sm">
                        {showCreateModal ? 'Create a new contract template' : 'Modify template settings and content'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedTemplate(null);
                      setFormData({ name: '', description: '', content: '', category: 'sub-grant' });
                    }}
                    className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg font-medium shadow-sm"
                        placeholder="Sub-Grant Agreement Template"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg font-medium shadow-sm"
                        required
                      >
                        <option value="sub-grant">Sub-Grant</option>
                        <option value="research">Research</option>
                        <option value="partnership">Partnership</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-base font-medium shadow-sm"
                      placeholder="Describe the purpose and use case of this template..."
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-4">
                      Template Content *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={15}
                      className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-3 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-base font-mono shadow-sm"
                      placeholder="Enter the template content with placeholders like {{partner_organization}}..."
                      required
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Use placeholders like {`{{partner_organization}}`}, {`{{total_amount}}`}, {`{{start_date}}`} for dynamic content
                    </p>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setSelectedTemplate(null);
                        setFormData({ name: '', description: '', content: '', category: 'sub-grant' });
                      }}
                      className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
                    >
                      <CheckIcon className="w-5 h-5" />
                      {showCreateModal ? 'Create Template' : 'Update Template'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedTemplate && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowViewModal(false);
                setSelectedTemplate(null);
              }
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-gray-600 to-gray-700 rounded-t-2xl px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <EyeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                      <p className="text-gray-100 text-sm">Template preview and details</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Close button clicked');
                      setShowViewModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      {getCategoryBadge(selectedTemplate.category)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Created
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedTemplate.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedTemplate.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedTemplate.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Content
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono overflow-x-auto">
                        {selectedTemplate.content}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(selectedTemplate)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Template
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

export default ContractTemplates;
