# TopicsLoop - User Journeys & UX Design

**Last Updated:** 2025-10-13
**Status:** Planning Phase
**Purpose:** Define how users interact with TopicsLoop to build the right features

---

## 🎯 Platform Vision

### **The Core Problem We Solve**
Users consume content across the internet but struggle to:
1. **Understand context** - Where does this topic fit in the bigger picture?
2. **Discover connections** - What other topics relate to this?
3. **Avoid information silos** - Breaking out of algorithmic bubbles
4. **Navigate knowledge space** - How do I explore systematically?

### **Our Solution**
A dual-interface platform combining:
- **Hierarchical Structure** (Primary) - Clear topic organization with deep categorization
- **Visual Knowledge Map** (Secondary) - AI-powered connection discovery

### **What Makes Us Unique**
- **Deep hierarchies** - Categories → Subcategories → Sub-subcategories (unlimited depth)
- **Context awareness** - Always show "you are here" in the structure
- **AI-powered connections** - Semantic similarity, not just manual categorization
- **Connection transparency** - Show WHY topics connect (weights, reasons)
- **Discovery-first** - Help users find content they didn't know they needed

---

## 👤 User Priorities

Based on founder vision (validated Oct 2025):

1. **🔍 Content Discovery** (Priority 1)
   - Explore topics systematically
   - Discover unexpected connections
   - Find relevant content efficiently

2. **🧠 AI-Assisted Learning** (Priority 2)
   - Understand topic relationships
   - See semantic connections
   - Learn context and structure

3. **👥 Social Sharing** (Priority 3)
   - Share knowledge
   - Contribute posts
   - Community engagement

---

## 🗺️ Primary User Journey: The Feed Explorer

**Persona:** Maria, a software engineer interested in AI and electric vehicles

### **Journey Map**

#### **Step 1: Onboarding & Topic Selection**
**Goal:** Set up personalized feed

**Actions:**
1. Creates account (email/password or OAuth)
2. Sees onboarding screen: "What topics interest you?"
3. Browses **category tree** (hierarchical selector)
   - Sees: Technology > Machine Learning > Neural Networks
   - Sees: Technology > Electric Vehicles > Tesla > Model 3
   - Can expand/collapse branches
   - Shows post counts per category
4. Selects topics at **any depth level**:
   - "Neural Networks" (broad)
   - "Tesla Model 3" (very specific)
   - "Computer Vision" (medium)
5. Clicks "Start Exploring"

**UI Elements Needed:**
- [ ] Category tree component (expandable/collapsible)
- [ ] Multi-select with checkboxes
- [ ] Post count badges
- [ ] "Go deeper" suggestions
- [ ] Skip button (can configure later)

**Success Criteria:**
- User selects 3-5 topics minimum
- Mix of broad and specific topics
- User understands they can change later

**What User Sees:**
```
┌─────────────────────────────────────┐
│  What topics interest you?          │
│                                     │
│  🔽 Technology (1,245 posts)        │
│    ☑ 🔽 Machine Learning (334)      │
│      ☑   Neural Networks (89)       │
│      □   Computer Vision (72)       │
│    ☑ 🔽 Electric Vehicles (156)     │
│      ☑   Tesla (89)                 │
│        ☑ Model 3 (34)               │
│        □ Model Y (28)               │
│  🔽 Science (892 posts)             │
│    □   Physics (234)                │
│                                     │
│  [Start Exploring →]                │
└─────────────────────────────────────┘
```

**Emotions:**
- ✅ Excitement - "This is specific!"
- ✅ Control - "I choose what I see"
- ✅ Clarity - "I understand the structure"

---

#### **Step 2: Daily Visit - The Feed**
**Goal:** Browse personalized content

**Actions:**
1. Logs in
2. Lands on **Home Feed** showing posts from followed topics
3. Sees posts with **clear hierarchical context**:
   ```
   Technology > Machine Learning > Neural Networks
   "New Transformer Architecture Released"

   Technology > Electric Vehicles > Tesla > Model 3
   "Battery Performance in Cold Weather"
   ```
4. Can filter feed:
   - "All Topics" (default)
   - "Technology only"
   - "Machine Learning only" (drill down)
5. Can sort by:
   - Recent (default)
   - Popular
   - Commented

**UI Elements Needed:**
- [ ] Feed component with breadcrumb trails
- [ ] Category filter sidebar (tree view)
- [ ] Active topic highlighting
- [ ] Sort controls
- [ ] Post preview cards

**Success Criteria:**
- Sees posts from followed topics
- Understands where each post belongs
- Can filter easily

**What User Sees:**
```
┌────────────┬────────────────────────────────────────┐
│            │  🏠 Your Feed                          │
│ Filters    │  [Recent ▼] [All Topics ▼]            │
│            │                                        │
│ ☑ All      │  Technology > ML > Neural Networks    │
│ ☑ Tech     │  ┌──────────────────────────────────┐ │
│   ☑ ML     │  │ New Transformer Architecture     │ │
│   □ EV     │  │ GPT-5 introduces sparse attention│ │
│ □ Science  │  │ 👤 @john  💬 12  ⏰ 2 hours ago   │ │
│            │  └──────────────────────────────────┘ │
│ [Manage]   │                                        │
│            │  Technology > EV > Tesla > Model 3    │
│            │  ┌──────────────────────────────────┐ │
│            │  │ Battery Performance in Cold      │ │
│            │  │ Tests show 15% degradation...    │ │
│            │  │ 👤 @maria  💬 8  ⏰ 5 hours ago   │ │
│            │  └──────────────────────────────────┘ │
└────────────┴────────────────────────────────────────┘
```

**Emotions:**
- ✅ Satisfaction - "This is relevant!"
- ✅ Orientation - "I know where I am"
- ✅ Efficiency - "Easy to browse"

---

#### **Step 3: Reading a Post**
**Goal:** Consume content with context

**Actions:**
1. Clicks post title
2. Sees **post detail page** with:
   - Full breadcrumb trail at top
   - Post content
   - Comments section
   - Sidebar showing:
     - Current category info
     - Related posts (same category)
     - Action buttons
3. Available actions:
   - 💬 Comment
   - 🔖 Bookmark
   - 🗺️ **"Show on Knowledge Map"** ← Key transition point!
   - ↗️ Share
   - ⚠️ Report

**UI Elements Needed:**
- [ ] Post detail component
- [ ] Full breadcrumb navigation (clickable)
- [ ] Category info sidebar
- [ ] Related posts section
- [ ] "Show on Map" prominent button

**Success Criteria:**
- User reads post comfortably
- Breadcrumb provides context
- "Show on Map" button is discoverable

**What User Sees:**
```
┌────────────────────────────────────────────────────┐
│ Home > Technology > Machine Learning > Neural Nets │
├────────────────────────────────────────────────────┤
│                                                    │
│  New Transformer Architecture Released            │
│  by @john  •  2 hours ago                         │
│                                                    │
│  GPT-5 introduces sparse attention mechanism...   │
│  [Full post content here]                         │
│                                                    │
│  [💬 Comment] [🔖 Bookmark] [🗺️ Show on Map]      │
│                                                    │
│  ─────────────────                                │
│  💬 12 Comments                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Emotions:**
- ✅ Informed - "I learned something"
- ✅ Curious - "What else is related?"
- ✅ Engaged - "I can interact"

---

#### **Step 4: Discovery via Knowledge Map**
**Goal:** Explore connections and discover new topics

**Actions:**
1. Clicks **"🗺️ Show on Knowledge Map"** on post
2. Graph view opens showing:
   - **Current post** at center (highlighted orange)
   - **Parent category** connected (Neural Networks)
   - **Sibling posts** (other posts in Neural Networks)
   - **Related categories** via AI (Computer Vision, NLP)
   - **Similar posts** via semantic analysis (different categories!)
3. Hovers over connection line → Tooltip shows:
   - "85% semantic similarity"
   - "Shared keywords: attention, transformers, training"
   - "AI detected: Related research areas"
4. Clicks on related category → Expands to show posts
5. Finds interesting post in Computer Vision (wasn't following!)
6. Clicks post → Preview modal opens
7. Clicks "Read Full Post" → Goes to post detail
8. Sees "Follow Computer Vision" suggestion
9. Follows new category

**UI Elements Needed:**
- [ ] Graph view with contextual entry (centered on source)
- [ ] Connection tooltips (WHY related?)
- [ ] Preview modal for quick reading
- [ ] "Follow this category" CTAs
- [ ] Breadcrumb showing graph context
- [ ] Easy exit back to feed

**Success Criteria:**
- User discovers 1+ new relevant categories
- User understands WHY things are connected
- User follows new category (conversion!)
- User returns to feed seamlessly

**What User Sees:**
```
┌──────────────────────────────────────────────────┐
│ 🗺️ Knowledge Map                    [✕ Close]   │
│ Exploring from: "New Transformer Architecture"   │
├──────────────────────────────────────────────────┤
│                                                  │
│           [Computer Vision]                      │
│                  │ 85% similar                   │
│                  │                               │
│    [NLP] ────[TRANSFORMER]──── [Model 3 Post]   │
│              (YOU ARE HERE)                      │
│                  │                               │
│           [Neural Networks]                      │
│              (parent)                            │
│                                                  │
│  💡 Tip: Click connections to see why related   │
└──────────────────────────────────────────────────┘
```

**Emotions:**
- ✅ Wonder - "I didn't know these connected!"
- ✅ Excitement - "This is relevant to me!"
- ✅ Understanding - "Now I see the bigger picture"
- ⚠️ Avoid: Confusion - "What am I looking at?"
- ⚠️ Avoid: Overwhelm - "Too much information!"

---

#### **Step 5: Category Exploration (Alternative Path)**
**Goal:** Browse by topic systematically

**Actions:**
1. From feed sidebar, clicks "Machine Learning" category
2. Sees **Category Page** showing:
   - Category description
   - Breadcrumb: Home > Technology > Machine Learning
   - **Subcategories** (Neural Networks, Computer Vision, etc.)
   - **Recent posts** in this category tree
   - **Related categories** (AI-suggested)
   - Post count and activity stats
3. Can expand subcategories to see their posts
4. Can click "🗺️ Show Category on Map" to see relationships
5. Can follow/unfollow category

**UI Elements Needed:**
- [ ] Category detail page
- [ ] Subcategory cards/list
- [ ] Category statistics
- [ ] "Show on Map" button
- [ ] Follow button
- [ ] Posts list filtered by category

**Success Criteria:**
- User understands category hierarchy
- User can drill down easily
- User can switch to map view if desired

**Emotions:**
- ✅ Organized - "This makes sense"
- ✅ Empowered - "I can explore systematically"

---

## 🗺️ Secondary User Journey: The Visual Explorer

**Persona:** Alex, a visual learner who likes to explore

### **Journey Map**

#### **Entry Point 1: From Homepage**
**Actions:**
1. Sees button: "🗺️ Explore Knowledge Map" in navigation
2. Clicks it
3. Lands on graph showing **all followed topics** as clusters
4. Categories as large nodes, posts as smaller nodes
5. Zoomed out view showing structure

#### **Entry Point 2: From Category Page**
**Actions:**
1. On category page, clicks "Show on Map"
2. Graph opens centered on that category
3. Shows relationships to other categories
4. Shows posts within category

#### **Entry Point 3: From Post Detail**
**Actions:**
1. On post, clicks "Show on Map"
2. Graph opens centered on that post
3. Shows similar posts
4. Shows category context
5. Shows semantic connections

**UI Elements Needed:**
- [ ] Multiple entry points (nav, category, post)
- [ ] Contextual graph centering
- [ ] Return navigation (back to source)
- [ ] Legend explaining node types
- [ ] "Switch to List View" button

---

## 🎯 Success Metrics

### **How do we know it's working?**

#### **Engagement Metrics**
- **Topic Discovery Rate:** % of users who follow new categories after using map
  - Target: 30%+ of map users discover and follow new topics

- **Daily Active Users (DAU):** Users returning daily
  - Target: 40%+ of registered users visit weekly

- **Session Depth:** Average posts read per session
  - Target: 5+ posts per session

#### **Navigation Metrics**
- **Map Usage Rate:** % of users who try map view
  - Target: 60%+ of users explore map within first week

- **Map-to-Feed Conversion:** Users who discover content via map and return to feed
  - Target: 80%+ successfully navigate back to feed

- **Category Drill-Down Depth:** How deep users go in hierarchies
  - Target: Average 3+ levels deep (shows engagement)

#### **Content Metrics**
- **Breadcrumb Click Rate:** Users clicking breadcrumbs to navigate
  - Target: 40%+ use breadcrumbs at least once per session

- **Related Content Discovery:** Users following connections
  - Target: 2+ related items clicked per map session

#### **User Satisfaction**
- **Net Promoter Score (NPS):** Would recommend to others?
  - Target: 40+ (good for early product)

- **Feature Clarity Survey:** "I understand how to use TopicsLoop"
  - Target: 80%+ agree

---

## 🚨 Anti-Patterns to Avoid

### **Things That Would Break UX**

1. **Lost in Space Syndrome**
   - ❌ User can't find their way back
   - ✅ Always show breadcrumbs + "Back to Feed" button

2. **Mystery Meat Navigation**
   - ❌ Icons without labels, unclear actions
   - ✅ Clear labels, tooltips, help text

3. **Graph Overload**
   - ❌ Showing 1000 nodes at once
   - ✅ Progressive disclosure, zoom levels, filtering

4. **Meaningless Connections**
   - ❌ "These are connected" (no explanation)
   - ✅ "Connected because: 85% semantic similarity, shared keywords"

5. **Forced Linear Paths**
   - ❌ Must use map to get to content
   - ✅ Map is optional enhancement, not required

6. **Context Loss**
   - ❌ User forgets where they came from
   - ✅ Breadcrumbs, history, "You were reading X"

---

## 🎨 Core UI Components Needed

### **Priority 1: Hierarchical Navigation**
1. **CategoryTree Component**
   - Expandable/collapsible tree
   - Multi-select for following
   - Post counts per category
   - Active state highlighting

2. **Breadcrumbs Component**
   - Clickable navigation trail
   - Always visible at top
   - Shows current location in hierarchy

3. **Category Page**
   - Category info and description
   - Subcategory grid/list
   - Posts within category
   - Related categories
   - Follow button

4. **Feed Component**
   - Post cards with breadcrumbs
   - Filter sidebar (category tree)
   - Sort controls
   - Pagination

5. **Post Detail Enhanced**
   - Full breadcrumb trail
   - Category sidebar
   - Related posts
   - "Show on Map" CTA

### **Priority 2: Graph Integration**
6. **Knowledge Map Component**
   - Contextual entry (centered on source)
   - Connection explanations
   - Preview modals
   - Multiple zoom levels
   - Legend and help

7. **Connection Tooltip**
   - Why connected?
   - Similarity scores
   - Shared attributes

8. **Preview Modal**
   - Quick post preview from graph
   - "Read Full" → goes to detail
   - "Follow Category" CTA

---

## 📋 Implementation Priority

### **Phase 1: Core Hierarchical UI**
Focus: Make browsing and navigation excellent

1. Breadcrumbs component (1-2 hours)
2. Category tree component (4-6 hours)
3. Enhanced category page (4-6 hours)
4. Feed filtering improvements (3-4 hours)
5. Post detail sidebar (2-3 hours)

**Deliverable:** Users can navigate hierarchically with full context

### **Phase 2: Graph Purpose Clarity**
Focus: Make graph understandable and valuable

1. Rename routes and labels (1 hour)
2. Add contextual entry points (3-4 hours)
3. Connection explanations/tooltips (2-3 hours)
4. Preview modals (3-4 hours)
5. Navigation improvements (2 hours)

**Deliverable:** Users understand when/why to use map

### **Phase 3: Graph Enhancements**
Focus: Polish and advanced features

1. Zoom-based progressive disclosure (8-10 hours)
2. Better layouts and physics (4-6 hours)
3. Category clustering (3-4 hours)
4. Performance optimizations (3-4 hours)

**Deliverable:** Smooth, scalable graph experience

---

## 🔄 Iteration Strategy

### **How to Validate These Journeys**

1. **Build Minimum Viable Flow**
   - Phase 1 only (hierarchical UI)
   - Test with real content
   - Validate assumptions

2. **User Testing (You + Early Users)**
   - Screen recording sessions
   - Think-aloud protocol
   - "What would you click here?"
   - Track confusion points

3. **Measure Actual Behavior**
   - Where do users get stuck?
   - Which features aren't used?
   - What paths are most common?

4. **Iterate Based on Data**
   - Fix confusing flows
   - Enhance popular features
   - Remove unused features

---

## 📚 Design References

### **Similar Products (Learn From)**

**Hierarchical Navigation:**
- Reddit sidebar (subreddit tree)
- File explorers (Finder, Explorer)
- Notion's page hierarchy

**Knowledge Maps:**
- Obsidian graph view
- Roam Research
- TheBrain

**Hybrid Approach (What we're building):**
- TopicsLoop's unique contribution!

---

**Next Steps:**
1. Review and validate these journeys
2. Create wireframes for Phase 1 components
3. Start implementation with highest priority items
