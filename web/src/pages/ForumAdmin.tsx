import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TagIcon,
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: string;
  order_index: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  created_at: string;
  replies_count: number;
  status: string;
}

const Forum: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'tags' | 'settings'>('posts');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    visibility: 'public',
    order_index: 1
  });

  const [tagForm, setTagForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6'
  });

  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    status: 'draft'
  });

  const [forumSettings, setForumSettings] = useState({
    name: 'Community Forum',
    description: 'A place for community discussions and knowledge sharing',
    allowGuestPosting: false,
    requireApproval: true,
    enableEditing: true
  });

  const handleSettingsSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/forum/settings', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(forumSettings)
      });
      
      if (response.ok) {
        setSuccess('Forum settings saved successfully');
      } else {
        setError('Failed to save forum settings');
      }
    } catch (err) {
      setError('Failed to save forum settings');
    } finally {
      setLoading(false);
    }
  };

  // Determine active tab based on URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/tags')) return 'tags';
    if (path.includes('/settings')) return 'settings';
    return 'posts';
  };

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchPosts();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum-admin/categories', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/forum-admin/tags', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/forum/posts', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      const response = await fetch(`/api/forum-admin/tags/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        await fetchTags();
        setSuccess('Tag deleted successfully');
      } else {
        setError('Failed to delete tag');
      }
    } catch (err) {
      setError('Failed to delete tag');
    }
  };

  const editPost = (post: any) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      category: post.category || '',
      tags: post.tags || [],
      status: post.status
    });
    setShowPostForm(true);
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/forum/posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        await fetchPosts();
        setSuccess('Post deleted successfully');
      } else {
        setError('Failed to delete post');
      }
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const handleApprovePost = async (id: number) => {
    try {
      const response = await fetch(`/api/forum/posts/${id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        await fetchPosts();
        setSuccess('Post approved successfully');
      } else {
        setError('Failed to approve post');
      }
    } catch (err) {
      setError('Failed to approve post');
    }
  };

  const handleRejectPost = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this post?')) return;
    
    try {
      const response = await fetch(`/api/forum/posts/${id}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        await fetchPosts();
        setSuccess('Post rejected successfully');
      } else {
        setError('Failed to reject post');
      }
    } catch (err) {
      setError('Failed to reject post');
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const url = editingPost 
        ? `/api/forum/posts/${editingPost.id}`
        : '/api/forum/posts';
      
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...postForm,
          author: user?.email || 'Anonymous'
        })
      });
      
      if (response.ok) {
        await fetchPosts();
        setShowPostForm(false);
        setEditingPost(null);
        setPostForm({
          title: '',
          content: '',
          category: '',
          tags: [],
          status: 'draft'
        });
        setSuccess(editingPost ? 'Post updated successfully' : 'Post created successfully');
      } else {
        setError('Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      setError('Failed to save post');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`/api/forum-admin/categories/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (response.ok) {
          await fetchCategories();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const deleteTag = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        const response = await fetch(`/api/forum-admin/tags/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (response.ok) {
          await fetchTags();
        }
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  const initializeForumData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/forum-admin/initialize', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchCategories();
        await fetchTags();
        setSuccess('Forum data initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing forum data:', error);
      setError('Failed to initialize forum data');
    } finally {
      setLoading(false);
    }
  };

  const editCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      visibility: category.visibility,
      order_index: category.order_index
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const editTag = (tag: Tag) => {
    setTagForm({
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      color: tag.color
    });
    setEditingTag(tag);
    setShowTagForm(true);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'posts' | 'categories' | 'tags' | 'settings');
    // Update URL without page reload
    const basePath = '/forum';
    const newPath = tabId === 'posts' ? basePath : `${basePath}/${tabId}`;
    navigate(newPath);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'posts', name: 'Forum Posts', icon: ChatBubbleLeftRightIcon, count: posts.length },
    { id: 'categories', name: 'Categories', icon: FolderIcon, count: categories.length },
    { id: 'tags', name: 'Tags', icon: TagIcon, count: tags.length },
    ...(isAdmin ? [{ id: 'settings', name: 'Settings', icon: Cog6ToothIcon, count: 0 }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPostsTab();
      case 'categories':
        return renderCategoriesTab();
      case 'tags':
        return renderTagsTab();
      case 'settings':
        return isAdmin ? renderSettingsTab() : null;
      default:
        return renderPostsTab();
    }
  };

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      draft: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
      pending: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const renderPostsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Posts</h2>
          <button
            onClick={() => setShowPostForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Post
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Posts
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, content, or author..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {posts.length === 0 ? 'No posts yet' : 'No posts match your filters'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {posts.length === 0 ? 'Get started by creating your first forum post.' : 'Try adjusting your search criteria.'}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{post.content.substring(0, 200)}...</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>By {post.author}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>{post.replies_count} replies</span>
                        {post.category && <span>in {post.category}</span>}
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Status Management Buttons */}
                      {post.status === 'pending' && isAdmin && (
                        <React.Fragment>
                          <button
                            onClick={() => handleApprovePost(Number(post.id))}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                            title="Approve post"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectPost(Number(post.id))}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Reject post"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </React.Fragment>
                      )}
                      
                      {/* View Detail Button */}
                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          setShowPostDetail(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                        title="View details"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => editPost(post)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Edit post"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Delete Button - Admin only */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeletePost(Number(post.id))}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete post"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCategoriesTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Categories</h2>
          {isAdmin && (
            <button
              onClick={() => setShowCategoryForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Category
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6">
              <FolderIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Categories Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
              Categories help organize forum discussions into topics. Create your first category to get started with organizing your community conversations.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">/{category.slug}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editCategory(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Order: {category.order_index}</span>
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{category.visibility}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTagsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Tags</h2>
          {isAdmin && (
            <button
              onClick={() => setShowTagForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Tag
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mb-6">
              <TagIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Tags Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
              Tags help users find related content quickly. Create colorful tags to label and categorize forum posts by topics, themes, or keywords.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowTagForm(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Tag
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map((tag) => (
              <div key={tag.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      ></div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tag.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tag.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">#{tag.slug}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editTag(tag)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const url = editingCategory 
        ? `/api/forum-admin/categories/${editingCategory.id}`
        : '/api/forum-admin/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        await fetchCategories();
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryForm({
          name: '',
          slug: '',
          description: '',
          visibility: 'public',
          order_index: 1
        });
        setSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      } else {
        setError('Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const url = editingTag 
        ? `/api/forum-admin/tags/${editingTag.id}`
        : '/api/forum-admin/tags';
      
      const method = editingTag ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(tagForm)
      });
      
      if (response.ok) {
        await fetchTags();
        setShowTagForm(false);
        setEditingTag(null);
        setTagForm({
          name: '',
          slug: '',
          description: '',
          color: '#3B82F6'
        });
        setSuccess(editingTag ? 'Tag updated successfully' : 'Tag created successfully');
      } else {
        setError('Failed to save tag');
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      setError('Failed to save tag');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Settings</h2>
          <div className="flex gap-3">
            <button
              onClick={initializeForumData}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5" />
              Initialize Default Data
            </button>
            <button
              onClick={handleSettingsSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSettingsSave(); }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forum Name *
                  </label>
                  <input
                    type="text"
                    value={forumSettings.name}
                    onChange={(e) => setForumSettings({ ...forumSettings, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forum Description
                  </label>
                  <textarea
                    rows={3}
                    value={forumSettings.description}
                    onChange={(e) => setForumSettings({ ...forumSettings, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your forum's purpose and community guidelines"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permissions & Moderation</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow guest posting</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Let non-registered users create posts</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={forumSettings.allowGuestPosting}
                    onChange={(e) => setForumSettings({ ...forumSettings, allowGuestPosting: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Require approval for new posts</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Posts need admin approval before being visible</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={forumSettings.requireApproval}
                    onChange={(e) => setForumSettings({ ...forumSettings, requireApproval: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable post editing</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allow users to edit their own posts</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={forumSettings.enableEditing}
                    onChange={(e) => setForumSettings({ ...forumSettings, enableEditing: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Forum Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{posts.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{categories.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{tags.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tags</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  };

  return (
    <>
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
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Community Forum
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Discussions, categories, tags, and forum management
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

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                    {tab.count > 0 && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
        </div>

      {/* Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <FolderIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {editingCategory ? 'Update category details' : 'Add a new forum category'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryForm({
                      name: '',
                      slug: '',
                      description: '',
                      visibility: 'public',
                      order_index: 1
                    });
                  }}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Category Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter category name"
                    required
                  />
                </div>
              </div>
              
              {/* Slug Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  URL Slug *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                    placeholder="category-url-slug"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 text-sm">/category/</span>
                  </div>
                </div>
              </div>
              
              {/* Description Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400 resize-none"
                  rows={4}
                  placeholder="Brief description of this category..."
                />
              </div>
              
              {/* Visibility and Order Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Visibility
                  </label>
                  <select
                    value={categoryForm.visibility}
                    onChange={(e) => setCategoryForm({ ...categoryForm, visibility: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="private">🔒 Private</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.order_index}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order_index: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    min="1"
                    placeholder="1"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryForm({
                      name: '',
                      slug: '',
                      description: '',
                      visibility: 'public',
                      order_index: 1
                    });
                  }}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {editingCategory ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </div>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden p-0 transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TagIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingTag ? 'Edit Tag' : 'Create New Tag'}
                    </h3>
                    <p className="text-purple-100 text-sm">
                      {editingTag ? 'Update tag details' : 'Add a new forum tag'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTagForm(false);
                    setEditingTag(null);
                    setTagForm({
                      name: '',
                      slug: '',
                      description: '',
                      color: '#3B82F6'
                    });
                  }}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
            
            <form onSubmit={handleTagSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tag Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagForm.name}
                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter tag name"
                    required
                  />
                </div>
              </div>
              
              {/* Slug Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  URL Slug *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagForm.slug}
                    onChange={(e) => setTagForm({ ...tagForm, slug: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                    placeholder="tag-url-slug"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 text-sm">/tag/</span>
                  </div>
                </div>
              </div>
              
              {/* Description Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={tagForm.description}
                  onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400 resize-none"
                  rows={4}
                  placeholder="Brief description of this tag..."
                />
              </div>
              
              {/* Color Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tag Color
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={tagForm.color}
                      onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                      className="w-16 h-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={tagForm.color}
                      onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: tagForm.color }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowTagForm(false);
                    setEditingTag(null);
                    setTagForm({
                      name: '',
                      slug: '',
                      description: '',
                      color: '#3B82F6'
                    });
                  }}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {editingTag ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                      {editingTag ? 'Update Tag' : 'Create Tag'}
                    </div>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
        )}

        {/* New/Edit Post Modal */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 transform animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <PencilIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {editingPost ? 'Edit Post' : 'Create New Post'}
                      </h3>
                      <p className="text-green-100 text-sm">
                        {editingPost ? 'Update post content and settings' : 'Share your thoughts with the community'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPostForm(false);
                      setEditingPost(null);
                      setPostForm({
                        title: '',
                        content: '',
                        category: '',
                        tags: [],
                        status: 'draft'
                      });
                    }}
                    className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <form onSubmit={handlePostSubmit} className="space-y-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Post Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                      placeholder="What's your post about?"
                    />
                  </div>

                  {/* Content Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Post Content *
                    </label>
                    <textarea
                      required
                      rows={8}
                      value={postForm.content}
                      onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400 resize-none"
                      placeholder="Share your thoughts, ideas, or questions with the community..."
                    />
                  </div>

                  {/* Category and Status Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Category
                      </label>
                      <select
                        value={postForm.category}
                        onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      >
                        <option value="">📁 Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.slug}>
                            📂 {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Publication Status
                      </label>
                      <select
                        value={postForm.status}
                        onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      >
                        <option value="draft">📝 Draft</option>
                        <option value="pending">⏳ Pending Review</option>
                        <option value="published">✅ Published</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Tags
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600">
                      <div className="flex flex-wrap gap-3">
                        {tags.map((tag) => (
                          <label key={tag.id} className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={postForm.tags.includes(tag.slug)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPostForm({
                                    ...postForm,
                                    tags: [...postForm.tags, tag.slug]
                                  });
                                } else {
                                  setPostForm({
                                    ...postForm,
                                    tags: postForm.tags.filter(t => t !== tag.slug)
                                  });
                                }
                              }}
                              className="sr-only"
                            />
                            <span
                              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                                postForm.tags.includes(tag.slug)
                                  ? 'text-white border-transparent shadow-lg scale-105'
                                  : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400 hover:scale-105'
                              }`}
                              style={postForm.tags.includes(tag.slug) ? { backgroundColor: tag.color } : {}}
                            >
                              🏷️ {tag.name}
                            </span>
                          </label>
                        ))}
                      </div>
                      {tags.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
                          No tags available. Create some tags first.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPostForm(false);
                        setEditingPost(null);
                        setPostForm({
                          title: '',
                          content: '',
                          category: '',
                          tags: [],
                          status: 'draft'
                        });
                      }}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {editingPost ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                          {editingPost ? 'Update Post' : 'Create Post'}
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Post Detail Modal */}
        {showPostDetail && selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedPost.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>By {selectedPost.author}</span>
                      <span>•</span>
                      <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedPost.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : selectedPost.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {selectedPost.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPostDetail(false);
                      setSelectedPost(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Post Content */}
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                    </div>
                  </div>

                  {/* Post Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category</h4>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {selectedPost.category || 'Uncategorized'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPost.tags && selectedPost.tags.length > 0 ? (
                          selectedPost.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex gap-3">
                      {selectedPost.status === 'pending' && isAdmin && (
                        <React.Fragment>
                          <button
                            onClick={() => {
                              handleApprovePost(Number(selectedPost.id));
                              setShowPostDetail(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Approve Post
                          </button>
                          <button
                            onClick={() => {
                              handleRejectPost(Number(selectedPost.id));
                              setShowPostDetail(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Reject Post
                          </button>
                        </React.Fragment>
                      )}
                      <button
                        onClick={() => {
                          editPost(selectedPost);
                          setShowPostDetail(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit Post
                      </button>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          handleDeletePost(Number(selectedPost.id));
                          setShowPostDetail(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete Post
                      </button>
                    )}
                  </div>

                  {/* Discussion Section */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Discussion & Replies</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        Reply functionality will be implemented in the public forum interface.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        This admin panel focuses on content management and moderation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Forum;
