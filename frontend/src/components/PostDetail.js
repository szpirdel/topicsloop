import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../api/axios';
import Breadcrumbs from './Breadcrumbs';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/posts/${id}/`);
        setPost(response.data);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id || payload.sub || payload.id;
      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const isOwner = () => {
    const currentUserId = getCurrentUserId();
    return currentUserId && post && currentUserId === post.author.id;
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
        navigate('/posts');
      } catch (error) {
        alert('Failed to delete post');
      }
    }
  };

  const handleShowOnGraph = () => {
    navigate(`/visualizations?focus_post=${post.id}`);
  };

  if (loading) return (
    <div className="content-container">
      <div className="loading-spinner">Loading post...</div>
    </div>
  );

  if (error) return (
    <div className="content-container">
      <div className="card">
        <div className="card-title">Error</div>
        <div className="card-content" style={{ color: '#dc3545' }}>{error}</div>
        <div className="mt-3">
          <Link to="/posts" className="btn btn-secondary">← Back to Posts</Link>
        </div>
      </div>
    </div>
  );

  if (!post) return null;

  return (
    <div className="content-container">
      <Breadcrumbs 
        path={post.primary_category?.path} 
        currentPage={post.title}
      />

      {/* Main Content Card */}
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div className="card-header" style={{ borderBottom: '1px solid #e9ecef', paddingBottom: '1.5rem' }}>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h1 style={{
              color: '#2c3e50',
              fontSize: '2rem',
              fontWeight: '700',
              lineHeight: '1.3',
              margin: 0,
              flex: 1,
              marginRight: '1rem'
            }}>
              {post.title}
            </h1>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button
                onClick={handleShowOnGraph}
                className="btn"
                style={{
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a2d91'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
              >
                🧠 Show on Semantic Graph
              </button>
              {isAuthenticated && isOwner() && (
                <>
                  <button onClick={handleEdit} className="btn btn-primary">
                    ✏️ Edit
                  </button>
                  <button onClick={handleDelete} className="btn btn-danger">
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Meta Information */}
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
            <div className="d-flex align-items-center">
              <span style={{ marginRight: '0.5rem' }}>👤</span>
              <strong style={{ color: '#2c3e50' }}>{post.author.username}</strong>
            </div>
            <div className="d-flex align-items-center">
              <span style={{ marginRight: '0.5rem' }}>📅</span>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {post.updated_at !== post.created_at && (
              <div className="d-flex align-items-center">
                <span style={{ marginRight: '0.5rem' }}>📝</span>
                <em>Updated {new Date(post.updated_at).toLocaleDateString()}</em>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <span style={{ fontSize: '0.9rem', color: '#6c757d', marginRight: '0.75rem' }}>
                📁 Primary Category:
              </span>
              <span
                className="category-badge"
                style={{
                  backgroundColor: post.primary_category?.level === 0 ? '#3498db' : '#2ecc71',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
                title={post.primary_category?.full_path}
              >
                {post.primary_category?.full_path || post.primary_category?.name || 'No category'}
              </span>
            </div>

            {post.additional_categories?.length > 0 && (
              <div className="d-flex align-items-center flex-wrap">
                <span style={{ fontSize: '0.9rem', color: '#6c757d', marginRight: '0.75rem' }}>
                  📂 Additional Categories:
                </span>
                <div className="d-flex flex-wrap gap-2">
                  {post.additional_categories.map(cat => (
                    <span
                      key={cat.id}
                      className="category-badge"
                      style={{
                        backgroundColor: cat.level === 0 ? '#3498db' : '#2ecc71',
                        color: 'white',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}
                      title={cat.full_path}
                    >
                      {cat.full_path || cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="d-flex align-items-center flex-wrap">
              <span style={{ fontSize: '0.9rem', color: '#6c757d', marginRight: '0.75rem' }}>
                🏷️ Tags:
              </span>
              <div className="d-flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="tag-badge"
                    style={{
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="card-content" style={{ padding: '2rem' }}>
          <div
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: '#2c3e50',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {post.content}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="card-footer" style={{
          borderTop: '1px solid #e9ecef',
          backgroundColor: '#f8f9fa',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link
            to="/posts"
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            ← Back to Posts
          </Link>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline"
              onClick={() => navigator.share ?
                navigator.share({
                  title: post.title,
                  text: post.content.substring(0, 100) + '...',
                  url: window.location.href
                }) :
                navigator.clipboard.writeText(window.location.href).then(() =>
                  alert('Link copied to clipboard!')
                )
              }
            >
              🔗 Share
            </button>

            <button
              className="btn"
              onClick={() => navigate(`/visualizations?focus_post=${post.id}&find_similar=true`)}
              style={{
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              🔍 Find Similar Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;