import React, { useState, useEffect } from 'react';
import { fetchCategories, fetchTags, createPost } from '../services/api';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    primary_category: '',
    additional_categories: [],
    tags: []
  });
  
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          fetchCategories(),
          fetchTags()
        ]);
        setCategories(categoriesData);
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
      alert('Error creating post. Please make sure you are logged in.');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (categoryId, isAdditional = false) => {
    if (isAdditional) {
      const newAdditional = formData.additional_categories.includes(categoryId)
        ? formData.additional_categories.filter(id => id !== categoryId)
        : [...formData.additional_categories, categoryId];
      
      setFormData({
        ...formData,
        additional_categories: newAdditional
      });
    } else {
      setFormData({
        ...formData,
        primary_category: categoryId
      });
    }
  };

  const handleTagChange = (tagId) => {
    const newTags = formData.tags.includes(tagId)
      ? formData.tags.filter(id => id !== tagId)
      : [...formData.tags, tagId];
    
    setFormData({
      ...formData,
      tags: newTags
    });
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
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Categories:</label>
                <div className="card" style={{ padding: '1rem', backgroundColor: '#f8f9fa' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {categories.map(cat => (
                      <label key={cat.id} className="d-flex align-items-center" style={{ cursor: 'pointer', padding: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.additional_categories.includes(cat.id)}
                          onChange={() => handleCategoryChange(cat.id, true)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span className="category-badge" style={{ fontSize: '0.8rem' }}>
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
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