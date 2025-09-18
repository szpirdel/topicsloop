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

  if (loading) return <div>Loading form...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Create New Post</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Content:</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows="6"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Primary Category:</label>
          <select
            value={formData.primary_category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          >
            <option value="">Select primary category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Additional Categories:</label>
          <div style={{ marginTop: '5px' }}>
            {categories.map(cat => (
              <label key={cat.id} style={{ display: 'block', margin: '5px 0' }}>
                <input
                  type="checkbox"
                  checked={formData.additional_categories.includes(cat.id)}
                  onChange={() => handleCategoryChange(cat.id, true)}
                  style={{ marginRight: '8px' }}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Tags:</label>
          <div style={{ marginTop: '5px' }}>
            {tags.map(tag => (
              <label key={tag.id} style={{ display: 'inline-block', margin: '5px 10px 5px 0' }}>
                <input
                  type="checkbox"
                  checked={formData.tags.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                  style={{ marginRight: '5px' }}
                />
                #{tag.name}
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;