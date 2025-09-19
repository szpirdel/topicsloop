import React, { useState, useEffect } from 'react';
import { fetchPosts, fetchUserProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './PostCard';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load user profile and favorite categories
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const profile = await fetchUserProfile();
          setUserProfile(profile);
          // By default, select all favorite categories
          const favoriteIds = profile.favorite_categories.map(cat => cat.id);
          setSelectedCategories(favoriteIds);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };

    loadUserProfile();
  }, [isAuthenticated]);

  // Load posts based on filters
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const filters = {
          categories: selectedCategories,
          showAll: showAll
        };
        const data = await fetchPosts(filters);
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategories, showAll]);

  if (loading) return (
    <div className="content-container">
      <div className="loading-spinner">Loading posts...</div>
    </div>
  );

  if (error) return (
    <div className="content-container">
      <div className="card">
        <div className="card-title">Error</div>
        <div className="card-content" style={{ color: '#dc3545' }}>{error}</div>
      </div>
    </div>
  );

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter(post => post.id !== deletedPostId));
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSelectAll = () => {
    if (userProfile?.favorite_categories) {
      const allIds = userProfile.favorite_categories.map(cat => cat.id);
      setSelectedCategories(allIds);
    }
  };

  const handleSelectNone = () => {
    setSelectedCategories([]);
  };

  const handleShowAllToggle = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="content-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          {showAll ? 'All Posts' : 'Posts from Your Interests'}
        </h1>
        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Filter Panel - only show if user is authenticated and has favorite categories */}
      {isAuthenticated && userProfile?.favorite_categories?.length > 0 && (
        <div className="card mb-4">
          <div className="card-title">Filter Posts</div>
          <div className="card-content">
            {/* Show All Toggle */}
            <div className="d-flex align-items-center mb-3">
              <label className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={handleShowAllToggle}
                  style={{ marginRight: '0.5rem' }}
                />
                <span style={{ fontWeight: '500' }}>
                  Show all posts (not just from your interests)
                </span>
              </label>
            </div>

            {/* Category Filters - only show if not showing all */}
            {!showAll && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontWeight: '500', color: '#2c3e50' }}>
                    Select categories to view:
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '1rem'
                }}>
                  {userProfile.favorite_categories.map(category => (
                    <label
                      key={category.id}
                      className="d-flex align-items-center"
                      style={{
                        cursor: 'pointer',
                        padding: '0.75rem',
                        backgroundColor: selectedCategories.includes(category.id) ? '#e3f2fd' : '#f8f9fa',
                        border: `2px solid ${selectedCategories.includes(category.id) ? '#007bff' : '#e9ecef'}`,
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                          {category.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          {category.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-3" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Showing posts from <strong>{selectedCategories.length}</strong> of{' '}
                  <strong>{userProfile.favorite_categories.length}</strong> favorite categories
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts found</h3>
          <p>
            {showAll
              ? "No posts are available in the system yet."
              : selectedCategories.length === 0
              ? "Select some categories to view posts, or enable 'Show all posts'."
              : "No posts found in your selected categories. Try selecting more categories or enabling 'Show all posts'."
            }
          </p>
        </div>
      ) : (
        <div className="post-grid">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;