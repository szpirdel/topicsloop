import React, { useState, useEffect } from 'react';
import { fetchCategories, fetchCategoryTree, fetchTags, createPost } from '../services/api';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    primary_category: '',
    additional_categories: [],
    tags: []
  });
  
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'flat'

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, categoryTreeData, tagsData] = await Promise.all([
          fetchCategories(),
          fetchCategoryTree(),
          fetchTags()
        ]);
        setCategories(categoriesData);
        setCategoryTree(categoryTreeData.tree || []);
        setTags(tagsData);
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: log form data before submission
    console.log('Form data before submission:', formData);
    console.log('Primary category type:', typeof formData.primary_category);
    console.log('Additional categories:', formData.additional_categories);
    console.log('Tags:', formData.tags);

    try {
      const newPost = await createPost(formData);
      console.log('Post created:', newPost);
      alert('Post created successfully!');
      // Reset form
      setFormData({
        title: '',
        content: '',
        primary_category: '',
        additional_categories: [],
        tags: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error creating post: ${error.response?.data?.detail || error.message}. Please make sure you are logged in.`);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (categoryId, isAdditional = false) => {
    // Ensure categoryId is a number for consistency
    const numericCategoryId = parseInt(categoryId);

    if (isAdditional) {
      const newAdditional = formData.additional_categories.includes(numericCategoryId)
        ? formData.additional_categories.filter(id => id !== numericCategoryId)
        : [...formData.additional_categories, numericCategoryId];

      setFormData({
        ...formData,
        additional_categories: newAdditional
      });
    } else {
      setFormData({
        ...formData,
        primary_category: numericCategoryId
      });
    }
  };

  const handleTagChange = (tagId) => {
    // Ensure tagId is a number for consistency
    const numericTagId = parseInt(tagId);

    const newTags = formData.tags.includes(numericTagId)
      ? formData.tags.filter(id => id !== numericTagId)
      : [...formData.tags, numericTagId];

    setFormData({
      ...formData,
      tags: newTags
    });
  };

  // Helper function to render hierarchical category tree
  const renderCategoryTree = (categoryList, isMainCategory = false) => {
    return categoryList.map(category => (
      <div key={category.id} style={{ marginBottom: '0.5rem' }}>
        <label
          className="d-flex align-items-center"
          style={{
            cursor: 'pointer',
            padding: '0.5rem',
            backgroundColor: formData.additional_categories.includes(category.id) ? '#e3f2fd' : '#f8f9fa',
            border: `2px solid ${formData.additional_categories.includes(category.id) ? '#007bff' : '#e9ecef'}`,
            borderRadius: '8px',
            marginLeft: isMainCategory ? '0' : '1.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="checkbox"
            checked={formData.additional_categories.includes(category.id)}
            onChange={() => handleCategoryChange(category.id, true)}
            style={{ marginRight: '0.75rem' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: category.level === 0 ? '600' : '500',
              color: category.level === 0 ? '#2c3e50' : '#6c757d',
              fontSize: category.level === 0 ? '0.9rem' : '0.8rem'
            }}>
              {category.level > 0 && '└─ '}
              {category.name}
            </div>
            {category.description && (
              <div style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '0.25rem' }}>
                {category.description}
              </div>
            )}
            {category.level > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#007bff' }}>
                {category.full_path}
              </div>
            )}
          </div>
        </label>

        {/* Render subcategories */}
        {category.subcategories && category.subcategories.length > 0 &&
          renderCategoryTree(category.subcategories, false)
        }
      </div>
    ));
  };

  // Helper function to render flat category list
  const renderFlatCategories = () => {
    return categories.map(cat => (
      <label key={cat.id} className="d-flex align-items-center" style={{ cursor: 'pointer', padding: '0.25rem' }}>
        <input
          type="checkbox"
          checked={formData.additional_categories.includes(cat.id)}
          onChange={() => handleCategoryChange(cat.id, true)}
          style={{ marginRight: '0.5rem' }}
        />
        <div>
          <span className="category-badge" style={{ fontSize: '0.8rem' }}>
            {cat.full_path || cat.name}
          </span>
          {cat.description && (
            <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {cat.description}
            </div>
          )}
        </div>
      </label>
    ));
  };

  if (loading) return (
    <div className="content-container">
      <div className="loading-spinner">Loading form...</div>
    </div>
  );

  return (
    <div className="content-container">
      <div className="d-flex justify-content-center">
        <div className="card" style={{ maxWidth: '700px', width: '100%' }}>
          <div className="card-title">Create New Post</div>
          <div className="card-content">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title:</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a compelling title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content:</label>
                <textarea
                  name="content"
                  className="form-textarea"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="8"
                  placeholder="Share your knowledge and insights..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Category:</label>
                <select
                  className="form-select"
                  value={formData.primary_category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Select primary category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.full_path || cat.name}
                      {cat.level > 0 && ` (${cat.level === 1 ? 'Subcategory' : 'Sub-subcategory'})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label">Additional Categories:</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setViewMode('tree')}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                    >
                      📊 Tree View
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${viewMode === 'flat' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setViewMode('flat')}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                    >
                      📋 List View
                    </button>
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', backgroundColor: '#f8f9fa', maxHeight: '400px', overflowY: 'auto' }}>
                  {viewMode === 'tree' ? (
                    <div>
                      {categoryTree.length > 0 ? (
                        renderCategoryTree(categoryTree, true)
                      ) : (
                        <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
                          <p>No hierarchical categories available</p>
                          <button
                            type="button"
                            onClick={() => setViewMode('flat')}
                            className="btn btn-outline btn-sm"
                          >
                            Switch to List View
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
                      {renderFlatCategories()}
                    </div>
                  )}
                </div>

                <div className="mt-2" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  💡 <strong>Tree View:</strong> Shows hierarchical relationships (Main Category → Subcategory)<br/>
                  💡 <strong>List View:</strong> Shows all categories in a simple grid layout
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags:</label>
                <div className="card" style={{ padding: '1rem', backgroundColor: '#f8f9fa' }}>
                  <div className="tag-list">
                    {tags.map(tag => (
                      <label key={tag.id} className="d-flex align-items-center" style={{ cursor: 'pointer', marginRight: '1rem', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.tags.includes(tag.id)}
                          onChange={() => handleTagChange(tag.id)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span className="tag-badge">
                          #{tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Post
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFormData({
                    title: '',
                    content: '',
                    primary_category: '',
                    additional_categories: [],
                    tags: []
                  })}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;