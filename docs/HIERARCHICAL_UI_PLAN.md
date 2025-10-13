# Hierarchical UI Implementation Plan

**Last Updated:** 2025-10-13
**Status:** Ready to implement
**Priority:** HIGH - Foundation for all future features

---

## 🎯 Goals

Transform TopicsLoop into a hierarchical navigation platform where:
1. Users always know WHERE they are in the structure
2. Users can drill down to any depth systematically
3. Context is always visible via breadcrumbs
4. Category relationships are clear
5. Posts inherit context from their location

---

## 📋 Implementation Checklist

### **Phase 1: Core Components** (6-8 hours)

#### **Task 1.1: Breadcrumbs Component** (1-2 hours)
**Priority:** P0 (Must Have)

**What:**
A clickable navigation trail showing current location in hierarchy.

**Example:**
```
Home > Technology > Machine Learning > Neural Networks > [Post Title]
```

**Requirements:**
- [ ] Create `frontend/src/components/Breadcrumbs.js`
- [ ] Click any level to navigate there
- [ ] Show separator (` > ` or `/`)
- [ ] Highlight current page (not clickable)
- [ ] Responsive (collapse on mobile)
- [ ] Test with 2-7 levels deep

**API Needs:**
- Category endpoint must return full parent chain
- Example: `GET /api/categories/15/` returns:
  ```json
  {
    "id": 15,
    "name": "Neural Networks",
    "path": [
      {"id": 1, "name": "Technology"},
      {"id": 5, "name": "Machine Learning"},
      {"id": 15, "name": "Neural Networks"}
    ]
  }
  ```

**Files to Create:**
- `frontend/src/components/Breadcrumbs.js`
- `frontend/src/components/Breadcrumbs.css`

**Files to Modify:**
- Add to: PostDetail, CategoryPage, anywhere context is needed

---

#### **Task 1.2: Category Tree Component** (4-6 hours)
**Priority:** P0 (Must Have)

**What:**
An expandable/collapsible tree showing category hierarchy.

**Visual Example:**
```
🔽 Technology (1,245)
   ☑ 🔽 Machine Learning (334)
      ☑   Neural Networks (89)
      □   Computer Vision (72)
      □   Natural Language Processing (63)
   ☑ 🔽 Electric Vehicles (156)
      ☑   Tesla (89)
         ☑ Model 3 (34)
         □ Model Y (28)
   □   Web Development (198)
🔽 Science (892)
   □   Physics (234)
   □   Chemistry (178)
```

**Requirements:**
- [ ] Create `frontend/src/components/CategoryTree.js`
- [ ] Expand/collapse with animated transitions
- [ ] Show post count per category
- [ ] Multi-select checkboxes (for following)
- [ ] Indentation shows depth level
- [ ] Lazy load children (don't load all at once)
- [ ] Search/filter within tree
- [ ] Active state highlighting
- [ ] Icons: 🔽 expanded, ▶️ collapsed

**API Needs:**
- Endpoint: `GET /api/categories/tree/`
- Returns hierarchical structure:
  ```json
  [
    {
      "id": 1,
      "name": "Technology",
      "post_count": 1245,
      "children": [
        {
          "id": 5,
          "name": "Machine Learning",
          "post_count": 334,
          "children": [...]
        }
      ]
    }
  ]
  ```

**States to Handle:**
- Loading children
- Empty categories
- Deep nesting (5+ levels)
- Large trees (100+ categories)

**Files to Create:**
- `frontend/src/components/CategoryTree.js`
- `frontend/src/components/CategoryTree.css`
- `frontend/src/hooks/useCategoryTree.js` (state management)

**Files to Modify:**
- Use in: Onboarding, Feed Sidebar, Category Browsing

---

### **Phase 2: Enhanced Pages** (4-5 hours)

#### **Task 2.1: Enhanced Category Page** (3-4 hours)
**Priority:** P0 (Must Have)

**What:**
A dedicated page for each category showing its place in hierarchy and content.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Home > Technology > Machine Learning            │ ← Breadcrumbs
├─────────────────────────────────────────────────┤
│                                                 │
│  🧠 Machine Learning                            │
│  The science of teaching computers to learn     │
│                                                 │
│  📊 334 posts  •  15,234 followers              │
│  [Follow] [🗺️ Show on Map]                      │
│                                                 │
│  ─── Subcategories ───                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Neural   │ │ Computer │ │    NLP   │       │
│  │ Networks │ │  Vision  │ │          │       │
│  │ 89 posts │ │ 72 posts │ │ 63 posts │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  ─── Recent Posts ───                           │
│  Technology > Machine Learning                  │
│  "New Transformer Architecture Released"        │
│  by @john • 2h ago • 💬 12                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Requirements:**
- [ ] Breadcrumbs at top
- [ ] Category name and description
- [ ] Statistics (post count, followers)
- [ ] Follow/Unfollow button
- [ ] "Show on Map" button
- [ ] Subcategories grid/list
- [ ] Recent posts in this category tree
- [ ] Filter: This category only vs. Include subcategories
- [ ] Sort: Recent, Popular, Commented
- [ ] Pagination

**API Needs:**
- `GET /api/categories/:id/` - Category details
- `GET /api/categories/:id/subcategories/` - Children
- `GET /api/categories/:id/posts/` - Posts in category
- Query params: `?include_subcategories=true&sort=recent&page=1`

**Files to Create:**
- `frontend/src/components/CategoryPage.js` (or enhance existing)
- `frontend/src/components/SubcategoryGrid.js`

**Files to Modify:**
- Update routing in `App.js`
- Update API service calls

---

#### **Task 2.2: Feed Filtering Improvements** (1-2 hours)
**Priority:** P1 (Should Have)

**What:**
Add category tree to feed sidebar for filtering.

**Layout:**
```
┌────────────┬──────────────────────────┐
│ Filters    │  🏠 Your Feed            │
│            │  [Recent ▼] [All ▼]     │
│ ☑ All      │                          │
│ ☑ Tech     │  [Post cards here...]    │
│   ☑ ML     │                          │
│   □ EV     │                          │
│ □ Science  │                          │
│            │                          │
│ [Manage]   │                          │
└────────────┴──────────────────────────┘
```

**Requirements:**
- [ ] Add CategoryTree component to sidebar
- [ ] Only show followed categories
- [ ] Selecting category filters feed
- [ ] "All" checkbox shows everything
- [ ] Active category highlighted
- [ ] Persist selection (localStorage or URL param)
- [ ] Mobile: Dropdown/modal instead of sidebar

**Files to Modify:**
- `frontend/src/components/PostList.js`
- Add sidebar component
- Add filtering logic

---

### **Phase 3: Post Context** (2-3 hours)

#### **Task 3.1: Post Detail Enhancements** (2-3 hours)
**Priority:** P1 (Should Have)

**What:**
Show post in full hierarchical context.

**Layout:**
```
┌──────────────────────────────────────────┐
│ Home > Technology > ML > Neural Networks │
├──────────────────────────────────────────┤
│  New Transformer Architecture Released    │
│  by @john • 2h ago                       │
│                                          │
│  [Post content here...]                  │
│                                          │
│  [💬 Comment] [🔖 Bookmark]              │
│  [🗺️ Show on Map]                        │
└──────────────────────────────────────────┘

┌─ Related in Neural Networks ────┐
│ • "Attention Mechanisms Explained"│
│ • "Training Large Models"        │
│ • "GPT vs BERT Comparison"       │
└──────────────────────────────────┘

┌─ You might also like ───────────┐
│ 🧠 Computer Vision (Related)    │
│ • "Vision Transformers"         │
│                                 │
│ 🧠 Natural Language Processing  │
│ • "BERT Fine-tuning Guide"      │
└──────────────────────────────────┘
```

**Requirements:**
- [ ] Breadcrumbs at top
- [ ] Related posts from same category
- [ ] AI-suggested related categories
- [ ] "Show on Map" CTA
- [ ] Category badge/tag
- [ ] Easy navigation to category page

**Files to Modify:**
- `frontend/src/components/PostDetail.js`
- Add Breadcrumbs
- Add related content sections

---

### **Phase 4: Onboarding Flow** (Optional, 2-3 hours)

#### **Task 4.1: Topic Selection Onboarding** (2-3 hours)
**Priority:** P2 (Nice to Have)

**What:**
First-time user flow for selecting topics to follow.

**Flow:**
```
1. Welcome screen
   "What topics interest you?"

2. Category tree selector
   - Can expand to any depth
   - Multi-select with checkboxes
   - Shows post counts

3. Confirmation
   "You're following 5 topics"
   [Start Exploring →]

4. Land on Feed
   Shows posts from selected topics
```

**Requirements:**
- [ ] Detect first-time users
- [ ] Show onboarding modal/page
- [ ] CategoryTree with multi-select
- [ ] "Skip" option (can configure later)
- [ ] Save selections to user profile
- [ ] Redirect to feed

**Files to Create:**
- `frontend/src/components/Onboarding.js`
- `frontend/src/components/OnboardingModal.js`

---

## 🔧 Backend API Requirements

### **New Endpoints Needed**

#### **1. Category Tree Endpoint**
```
GET /api/categories/tree/
```

Returns hierarchical category structure:
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Technology",
      "slug": "technology",
      "description": "All things tech",
      "post_count": 1245,
      "follower_count": 523,
      "children": [
        {
          "id": 5,
          "name": "Machine Learning",
          "slug": "machine-learning",
          "post_count": 334,
          "children": [...]
        }
      ]
    }
  ]
}
```

**Implementation:**
- Add `blog/views.py::CategoryTreeView`
- Recursive query or use django-treebeard/django-mptt
- Cache result (updates every 5 minutes)
- Option to limit depth: `?max_depth=3`

---

#### **2. Category Detail with Path**
```
GET /api/categories/:id/
```

Returns category with full parent chain:
```json
{
  "id": 15,
  "name": "Neural Networks",
  "slug": "neural-networks",
  "description": "...",
  "post_count": 89,
  "follower_count": 234,
  "path": [
    {"id": 1, "name": "Technology", "slug": "technology"},
    {"id": 5, "name": "Machine Learning", "slug": "machine-learning"},
    {"id": 15, "name": "Neural Networks", "slug": "neural-networks"}
  ],
  "parent": {
    "id": 5,
    "name": "Machine Learning"
  },
  "children": [
    {"id": 23, "name": "Transformers", "post_count": 34},
    {"id": 24, "name": "CNNs", "post_count": 28}
  ]
}
```

**Implementation:**
- Modify existing CategoryDetailView
- Add `path` field using recursive parent lookup
- Cache parent chains

---

#### **3. Posts with Category Path**
```
GET /api/posts/
GET /api/posts/:id/
```

Add `category_path` to post serializer:
```json
{
  "id": 123,
  "title": "New Transformer Architecture",
  "primary_category": {
    "id": 15,
    "name": "Neural Networks",
    "path": [
      {"id": 1, "name": "Technology"},
      {"id": 5, "name": "Machine Learning"},
      {"id": 15, "name": "Neural Networks"}
    ]
  }
}
```

**Implementation:**
- Update PostSerializer
- Add `category_path` method
- Optimize with select_related

---

#### **4. User Following Endpoint**
```
POST /api/users/me/follow-category/
POST /api/users/me/unfollow-category/
GET  /api/users/me/followed-categories/
```

**Implementation:**
- Create UserCategoryFollow model (if not exists)
- Add follow/unfollow views
- Return tree of followed categories

---

## 📁 File Structure After Implementation

```
frontend/src/
├── components/
│   ├── Breadcrumbs.js           # NEW
│   ├── Breadcrumbs.css          # NEW
│   ├── CategoryTree.js          # NEW
│   ├── CategoryTree.css         # NEW
│   ├── CategoryPage.js          # ENHANCED
│   ├── SubcategoryGrid.js       # NEW
│   ├── PostList.js              # ENHANCED (add sidebar)
│   ├── PostDetail.js            # ENHANCED (add breadcrumbs)
│   ├── Onboarding.js            # NEW (optional)
│   └── ...existing components
│
├── hooks/
│   ├── useCategoryTree.js       # NEW
│   └── useBreadcrumbs.js        # NEW
│
└── services/
    └── api.js                   # ADD new endpoints

backend/
├── blog/
│   ├── models.py               # CHECK if Category supports hierarchy
│   ├── serializers.py          # ADD category_path fields
│   ├── views.py                # ADD CategoryTreeView
│   └── urls.py                 # ADD new routes
```

---

## 🎯 Testing Checklist

### **Manual Testing Scenarios**

#### **Scenario 1: Deep Navigation**
1. Create category hierarchy 5 levels deep
2. Navigate from home → deepest category
3. Verify breadcrumbs show full path
4. Click breadcrumb at level 2
5. Verify navigation works

#### **Scenario 2: Category Tree Interaction**
1. Load page with CategoryTree
2. Expand/collapse multiple categories
3. Select checkboxes at different levels
4. Verify filtering works
5. Refresh page, verify state persists

#### **Scenario 3: Mobile Responsiveness**
1. Open on mobile viewport (375px)
2. Verify breadcrumbs collapse/truncate
3. Verify tree becomes modal/dropdown
4. Test touch interactions

#### **Scenario 4: Edge Cases**
1. Category with 0 posts
2. Category with 100+ children
3. Single-category path (no parents)
4. 10+ level deep hierarchy
5. Unicode category names

---

## ⚡ Performance Considerations

### **Optimization Strategies**

1. **Category Tree Loading**
   - Lazy load children (don't fetch all at once)
   - Cache tree structure (5 minute TTL)
   - Limit initial depth to 3 levels
   - Load more on expand

2. **Breadcrumb Queries**
   - Cache parent chains in Redis
   - Use select_related for single query
   - Precompute paths on category save

3. **Frontend State**
   - Use React Context for category tree state
   - Memoize tree component
   - Debounce search/filter inputs

4. **Database**
   - Add indexes: `category.parent_id`
   - Consider django-mppt for better tree queries
   - Denormalize path for fast lookups

---

## 🚀 Deployment Strategy

### **Rollout Plan**

**Phase 1: Backend + Core Components**
- Implement API endpoints
- Test with API client (Postman)
- Create Breadcrumbs component
- Create CategoryTree component
- Integration testing

**Phase 2: Enhanced Pages**
- Update CategoryPage
- Update PostDetail
- Update Feed with sidebar
- End-to-end testing

**Phase 3: Polish + Optional Features**
- Onboarding flow (if desired)
- Mobile optimization
- Performance tuning
- User testing

---

## 📊 Success Metrics

**How do we know it's working?**

### **Quantitative**
- [ ] 80%+ of page views include breadcrumbs
- [ ] 40%+ of users click breadcrumbs at least once
- [ ] Average category depth explored: 3+ levels
- [ ] CategoryTree used in 60%+ of sessions
- [ ] Feed filtering used by 50%+ of active users

### **Qualitative**
- [ ] Users can explain where they are
- [ ] No "I'm lost" feedback
- [ ] Users discover subcategories naturally
- [ ] Navigation feels intuitive

---

## 🐛 Known Risks & Mitigations

### **Risk 1: Too Many Categories (100+)**
**Problem:** Tree becomes overwhelming
**Mitigation:**
- Show top 10 by default
- Add search box
- Collapse all by default

### **Risk 2: Deep Hierarchies (10+ levels)**
**Problem:** Breadcrumbs get too long
**Mitigation:**
- Truncate middle: `Home > ... > Level 8 > Level 9 > Current`
- Show full path on hover
- Mobile: Show only last 2 levels + "..."

### **Risk 3: Performance with Large Trees**
**Problem:** Slow rendering, memory issues
**Mitigation:**
- Virtual scrolling for long lists
- Lazy loading children
- Pagination for categories with 100+ children

### **Risk 4: Mobile UX**
**Problem:** Trees don't work well on small screens
**Mitigation:**
- Use accordion/modal on mobile
- Horizontal scrolling breadcrumbs
- Touch-optimized controls

---

## ✅ Definition of Done

**Phase 1 Complete When:**
- [ ] Breadcrumbs component working on all pages
- [ ] CategoryTree component implemented
- [ ] API endpoints returning correct data
- [ ] Manual testing scenarios pass
- [ ] No console errors
- [ ] Responsive on mobile (375px+)
- [ ] Code reviewed and merged

**Phase 2 Complete When:**
- [ ] CategoryPage shows full context
- [ ] Feed has working filter sidebar
- [ ] PostDetail has breadcrumbs and related content
- [ ] All pages connect logically
- [ ] Navigation feels natural

**Phase 3 Complete When:**
- [ ] (Optional) Onboarding flow works
- [ ] Performance acceptable (<2s load)
- [ ] User can navigate 5+ levels deep smoothly

---

## 📚 Resources & References

### **React Components to Study**
- Material-UI TreeView
- Ant Design Tree
- React-Complex-Tree

### **Hierarchical Data Patterns**
- Django MPTT (Modified Preorder Tree Traversal)
- Nested Set Model
- Adjacency List (current, simplest)

### **Design Inspiration**
- Reddit sidebar
- VSCode file explorer
- Notion page tree
- Finder/Explorer

---

**Ready to start? Let's build Phase 1!**

**Next Step:** Choose first task (Breadcrumbs recommended as it's quickest win)
