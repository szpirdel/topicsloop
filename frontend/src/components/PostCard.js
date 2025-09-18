import React from 'react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="post-card" style={{ border: '1px solid #ddd', padding: '16px', margin: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3>{post.title}</h3>
        {isOwner() && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleEdit}
              style={{
                padding: '4px 8px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <p><strong>Author:</strong> {post.author.username} ({post.author.email})</p>
      <p><strong>Category:</strong> {post.primary_category?.name || 'No category'}</p>
      {post.additional_categories.length > 0 && (
        <p><strong>Also in:</strong> {post.additional_categories.map(cat => cat.name).join(', ')}</p>
      )}
      <p><strong>Tags:</strong> {post.tags.map(tag => `#${tag.name}`).join(', ')}</p>
      <p>{post.content}</p>
      <small>Created: {new Date(post.created_at).toLocaleDateString()}</small>
    </div>
  );
};

export default PostCard;