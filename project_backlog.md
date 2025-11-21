# TopicsLoop - Active Development Backlog

**Last Updated:** 2025-10-24
**Sprint:** October 2025 - Hierarchical Foundation Sprint
**Current Version:** 0.2.0
**Next Target:** 0.3.0

---

## 📑 TABLE OF CONTENTS

### **CURRENT STATUS & ACTIVE WORK**
- [1. Current Status: Foundation Work in Progress](#1-current-status-foundation-work-in-progress)
- [2. Start Here Tomorrow (Oct 16, 2025)](#2-start-here-tomorrow-oct-16-2025)
- [3. Paused Sprint Goals](#3-paused-sprint-goals)

### **CURRENT SPRINT TASKS**
- [4. High Priority Tasks (This Sprint)](#4-high-priority-tasks-this-sprint)
  - [4.1. Project Documentation & Cleanup](#41-project-documentation--cleanup)
  - [4.2. Zoom-Based Progressive Disclosure](#42-zoom-based-progressive-disclosure)
  - [4.3. Basic Test Suite Foundation](#43-basic-test-suite-foundation)
  - [4.4. Error Handling & Logging Improvements](#44-error-handling--logging-improvements)
  - [4.5. AI/ML System Tuning & Integration](#45-aiml-system-tuning--integration)
- [5. Medium Priority Tasks (Next Sprint)](#5-medium-priority-tasks-next-sprint)
  - [5.1. Explainable AI Similarities](#51-explainable-ai-similarities)
  - [5.2. Code Refactoring - api/views.py](#52-code-refactoring---apiviewspy)
  - [5.3. Performance Optimization](#53-performance-optimization)
- [6. Low Priority Tasks (Future Sprints)](#6-low-priority-tasks-future-sprints)

### **IMPLEMENTATION PLANS**
- [7. Hierarchical UI Implementation Plan](#7-hierarchical-ui-implementation-plan)
  - [7.1. Goals](#71-goals)
  - [7.2. Phase 1: Core Components](#72-phase-1-core-components)
  - [7.3. Phase 2: Enhanced Pages](#73-phase-2-enhanced-pages)
  - [7.4. Phase 3: Post Context](#74-phase-3-post-context)
  - [7.5. Phase 4: Onboarding Flow (Optional)](#75-phase-4-onboarding-flow-optional)
  - [7.6. Backend API Requirements](#76-backend-api-requirements)
  - [7.7. Testing & Performance](#77-testing--performance)

### **TRACKING & METRICS**
- [8. Known Issues & Bugs](#8-known-issues--bugs)
- [9. Progress Tracking](#9-progress-tracking)
- [10. Sprint Success Criteria](#10-sprint-success-criteria)
- [11. Daily Standup Notes](#11-daily-standup-notes)

### **LONG-TERM PLANNING**
- [12. Long-Term Roadmap](#12-long-term-roadmap)
  - [12.1. Current Status (v0.2.0)](#121-current-status-v020)
  - [12.2. Version 0.3.0 - Enhanced Discovery](#122-version-030---enhanced-discovery)
  - [12.3. Version 0.4.0 - Collaboration & Quality](#123-version-040---collaboration--quality)
  - [12.4. Version 1.0.0 - Production Release](#124-version-100---production-release)
  - [12.5. Future Enhancements (Post v1.0)](#125-future-enhancements-post-v10)
  - [12.6. Technical Debt & Maintenance](#126-technical-debt--maintenance)
  - [12.7. Development Philosophy](#127-development-philosophy)

### **RESOURCES**
- [13. Resources & Links](#13-resources--links)

---

<!-- ============================================ -->
<!-- SECTION 1: CURRENT STATUS                   -->
<!-- ============================================ -->

## 1. CURRENT STATUS: HIERARCHICAL FOUNDATION SPRINT

### 1.1. Sprint Focus - Oct 22 2025

**Decision:** Focus on hierarchical navigation foundation before tackling graph features.

**Strategy:**
1. ✅ **Phase 1 Complete:** Documentation restructuring & UI improvements
2. ✅ **Phase 2 Complete:** Landing page, navigation, and branding
3. → **Phase 3 In Progress:** Hierarchical navigation system

**Why Hierarchical First:**
- Simpler to implement and test with real content
- Provides better UX foundation for users
- Graph features build on well-organized hierarchical data
- Allows iterative UI improvement with actual usage

**Next Steps:**
- Add realistic category hierarchy (3-4 levels deep)
- Create 20-30 sample posts across categories
- Test breadcrumbs navigation with real data
- Fix UI issues discovered during content addition

---

<!-- ============================================ -->
<!-- SECTION 2: START HERE TOMORROW              -->
<!-- ============================================ -->

## 2. START HERE TOMORROW (Oct 23, 2025)

### 2.1. Hierarchical Content & Navigation (3-4 hours)

#### **Task 2.1: Create Sample Category Hierarchy** ⏰ 1 hour
- [ ] Create 3-4 level deep category structure
- [ ] Examples: Technology > ML > Neural Networks > CNNs
- [ ] Cover diverse topics (Tech, Science, Business, etc.)
- [ ] Ensure realistic naming and descriptions

**Sample Structure:**
```
Technology
├── Machine Learning
│   ├── Neural Networks
│   │   ├── CNNs
│   │   └── RNNs
│   └── Computer Vision
├── Electric Vehicles
│   ├── Tesla
│   └── Rivian
└── Web Development

Science
├── Physics
└── Biology
```

#### **Task 2.2: Add Sample Posts** ⏰ 1-2 hours
- [ ] Create 20-30 posts across different categories
- [ ] Vary depths (some in main categories, some deep)
- [ ] Use realistic titles and content
- [ ] Test breadcrumbs display with real data

#### **Task 2.3: Test & Fix UI Issues** ⏰ 1 hour
- [ ] Navigate through all category levels
- [ ] Check breadcrumbs on every page
- [ ] Test long category names
- [ ] Verify mobile responsiveness
- [ ] Fix any layout issues discovered

**Deliverable:** Working hierarchical navigation with real content

---

<!-- ============================================ -->
<!-- SECTION 3: PAUSED SPRINT GOALS              -->
<!-- ============================================ -->

## 3. PAUSED SPRINT GOALS

### 3.1. Sprint Overview

**Duration:** October 12 - October 26 (2 weeks) - **PAUSED**
**Original Focus:** Platform cleanup, testing foundation, and zoom-based navigation
**New Focus:** Foundation work (docs + UI/UX)
**Velocity:** 40-50 hours available

---

<!-- ============================================ -->
<!-- SECTION 4: HIGH PRIORITY TASKS              -->
<!-- ============================================ -->

## 4. HIGH PRIORITY TASKS (This Sprint)

### 4.1. Project Documentation & Cleanup

**Status:** ✅ COMPLETED (2025-10-12)
**Time Invested:** 2 hours

**Completed:**
- ✅ Deleted outdated session files (SESSION_SUMMARY, TOMORROW)
- ✅ Deleted obsolete DEVELOPMENT_LOG.md
- ✅ Created proper CHANGELOG.md (Keep a Changelog format)
- ✅ Added MIT LICENSE file
- ✅ Consolidated requirements.txt (removed requirements_minimal.txt)
- ✅ Created ROADMAP.md for long-term planning
- ✅ Updated project_backlog.md (this file)

---

### 4.2. Zoom-Based Progressive Disclosure

**Status:** 📋 Ready to Start
**Estimate:** 8-10 hours
**Priority:** HIGH - Key UX improvement
**Dependency:** None

**Goal:** Implement Google Maps-style zoom navigation for graph

**Tasks:**
- [ ] Add zoom event listener (`network.on('zoom')`)
- [ ] Define zoom level thresholds (4 levels)
- [ ] Implement node visibility logic
- [ ] Add debouncing (300ms delay)
- [ ] Test with 109+ posts
- [ ] Add visual feedback for zoom levels
- [ ] Performance testing

**Acceptance Criteria:**
- Zoom out shows categories only (< 0.4 scale)
- Zoom in progressively shows more detail
- Smooth transitions, no lag
- Works with 200+ posts

**Files to Modify:**
- `frontend/src/components/Visualization.js`

---

### 4.3. Basic Test Suite Foundation

**Status:** 📋 Planned
**Estimate:** 8-12 hours
**Priority:** HIGH - Technical debt reduction

**Goal:** Establish testing infrastructure for future development

#### **Phase 1: Backend Tests (6 hours)**
- [ ] Set up pytest configuration
- [ ] Write tests for API endpoints (posts, categories)
- [ ] Write tests for AI embeddings generation
- [ ] Write tests for similarity calculations
- [ ] Test authentication flows
- [ ] Achieve 40%+ backend coverage

#### **Phase 2: Frontend Tests (4 hours)**
- [ ] Set up Jest + React Testing Library
- [ ] Write component tests (PostList, Login, Register)
- [ ] Write service tests (api.js)
- [ ] Test basic user flows
- [ ] Achieve 30%+ frontend coverage

**Deliverables:**
- Test configuration files
- 20+ test cases
- CI-ready test commands
- Testing documentation

---

### 4.4. Error Handling & Logging Improvements

**Status:** 📋 Planned
**Estimate:** 4-6 hours
**Priority:** MEDIUM-HIGH

**Goal:** Better error tracking and debugging capabilities

**Tasks:**
- [ ] Add Python logging configuration
- [ ] Add frontend error boundaries
- [ ] Implement API error standardization
- [ ] Add request/response logging
- [ ] Create error tracking utils
- [ ] Document common errors

**Locations:**
- `topicsloop/settings.py` (logging config)
- `frontend/src/components/ErrorBoundary.js` (new)
- `api/views.py` (error handling)

---

### 4.5. AI/ML System Tuning & Integration

**Status:** 📋 Critical for MVP
**Estimate:** 12-16 hours (split across MVP phases)
**Priority:** HIGH - Unlocks platform's core value proposition

**Goal:** Optimize and integrate AI stack (sentence-transformers + PyTorch Geometric + GNN) to deliver accurate, fast content discovery

---

#### **Phase 1: AI Performance Audit & Quick Wins (4-5 hours)** ⚡
**Priority:** P0 - Do this FIRST for MVP

**Context:** Currently using sentence-transformers (all-MiniLM-L6-v2) for embeddings. Need to verify it's optimal and cache results.

**Tasks:**
- [ ] **Benchmark current embedding performance** (1 hour)
  - Measure: Time to embed 100 posts
  - Measure: Memory usage during inference
  - Measure: Similarity calculation speed
  - Document baseline metrics

- [ ] **Implement embedding caching in database** (2-3 hours)
  - Add `embedding` field to Post model (JSONField or BinaryField)
  - Generate embeddings on post creation/update only
  - Serve from cache for similarity calculations
  - Migration + testing

- [ ] **Tune similarity thresholds** (1 hour)
  - Test different cosine similarity thresholds (0.3, 0.5, 0.7)
  - Find sweet spot: not too many "similar" posts, not too few
  - Make configurable via settings
  - Document chosen threshold + reasoning

**Expected Impact:**
- 🚀 10-50x faster similarity queries (cache vs. real-time embedding)
- 💾 Reduced memory usage (embed once, cache forever)
- 🎯 Better "similar posts" quality (tuned threshold)

**Deliverables:**
- Performance baseline document
- Database migration for embedding cache
- Configurable similarity threshold setting
- Before/after performance comparison

**Files to Modify:**
- `blog/models.py` - Add embedding field
- `gnn_models/embeddings.py` - Cache logic
- `api/views.py` - Use cached embeddings
- `topicsloop/settings.py` - Similarity threshold config

---

#### **Phase 2: Model Selection & Optimization (3-4 hours)** 🔬
**Priority:** P1 - After Phase 1, before v0.3.0 release

**Context:** all-MiniLM-L6-v2 is fast (384-dim) but less accurate. Consider trade-offs.

**Tasks:**
- [ ] **Compare sentence-transformer models** (2 hours)
  - Test models:
    - `all-MiniLM-L6-v2` (current, 384-dim, fast)
    - `all-mpnet-base-v2` (768-dim, slower, more accurate)
    - `paraphrase-multilingual-MiniLM-L12-v2` (if Polish support needed)
  - Metrics: accuracy (manual evaluation on 20 post pairs), speed, size
  - Create comparison matrix

- [ ] **Optimize inference performance** (1-2 hours)
  - Batch embedding generation (process 10+ posts at once)
  - Use CPU efficiently (torch.set_num_threads)
  - Consider quantization for smaller model size
  - Profile and document optimizations

**Decision Point:** Stay with MiniLM or upgrade to mpnet?
- MiniLM: Good enough for MVP, 2x faster
- mpnet: Better accuracy, worth it if speed acceptable

**Deliverables:**
- Model comparison report with benchmarks
- Recommended model choice + justification
- Optimized inference code (batching, threading)
- Updated documentation

**Files to Modify:**
- `gnn_models/embeddings.py` - Model selection, batching
- `topicsloop/settings.py` - Model name config
- `requirements.txt` - If switching models

---

#### **Phase 3: GNN Integration Preparation (5-7 hours)** 🧠
**Priority:** P2 - For v0.4.0, NOT blocking MVP

**Context:** You have GNN architecture (`PostGraphConv`, `CategoryGraphConv`) but it's not trained or integrated. This is advanced work.

**Tasks:**
- [ ] **Audit existing GNN code** (1 hour)
  - Review `gnn_models/models.py` - architecture looks good
  - Review `gnn_models/integration.py` - check graph building
  - Review `gnn_models/training.py` - training pipeline
  - Identify what's missing for production use

- [ ] **Create GNN training pipeline** (3-4 hours)
  - Define training task: link prediction (predict post similarities)
  - Create dataset from existing posts + similarities
  - Implement training loop with validation
  - Save trained model checkpoints
  - Document hyperparameters

- [ ] **Integrate GNN into inference pipeline** (2 hours)
  - Load trained GNN model
  - Pipeline: text → sentence-transformers → GNN → final embedding
  - A/B test: sentence-transformers only vs. full pipeline
  - Measure improvement in similarity quality

**Decision Point:** Is GNN worth the complexity?
- If yes: Better similarities, graph-aware recommendations
- If no: Stick with sentence-transformers for simplicity

**Deliverables:**
- Trained GNN model checkpoint
- Training script + hyperparameters
- Integration code (optional, can be feature-flagged)
- A/B test results comparing approaches

**Files to Modify:**
- `gnn_models/training.py` - Complete training pipeline
- `gnn_models/integration.py` - Inference integration
- `api/views.py` - Optional GNN-powered endpoints
- `topicsloop/settings.py` - Feature flag for GNN

---

#### **Phase 4: Production Readiness (Future - v1.0)** 🚀
**Priority:** P3 - Long-term, not for MVP

**Tasks (for reference, don't implement now):**
- [ ] Fine-tune models on TopicsLoop-specific data
- [ ] Multi-modal embeddings (text + tags + category hierarchy)
- [ ] Advanced GNN architectures (GAT with hierarchical attention)
- [ ] Real-time model updates based on user feedback
- [ ] GPU optimization for production inference
- [ ] Model versioning and A/B testing framework

---

#### **Success Criteria for AI/ML Tuning**

**Phase 1 (MVP Must-Have):**
- ✅ Embeddings cached in database
- ✅ Similarity queries < 100ms (vs. 1s+ without cache)
- ✅ "Similar posts" feel relevant (manual check on 20 examples)
- ✅ No out-of-memory errors with 1000+ posts

**Phase 2 (v0.3.0 Should-Have):**
- ✅ Model comparison completed, best model chosen
- ✅ Batch inference implemented
- ✅ Inference performance documented

**Phase 3 (v0.4.0 Nice-to-Have):**
- ✅ GNN trained on real data
- ✅ GNN improves similarity quality (measurable)
- ✅ A/B test shows user preference for GNN results

---

#### **Resources & References**

**Sentence-Transformers:**
- [Model comparison](https://www.sbert.net/docs/pretrained_models.html)
- [Performance optimization](https://www.sbert.net/docs/usage/computing_sentence_embeddings.html#performance)

**PyTorch Geometric:**
- [GNN tutorial](https://pytorch-geometric.readthedocs.io/en/latest/tutorial/create_gnn.html)
- [Link prediction examples](https://github.com/pyg-team/pytorch_geometric/tree/master/examples)

**Evaluation:**
- [Information Retrieval metrics](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval))
- Manual evaluation (qualitative assessment by you!)

---

#### **Key Technical Decisions**

**Decision 1: Model Choice**
- **Options:** MiniLM (fast) vs. mpnet (accurate) vs. multilingual (Polish)
- **Recommendation:** Start MiniLM, switch if accuracy lacking
- **Why:** MVP speed > perfection, can iterate

**Decision 2: GNN Integration**
- **Options:** (A) sentence-transformers only, (B) sentence-transformers + GNN
- **Recommendation:** (A) for MVP, (B) for v0.4.0
- **Why:** GNN requires training data, adds complexity, delay until have users

**Decision 3: Caching Strategy**
- **Options:** DB cache vs. Redis vs. in-memory
- **Recommendation:** DB cache (PostgreSQL JSONField)
- **Why:** Simplest, persistent, no extra infrastructure

**Decision 4: Similarity Threshold**
- **Options:** 0.3 (loose) vs. 0.5 (moderate) vs. 0.7 (strict)
- **Recommendation:** Start 0.5, make configurable
- **Why:** Balance between discovery (find connections) and relevance (avoid noise)

---

<!-- ============================================ -->
<!-- SECTION 5: MEDIUM PRIORITY TASKS            -->
<!-- ============================================ -->

## 5. MEDIUM PRIORITY TASKS (Next Sprint)

### 5.1. Explainable AI Similarities

**Status:** 📋 Backlog
**Estimate:** 10-12 hours
**Dependencies:** Zoom navigation completed

**Goal:** Show users WHY posts are semantically similar

#### **Research Phase (2 hours):**
- [ ] Investigate sentence-transformers feature extraction
- [ ] Research visualization approaches
- [ ] Design UI/UX for explanations

#### **Implementation (8 hours):**
- [ ] Extract top semantic features
- [ ] Identify overlapping content snippets
- [ ] Create explanation API endpoint
- [ ] Build explanation UI component
- [ ] Add similarity score breakdown

---

### 5.2. Code Refactoring - api/views.py

**Status:** 📋 Backlog
**Estimate:** 6-8 hours

**Goal:** Split large views.py into maintainable modules

**Structure:**
```
api/
├── views/
│   ├── __init__.py
│   ├── post_views.py
│   ├── category_views.py
│   ├── visualization_views.py
│   ├── ai_views.py
│   └── user_views.py
└── urls.py (update imports)
```

**Tasks:**
- [ ] Create views package structure
- [ ] Split by domain (posts, categories, viz, AI)
- [ ] Update URL imports
- [ ] Test all endpoints
- [ ] Update documentation

---

### 5.3. Performance Optimization

**Status:** 📋 Backlog
**Estimate:** 6 hours

#### **Database:**
- [ ] Add select_related/prefetch_related to queries
- [ ] Create database indexes for common queries
- [ ] Analyze slow queries with Django Debug Toolbar
- [ ] Optimize embedding retrieval

#### **Frontend:**
- [ ] Analyze bundle size
- [ ] Implement code splitting
- [ ] Add React.memo to expensive components
- [ ] Optimize graph rendering

---

<!-- ============================================ -->
<!-- SECTION 6: LOW PRIORITY TASKS               -->
<!-- ============================================ -->

## 6. LOW PRIORITY TASKS (Future Sprints)

### 6.1. Search & Filtering
**Estimate:** 6 hours
- Full-text search
- Advanced filters
- Search history

### 6.2. User Onboarding Flow
**Estimate:** 4 hours
- Welcome tutorial
- Interactive guide
- Sample content

### 6.3. Mobile Responsiveness
**Estimate:** 8 hours
- Responsive graph controls
- Touch gesture support
- Mobile-optimized layouts

---

<!-- ============================================ -->
<!-- SECTION 7: HIERARCHICAL UI PLAN             -->
<!-- ============================================ -->

## 7. HIERARCHICAL UI IMPLEMENTATION PLAN

> **Status:** Ready to implement - Foundation for all future features
> **Source:** Detailed implementation plan for hierarchical navigation
> **Last Updated:** 2025-10-15

---

### 7.1. Goals

Transform TopicsLoop into a hierarchical navigation platform where:
1. Users always know WHERE they are in the structure
2. Users can drill down to any depth systematically
3. Context is always visible via breadcrumbs
4. Category relationships are clear
5. Posts inherit context from their location

---

### 7.2. Phase 1: Core Components (6-8 hours)

#### **Task 7.2.1: Breadcrumbs Component** (1-2 hours)
**Priority:** P0 (Must Have)

**What:** A clickable navigation trail showing current location in hierarchy.

**Example:**
```
Home > Technology > Machine Learning > Neural Networks > [Post Title]
```

**Requirements:**
- Create `frontend/src/components/Breadcrumbs.js`
- Click any level to navigate there
- Show separator (` > ` or `/`)
- Highlight current page (not clickable)
- Responsive (collapse on mobile)
- Test with 2-7 levels deep

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

#### **Task 7.2.2: Category Tree Component** (4-6 hours)
**Priority:** P0 (Must Have)

**What:** An expandable/collapsible tree showing category hierarchy.

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
- Create `frontend/src/components/CategoryTree.js`
- Expand/collapse with animated transitions
- Show post count per category
- Multi-select checkboxes (for following)
- Indentation shows depth level
- Lazy load children (don't load all at once)
- Search/filter within tree
- Active state highlighting
- Icons: 🔽 expanded, ▶️ collapsed

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

### 7.3. Phase 2: Enhanced Pages (4-5 hours)

#### **Task 7.3.1: Enhanced Category Page** (3-4 hours)
**Priority:** P0 (Must Have)

**What:** A dedicated page for each category showing its place in hierarchy and content.

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
- Breadcrumbs at top
- Category name and description
- Statistics (post count, followers)
- Follow/Unfollow button
- "Show on Map" button
- Subcategories grid/list
- Recent posts in this category tree
- Filter: This category only vs. Include subcategories
- Sort: Recent, Popular, Commented
- Pagination

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

#### **Task 7.3.2: Feed Filtering Improvements** (1-2 hours)
**Priority:** P1 (Should Have)

**What:** Add category tree to feed sidebar for filtering.

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
- Add CategoryTree component to sidebar
- Only show followed categories
- Selecting category filters feed
- "All" checkbox shows everything
- Active category highlighted
- Persist selection (localStorage or URL param)
- Mobile: Dropdown/modal instead of sidebar

**Files to Modify:**
- `frontend/src/components/PostList.js`
- Add sidebar component
- Add filtering logic

---

### 7.4. Phase 3: Post Context (2-3 hours)

#### **Task 7.4.1: Post Detail Enhancements** (2-3 hours)
**Priority:** P1 (Should Have)

**What:** Show post in full hierarchical context.

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
- Breadcrumbs at top
- Related posts from same category
- AI-suggested related categories
- "Show on Map" CTA
- Category badge/tag
- Easy navigation to category page

**Files to Modify:**
- `frontend/src/components/PostDetail.js`
- Add Breadcrumbs
- Add related content sections

---

### 7.5. Phase 4: Onboarding Flow (Optional, 2-3 hours)

#### **Task 7.5.1: Topic Selection Onboarding** (2-3 hours)
**Priority:** P2 (Nice to Have)

**What:** First-time user flow for selecting topics to follow.

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
- Detect first-time users
- Show onboarding modal/page
- CategoryTree with multi-select
- "Skip" option (can configure later)
- Save selections to user profile
- Redirect to feed

**Files to Create:**
- `frontend/src/components/Onboarding.js`
- `frontend/src/components/OnboardingModal.js`

---

### 7.6. Backend API Requirements

#### **New Endpoints Needed**

**1. Category Tree Endpoint**
```
GET /api/categories/tree/
```

Returns hierarchical category structure with optional parameters:
- `?max_depth=3` - Limit depth
- `?parent_id=5` - Get subtree
- `?include_empty=false` - Exclude categories with 0 posts

**2. Category Detail with Path**
```
GET /api/categories/:id/
```

Enhanced to include `path` field with full parent chain.

**3. Posts with Category Path**
```
GET /api/posts/
GET /api/posts/:id/
```

Add `category_path` to post serializer showing full hierarchy.

**4. User Following Endpoints**
```
POST /api/users/me/follow-category/
POST /api/users/me/unfollow-category/
GET  /api/users/me/followed-categories/
```

---

### 7.7. Testing & Performance

#### **File Structure After Implementation**

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

#### **Testing Checklist**

**Manual Testing Scenarios**

**Scenario 1: Deep Navigation**
1. Create category hierarchy 5 levels deep
2. Navigate from home → deepest category
3. Verify breadcrumbs show full path
4. Click breadcrumb at level 2
5. Verify navigation works

**Scenario 2: Category Tree Interaction**
1. Load page with CategoryTree
2. Expand/collapse multiple categories
3. Select checkboxes at different levels
4. Verify filtering works
5. Refresh page, verify state persists

**Scenario 3: Mobile Responsiveness**
1. Open on mobile viewport (375px)
2. Verify breadcrumbs collapse/truncate
3. Verify tree becomes modal/dropdown
4. Test touch interactions

**Scenario 4: Edge Cases**
1. Category with 0 posts
2. Category with 100+ children
3. Single-category path (no parents)
4. 10+ level deep hierarchy
5. Unicode category names

#### **Performance Considerations**

**Optimization Strategies:**

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
   - Consider django-mptt for better tree queries
   - Denormalize path for fast lookups

#### **Deployment Strategy**

**Rollout Plan:**

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

#### **Success Metrics**

**How do we know it's working?**

**Quantitative:**
- 80%+ of page views include breadcrumbs
- 40%+ of users click breadcrumbs at least once
- Average category depth explored: 3+ levels
- CategoryTree used in 60%+ of sessions
- Feed filtering used by 50%+ of active users

**Qualitative:**
- Users can explain where they are
- No "I'm lost" feedback
- Users discover subcategories naturally
- Navigation feels intuitive

#### **Known Risks & Mitigations**

**Risk 1: Too Many Categories (100+)**
- Problem: Tree becomes overwhelming
- Mitigation: Show top 10 by default, add search box, collapse all by default

**Risk 2: Deep Hierarchies (10+ levels)**
- Problem: Breadcrumbs get too long
- Mitigation: Truncate middle: `Home > ... > Level 8 > Level 9 > Current`

**Risk 3: Performance with Large Trees**
- Problem: Slow rendering, memory issues
- Mitigation: Virtual scrolling, lazy loading, pagination for 100+ children

**Risk 4: Mobile UX**
- Problem: Trees don't work well on small screens
- Mitigation: Use accordion/modal on mobile, horizontal scrolling breadcrumbs

#### **Definition of Done**

**Phase 1 Complete When:**
- Breadcrumbs component working on all pages
- CategoryTree component implemented
- API endpoints returning correct data
- Manual testing scenarios pass
- No console errors
- Responsive on mobile (375px+)
- Code reviewed and merged

**Phase 2 Complete When:**
- CategoryPage shows full context
- Feed has working filter sidebar
- PostDetail has breadcrumbs and related content
- All pages connect logically
- Navigation feels natural

**Phase 3 Complete When:**
- (Optional) Onboarding flow works
- Performance acceptable (<2s load)
- User can navigate 5+ levels deep smoothly

#### **Resources & References**

**React Components to Study:**
- Material-UI TreeView
- Ant Design Tree
- React-Complex-Tree

**Hierarchical Data Patterns:**
- Django MPTT (Modified Preorder Tree Traversal)
- Nested Set Model
- Adjacency List (current, simplest)

**Design Inspiration:**
- Reddit sidebar
- VSCode file explorer
- Notion page tree
- Finder/Explorer

---

<!-- ============================================ -->
<!-- SECTION 8: KNOWN ISSUES & BUGS              -->
<!-- ============================================ -->

## 8. KNOWN ISSUES & BUGS

### 8.1. Critical
- None currently identified

### 8.2. Medium
- Graph physics occasionally doesn't stabilize on first load (refresh fixes)
- Similar posts modal doesn't close on Escape key
- Long post titles overflow in graph nodes

### 8.3. Low
- Toast notifications not dismissible manually
- No loading state for AI operations
- Category color picker missing in admin

---

<!-- ============================================ -->
<!-- SECTION 9: PROGRESS TRACKING                -->
<!-- ============================================ -->

## 9. PROGRESS TRACKING

### 9.1. Completed This Month (October 2025)

**Week 1-2 (Oct 12-16):**
- ✅ Project documentation cleanup
- ✅ CHANGELOG.md creation
- ✅ LICENSE file addition
- ✅ Requirements consolidation
- ✅ ROADMAP.md creation
- ✅ Project backlog restructuring with table of contents

**Week 3 (Oct 17-22):**
- ✅ Discord-style landing page with split hero image
- ✅ TopicsLoop icon/logo design and implementation
- ✅ Navigation redesign (logo + unified right-side links)
- ✅ Active page indicators (underline current page)
- ✅ Breadcrumbs component created and styled
- ✅ Login/logout flow improvements
- ✅ "My TopicsLoop" personalized feed naming
- ✅ Navigation labels updated (Browse Systematically, Browse on Graph)
- ✅ CreatePost error handling fixes

### 9.2. In Progress
- [ ] Adding sample category hierarchy
- [ ] Creating sample posts for testing
- [ ] Testing hierarchical navigation with real data

### 9.3. Blocked
- None currently

---

<!-- ============================================ -->
<!-- SECTION 10: SPRINT SUCCESS CRITERIA         -->
<!-- ============================================ -->

## 10. SPRINT SUCCESS CRITERIA

### 10.1. Must Have (P0)
- ✅ Documentation cleanup completed
- [ ] Zoom-based navigation working
- [ ] Basic test suite (20+ tests)

### 10.2. Should Have (P1)
- [ ] Error handling improvements
- [ ] Logging configuration
- [ ] Code coverage reports

### 10.3. Nice to Have (P2)
- [ ] Code refactoring started
- [ ] Performance baseline established
- [ ] CI/CD pipeline draft

---

<!-- ============================================ -->
<!-- SECTION 11: DAILY STANDUP NOTES             -->
<!-- ============================================ -->

## 11. DAILY STANDUP NOTES

### 11.1. 2025-10-12

**Completed:**
- Documentation cleanup (CHANGELOG, LICENSE, ROADMAP)
- Requirements consolidation
- Project structure improvements

**Today's Focus:**
- User review of changes
- Planning next steps (zoom navigation or testing)

**Blockers:**
- None

### 11.2. Sprint Retrospective Template

**What Went Well:**
- TBD at sprint end

**What Could Be Improved:**
- TBD at sprint end

**Action Items:**
- TBD at sprint end

---

<!-- ============================================ -->
<!-- SECTION 12: LONG-TERM ROADMAP               -->
<!-- ============================================ -->

## 12. LONG-TERM ROADMAP

> **Note:** This section contains the strategic vision for future versions.
> For active sprint work, see the sections above.

---

### 12.1. Current Status (v0.2.0)

#### **Completed Features**

**Core Platform:**
- Django 4.2+ backend with REST API
- React 19 frontend with modern UI
- PostgreSQL 17 database
- Docker containerization
- JWT authentication with Djoser
- CORS configuration

**AI/ML Capabilities:**
- Sentence-transformers integration (all-MiniLM-L6-v2)
- Semantic content analysis (384-dimensional embeddings)
- Auto-categorization engine
- Similar content discovery with cosine similarity
- Real-time AI inference

**Graph Visualizations:**
- Interactive network graphs (vis.js)
- Hierarchical color-coding (10-color palette)
- Circular post distribution algorithm
- Physics-based layout with auto-stabilization
- Category relationship networks
- User interest networks
- AI semantic networks

**User Experience:**
- User profiles with favorite categories
- Multi-category post support
- Tag system
- Personalized content filtering
- Fullscreen graph mode
- Toast notifications
- Manual/physics mode toggle

---

### 12.2. Version 0.3.0 - Enhanced Discovery (Next Release)

**Focus:** Improved navigation and AI transparency

#### **High Priority Features**

**1. Zoom-Based Progressive Disclosure (8-10 hours)**
- Status: Design Complete, Ready for Implementation
- Description: Google Maps-style zoom levels for graph navigation
- Implementation:
  - Scale < 0.4: Categories only (overview mode)
  - Scale 0.4-0.8: Categories + post nodes (no labels)
  - Scale 0.8-1.5: Categories + posts with labels
  - Scale > 1.5: Full detail + similarity edges
- Benefits:
  - Scalable to 1000+ posts
  - Intuitive navigation
  - Reduced visual clutter
  - Better performance
- Technical: Listen to `network.on('zoom')`, dynamic node visibility, debounced updates (300ms)

**2. Explainable AI Similarities (10-12 hours)**
- Status: Planned
- Description: Show WHY posts are semantically similar
- Implementation:
  - Extract top semantic features from embeddings
  - Show overlapping content snippets
  - Highlight common categories/tags
  - Display similarity score breakdown
  - Visualize embedding space distances
- Benefits: AI transparency, user trust, educational value, better content discovery
- Technical Stack: SHAP or LIME for feature importance, attention visualization, sentence-level similarity scores

**3. Category Similarity Explanations (6-8 hours)**
- Status: Planned
- Description: Semantic relationships between categories
- Implementation:
  - Category embedding analysis
  - Common topic extraction
  - Visual relationship strength indicators
  - Interactive category comparison

#### **Medium Priority Features**

**4. Search & Filtering Improvements (6 hours)**
- Full-text search across posts
- Advanced filtering (date, author, similarity threshold)
- Saved searches
- Search history

**5. Performance Optimizations (8 hours)**
- Database query optimization (prefetch_related)
- Redis caching for embeddings
- Lazy loading for large graphs
- CDN integration for static assets
- Bundle size optimization

**6. User Engagement Features (10 hours)**
- Comments system
- Post reactions (like/bookmark)
- User following
- Activity feed
- Notifications

---

### 12.3. Version 0.4.0 - Collaboration & Quality

#### **Planned Features**

**Testing Infrastructure:**
- Backend unit tests (pytest)
- Frontend component tests (Jest + React Testing Library)
- Integration tests
- E2E tests (Playwright)
- CI/CD pipeline (GitHub Actions)
- Code coverage > 80%

**Documentation:**
- API documentation (Swagger/OpenAPI)
- Architecture deep-dive
- Deployment guide
- Contributing guidelines
- User manual

**Developer Experience:**
- TypeScript migration (frontend)
- Type hints (backend with mypy)
- Pre-commit hooks
- Code formatting (Black, Prettier)
- Linting (flake8, ESLint)

**Monitoring & Observability:**
- Django Debug Toolbar
- Sentry error tracking
- Performance monitoring
- User analytics
- AI model performance metrics

---

### 12.4. Version 1.0.0 - Production Release

#### **Production Readiness**

**Security Enhancements:**
- Rate limiting (django-ratelimit)
- Security headers (django-csp)
- API versioning
- OAuth2 providers (Google, GitHub)
- 2FA support
- Security audit

**Performance:**
- Database indexing optimization
- Query performance analysis
- Caching strategy (Redis)
- Load testing
- Auto-scaling setup

**Infrastructure:**
- Production deployment guide
- Database backup strategy
- Monitoring dashboards
- Log aggregation
- SSL/TLS configuration
- CDN setup

**Polish & UX:**
- Mobile responsive design
- Accessibility (WCAG 2.1 AA)
- Internationalization (i18n)
- Dark mode
- Onboarding flow
- Tutorial system

---

### 12.5. Future Enhancements (Post v1.0)

#### **Advanced AI Features**
- Multi-modal embeddings (text + images)
- Knowledge graph reasoning
- Trend detection
- Automatic summarization
- Content recommendations based on reading history
- Collaborative filtering

#### **Platform Extensions**
- Browser extension for content capture
- Mobile app (React Native)
- Public API with rate limits
- Webhooks for integrations
- Export functionality (PDF, Markdown)

#### **Community Features**
- Team workspaces
- Private knowledge bases
- Content moderation tools
- User reputation system
- Badges and achievements

#### **Enterprise Features**
- SSO integration (SAML, LDAP)
- Advanced permissions
- Audit logs
- Custom branding
- SLA guarantees

---

### 12.6. Technical Debt & Maintenance

#### **Ongoing Tasks**
- Dependency updates (monthly)
- Security patches (as needed)
- Performance monitoring
- Bug triage and fixes
- Database migrations
- Documentation updates

#### **Known Issues**
- API views.py getting large (needs refactoring)
- Missing test coverage
- No logging configuration
- Limited error handling in AI inference
- No database query optimization

#### **Refactoring Priorities**
1. Split `api/views.py` into multiple modules
2. Extract graph logic into separate app
3. Add comprehensive error handling
4. Implement proper logging
5. Database query optimization

---

### 12.7. Development Philosophy

**Principles:**
- **MVP First:** Ship working features, iterate based on feedback
- **AI Transparency:** Always explain AI decisions to users
- **Performance:** Keep UX snappy even with large datasets
- **Documentation:** Code should be self-documenting + comprehensive docs

**Prioritization Criteria:**
1. **User Value:** Does it solve a real problem?
2. **Effort:** Can we build it efficiently?
3. **Dependencies:** Does it block other features?
4. **Technical Debt:** Does it improve code quality?

#### **Success Metrics**

**Version 0.3.0 Success Criteria**
- Load time < 2s for 500 posts
- Zoom navigation working smoothly
- AI explanations for all similar posts
- User feedback: 8/10+ satisfaction
- Test coverage > 40%

**Version 1.0.0 Success Criteria**
- Test coverage > 80%
- Page load < 1s
- 1,000+ active users
- 10,000+ posts across 100+ categories
- 40% of users try the knowledge map
- 30% of users discover new topics via map
- NPS score: 40+

---

<!-- ============================================ -->
<!-- SECTION 13: RESOURCES & LINKS              -->
<!-- ============================================ -->

## 13. RESOURCES & LINKS

### 13.1. Documentation
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **README:** [README.md](README.md)
- **License:** [LICENSE](LICENSE)
- **Product Strategy:** [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md)
- **API Documentation:** [docs/API.md](docs/API.md)
- **Documentation Index:** [docs/README.md](docs/README.md)

### 13.2. External Resources
- Django Documentation
- React Documentation
- PyTorch Documentation
- Sentence-Transformers Documentation
- Vis.js Network Documentation

---

**Last Review:** 2025-10-16
**Next Review:** 2025-10-19 (weekly)

---

**"Clear backlog = Clear direction"**
