import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './TopicDetail.css';

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface Topic {
  id: number;
  title: string;
  body: string;
  type: string;
  author_name: string;
  author_avatar: string;
  category_name: string;
  category_slug: string;
  reply_count: number;
  views: number;
  votes: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

interface Post {
  id: number;
  body: string;
  author_name: string;
  author_avatar: string;
  is_answer: boolean;
  votes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTopicDetail();
      fetchPosts();
    }
  }, [id]);

  const fetchTopicDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/forum/topics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopic(data);
      } else {
        console.error('Failed to fetch topic');
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/forum/topics/${id}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch posts');
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setIsReplying(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/forum/topics/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body: replyText })
      });

      if (response.ok) {
        setReplyText('');
        fetchPosts(); // Refresh posts
        fetchTopicDetail(); // Refresh topic to update reply count
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  const markAsAnswer = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/forum/topics/${id}/posts/${postId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPosts();
        fetchTopicDetail();
      }
    } catch (error) {
      console.error('Error marking as answer:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="topic-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading topic...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="topic-detail-container">
        <div className="error-state">
          <h2>Topic not found</h2>
          <p>The topic you're looking for doesn't exist or has been removed.</p>
          <Link to="/forum" className="btn btn-primary">Back to Forum</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-detail-container">
      {/* Header */}
      <div className="topic-header">
        <div className="breadcrumb">
          <Link to="/forum">Forum</Link>
          <span className="separator">›</span>
          <span>{topic.category_name}</span>
        </div>
        
        <div className="topic-title-section">
          <div className="topic-icon-title">
            <span className="topic-icon">
              {getTopicIcon(topic.type, topic.is_answered, topic.is_locked)}
            </span>
            <h1>{topic.title}</h1>
            {topic.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
          </div>
          
          <div className="topic-meta">
            <span className="category">{topic.category_name}</span>
            <span className="author">by {topic.author_name}</span>
            <span className="date">{formatDate(topic.created_at)}</span>
            <span className="views">{topic.views} views</span>
          </div>
        </div>
      </div>

      {/* Topic Content */}
      <div className="topic-content">
        <div className="original-post">
          <div className="post-author">
            <div className="avatar">
              {topic.author_avatar ? (
                <img src={topic.author_avatar} alt={topic.author_name} />
              ) : (
                <div className="avatar-placeholder">{topic.author_name.charAt(0)}</div>
              )}
            </div>
            <div className="author-info">
              <div className="author-name">{topic.author_name}</div>
              <div className="post-date">{formatDate(topic.created_at)}</div>
            </div>
          </div>
          
          <div className="post-content">
            <div className="post-body" dangerouslySetInnerHTML={{ __html: topic.body.replace(/\n/g, '<br>') }} />
            
            {topic.tags.length > 0 && (
              <div className="topic-tags">
                {topic.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="tag-chip"
                    style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="post-actions">
            <button className="vote-btn">
              <span className="vote-icon">👍</span>
              <span className="vote-count">{topic.votes}</span>
            </button>
          </div>
        </div>

        {/* Posts/Replies */}
        <div className="posts-section">
          <div className="posts-header">
            <h3>{topic.reply_count} {topic.reply_count === 1 ? 'Reply' : 'Replies'}</h3>
          </div>
          
          {posts.map(post => (
            <div key={post.id} className={`post ${post.is_answer ? 'accepted-answer' : ''}`}>
              {post.is_answer && (
                <div className="answer-badge">
                  <span className="badge-icon">✅</span>
                  <span className="badge-text">Accepted Answer</span>
                </div>
              )}
              
              <div className="post-author">
                <div className="avatar">
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt={post.author_name} />
                  ) : (
                    <div className="avatar-placeholder">{post.author_name.charAt(0)}</div>
                  )}
                </div>
                <div className="author-info">
                  <div className="author-name">{post.author_name}</div>
                  <div className="post-date">{formatDate(post.created_at)}</div>
                </div>
              </div>
              
              <div className="post-content">
                <div className="post-body" dangerouslySetInnerHTML={{ __html: post.body.replace(/\n/g, '<br>') }} />
              </div>
              
              <div className="post-actions">
                <button className="vote-btn">
                  <span className="vote-icon">👍</span>
                  <span className="vote-count">{post.votes}</span>
                </button>
                
                {topic.type === 'question' && !post.is_answer && !topic.is_answered && (
                  <button 
                    className="accept-btn"
                    onClick={() => markAsAnswer(post.id)}
                  >
                    <span className="accept-icon">✅</span>
                    Mark as Answer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {!topic.is_locked && (
          <div className="reply-section">
            <h3>Post a Reply</h3>
            <form onSubmit={handleReply} className="reply-form">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows={6}
                className="reply-textarea"
                disabled={isReplying}
              />
              <div className="reply-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isReplying || !replyText.trim()}
                >
                  {isReplying ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        )}

        {topic.is_locked && (
          <div className="locked-notice">
            <span className="lock-icon">🔒</span>
            <span>This topic is locked and no longer accepts new replies.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicDetail;
