import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const EditPost = () => {
  console.log('EditPost component rendered');
  const { id } = useParams();
  console.log('Post ID from URL:', id);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    primary_category_id: '',
    additional_category_ids: [],
    tag_ids: []
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for post ID:', id);

        // Debug token
        const token = localStorage.getItem('access_token');
        console.log('Access token:', token ? 'exists' : 'missing');
        console.log('Token length:', token?.length);

        // Clear invalid token
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp < Date.now() / 1000;
            console.log('Token expired:', isExpired);
            if (isExpired) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              console.log('Removed expired token');
            }
          } catch (e) {
            console.log('Invalid token format, removing');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        }

        console.log('Making API calls...');

        const postResponse = await axios.get(`/api/posts/${id}/`);
        console.log('Got post response');

        const categoriesResponse = await axios.get('/api/categories/');
        console.log('Got categories response');

        const tagsResponse = await axios.get('/api/tags/');
        console.log('Got tags response');

        console.log('Post response:', postResponse.data);
        console.log('Categories response:', categoriesResponse.data);
        console.log('Tags response:', tagsResponse.data);

        const post = postResponse.data;
        setFormData({
          title: post.title,
          content: post.content,
          primary_category_id: post.primary_category?.id || '',
          additional_category_ids: post.additional_categories.map(cat => cat.id),
          tag_ids: post.tags.map(tag => tag.id)
        });

        setCategories(categoriesResponse.data);
        setTags(tagsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError(`Failed to load post data: ${err.response?.data?.detail || err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (e, fieldName) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      [fieldName]: selectedIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`/api/posts/${id}/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      navigate('/posts');
    } catch (err) {
      setError('Failed to update post');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Edit Post</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Content:</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows="6"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Primary Category:</label>
          <select
            name="primary_category_id"
            value={formData.primary_category_id}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Additional Categories:</label>
          <select
            multiple
            onChange={(e) => handleMultiSelectChange(e, 'additional_category_ids')}
            value={formData.additional_category_ids}
            style={{ width: '100%', padding: '8px', marginTop: '5px', height: '100px' }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Tags:</label>
          <select
            multiple
            onChange={(e) => handleMultiSelectChange(e, 'tag_ids')}
            value={formData.tag_ids}
            style={{ width: '100%', padding: '8px', marginTop: '5px', height: '100px' }}
          >
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            Update Post
          </button>
          <button type="button" onClick={() => navigate('/posts')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;