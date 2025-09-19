import axios from '../api/axios';

// Create separate instance for public endpoints (no auth)
const publicAPI = axios.create({
  baseURL: "http://localhost:8000",
});

export const fetchPosts = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.categories && filters.categories.length > 0) {
    params.append('categories', filters.categories.join(','));
  }

  if (filters.showAll) {
    params.append('show_all', 'true');
  }

  const url = `/api/posts/${params.toString() ? `?${params.toString()}` : ''}`;

  // Use authenticated API if we have filters (which means user is logged in)
  const apiInstance = (filters.categories || filters.showAll) ? axios : publicAPI;
  const response = await apiInstance.get(url);
  return response.data;
};

export const createPost = async (postData) => {
  const response = await axios.post('/api/posts/', {
    title: postData.title,
    content: postData.content,
    primary_category_id: parseInt(postData.primary_category),
    additional_category_ids: postData.additional_categories.map(id => parseInt(id)),
    tag_ids: postData.tags.map(id => parseInt(id))
  });
  return response.data;
};

export const fetchCategories = async () => {
  const response = await publicAPI.get('/api/categories/');
  return response.data;
};

export const fetchTags = async () => {
  const response = await publicAPI.get('/api/tags/');
  return response.data;
};

export const fetchUserProfile = async () => {
  const response = await axios.get('/api/profile/me/');
  return response.data;
};