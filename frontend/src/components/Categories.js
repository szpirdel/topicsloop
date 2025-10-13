import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CategoryTree from './CategoryTree';
import axios from '../api/axios';

const Categories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch posts (all or filtered by category)
  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: 20
      };

      if (selectedCategory) {
        params.category = selectedCategory.id;
      }

      const response = await axios.get('/api/posts/', { params });

      // Handle response format
      if (response.data.posts) {
        // Format: {posts: [...], pagination: {...}}
        setPosts(response.data.posts);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.total_pages || 1);
        }
      } else if (response.data.results) {
        // Alternative format: {results: [...], count: X}
        setPosts(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 20));
      } else if (Array.isArray(response.data)) {
        // Direct array
        setPosts(response.data);
      } else {
        setPosts([]);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="content-container">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Sidebar - Category Tree */}
        <div>
          <CategoryTree
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategory?.id || null}
          />
        </div>

        {/* Right Content - Posts */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#2c3e50', margin: '0 0 0.5rem 0' }}>
              {selectedCategory ? selectedCategory.name : 'All Posts'}
            </h1>
            {selectedCategory && selectedCategory.full_path && (
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                {selectedCategory.full_path}
              </div>
            )}
            {!loading && (
              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.5rem' }}>
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                {selectedCategory && ` in ${selectedCategory.name}`}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="loading-spinner">Loading posts...</div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="card">
              <div className="card-content" style={{ color: '#dc3545' }}>
                {error}
              </div>
              <button
                onClick={fetchPosts}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="card">
              <div className="card-content" style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>
                  No posts found
                </h3>
                <p style={{ color: '#6c757d' }}>
                  {selectedCategory
                    ? `No posts in "${selectedCategory.name}" yet.`
                    : 'No posts available.'}
                </p>
              </div>
            </div>
          )}

          {/* Posts List */}
          {!loading && !error && posts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem',
              padding: '1rem'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
                  color: currentPage === 1 ? '#6c757d' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              <span style={{ color: '#6c757d' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
                  color: currentPage === totalPages ? '#6c757d' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post }) => {
  return (
    <Link
      to={`/posts/${post.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="card"
        style={{
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
      >
        <div className="card-content">
          {/* Title */}
          <h3 style={{
            color: '#2c3e50',
            margin: '0 0 0.5rem 0',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            {post.title}
          </h3>

          {/* Meta Info */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.85rem',
            color: '#6c757d',
            marginBottom: '0.75rem'
          }}>
            <span>👤 {post.author?.username || 'Unknown'}</span>
            <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
            {post.primary_category && (
              <span style={{
                backgroundColor: '#e3f2fd',
                color: '#007bff',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                📁 {post.primary_category.full_path || post.primary_category.name}
              </span>
            )}
          </div>

          {/* Content Preview */}
          <p style={{
            color: '#6c757d',
            margin: 0,
            lineHeight: '1.5',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {post.content}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default Categories;
