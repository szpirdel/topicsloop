# Changelog

All notable changes to TopicsLoop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Zoom-based progressive disclosure (Google Maps-style navigation)
- Explainable AI similarities (show WHY posts are similar)
- Category similarity explanations
- Comprehensive test suite
- Performance monitoring and analytics

---

## [0.2.0] - 2025-10-01

### Added
- **Hierarchical color-coding system** - 10-color palette with color inheritance for category families
- **Circular post distribution** - Mathematical circular positioning around categories (120 unit radius)
- **Physics auto-disable** - Graph freezes after stabilization for stable, usable layout
- **Color inheritance logic** - Posts inherit lighter shade (30%) of their category's color

### Changed
- **Node distance reduction** - 87.5% more compact layout for better screen space utilization
  - gravitationalConstant: -500 → -62
  - springLength: 400 → 50
  - centralGravity: 0.001 → 0.008
- **Initial zoom reduction** - 75% zoomed out for bird's-eye view (scale: 1.5 → 0.375)
- **Category size increase** - 75% bigger categories (size: 40 → 70) for better visibility
- **Physics engine switch** - Changed from barnesHut to forceAtlas2Based for better clustering

### Fixed
- Physics freeze issue - Nodes now stabilize after initial layout (no continuous movement)
- Overlapping post nodes - Circular distribution ensures all titles are readable
- Event listener placement - Moved to `initializeNetwork()` for proper stabilization handling

---

## [0.1.1] - 2025-09-29

### Added
- **Feature: Load ALL posts by default** - Increased from 20 to 200 posts (109 total visible)
- **Balanced distribution algorithm** - Ensures all categories get representation (minimum 2 posts each)
- **Radial layout for similar posts** - Even angular distribution in circle around original post
- Added `added_edges` set to prevent duplicate edge creation

### Changed
- Removed "Focus on This Post" button - Simplified UI to only essential actions
- Post modal now shows only 2 actions: "Read Full Post" and "Find Similar Posts"

### Fixed
- **Bug: Category post display** - Science and Arts categories now show posts on initial load
- **Bug: Duplicate post nodes** - Used dictionary to prevent `post_106 already exists` error
- **Bug: focus_category 500 error** - Fixed query execution in category_id branch
- **Bug: Duplicate edge error** - Arts category now loads without `post_3_to_cat_3` error
- **Bug: Similar posts grouping** - Posts now extend graph dynamically instead of isolated clusters
- **Bug: Similar posts alignment** - Clear star/radial pattern instead of random scatter

---

## [0.1.0] - 2025-09-28

### Added
- **Find Similar Posts functionality** - AI-powered semantic similarity discovery
- **Batch operations** - Major performance improvement for node updates
- **Spatial organization** - Similar posts cluster on one side of graph
- **Toast notifications** - Beautiful auto-disappearing messages (6-second display)
- **Fullscreen mode** - Immersive graph exploration with floating exit button
- **Manual mode as default** - User control over graph layout (physics disabled by default)

### Changed
- **Color scheme optimization**:
  - Selected nodes: Green (#28a745)
  - Original post: Orange (#ff8c00)
  - Similar posts: Red (#e74c3c)
  - Default nodes: Blue (#3498db)
- Improved button labels: "⚡ Turn On Physics" / "🔧 Turn Off Physics"

### Fixed
- White screen rendering issues when finding similar posts
- Loading state changes that caused network re-initialization
- Multiple network initialization prevention with `isInitialized.current` flag

---

## [0.0.1] - 2025-09-19

### Added
- Initial MVP release
- Django backend with REST API
- React frontend with modern UI
- PostgreSQL database integration
- JWT authentication with Djoser
- **AI Models**:
  - Sentence-transformers integration (all-MiniLM-L6-v2)
  - Semantic content analysis
  - Auto-categorization engine
  - Similar content discovery
- **Graph Visualizations**:
  - Interactive knowledge graphs (vis.js)
  - Category relationship networks
  - User interest networks
  - AI semantic networks
- **Social Features**:
  - User profiles with favorite categories
  - Multi-category posts
  - Tag system
  - Personalized content filtering
- Docker containerization with docker-compose
- Professional React UI with Context API

### Technical Stack
- Django 4.2+ with Django REST Framework
- React 19 with Router DOM 7.1.5
- PyTorch 2.0+ with PyTorch Geometric
- PostgreSQL 17
- Sentence-Transformers for semantic analysis
- Vis.js for network visualizations

---

## Notes

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major feature releases
- **Minor (0.X.0)**: New features, significant improvements
- **Patch (0.0.X)**: Bug fixes, minor improvements

### Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
