import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';

const PostCard = ({ post, onPostDeleted }) => {
  const navigate = useNavigate();

  const getCurrentUserId = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id || payload.sub || payload.id;
      // Konwertuj na number żeby porównać z post.author.id
      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const isOwner = () => {
    const currentUserId = getCurrentUserId();
    return currentUserId && currentUserId === post.author.id;
  };

  const handleEdit = () => {
    navigate(`/edit/${post.id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`/api/posts/${post.id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      } catch (error) {
        alert('Failed to delete post');
      }
    }
  };

  const handleReadMore = () => {
    navigate(`/posts/${post.id}`);
  };

  const handleShowOnGraph = () => {
    navigate(`/visualizations?focus_post=${post.id}`);
  };

  return (
    <div className="post-card fade-in">
      <div className="post-card-header">
        <div className="d-flex justify-content-between align-items-flex-start">
          <h3 className="post-card-title">{post.title}</h3>
          {isOwner() && (
            <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleEdit} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="post-card-meta">
          <span>by <strong>{post.author.username}</strong></span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="post-card-body">
        <div className="post-card-content">
          {post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 d-flex justify-content-between align-items-center gap-2">
          <div className="d-flex gap-2" style={{ flex: 1 }}>
            <Link
              to={`/posts/${post.id}`}
              className="btn"
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                flex: 1
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              📖 Read Full Post
            </Link>

            <button
              onClick={handleShowOnGraph}
              className="btn"
              style={{
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                flex: 1
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a2d91'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
            >
              🧠 Show on Semantic Graph
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
            {post.content.length > 300 && (
              <span>{post.content.length} characters</span>
            )}
          </div>
        </div>

        <div className="mb-2 mt-3">
          <div className="d-flex align-items-center mb-2">
            <span style={{ fontSize: '0.8rem', color: '#6c757d', marginRight: '0.5rem' }}>
              📁 Primary:
            </span>
            <span
              className="category-badge"
              title={post.primary_category?.full_path}
              style={{
                backgroundColor: post.primary_category?.level === 0 ? '#3498db' : '#2ecc71',
                color: 'white'
              }}
            >
              {post.primary_category?.full_path || post.primary_category?.name || 'No category'}
            </span>
          </div>

          {post.additional_categories.length > 0 && (
            <div className="mb-2">
              <span style={{ fontSize: '0.8rem', color: '#6c757d', marginRight: '0.5rem' }}>
                📂 Additional:
              </span>
              <div className="tag-list" style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {post.additional_categories.map(cat => (
                  <span
                    key={cat.id}
                    className="tag-badge"
                    title={cat.full_path}
                    style={{
                      backgroundColor: cat.level === 0 ? '#3498db' : '#2ecc71',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  >
                    {cat.full_path || cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="tag-list">
            {post.tags.map(tag => (
              <span key={tag.id} className="tag-badge">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;