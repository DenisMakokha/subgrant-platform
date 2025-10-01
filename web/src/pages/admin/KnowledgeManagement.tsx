import React, { useState, useEffect } from 'react';
import {
  KnowledgeDocument,
  TrainingModule,
  KnowledgeCategory,
  KnowledgeSearchFilters,
  KnowledgeSearchResult
} from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';

const KnowledgeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'training' | 'categories'>('documents');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<KnowledgeSearchFilters>({});
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'documents') {
        try {
          const response = await adminApi.knowledge.documents.getAll();
          setDocuments(response.data || []);
        } catch (error) {
          console.error('Error fetching documents:', error);
          const mockDocuments: KnowledgeDocument[] = [
            {
              id: '1',
              title: 'Financial Reporting Guidelines',
              description: 'Comprehensive guide for financial reporting requirements',
              content: 'Detailed content about financial reporting...',
              type: 'policy',
              category: 'Finance',
              tags: ['finance', 'reporting', 'compliance'],
              version: '2.1',
              status: 'published',
              author: 'John Smith',
              createdAt: new Date('2025-01-15'),
              updatedAt: new Date('2025-02-20'),
              lastReviewed: new Date('2025-02-20'),
              nextReview: new Date('2025-08-20'),
              downloadCount: 45,
              viewCount: 123,
              filePath: '/docs/financial-reporting-v2.1.pdf',
              fileSize: 2048576,
              mimeType: 'application/pdf'
            }
          ];
          setDocuments(mockDocuments);
        }
      } else if (activeTab === 'training') {
        const mockModules: TrainingModule[] = [
          {
            id: '1',
            title: 'Project Management Fundamentals',
            description: 'Introduction to project management principles and practices',
            type: 'course',
            category: 'Project Management',
            difficulty: 'beginner',
            duration: 240,
            status: 'published',
            content: [
              {
                id: '1',
                type: 'video',
                title: 'Introduction to Project Management',
                content: 'Video content URL',
                order: 1,
                duration: 30
              }
            ],
            prerequisites: [],
            learningObjectives: [
              'Understand basic project management concepts',
              'Learn project planning techniques',
              'Apply project management tools'
            ],
            author: 'Emily Rodriguez',
            createdAt: new Date('2025-01-20'),
            updatedAt: new Date('2025-02-15'),
            enrollmentCount: 45,
            completionRate: 78.5,
            averageRating: 4.2,
            tags: ['project-management', 'planning', 'fundamentals']
          }
        ];
        setModules(mockModules);
      } else if (activeTab === 'categories') {
        const mockCategories: KnowledgeCategory[] = [
          {
            id: '1',
            name: 'Finance',
            description: 'Financial policies, procedures, and guidelines',
            order: 1,
            icon: '💰',
            color: '#10B981',
            documentCount: 15,
            moduleCount: 3
          }
        ];
        setCategories(mockCategories);
      }
    } catch (error) {
      console.error('Error fetching knowledge management data:', error);
      toast.error('Failed to load knowledge management data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: KnowledgeSearchFilters) => {
    setSearchFilters(filters);
    toast.info('Search functionality would be implemented with backend API');
  };

  const documentColumns = [
    { key: 'title' as keyof KnowledgeDocument, label: 'Title', sortable: true },
    { key: 'type' as keyof KnowledgeDocument, label: 'Type', sortable: true },
    { key: 'category' as keyof KnowledgeDocument, label: 'Category', sortable: true },
    { key: 'status' as keyof KnowledgeDocument, label: 'Status', sortable: true },
    { key: 'author' as keyof KnowledgeDocument, label: 'Author', sortable: true },
    { key: 'updatedAt' as keyof KnowledgeDocument, label: 'Last Updated', sortable: true },
    { key: 'viewCount' as keyof KnowledgeDocument, label: 'Views', sortable: true }
  ];

  const moduleColumns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'difficulty', label: 'Difficulty', sortable: true },
    { key: 'duration', label: 'Duration (min)', sortable: true },
    { key: 'enrollmentCount', label: 'Enrollments', sortable: true },
    { key: 'completionRate', label: 'Completion %', sortable: true },
    { key: 'averageRating', label: 'Rating', sortable: true }
  ];

  const categoryColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'documentCount', label: 'Documents', sortable: true },
    { key: 'moduleCount', label: 'Modules', sortable: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Knowledge Management</h1>
              <p className="text-blue-100">Documentation, training materials, and knowledge base</p>
            </div>
            <div className="flex space-x-3">
              {activeTab === 'documents' && (
                <button
                  onClick={() => setShowDocumentForm(true)}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Document</span>
                </button>
              )}
              {activeTab === 'training' && (
                <button
                  onClick={() => setShowModuleForm(true)}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Training Module</span>
                </button>
              )}
              <button
                onClick={fetchData}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents' },
            { id: 'training', label: 'Training Modules' },
            { id: 'categories', label: 'Categories' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'documents' | 'training' | 'categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <DataTable
              data={documents}
              columns={documentColumns}
              loading={loading}
              searchable={false}
              onRowClick={(document) => {
                toast.info(`View document: ${document.title}`);
              }}
            />
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <div key={module.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {module.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Difficulty</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.duration} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enrollments</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.enrollmentCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {module.completionRate}%
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      View Details
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20">
                      Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-xl mr-3"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.documentCount} docs, {category.moduleCount} modules
                      </p>
                    </div>
                  </div>

                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {category.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      View Documents ({category.documentCount})
                    </button>
                    <button className="w-full px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20">
                      View Modules ({category.moduleCount})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDocumentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Document
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Document form would be implemented here with fields for title, description, content, category, tags, etc.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDocumentForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDocumentForm(false);
                    toast.success('Document creation would be implemented');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModuleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Training Module
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Training module form would be implemented here with fields for title, description, content sections, learning objectives, etc.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModuleForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowModuleForm(false);
                    toast.success('Training module creation would be implemented');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Create Module
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

export default KnowledgeManagement;
