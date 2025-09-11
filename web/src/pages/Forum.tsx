import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Forum.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  topic_count: number;
  visibility: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  usage_count: number;
}

interface Topic {
  id: number;
  title: string;
  type: string;
  author_name: string;
  category_name: string;
  reply_count: number;
  views: number;
  votes: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_answered: boolean;
  created_at: string;
  tags: Tag[];
}

const Forum: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'popular' | 'unanswered'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchForumData();
  }, [activeTab, selectedCategory]);

  const fetchForumData = async () => {
    try {
      setLoading(true);
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

      // Fetch topics with filters
      const topicsParams = new URLSearchParams();
      if (selectedCategory) topicsParams.append('category_id', selectedCategory);
      
      switch (activeTab) {
        case 'popular':
          topicsParams.append('sort', 'popular');
          break;
        case 'unanswered':
          topicsParams.append('status', 'unanswered');
          break;
        default:
          topicsParams.append('sort', 'latest');
      }

      const topicsResponse = await fetch(`http://localhost:3000/api/forum/topics?${topicsParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!topicsResponse.ok) {
        throw new Error(`Topics API failed: ${topicsResponse.status}`);
      }
      
      const topicsData = await topicsResponse.json();
      setTopics(Array.isArray(topicsData) ? topicsData : []);

      // Fetch popular tags
      const tagsResponse = await fetch('http://localhost:3000/api/forum/tags/popular?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!tagsResponse.ok) {
        throw new Error(`Tags API failed: ${tagsResponse.status}`);
      }
      
      const tagsData = await tagsResponse.json();
      setPopularTags(Array.isArray(tagsData) ? tagsData : []);

    } catch (error) {
      console.error('Error fetching forum data:', error);
      // Set empty arrays as fallback to prevent map errors
      setCategories([]);
      setTopics([]);
      setPopularTags([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTopicIcon = (type: string, isAnswered: boolean, isLocked: boolean) => {
    if (isLocked) return '🔒';
    if (type === 'question') return isAnswered ? '✅' : '❓';
    if (type === 'announcement') return '📢';
    if (type === 'poll') return '📊';
    return '💬';
  };

  if (loading) {
    return (
      <div className="forum-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-container">
      {/* Header */}
      <div className="forum-header">
        <div className="forum-title">
          <h1>Community Forum</h1>
          <p>Connect, discuss, and share knowledge with the community</p>
        </div>
        <Link to="/forum/new-topic" className="btn btn-primary">
          <span className="icon">✏️</span>
          New Topic
        </Link>
      </div>

      <div className="forum-layout">
        {/* Sidebar */}
        <aside className="forum-sidebar">
          <div className="sidebar-section">
            <h3>Categories</h3>
            <div className="categories-list">
              <button 
                className={`category-item ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                <span className="category-name">All Categories</span>
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id.toString())}
                >
                  <span className="category-name">{category.name}</span>
                  <span className="topic-count">{category.topic_count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Popular Tags</h3>
            <div className="tags-list">
              {popularTags.map(tag => (
                <span
                  key={tag.id}
                  className="tag-chip"
                  style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                >
                  {tag.name}
                  <span className="tag-count">{tag.usage_count}</span>
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="forum-main">
          {/* Tabs */}
          <div className="forum-tabs">
            <button
              className={`tab-button ${activeTab === 'latest' ? 'active' : ''}`}
              onClick={() => setActiveTab('latest')}
            >
              Latest
            </button>
            <button
              className={`tab-button ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </button>
            <button
              className={`tab-button ${activeTab === 'unanswered' ? 'active' : ''}`}
              onClick={() => setActiveTab('unanswered')}
            >
              Unanswered
            </button>
          </div>

          {/* Topics List */}
          <div className="topics-list">
            {topics.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>No topics found</h3>
                <p>Be the first to start a discussion!</p>
                <Link to="/forum/new-topic" className="btn btn-primary">
                  Create First Topic
                </Link>
              </div>
            ) : (
              topics.map(topic => (
                <div key={topic.id} className="topic-card">
                  <div className="topic-icon">
                    {topic.is_pinned && <span className="pinned-badge">📌</span>}
                    <span className="type-icon">
                      {getTopicIcon(topic.type, topic.is_answered, topic.is_locked)}
                    </span>
                  </div>
                  
                  <div className="topic-content">
                    <div className="topic-header">
                      <Link to={`/forum/topics/${topic.id}`} className="topic-title">
                        {topic.title}
                      </Link>
                      <div className="topic-meta">
                        <span className="category">{topic.category_name}</span>
                        <span className="author">by {topic.author_name}</span>
                        <span className="date">{formatDate(topic.created_at)}</span>
                      </div>
                    </div>
                    
                    {topic.tags.length > 0 && (
                      <div className="topic-tags">
                        {topic.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="tag-chip small"
                            style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="topic-stats">
                    <div className="stat">
                      <span className="stat-number">{topic.reply_count}</span>
                      <span className="stat-label">replies</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{topic.views}</span>
                      <span className="stat-label">views</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{topic.votes}</span>
                      <span className="stat-label">votes</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Forum;
