import axios from '../api/axios';

// Create separate instance for public endpoints (no auth)
const publicAPI = axios.create({
  baseURL: "http://localhost:8000",
});

export const fetchPosts = async (filters = {}) => {
  const params = new URLSearchParams();

  // === NEW SEARCH PARAMETERS ===
  if (filters.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  if (filters.category) {
    params.append('category', filters.category);
  }

  if (filters.order) {
    params.append('order', filters.order);
  }

  // === PAGINATION PARAMETERS ===
  if (filters.page) {
    params.append('page', filters.page);
  }

  if (filters.page_size) {
    params.append('page_size', filters.page_size);
  }

  // === EXISTING FAVORITE CATEGORIES LOGIC ===
  if (filters.categories !== undefined) {
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    } else {
      // Explicitly send empty categories to indicate "no categories selected"
      params.append('categories', '');
    }
  }

  if (filters.showAll) {
    params.append('show_all', 'true');
  }

  const url = `/api/posts/${params.toString() ? `?${params.toString()}` : ''}`;

  // Use authenticated API if we have filters (which means user is logged in)
  const apiInstance = (filters.categories || filters.showAll || filters.search || filters.category) ? axios : publicAPI;
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

export const fetchCategories = async (mainOnly = false) => {
  const params = new URLSearchParams();
  if (mainOnly) {
    params.append('main_only', 'true');
  }

  const url = `/api/categories/${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await publicAPI.get(url);
  return response.data;
};

export const fetchCategoryTree = async () => {
  const response = await publicAPI.get('/api/categories/tree/');
  return response.data;
};

export const fetchHierarchicalCategoryNetwork = async () => {
  const response = await publicAPI.get('/api/viz/hierarchical-category-network/');
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

// === POST NETWORK API FUNCTIONS ===
export const fetchPostNetwork = async (params = {}) => {
  const queryParams = new URLSearchParams();

  // Add parameters if provided
  if (params.focus_post_id) queryParams.append('focus_post_id', params.focus_post_id);
  if (params.category_id) queryParams.append('category_id', params.category_id);
  if (params.include_posts !== undefined) queryParams.append('include_posts', params.include_posts);
  if (params.similarity_threshold) queryParams.append('similarity_threshold', params.similarity_threshold);
  if (params.max_posts) queryParams.append('max_posts', params.max_posts);
  if (params.max_connections) queryParams.append('max_connections', params.max_connections);

  const url = `/api/viz/post-network/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await publicAPI.get(url);
  return response.data;
};

export const fetchSimilarPosts = async (postId, params = {}) => {
  const queryParams = new URLSearchParams();

  // Add parameters if provided
  if (params.threshold) queryParams.append('threshold', params.threshold);
  if (params.algorithm) queryParams.append('algorithm', params.algorithm);
  if (params.method) queryParams.append('method', params.method);
  if (params.limit) queryParams.append('limit', params.limit);

  const url = `/api/posts/${postId}/similar/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await publicAPI.get(url);
  return response.data;
};

export const fetchSimilarCategories = async (categoryId, params = {}) => {
  const queryParams = new URLSearchParams();

  // Add parameters if provided
  if (params.threshold) queryParams.append('threshold', params.threshold);
  if (params.limit) queryParams.append('limit', params.limit);

  const url = `/api/categories/${categoryId}/similar/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await publicAPI.get(url);
  return response.data;
};