import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewTopic.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  visibility: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

const NewTopic: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'discussion',
    category_id: '',
    tags: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch categories
      const categoriesResponse = await fetch('http://localhost:3000/api/forum/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!categoriesResponse.ok) {
        throw new Error(`Categories API failed: ${categoriesResponse.status}`);
      }
      
      const categoriesData = await categoriesResponse.json();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Fetch tags
      const tagsResponse = await fetch('http://localhost:3000/api/forum/tags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!tagsResponse.ok) {
        throw new Error(`Tags API failed: ${tagsResponse.status}`);
      }
      
      const tagsData = await tagsResponse.json();
      setAvailableTags(Array.isArray(tagsData) ? tagsData : []);

    } catch (error) {
      console.error('Error fetching form data:', error);
      // Set empty arrays as fallback to prevent map errors
      setCategories([]);
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 500) {
      newErrors.title = 'Title must be less than 500 characters';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Content is required';
    } else if (formData.body.length < 10) {
      newErrors.body = 'Content must be at least 10 characters long';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id)
        })
      });

      if (response.ok) {
        const topic = await response.json();
        navigate(`/forum/topics/${topic.id}`);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to create topic' });
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return '❓';
      case 'announcement': return '📢';
      case 'poll': return '📊';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="new-topic-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-topic-container">
      <div className="new-topic-header">
        <h1>Create New Topic</h1>
        <p>Start a new discussion, ask a question, or make an announcement</p>
      </div>

      <div className="new-topic-form-container">
        <form onSubmit={handleSubmit} className="new-topic-form">
          {/* Topic Type */}
          <div className="form-group">
            <label className="form-label">Topic Type</label>
            <div className="topic-types">
              {[
                { value: 'discussion', label: 'Discussion', description: 'General discussion or conversation' },
                { value: 'question', label: 'Question', description: 'Ask for help or information' },
                { value: 'announcement', label: 'Announcement', description: 'Share important news or updates' },
                { value: 'poll', label: 'Poll', description: 'Gather opinions from the community' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${formData.type === type.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <span className="type-icon">{getTypeIcon(type.value)}</span>
                  <div className="type-info">
                    <div className="type-label">{type.label}</div>
                    <div className="type-description">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter a descriptive title for your topic..."
              maxLength={500}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
            <div className="character-count">{formData.title.length}/500</div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className={`form-select ${errors.category_id ? 'error' : ''}`}
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <div className="error-message">{errors.category_id}</div>}
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="body" className="form-label">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              className={`form-textarea ${errors.body ? 'error' : ''}`}
              placeholder="Write your topic content here..."
              rows={12}
            />
            {errors.body && <div className="error-message">{errors.body}</div>}
            <div className="textarea-help">
              You can use line breaks and basic formatting. Be clear and descriptive.
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags (Optional)</label>
            <div className="tags-selection">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-option ${formData.tags.includes(tag.id) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    borderColor: tag.color,
                    backgroundColor: formData.tags.includes(tag.id) ? tag.color + '20' : 'transparent'
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="tags-help">
              Select relevant tags to help others find your topic. You can select multiple tags.
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="form-group">
              <div className="error-message">{errors.submit}</div>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/forum')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">✏️</span>
                  Create Topic
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTopic;
