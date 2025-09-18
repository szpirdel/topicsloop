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

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>My Profile</h2>

      {/* User Info */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Account Information</h3>
        <p><strong>Username:</strong> {profile.user.username}</p>
        <p><strong>Email:</strong> {profile.user.email}</p>
        <p><strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        {/* Bio Section */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Bio (Tell us about yourself):
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share something about yourself..."
            rows="4"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Favorite Categories Section */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
            Favorite Categories (Select topics that interest you):
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            {categories.map(category => (
              <div
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                style={{
                  padding: '12px',
                  border: `2px solid ${selectedCategories.includes(category.id) ? '#007bff' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedCategories.includes(category.id) ? '#e3f2fd' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{category.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {category.description}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Selected: {selectedCategories.length} categories
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>
            {success}
          </div>
        )}

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Home
          </button>
        </div>
      </form>

      {/* Current Favorites Display */}
      {profile.favorite_categories.length > 0 && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h4>Your Current Favorite Categories:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {profile.favorite_categories.map(cat => (
              <span
                key={cat.id}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;