import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [bio, setBio] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user profile and categories in parallel
        const [profileResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/profile/me/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get('/api/categories/')
        ]);

        console.log('Profile data:', profileResponse.data);
        console.log('Categories data:', categoriesResponse.data);

        setProfile(profileResponse.data);
        setCategories(categoriesResponse.data);
        setBio(profileResponse.data.bio || '');
        setSelectedCategories(profileResponse.data.favorite_categories.map(cat => cat.id));

      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        } else {
          setError('Failed to load profile data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const updateData = {
        bio: bio,
        favorite_category_ids: selectedCategories
      };

      console.log('Sending update:', updateData);

      const response = await axios.patch('/api/profile/me/', updateData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Update response:', response.data);
      setProfile(response.data);
      setSuccess('Profile updated successfully!');

    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="content-container">
      <div className="loading-spinner">Loading profile...</div>
    </div>
  );

  if (!profile) return (
    <div className="content-container">
      <div className="empty-state">
        <h3>Profile not found</h3>
      </div>
    </div>
  );

  return (
    <div className="content-container">
      <div className="card profile-header">
        <div className="profile-avatar">
          {profile.user.username.charAt(0).toUpperCase()}
        </div>
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>{profile.user.username}</h1>
        <p style={{ opacity: 0.9, margin: 0 }}>{profile.user.email}</p>
      </div>

      <div className="card profile-body">
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-number">{profile.favorite_categories.length}</div>
            <div className="stat-label">Favorite Categories</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{new Date(profile.created_at).getFullYear()}</div>
            <div className="stat-label">Member Since</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          {/* Bio Section */}
          <div className="form-group">
            <label className="form-label">Bio:</label>
            <textarea
              className="form-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows="4"
            />
          </div>

          {/* Favorite Categories Section */}
          <div className="form-group">
            <label className="form-label">
              Favorite Categories
              <span style={{ color: '#6c757d', fontWeight: 'normal', fontSize: '0.9rem' }}>
                (Select topics that interest you)
              </span>
            </label>
            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f8f9fa' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {categories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className="card"
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      borderColor: selectedCategories.includes(category.id) ? '#007bff' : '#e9ecef',
                      backgroundColor: selectedCategories.includes(category.id) ? '#e3f2fd' : 'white',
                      borderWidth: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                      {category.name}
                    </div>
                    <div className="card-content" style={{ fontSize: '0.8rem' }}>
                      {category.description}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                Selected: <strong>{selectedCategories.length}</strong> categories
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="card mb-3" style={{ backgroundColor: '#fdf2f2', borderColor: '#fecaca', color: '#dc3545' }}>
              <div className="card-content">{error}</div>
            </div>
          )}

          {success && (
            <div className="card mb-3" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
              <div className="card-content">{success}</div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className={`btn ${saving ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1 }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Back to Home
            </button>
          </div>
        </form>

        {/* Current Favorites Display */}
        {profile.favorite_categories.length > 0 && (
          <div className="card mt-4">
            <div className="card-title">Your Current Favorite Categories</div>
            <div className="card-content">
              <div className="tag-list">
                {profile.favorite_categories.map(cat => (
                  <span key={cat.id} className="category-badge">
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;