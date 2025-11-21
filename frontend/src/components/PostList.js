import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPosts, fetchUserProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './PostCard';
import Pagination from './Pagination';

// Search Component for Posts Page
const PostsSearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize with current search query from URL
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    setSearchQuery(currentSearch);
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams();

    if (searchQuery.trim()) {
      newSearchParams.set('search', searchQuery.trim());
    }

    // Navigate to new URL (this will reset to page 1)
    navigate(`/posts?${newSearchParams.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/posts');
  };

  return (
    <div className="posts-search-container" style={{
      marginBottom: '1rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'transparent',
      borderRadius: '6px',
      border: '1px solid #e9ecef'
    }}>
      <form onSubmit={handleSearch} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <input
          type="text"
          placeholder="Search your posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '0.9rem',
            flex: 1,
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#5568d3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
        >
          🔍
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#e9ecef',
              color: '#6c757d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dee2e6'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e9ecef'}
          >
            ✕
          </button>
        )}
      </form>
    </div>
  );
};

const PostList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get search query from URL
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const pageSize = parseInt(searchParams.get('page_size')) || 10;

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
          // URL search parameters
          search: searchQuery,
          category: categoryFilter,
          page: currentPage,
          page_size: pageSize,
          // Always respect user's category selections (even during search)
          categories: selectedCategories,
          showAll: showAll
        };

        const data = await fetchPosts(filters);
        // Handle new response structure with posts array and pagination
        if (data.posts) {
          setPosts(data.posts);
          setPagination(data.pagination);
        } else {
          // Fallback for old response structure
          setPosts(data);
          setPagination(null);
        }
      } catch (err) {
        setError('Failed to load posts');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategories, showAll, searchQuery, categoryFilter, currentPage, pageSize]);

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

  // Handle pagination page change
  const handlePageChange = (newFilters) => {
    const newSearchParams = new URLSearchParams();

    // Preserve existing search/category filters
    if (searchQuery) newSearchParams.set('search', searchQuery);
    if (categoryFilter) newSearchParams.set('category', categoryFilter);

    // Add pagination
    if (newFilters.page) newSearchParams.set('page', newFilters.page);
    if (newFilters.page_size && newFilters.page_size !== 10) {
      newSearchParams.set('page_size', newFilters.page_size);
    }

    // Navigate to new URL
    navigate(`/posts?${newSearchParams.toString()}`);
  };

  return (
    <div className="content-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          {searchQuery ? `Search Results for "${searchQuery}"` :
           categoryFilter ? 'Filtered Posts' :
           showAll ? 'All Posts' :
           isAuthenticated ? 'Your Interests Content' : 'Your Interests Content (Log in to Personalize)'}
        </h1>
        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          {pagination ?
            `${pagination.total_count} post${pagination.total_count !== 1 ? 's' : ''} found` :
            `${posts.length} post${posts.length !== 1 ? 's' : ''} found`
          }
          {pagination && pagination.total_count > pagination.page_size && (
            <span style={{ marginLeft: '1rem', color: '#666' }}>
              (showing page {pagination.current_page} of {pagination.total_pages})
            </span>
          )}
          {searchQuery && (
            <span style={{ marginLeft: '1rem', color: '#3498db' }}>
              🔍 "{searchQuery}"
            </span>
          )}
        </div>
      </div>

      {/* Search Component - only show if user has favorite categories */}
      {isAuthenticated && userProfile?.favorite_categories?.length > 0 && (
        <PostsSearchComponent />
      )}

      {/* Empty State - No Favorite Categories */}
      {isAuthenticated && userProfile && userProfile.favorite_categories?.length === 0 && (
        <div className="card" style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
          <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.8rem' }}>
            Personalize Your Feed
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.95 }}>
            Select topics you're interested in to see relevant posts here.<br/>
            Make this page truly yours!
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            Choose Your Interests →
          </button>
          <div style={{ marginTop: '1.5rem', fontSize: '0.95rem', opacity: 0.9 }}>
            Or browse <button
              onClick={() => navigate('/categories')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              all categories
            </button> to discover topics
          </div>
        </div>
      )}

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
        <>
          <div className="post-grid">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
            ))}
          </div>

          {/* Pagination Component */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            currentFilters={{
              search: searchQuery,
              category: categoryFilter,
              page_size: pageSize
            }}
          />
        </>
      )}
    </div>
  );
};

export default PostList;