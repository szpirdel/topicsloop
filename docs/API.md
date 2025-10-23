# TopicsLoop API Documentation

**Last Updated:** 2025-10-15
**API Version:** v1
**Base URL:** `http://localhost:8000` (development) | `https://api.topicsloop.com` (production)

---

## 📖 DOCUMENT PURPOSE

This document provides comprehensive API documentation for TopicsLoop backend.

**Sections:**
- **Authentication** - JWT token-based authentication
- **Content Management** - Posts, categories, tags
- **AI Features** - Embeddings, similarity, auto-categorization
- **Visualizations** - Network data for graph views
- **Hierarchical Navigation** - Category tree and paths
- **User Management** - Profiles and preferences

---

<!-- ============================================ -->
<!-- SECTION 1: AUTHENTICATION                   -->
<!-- ============================================ -->

## 🔐 AUTHENTICATION

TopicsLoop uses JWT (JSON Web Token) authentication with access and refresh tokens.

### **Register New User**

```http
POST /auth/users/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

---

### **Login (Get Tokens)**

```http
POST /api/token/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Token Lifetime:**
- Access token: 60 minutes
- Refresh token: 24 hours

---

### **Refresh Access Token**

```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### **Using Authentication**

Include the access token in the Authorization header:

```http
GET /api/posts/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

<!-- ============================================ -->
<!-- SECTION 2: POSTS API                        -->
<!-- ============================================ -->

## 📝 POSTS API

### **List Posts**

```http
GET /api/posts/
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (integer): Page number for pagination (default: 1)
- `page_size` (integer): Items per page (default: 20, max: 100)
- `category` (integer): Filter by category ID
- `tag` (string): Filter by tag name
- `search` (string): Search in title and content
- `ordering` (string): Sort by field (e.g., `-created_at`, `title`)

**Example:**
```http
GET /api/posts/?category=5&ordering=-created_at&page=1&page_size=20
```

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/posts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "title": "New Transformer Architecture Released",
      "content": "GPT-5 introduces sparse attention mechanism...",
      "author": {
        "id": 1,
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe"
      },
      "primary_category": {
        "id": 15,
        "name": "Neural Networks",
        "path": [
          {"id": 1, "name": "Technology"},
          {"id": 5, "name": "Machine Learning"},
          {"id": 15, "name": "Neural Networks"}
        ]
      },
      "additional_categories": [
        {"id": 18, "name": "Deep Learning"}
      ],
      "tags": [
        {"id": 1, "name": "AI"},
        {"id": 2, "name": "GPT"}
      ],
      "created_at": "2025-10-15T10:30:00Z",
      "updated_at": "2025-10-15T10:30:00Z",
      "view_count": 245,
      "like_count": 12,
      "comment_count": 8
    }
  ]
}
```

---

### **Get Single Post**

```http
GET /api/posts/{id}/
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": 123,
  "title": "New Transformer Architecture Released",
  "content": "Full post content here...",
  "author": {
    "id": 1,
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "avatar": null
  },
  "primary_category": {
    "id": 15,
    "name": "Neural Networks",
    "slug": "neural-networks",
    "path": [
      {"id": 1, "name": "Technology", "slug": "technology"},
      {"id": 5, "name": "Machine Learning", "slug": "machine-learning"},
      {"id": 15, "name": "Neural Networks", "slug": "neural-networks"}
    ]
  },
  "additional_categories": [...],
  "tags": [...],
  "created_at": "2025-10-15T10:30:00Z",
  "updated_at": "2025-10-15T10:30:00Z",
  "view_count": 245,
  "like_count": 12,
  "comment_count": 8,
  "has_embedding": true
}
```

---

### **Create Post**

```http
POST /api/posts/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "My New Post",
  "content": "Post content here...",
  "primary_category": 15,
  "additional_categories": [18, 22],
  "tags": ["AI", "Machine Learning"]
}
```

**Response (201 Created):**
```json
{
  "id": 124,
  "title": "My New Post",
  "content": "Post content here...",
  ...
}
```

**Validation:**
- `title`: Required, max 200 characters
- `content`: Required, max 10,000 characters
- `primary_category`: Required, must be valid category ID
- `additional_categories`: Optional, array of category IDs
- `tags`: Optional, array of tag names (created if not exist)

---

### **Update Post**

```http
PUT /api/posts/{id}/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "primary_category": 15
}
```

**Response (200 OK):** Returns updated post object

**Permissions:** Only post author can update

---

### **Delete Post**

```http
DELETE /api/posts/{id}/
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

**Permissions:** Only post author can delete

---

### **Get Similar Posts**

```http
GET /api/posts/{id}/similar/
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (integer): Number of similar posts to return (default: 10, max: 50)
- `threshold` (float): Minimum similarity score (default: 0.5, range: 0-1)

**Example:**
```http
GET /api/posts/123/similar/?limit=5&threshold=0.7
```

**Response (200 OK):**
```json
{
  "post_id": 123,
  "similar_posts": [
    {
      "id": 98,
      "title": "Attention Mechanisms Explained",
      "similarity_score": 0.87,
      "primary_category": {
        "id": 15,
        "name": "Neural Networks"
      },
      "author": {
        "id": 2,
        "username": "jane"
      },
      "created_at": "2025-10-10T14:20:00Z"
    },
    {
      "id": 76,
      "title": "Training Large Models at Scale",
      "similarity_score": 0.82,
      ...
    }
  ],
  "count": 5
}
```

**Note:** Requires post to have embedding generated. Returns 404 if no embedding exists.

---

<!-- ============================================ -->
<!-- SECTION 3: CATEGORIES API                   -->
<!-- ============================================ -->

## 📁 CATEGORIES API

### **List Categories (Flat)**

```http
GET /api/categories/
```

**Query Parameters:**
- `main_only` (boolean): Return only root categories (default: false)
- `parent` (integer): Filter by parent category ID
- `ordering` (string): Sort by field (e.g., `name`, `-post_count`)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Technology",
    "description": "All things tech",
    "slug": "technology",
    "parent": null,
    "level": 0,
    "post_count": 1245,
    "subcategory_count": 5,
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": 5,
    "name": "Machine Learning",
    "description": "ML and AI topics",
    "slug": "machine-learning",
    "parent": 1,
    "level": 1,
    "post_count": 334,
    "subcategory_count": 3,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### **Get Category Tree** ⭐ NEW

```http
GET /api/categories/tree/
```

**Query Parameters:**
- `max_depth` (integer): Maximum depth to return (default: unlimited)
- `parent_id` (integer): Get tree starting from specific parent (default: root categories)
- `include_empty` (boolean): Include categories with 0 posts (default: false)

**Examples:**
```http
# Get full tree
GET /api/categories/tree/

# Get tree up to 2 levels deep
GET /api/categories/tree/?max_depth=2

# Get subcategories of category 5
GET /api/categories/tree/?parent_id=5

# Include empty categories
GET /api/categories/tree/?include_empty=true
```

**Response (200 OK):**
```json
{
  "tree": [
    {
      "id": 1,
      "name": "Technology",
      "description": "All things tech",
      "level": 0,
      "post_count": 1245,
      "subcategory_count": 5,
      "full_path": "Technology",
      "has_subcategories": true,
      "children": [
        {
          "id": 5,
          "name": "Machine Learning",
          "description": "ML and AI topics",
          "level": 1,
          "post_count": 334,
          "subcategory_count": 3,
          "full_path": "Technology > Machine Learning",
          "has_subcategories": true,
          "children": [
            {
              "id": 15,
              "name": "Neural Networks",
              "level": 2,
              "post_count": 89,
              "subcategory_count": 0,
              "full_path": "Technology > Machine Learning > Neural Networks",
              "has_subcategories": false,
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "params": {
    "max_depth": null,
    "parent_id": null,
    "include_empty": false
  },
  "stats": {
    "root_categories": 5,
    "total_categories": 47,
    "max_level": 3
  }
}
```

---

### **Get Single Category** ⭐ ENHANCED

```http
GET /api/categories/{id}/
```

**Response (200 OK):**
```json
{
  "id": 15,
  "name": "Neural Networks",
  "description": "Deep learning and neural networks",
  "slug": "neural-networks",
  "level": 2,
  "parent": 5,
  "parent_name": "Machine Learning",
  "subcategories": [],
  "full_path": "Technology > Machine Learning > Neural Networks",
  "path": [
    {
      "id": 1,
      "name": "Technology",
      "slug": "technology",
      "level": 0
    },
    {
      "id": 5,
      "name": "Machine Learning",
      "slug": "machine-learning",
      "level": 1
    },
    {
      "id": 15,
      "name": "Neural Networks",
      "slug": "neural-networks",
      "level": 2
    }
  ],
  "is_main_category": false,
  "post_count": 89,
  "subcategory_count": 0,
  "has_subcategories": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**New Fields:**
- `path`: Full hierarchical path as array of objects
- `full_path`: Human-readable breadcrumb string
- `has_subcategories`: Boolean flag

---

### **Get Category Posts**

```http
GET /api/categories/{id}/posts/
```

**Query Parameters:**
- `include_subcategories` (boolean): Include posts from child categories (default: false)
- `sort` (string): `recent`, `popular`, or `commented` (default: `recent`)
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20)

**Example:**
```http
GET /api/categories/5/posts/?include_subcategories=true&sort=popular&page=1
```

**Response (200 OK):** Same structure as List Posts

---

### **Create Category**

```http
POST /api/categories/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Deep Learning",
  "description": "Advanced neural network techniques",
  "parent": 5
}
```

**Response (201 Created):**
```json
{
  "id": 20,
  "name": "Deep Learning",
  "description": "Advanced neural network techniques",
  "slug": "deep-learning",
  "parent": 5,
  "level": 2,
  "post_count": 0,
  "created_at": "2025-10-15T12:00:00Z"
}
```

**Permissions:** Admin only

---

<!-- ============================================ -->
<!-- SECTION 4: AI FEATURES API                  -->
<!-- ============================================ -->

## 🤖 AI FEATURES API

### **Auto-Categorize Content**

```http
POST /api/ai/auto-categorize/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Machine Learning Basics",
  "content": "Introduction to neural networks and deep learning..."
}
```

**Response (200 OK):**
```json
{
  "suggested_categories": [
    {
      "id": 15,
      "name": "Neural Networks",
      "confidence": 0.89,
      "reason": "High semantic similarity with category description and existing posts"
    },
    {
      "id": 5,
      "name": "Machine Learning",
      "confidence": 0.76,
      "reason": "Strong keyword match and content alignment"
    },
    {
      "id": 18,
      "name": "Deep Learning",
      "confidence": 0.68,
      "reason": "Related terminology and concepts detected"
    }
  ],
  "primary_suggestion": {
    "id": 15,
    "name": "Neural Networks",
    "confidence": 0.89
  }
}
```

**Use Case:** Call this endpoint before creating a post to get category suggestions.

---

### **Generate Embeddings**

```http
POST /api/ai/embeddings/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "post_ids": [123, 124, 125]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "generated": 3,
  "failed": 0,
  "details": [
    {
      "post_id": 123,
      "status": "created",
      "embedding_id": 456,
      "dimensions": 384
    },
    {
      "post_id": 124,
      "status": "updated",
      "embedding_id": 457,
      "dimensions": 384
    },
    {
      "post_id": 125,
      "status": "created",
      "embedding_id": 458,
      "dimensions": 384
    }
  ]
}
```

**Note:** Embeddings are generated automatically for new posts. This endpoint is for bulk operations or regenerating embeddings.

---

### **Get Recommendations**

```http
GET /api/recommendations/
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (integer): Number of recommendations (default: 10, max: 50)
- `exclude_viewed` (boolean): Exclude posts user has viewed (default: true)

**Response (200 OK):**
```json
{
  "recommendations": [
    {
      "id": 145,
      "title": "Advanced Neural Network Architectures",
      "score": 0.92,
      "reason": "Based on your interest in Neural Networks and recent activity",
      "primary_category": {
        "id": 15,
        "name": "Neural Networks"
      },
      "author": {
        "id": 3,
        "username": "aiexpert"
      },
      "created_at": "2025-10-14T09:00:00Z"
    }
  ],
  "count": 10,
  "based_on": {
    "favorite_categories": [15, 5, 18],
    "recent_activity": true,
    "reading_history": true
  }
}
```

**Algorithm:** Based on user's favorite categories, reading history, and semantic similarity.

---

<!-- ============================================ -->
<!-- SECTION 5: VISUALIZATION API                -->
<!-- ============================================ -->

## 📊 VISUALIZATION API

### **Category Network**

```http
GET /api/viz/category-network/
```

**Query Parameters:**
- `include_posts` (boolean): Include post nodes (default: false)
- `category_id` (integer): Focus on specific category (default: all)
- `depth` (integer): Depth from focused category (default: 2)

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "cat_1",
      "label": "Technology",
      "type": "category",
      "size": 70,
      "color": "#3498db",
      "post_count": 1245,
      "level": 0
    },
    {
      "id": "cat_5",
      "label": "Machine Learning",
      "type": "category",
      "size": 60,
      "color": "#2980b9",
      "post_count": 334,
      "level": 1
    },
    {
      "id": "post_123",
      "label": "New Transformer Architecture",
      "type": "post",
      "size": 30,
      "color": "#e8f4f8",
      "category_id": 15
    }
  ],
  "edges": [
    {
      "from": "cat_5",
      "to": "cat_1",
      "type": "parent_child",
      "weight": 1
    },
    {
      "from": "post_123",
      "to": "cat_15",
      "type": "belongs_to",
      "weight": 1
    }
  ],
  "stats": {
    "total_nodes": 123,
    "total_edges": 145,
    "categories": 15,
    "posts": 108
  }
}
```

---

### **Semantic Category Network**

```http
GET /api/viz/semantic-category-network/
```

**Query Parameters:**
- `threshold` (float): Minimum similarity threshold (default: 0.6, range: 0-1)
- `max_connections` (integer): Max connections per category (default: 5)

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "cat_15",
      "label": "Neural Networks",
      "type": "category",
      "size": 60,
      "color": "#3498db"
    },
    {
      "id": "cat_17",
      "label": "Computer Vision",
      "type": "category",
      "size": 55,
      "color": "#2ecc71"
    }
  ],
  "edges": [
    {
      "from": "cat_15",
      "to": "cat_17",
      "type": "semantic_similarity",
      "weight": 0.78,
      "label": "78% similar",
      "shared_concepts": ["CNN", "image processing", "deep learning"]
    }
  ],
  "stats": {
    "total_connections": 42,
    "avg_similarity": 0.72
  }
}
```

---

### **User Network**

```http
GET /api/viz/user-network/
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "user_1",
      "label": "johndoe",
      "type": "user",
      "size": 40,
      "color": "#e74c3c",
      "post_count": 25
    },
    {
      "id": "user_2",
      "label": "janesmith",
      "type": "user",
      "size": 38,
      "color": "#9b59b6",
      "post_count": 22
    }
  ],
  "edges": [
    {
      "from": "user_1",
      "to": "user_2",
      "type": "shared_interest",
      "weight": 3,
      "label": "3 shared categories",
      "shared_categories": ["Neural Networks", "Computer Vision", "NLP"]
    }
  ]
}
```

---

<!-- ============================================ -->
<!-- SECTION 6: USER MANAGEMENT API              -->
<!-- ============================================ -->

## 👤 USER MANAGEMENT API

### **Get User Profile**

```http
GET /api/users/me/
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar": null,
  "bio": "Software engineer passionate about AI",
  "favorite_categories": [
    {
      "id": 15,
      "name": "Neural Networks"
    },
    {
      "id": 17,
      "name": "Computer Vision"
    }
  ],
  "post_count": 12,
  "created_at": "2025-01-15T10:00:00Z",
  "last_login": "2025-10-15T08:30:00Z"
}
```

---

### **Update User Profile**

```http
PATCH /api/users/me/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Updated bio..."
}
```

**Response (200 OK):** Returns updated user object

---

### **Follow Category**

```http
POST /api/users/me/follow-category/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "category_id": 15
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Now following Neural Networks",
  "category": {
    "id": 15,
    "name": "Neural Networks"
  }
}
```

---

### **Unfollow Category**

```http
POST /api/users/me/unfollow-category/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "category_id": 15
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Unfollowed Neural Networks"
}
```

---

### **Get Followed Categories**

```http
GET /api/users/me/followed-categories/
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": 15,
      "name": "Neural Networks",
      "path": [
        {"id": 1, "name": "Technology"},
        {"id": 5, "name": "Machine Learning"},
        {"id": 15, "name": "Neural Networks"}
      ],
      "post_count": 89,
      "followed_at": "2025-09-01T10:00:00Z"
    }
  ],
  "count": 5
}
```

---

<!-- ============================================ -->
<!-- SECTION 7: TAGS API                         -->
<!-- ============================================ -->

## 🏷️ TAGS API

### **List Tags**

```http
GET /api/tags/
```

**Query Parameters:**
- `ordering` (string): Sort by field (e.g., `name`, `-post_count`)
- `search` (string): Filter by tag name

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "AI",
    "post_count": 245,
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Machine Learning",
    "post_count": 189,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### **Get Tag Details**

```http
GET /api/tags/{id}/
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "AI",
  "post_count": 245,
  "created_at": "2025-01-01T00:00:00Z",
  "top_categories": [
    {
      "id": 15,
      "name": "Neural Networks",
      "post_count": 89
    },
    {
      "id": 17,
      "name": "Computer Vision",
      "post_count": 56
    }
  ]
}
```

---

<!-- ============================================ -->
<!-- SECTION 8: ERROR HANDLING                   -->
<!-- ============================================ -->

## ⚠️ ERROR HANDLING

### **Error Response Format**

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": ["Specific error details"]
    }
  }
}
```

### **Common HTTP Status Codes**

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### **Example Error Responses**

**400 Bad Request:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "title": ["This field is required"],
      "primary_category": ["Invalid category ID"]
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication credentials were not provided",
    "details": {}
  }
}
```

**404 Not Found:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Post with ID 999 not found",
    "details": {}
  }
}
```

---

<!-- ============================================ -->
<!-- SECTION 9: RATE LIMITING                    -->
<!-- ============================================ -->

## 🚦 RATE LIMITING

### **Current Limits** (Development)

| Endpoint Type | Limit |
|--------------|-------|
| Authentication | 5 requests/minute |
| Read operations (GET) | 100 requests/minute |
| Write operations (POST/PUT/PATCH/DELETE) | 30 requests/minute |
| AI operations | 10 requests/minute |

### **Rate Limit Headers**

Response includes:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697380800
```

### **Rate Limit Exceeded**

**Response (429 Too Many Requests):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

<!-- ============================================ -->
<!-- SECTION 10: PAGINATION                      -->
<!-- ============================================ -->

## 📄 PAGINATION

### **Paginated Response Format**

All list endpoints return paginated results:

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/posts/?page=3",
  "previous": "http://localhost:8000/api/posts/?page=1",
  "results": [...]
}
```

### **Pagination Parameters**

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Example:**
```http
GET /api/posts/?page=2&page_size=50
```

---

<!-- ============================================ -->
<!-- SECTION 11: FILTERING & SEARCHING           -->
<!-- ============================================ -->

## 🔍 FILTERING & SEARCHING

### **General Search**

```http
GET /api/posts/?search=machine+learning
```

Searches in:
- Post title
- Post content
- Category names
- Tag names

### **Category Filtering**

```http
GET /api/posts/?category=15
GET /api/posts/?category=15&include_subcategories=true
```

### **Tag Filtering**

```http
GET /api/posts/?tag=AI
GET /api/posts/?tag=AI&tag=ML  # Multiple tags (AND)
```

### **Date Filtering**

```http
GET /api/posts/?created_after=2025-10-01
GET /api/posts/?created_before=2025-10-15
GET /api/posts/?created_after=2025-10-01&created_before=2025-10-15
```

### **Ordering**

```http
GET /api/posts/?ordering=-created_at  # Newest first
GET /api/posts/?ordering=title        # A-Z
GET /api/posts/?ordering=-view_count  # Most viewed
GET /api/posts/?ordering=-like_count  # Most liked
```

**Available ordering fields:**
- `created_at`, `-created_at`
- `updated_at`, `-updated_at`
- `title`, `-title`
- `view_count`, `-view_count`
- `like_count`, `-like_count`
- `comment_count`, `-comment_count`

---

<!-- ============================================ -->
<!-- SECTION 12: CORS & SECURITY                 -->
<!-- ============================================ -->

## 🔒 CORS & SECURITY

### **CORS Configuration**

**Allowed Origins (Development):**
- `http://localhost:3000`
- `http://localhost:8000`

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- Authorization, Content-Type, Accept

### **Security Headers**

All responses include:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### **HTTPS**

**Production:** All requests must use HTTPS
**Development:** HTTP allowed for localhost only

---

<!-- ============================================ -->
<!-- SECTION 13: PERFORMANCE TIPS                -->
<!-- ============================================ -->

## ⚡ PERFORMANCE TIPS

### **Use Pagination**

Always paginate large result sets:
```http
GET /api/posts/?page_size=50  # Don't fetch all at once
```

### **Request Only Needed Fields**

Future enhancement: Field selection
```http
GET /api/posts/?fields=id,title,created_at
```

### **Cache Responses**

- Category tree: Cache for 5 minutes
- Static content: Cache for 1 hour
- User profile: Cache for 5 minutes

### **Batch Operations**

For generating embeddings:
```http
POST /api/ai/embeddings/
{
  "post_ids": [1, 2, 3, 4, 5]  # Batch instead of 5 separate requests
}
```

---

<!-- ============================================ -->
<!-- SECTION 14: CHANGELOG                       -->
<!-- ============================================ -->

## 📝 API CHANGELOG

### **v1.1.0** (2025-10-15)

**Added:**
- `GET /api/categories/tree/` - Hierarchical category tree endpoint
- `path` field in category detail response
- `full_path` field in category responses
- `include_subcategories` parameter for category posts
- User category following endpoints

**Enhanced:**
- `GET /api/categories/{id}/` now includes full hierarchical path
- `GET /api/posts/` now includes category path in responses
- Better error messages and validation

**Deprecated:**
- None

### **v1.0.0** (2025-09-19)

**Initial Release:**
- Authentication (JWT)
- Posts CRUD
- Categories CRUD
- Tags API
- AI features (embeddings, similarity, auto-categorization)
- Visualization endpoints
- User management

---

## 📚 ADDITIONAL RESOURCES

- **Main Documentation:** [README.md](../README.md)
- **Product Strategy:** [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md)
- **Project Backlog:** [../project_backlog.md](../project_backlog.md)
- **Changelog:** [../CHANGELOG.md](../CHANGELOG.md)

---

## 🆘 SUPPORT

**Issues:** Report bugs and request features at [GitHub Issues](https://github.com/your-repo/topicsloop/issues)

**Questions:** Check the main README or create a discussion

---

**Last Updated:** 2025-10-15
**Next Review:** When new endpoints are added or significant changes occur
**Maintainer:** Backend team
