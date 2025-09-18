import axios from '../api/axios';

// Create separate instance for public endpoints (no auth)
const publicAPI = axios.create({
  baseURL: "http://localhost:8000",
});

export const fetchPosts = async () => {
  const response = await publicAPI.get('/api/posts/');
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