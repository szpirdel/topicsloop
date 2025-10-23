import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import TopicsLoopIcon from './TopicsLoopIcon';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Landing Page Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          {/* Logo on the left */}
          <div className="nav-logo">
            <TopicsLoopIcon size={40} />
            <span className="nav-logo-text">TopicsLoop</span>
          </div>

          {/* Auth buttons on the right */}
          <div className="landing-nav-links">
            <Link to="/login" className="btn-nav-login">
              Login
            </Link>
            <Link to="/register" className="btn-nav-signup">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Split Image */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-subtitle">Where Your Knowledge Connects</span>
            </h1>
            <p className="hero-description">
              Navigate topics like you browse folders. Discover connections like you explore maps.
              Two ways to explore, infinite possibilities.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-hero btn-primary">
                Get Started Free
              </Link>
              <Link to="/visualizations" className="btn-hero btn-secondary">
                Explore the Map →
              </Link>
            </div>
          </div>

          {/* Split Hero Image */}
          <div className="hero-split-image">
            <div className="split-left">
              <div className="split-label">Hierarchical Navigation</div>
              <div className="hierarchical-demo">
                <div className="tree-item level-0">
                  <span className="tree-icon">📁</span> Technology
                  <div className="tree-children">
                    <div className="tree-item level-1">
                      <span className="tree-icon">📂</span> Machine Learning
                      <div className="tree-children">
                        <div className="tree-item level-2">
                          <span className="tree-icon">📄</span> Neural Networks
                        </div>
                        <div className="tree-item level-2">
                          <span className="tree-icon">📄</span> Computer Vision
                        </div>
                        <div className="tree-item level-2">
                          <span className="tree-icon">📄</span> NLP
                        </div>
                      </div>
                    </div>
                    <div className="tree-item level-1">
                      <span className="tree-icon">📂</span> Electric Vehicles
                    </div>
                  </div>
                </div>
                <div className="tree-item level-0">
                  <span className="tree-icon">📁</span> Science
                </div>
              </div>
            </div>

            <div className="split-divider">
              <div className="divider-text">OR</div>
            </div>

            <div className="split-right">
              <div className="split-label">Knowledge Graph</div>
              <div className="graph-demo">
                <svg viewBox="0 0 300 200" className="graph-svg">
                  {/* Connections */}
                  <line x1="150" y1="100" x2="80" y2="50" className="graph-edge" />
                  <line x1="150" y1="100" x2="220" y2="50" className="graph-edge" />
                  <line x1="150" y1="100" x2="80" y2="150" className="graph-edge" />
                  <line x1="150" y1="100" x2="220" y2="150" className="graph-edge" />
                  <line x1="80" y1="50" x2="220" y2="50" className="graph-edge-thin" />
                  <line x1="220" y1="50" x2="220" y2="150" className="graph-edge-thin" />

                  {/* Nodes */}
                  <circle cx="150" cy="100" r="25" className="graph-node graph-node-center" />
                  <text x="150" y="105" className="graph-label">ML</text>

                  <circle cx="80" cy="50" r="20" className="graph-node graph-node-related" />
                  <text x="80" y="55" className="graph-label-small">CV</text>

                  <circle cx="220" cy="50" r="20" className="graph-node graph-node-related" />
                  <text x="220" y="55" className="graph-label-small">NLP</text>

                  <circle cx="80" cy="150" r="18" className="graph-node graph-node-post" />
                  <text x="80" y="154" className="graph-label-small">Post</text>

                  <circle cx="220" cy="150" r="18" className="graph-node graph-node-post" />
                  <text x="220" y="154" className="graph-label-small">Post</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="section-container">
          <h2 className="section-title">Ever Feel Lost in the Internet?</h2>
          <p className="section-subtitle">
            Traditional platforms leave you wandering without a map
          </p>

          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🌀</div>
              <h3>Topics Feel Disconnected</h3>
              <p>You browse content but miss the bigger picture of how topics relate</p>
            </div>

            <div className="problem-card">
              <div className="problem-icon">📍</div>
              <h3>No Sense of Location</h3>
              <p>WHERE are you in the knowledge space? It's unclear and disorienting</p>
            </div>

            <div className="problem-card">
              <div className="problem-icon">🔗</div>
              <h3>Hidden Connections</h3>
              <p>Related topics exist but you never discover them on your own</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-section">
        <div className="section-container">
          <h2 className="section-title">Navigate & Discover</h2>
          <p className="section-subtitle">
            Two complementary ways to explore knowledge
          </p>

          <div className="solution-grid">
            {/* Hierarchical Navigation */}
            <div className="solution-feature">
              <div className="feature-visual">
                <div className="breadcrumb-demo">
                  <span className="breadcrumb-item">Home</span>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item">Technology</span>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item">Machine Learning</span>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item active">Neural Networks</span>
                </div>
                <div className="category-tree-demo">
                  <div className="tree-demo-item expanded">
                    <span className="tree-toggle">▼</span> Technology
                  </div>
                  <div className="tree-demo-item expanded indented">
                    <span className="tree-toggle">▼</span> Machine Learning
                  </div>
                  <div className="tree-demo-item indented-2">
                    <span className="tree-bullet">•</span> Neural Networks
                  </div>
                  <div className="tree-demo-item indented-2">
                    <span className="tree-bullet">•</span> Computer Vision
                  </div>
                  <div className="tree-demo-item indented">
                    <span className="tree-toggle">▶</span> Electric Vehicles
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <h3>🗂️ Browse Systematically</h3>
                <p>
                  Navigate through deep category hierarchies like you browse folders.
                  Always know exactly WHERE you are with breadcrumb trails.
                </p>
                <ul className="feature-list">
                  <li>✓ Clear hierarchical structure</li>
                  <li>✓ Always visible breadcrumbs</li>
                  <li>✓ Drill down to any depth</li>
                </ul>
              </div>
            </div>

            {/* Graph Discovery */}
            <div className="solution-feature reverse">
              <div className="feature-content">
                <h3>🕸️ Discover with AI</h3>
                <p>
                  Visualize connections between topics using AI-powered semantic analysis.
                  Explore unexpected relationships and discover new interests.
                </p>
                <ul className="feature-list">
                  <li>✓ AI-powered connections</li>
                  <li>✓ Visual knowledge maps</li>
                  <li>✓ Explained similarities</li>
                </ul>
              </div>
              <div className="feature-visual">
                <div className="graph-feature-demo">
                  <div className="mini-graph">
                    <div className="mini-node center">Neural Nets</div>
                    <div className="mini-node top-left">Computer Vision</div>
                    <div className="mini-node top-right">NLP</div>
                    <div className="connection-label">85% similar</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="screenshots-section">
        <div className="section-container">
          <h2 className="section-title">See It In Action</h2>

          <div className="screenshots-grid">
            <div className="screenshot-card">
              <div className="screenshot-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">📝</div>
                  <p>Feed with Breadcrumbs</p>
                </div>
              </div>
              <h4>Browse Posts with Context</h4>
              <p>Every post shows its place in the hierarchy</p>
            </div>

            <div className="screenshot-card">
              <div className="screenshot-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🕸️</div>
                  <p>Knowledge Graph</p>
                </div>
              </div>
              <h4>Explore Connections</h4>
              <p>Interactive graph reveals relationships</p>
            </div>

            <div className="screenshot-card">
              <div className="screenshot-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🎯</div>
                  <p>Category Page</p>
                </div>
              </div>
              <h4>Topic Deep Dives</h4>
              <p>See everything related to a category</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Explore Knowledge Differently?</h2>
          <p className="cta-subtitle">
            Join curious learners discovering how topics connect
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-cta btn-large">
              Create Free Account →
            </Link>
          </div>
          <p className="cta-note">Free forever. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>TopicsLoop</h3>
            <p>Where Knowledge Connects</p>
          </div>
          <div className="footer-links">
            <Link to="/categories">Browse Categories</Link>
            <Link to="/visualizations">Knowledge Map</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 TopicsLoop. Built with AI transparency in mind.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
