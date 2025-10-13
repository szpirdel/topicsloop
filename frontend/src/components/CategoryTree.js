import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * CategoryTreeNode Component
 *
 * Renders a single category node with expand/collapse functionality
 * This component calls itself recursively to render children
 */
const CategoryTreeNode = ({ node, level = 0, onCategoryClick, selectedCategoryId }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Root categories expanded by default

  const hasChildren = node.children && node.children.length > 0;
  const indentSize = level * 20; // 20px per level
  const isSelected = selectedCategoryId === node.id;

  const toggleExpand = (e) => {
    e.stopPropagation(); // Don't trigger category click
    setIsExpanded(!isExpanded);
  };

  const handleCategoryClick = () => {
    if (onCategoryClick) {
      onCategoryClick(node);
    }
  };

  return (
    <div style={{ marginLeft: `${indentSize}px` }}>
      {/* Category Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
          borderLeft: isSelected ? '3px solid #007bff' : '3px solid transparent'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <span
            onClick={toggleExpand}
            style={{
              cursor: 'pointer',
              marginRight: '0.5rem',
              fontSize: '1rem',
              userSelect: 'none',
              width: '20px',
              textAlign: 'center'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ marginRight: '0.5rem', width: '20px' }}></span>
        )}

        {/* Category Name and Count */}
        <div
          onClick={handleCategoryClick}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              fontWeight: level === 0 ? '600' : '500',
              color: '#2c3e50',
              fontSize: level === 0 ? '1rem' : '0.9rem'
            }}
          >
            {node.name}
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              color: '#6c757d',
              backgroundColor: '#e9ecef',
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              marginLeft: '0.5rem'
            }}
          >
            {node.post_count}
          </span>
        </div>
      </div>

      {/* Children (rendered recursively) */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onCategoryClick={onCategoryClick}
              selectedCategoryId={selectedCategoryId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CategoryTree Component
 *
 * Main component that fetches and displays the category tree
 */
const CategoryTree = ({ onCategorySelect, selectedCategoryId }) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategoryTree();
  }, []);

  const fetchCategoryTree = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories/tree/');
      setTreeData(response.data.tree || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching category tree:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleShowAllPosts = () => {
    if (onCategorySelect) {
      onCategorySelect(null); // null means show all posts
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ color: '#6c757d' }}>Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ color: '#dc3545' }}>{error}</div>
        <button
          onClick={fetchCategoryTree}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
        No categories found
      </div>
    );
  }

  return (
    <div
      className="category-tree"
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: '1rem'
      }}
    >
      <h3
        style={{
          margin: '0 0 1rem 0',
          fontSize: '1.2rem',
          fontWeight: '600',
          color: '#2c3e50'
        }}
      >
        Categories
      </h3>

      {/* All Posts Button */}
      <div
        onClick={handleShowAllPosts}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem',
          cursor: 'pointer',
          borderRadius: '4px',
          marginBottom: '0.5rem',
          transition: 'all 0.2s ease',
          backgroundColor: selectedCategoryId === null ? '#e3f2fd' : 'transparent',
          borderLeft: selectedCategoryId === null ? '3px solid #007bff' : '3px solid transparent',
          fontWeight: '500',
          color: '#2c3e50'
        }}
        onMouseEnter={(e) => {
          if (selectedCategoryId !== null) e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          if (selectedCategoryId !== null) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        📚 All Posts
      </div>

      {/* Category Tree */}
      {treeData.map((rootCategory) => (
        <CategoryTreeNode
          key={rootCategory.id}
          node={rootCategory}
          level={0}
          onCategoryClick={handleCategoryClick}
          selectedCategoryId={selectedCategoryId}
        />
      ))}
    </div>
  );
};

export default CategoryTree;
