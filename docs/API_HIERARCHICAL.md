# Hierarchical Category API Documentation

**Last Updated:** 2025-10-13
**Status:** Implemented
**Purpose:** Backend API endpoints for hierarchical UI

---

## 🆕 New Endpoints

### 1. Category Tree Endpoint

**URL:** `GET /api/categories/tree/`

**Description:** Returns hierarchical category structure as nested tree.

**Query Parameters:**
- `max_depth` (integer, optional): Maximum depth to return. Default: unlimited
- `parent_id` (integer, optional): Get tree starting from specific parent. Default: root categories only
- `include_empty` (boolean, optional): Include categories with 0 posts. Default: false

**Response Format:**
```json
{
  "tree": [
    {
      "id": 1,
      "name": "Technology",
      "description": "All things tech",
      "level": 0,
      "post_count": 245,
      "subcategory_count": 5,
      "full_path": "Technology",
      "has_subcategories": true,
      "children": [
        {
          "id": 5,
          "name": "Machine Learning",
          "description": "ML and AI topics",
          "level": 1,
          "post_count": 89,
          "subcategory_count": 3,
          "full_path": "Technology > Machine Learning",
          "has_subcategories": true,
          "children": [
            {
              "id": 15,
              "name": "Neural Networks",
              "level": 2,
              "post_count": 34,
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

**Example Requests:**

```bash
# Get all root categories with full tree
curl http://localhost:8000/api/categories/tree/

# Get tree up to 2 levels deep
curl http://localhost:8000/api/categories/tree/?max_depth=2

# Get subcategories of specific category
curl http://localhost:8000/api/categories/tree/?parent_id=5

# Include categories with 0 posts
curl http://localhost:8000/api/categories/tree/?include_empty=true
```

---

### 2. Enhanced Category Detail

**URL:** `GET /api/categories/{id}/`

**Description:** Get category details with full hierarchical path.

**Response Format (Enhanced):**
```json
{
  "id": 15,
  "name": "Neural Networks",
  "description": "Deep learning and neural networks",
  "level": 2,
  "created_at": "2025-01-15T10:30:00Z",
  "parent": 5,
  "parent_name": "Machine Learning",
  "subcategories": [],
  "full_path": "Technology > Machine Learning > Neural Networks",
  "path": [
    {
      "id": 1,
      "name": "Technology",
      "level": 0
    },
    {
      "id": 5,
      "name": "Machine Learning",
      "level": 1
    },
    {
      "id": 15,
      "name": "Neural Networks",
      "level": 2
    }
  ],
  "is_main_category": false,
  "post_count": 34,
  "subcategory_count": 0,
  "has_subcategories": false
}
```

**New Fields:**
- `path` (array): Full hierarchical path as array of objects (id, name, level)

---

## 🔧 Updated Features

### Category Model Improvements

**Maximum Depth:** Increased from 3 levels to **10 levels** (0-9)

**Helper Methods Available:**
- `get_full_path()`: Returns string like "Technology > Machine Learning > Neural Networks"
- `get_root_category()`: Returns the top-level parent category
- `get_all_subcategories()`: Returns all descendants recursively
- `is_subcategory_of(category)`: Check if category is descendant of another

---

## 📋 Usage Examples for Frontend

### Building Breadcrumbs

Use the `path` array from category detail:

```javascript
// GET /api/categories/15/
const response = await fetch('/api/categories/15/');
const category = await response.json();

// Render breadcrumbs
const breadcrumbs = category.path.map(item => (
  <a href={`/category/${item.id}`}>{item.name}</a>
));
// Renders: Technology > Machine Learning > Neural Networks
```

### Building Category Tree Component

Use the tree endpoint:

```javascript
// GET /api/categories/tree/
const response = await fetch('/api/categories/tree/');
const { tree } = await response.json();

// Recursively render tree
function CategoryNode({ node }) {
  return (
    <div className="category-node">
      <span>{node.name} ({node.post_count})</span>
      {node.has_subcategories && (
        <div className="children">
          {node.children.map(child => (
            <CategoryNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// Render tree
tree.map(root => <CategoryNode node={root} />);
```

### Lazy Loading Subcategories

Load children on-demand:

```javascript
// Initial load: Just root categories
const response = await fetch('/api/categories/tree/?max_depth=1');

// When user expands a category, load its children
async function loadChildren(categoryId) {
  const response = await fetch(`/api/categories/tree/?parent_id=${categoryId}&max_depth=1`);
  const { tree } = await response.json();
  return tree;
}
```

---

## 🔄 Migration Notes

### Backward Compatibility

**All existing endpoints still work!** ✅

- `GET /api/categories/` - Still returns flat list
- `GET /api/categories/{id}/` - Enhanced with new `path` field, but all old fields remain

### Performance Considerations

**Tree Endpoint:**
- Optimized with `select_related('parent')` and `prefetch_related('subcategories')`
- Uses single query with annotations for post counts
- Recursive tree building happens in Python (efficient for < 1000 categories)

**Recommendations:**
- Use `max_depth` parameter for large trees (avoid loading 10 levels at once)
- Use `include_empty=false` to reduce payload size
- Cache tree responses on frontend (tree doesn't change often)

---

## 🧪 Testing Endpoints

### Manual Testing with curl

```bash
# Test tree endpoint
curl http://localhost:8000/api/categories/tree/ | jq

# Test with parameters
curl "http://localhost:8000/api/categories/tree/?max_depth=2&include_empty=true" | jq

# Test category detail with path
curl http://localhost:8000/api/categories/5/ | jq '.path'

# Test that old endpoints still work
curl http://localhost:8000/api/categories/?main_only=true | jq
```

### Expected Response Times

- Tree endpoint (< 100 categories): < 200ms
- Tree endpoint (< 500 categories): < 500ms
- Category detail: < 50ms

---

## 📊 Database Queries

### Tree Endpoint Optimization

The tree endpoint uses:
1. **Single annotated query** for root categories
2. **Prefetching** for subcategories at each level
3. **No N+1 queries** (all relationships prefetched)

Example query plan:
```sql
-- Initial query (root categories)
SELECT * FROM blog_category
WHERE parent_id IS NULL
  AND (SELECT COUNT(*) FROM blog_post WHERE primary_category_id = blog_category.id) > 0;

-- Subcategories (prefetched per level)
SELECT * FROM blog_category WHERE parent_id IN (1, 2, 3, ...);
```

---

## 🎯 Next Steps for Frontend

1. **Create Breadcrumbs Component** (use `path` array)
2. **Create CategoryTree Component** (use tree endpoint)
3. **Add to PostDetail page** (show post's category path)
4. **Add to Feed sidebar** (allow filtering by category tree)

See [HIERARCHICAL_UI_PLAN.md](HIERARCHICAL_UI_PLAN.md) for detailed implementation plan.

---

**Questions or Issues?** Check the main [README.md](../README.md) or review implementation in:
- `api/views.py` - CategoryViewSet.tree() method
- `api/serializers.py` - CategorySerializer.get_path() method
- `blog/models.py` - Category model with hierarchical support
