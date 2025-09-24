import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCategories } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await fetchCategories(true); // Main categories only initially

        // Handle new response format with categories array and stats
        if (data.categories) {
          setCategories(data.categories);
          setStats(data.stats || {});
        } else {
          // Fallback for old response format
          setCategories(data);
        }
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle category expansion (load subcategories)
  const handleCategoryExpand = async (categoryId) => {
    if (expandedCategories.has(categoryId)) {
      // Collapse - remove subcategories
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });

      // Remove subcategories from categories list
      setCategories(prev =>
        prev.filter(cat => cat.parent !== categoryId)
      );
    } else {
      // Expand - load subcategories
      try {
        const data = await fetchCategories(); // Get all categories
        const parentCategory = categories.find(cat => cat.id === categoryId);

        if (parentCategory && parentCategory.subcategories) {
          // Add subcategories to categories list after parent
          const parentIndex = categories.findIndex(cat => cat.id === categoryId);
          const newCategories = [...categories];
          newCategories.splice(parentIndex + 1, 0, ...parentCategory.subcategories);
          setCategories(newCategories);
        }

        setExpandedCategories(prev => new Set([...prev, categoryId]));
      } catch (err) {
        console.error('Error loading subcategories:', err);
      }
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Implementation can be added later
  };

  // Handle navigation to posts
  const handleBrowsePosts = (categoryId) => {
    navigate(`/posts?category=${categoryId}`);
  };

  // Handle navigation to graph view
  const handleViewNetwork = (categoryId) => {
    navigate(`/visualizations?focus_category=${categoryId}`);
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
    <div className="content-container">
      <div className="loading-spinner">Loading categories...</div>
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

  return (
    <div className="content-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          Explore Categories
        </h1>
        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          {stats.main_categories} main categories • {stats.total_categories} total • {stats.total_posts} posts
        </div>
      </div>

      {/* Search */}
      <div className="categories-search-container" style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '1rem',
              flex: 1,
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
          />
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#545b62'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            ✕ Clear
          </button>
        </form>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="empty-state">
          <h3>No categories found</h3>
          <p>
            {searchQuery
              ? `No categories match "${searchQuery}". Try a different search term.`
              : "No categories are available yet."
            }
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCategories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onExpand={() => handleCategoryExpand(category.id)}
              onBrowsePosts={() => handleBrowsePosts(category.id)}
              onViewNetwork={() => handleViewNetwork(category.id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Category Card Component
const CategoryCard = ({
  category,
  isExpanded,
  onExpand,
  onBrowsePosts,
  onViewNetwork,
  isAuthenticated
}) => {
  return (
    <div className="card" style={{
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }}>

      {/* Category Header */}
      <div
        onClick={category.has_subcategories ? onExpand : undefined}
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e9ecef',
          cursor: category.has_subcategories ? 'pointer' : 'default'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              color: '#2c3e50',
              margin: '0 0 0.5rem 0',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {category.name}
              {category.has_subcategories && (
                <span style={{
                  fontSize: '0.8rem',
                  color: '#6c757d',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  🔽
                </span>
              )}
            </h3>
            <p style={{
              color: '#6c757d',
              margin: '0 0 1rem 0',
              lineHeight: '1.5'
            }}>
              {category.description || 'No description available.'}
            </p>

            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.9rem',
              color: '#6c757d'
            }}>
              <span>📄 {category.post_count || 0} posts</span>
              {category.has_subcategories && (
                <span>📁 {category.subcategory_count || 0} subcategories</span>
              )}
              <span>🏷️ Level {category.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onBrowsePosts}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
              flex: 1
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            📝 Browse Posts
          </button>

          <button
            onClick={onViewNetwork}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
              flex: 1
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a2d91'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6f42c1'}
          >
            🧠 Semantic Graph
          </button>
        </div>
      </div>

      {/* Expanded Subcategories */}
      {isExpanded && category.subcategories && category.subcategories.length > 0 && (
        <div style={{
          borderTop: '1px solid #e9ecef',
          backgroundColor: '#f8f9fa',
          padding: '1rem 1.5rem'
        }}>
          <h4 style={{
            color: '#6c757d',
            fontSize: '0.9rem',
            margin: '0 0 1rem 0',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Subcategories
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            {category.subcategories.map(subcat => (
              <div
                key={subcat.id}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                onClick={() => onBrowsePosts(subcat.id)}
              >
                <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>
                  {subcat.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  {subcat.post_count || 0} posts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;