import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const PostCard = ({ post, onPostDeleted }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleCardClick = (e) => {
    // Don't expand if clicking on buttons
    if (e.target.closest('button')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="post-card fade-in"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
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
          {isExpanded ? post.content : (
            post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content
          )}
        </div>

        {post.content.length > 200 && (
          <div className="mt-2">
            <span style={{
              color: '#007bff',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              {isExpanded ? 'Click to collapse' : 'Click to read more'}
            </span>
          </div>
        )}

        <div className="mb-2 mt-3">
          <span className="category-badge">
            {post.primary_category?.name || 'No category'}
          </span>
          {post.additional_categories.length > 0 && (
            <div className="tag-list mt-1">
              {post.additional_categories.map(cat => (
                <span key={cat.id} className="tag-badge">
                  {cat.name}
                </span>
              ))}
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