# TopicsLoop - Active Development Backlog

**Last Updated:** 2025-10-12
**Sprint:** October 2025
**Current Version:** 0.2.0
**Next Target:** 0.3.0

> **Note:** For long-term roadmap, see [ROADMAP.md](ROADMAP.md)

---

## 🎯 Current Sprint Goals

### Sprint Overview
**Duration:** October 12 - October 26 (2 weeks)
**Focus:** Platform cleanup, testing foundation, and zoom-based navigation
**Velocity:** 40-50 hours available

---

## 🔴 High Priority (This Sprint)

### 1. Project Documentation & Cleanup ✅ COMPLETED
**Status:** ✅ DONE (2025-10-12)
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

### 2. Zoom-Based Progressive Disclosure ⚡ HIGH PRIORITY
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

### 3. Basic Test Suite Foundation 🧪
**Status:** 📋 Planned
**Estimate:** 8-12 hours
**Priority:** HIGH - Technical debt reduction

**Goal:** Establish testing infrastructure for future development

**Phase 1: Backend Tests (6 hours)**
- [ ] Set up pytest configuration
- [ ] Write tests for API endpoints (posts, categories)
- [ ] Write tests for AI embeddings generation
- [ ] Write tests for similarity calculations
- [ ] Test authentication flows
- [ ] Achieve 40%+ backend coverage

**Phase 2: Frontend Tests (4 hours)**
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

### 4. Error Handling & Logging Improvements 🐛
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

## 🟡 Medium Priority (Next Sprint)

### 5. Explainable AI Similarities
**Status:** 📋 Backlog
**Estimate:** 10-12 hours
**Dependencies:** Zoom navigation completed

**Goal:** Show users WHY posts are semantically similar

**Research Phase (2 hours):**
- [ ] Investigate sentence-transformers feature extraction
- [ ] Research visualization approaches
- [ ] Design UI/UX for explanations

**Implementation (8 hours):**
- [ ] Extract top semantic features
- [ ] Identify overlapping content snippets
- [ ] Create explanation API endpoint
- [ ] Build explanation UI component
- [ ] Add similarity score breakdown

---

### 6. Code Refactoring - api/views.py
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

### 7. Performance Optimization
**Status:** 📋 Backlog
**Estimate:** 6 hours

**Database:**
- [ ] Add select_related/prefetch_related to queries
- [ ] Create database indexes for common queries
- [ ] Analyze slow queries with Django Debug Toolbar
- [ ] Optimize embedding retrieval

**Frontend:**
- [ ] Analyze bundle size
- [ ] Implement code splitting
- [ ] Add React.memo to expensive components
- [ ] Optimize graph rendering

---

## 🟢 Low Priority (Future Sprints)

### 8. Search & Filtering
**Estimate:** 6 hours
- Full-text search
- Advanced filters
- Search history

### 9. User Onboarding Flow
**Estimate:** 4 hours
- Welcome tutorial
- Interactive guide
- Sample content

### 10. Mobile Responsiveness
**Estimate:** 8 hours
- Responsive graph controls
- Touch gesture support
- Mobile-optimized layouts

---

## 🐛 Known Issues & Bugs

### Critical
- None currently identified

### Medium
- Graph physics occasionally doesn't stabilize on first load (refresh fixes)
- Similar posts modal doesn't close on Escape key
- Long post titles overflow in graph nodes

### Low
- Toast notifications not dismissible manually
- No loading state for AI operations
- Category color picker missing in admin

---

## 📊 Progress Tracking

### Completed This Month (October 2025)
- ✅ Project documentation cleanup
- ✅ CHANGELOG.md creation
- ✅ LICENSE file addition
- ✅ Requirements consolidation
- ✅ ROADMAP.md creation

### In Progress
- None currently

### Blocked
- None currently

---

## 🎯 Sprint Success Criteria

**Must Have (P0):**
- ✅ Documentation cleanup completed
- [ ] Zoom-based navigation working
- [ ] Basic test suite (20+ tests)

**Should Have (P1):**
- [ ] Error handling improvements
- [ ] Logging configuration
- [ ] Code coverage reports

**Nice to Have (P2):**
- [ ] Code refactoring started
- [ ] Performance baseline established
- [ ] CI/CD pipeline draft

---

## 📝 Daily Standup Notes

### 2025-10-12
**Completed:**
- Documentation cleanup (CHANGELOG, LICENSE, ROADMAP)
- Requirements consolidation
- Project structure improvements

**Today's Focus:**
- User review of changes
- Planning next steps (zoom navigation or testing)

**Blockers:**
- None

---

## 🔄 Sprint Retrospective Template

**What Went Well:**
- TBD at sprint end

**What Could Be Improved:**
- TBD at sprint end

**Action Items:**
- TBD at sprint end

---

## 📚 Resources & Links

- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Long-term Roadmap:** [ROADMAP.md](ROADMAP.md)
- **README:** [README.md](README.md)
- **License:** [LICENSE](LICENSE)

---

**Last Review:** 2025-10-12
**Next Review:** 2025-10-19 (weekly)
