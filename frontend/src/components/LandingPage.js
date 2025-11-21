import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Landing Page Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          {/* Logo on the left */}
          <div className="nav-logo">
            <img
              src="/logo.png"
              alt="LookBeyond.io Logo"
              style={{
                height: '64px',
                width: 'auto'
              }}
            />
            <span className="nav-logo-text">LookBeyond.io</span>
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
              <span className="hero-subtitle">Beyond Apps' Mindless Scrolling
              </span>
            </h1>
            <p className="hero-description">
              Navigate topics like you browse folders. Discover connections like you explore maps.
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
      </section>

      {/* Screenshots Section */}
      <section className="screenshots-section">
        <div className="section-container">
          <h2 className="section-title">Beyond Algorithmic Paths</h2>

          <div className="screenshots-grid">
            <div className="screenshot-card">
              <div className="screenshot-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">📝</div>
                  <p>Feed with Breadcrumbs</p>
                </div>
              </div>
              <h4>Find Everything Info Thanks to Clear Structure</h4>
              <p>Don't get lost in the meanders of information, treat the platform structure as a map/guide</p>
            </div>

            <div className="screenshot-card">
              <div className="screenshot-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🕸️</div>
                  <p>Knowledge Graph</p>
                </div>
              </div>
              <h4>Find Non-Obvious Connections on Your Own or with AI</h4>
              <p>Rediscover knowledge, from how-to videos to quantum mechanics.</p>
            </div>

            <div className="screenshot-card">
              <div className="screenshot-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🎯</div>
                  <p>Category Page</p>
                </div>
              </div>
              <h4>Browse Topics Deeper and Deeper</h4>
              <p>Operate on many levels of detail, immerse yourself in the depths of structured content</p>
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
            <h3>LookBeyond.io</h3>
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
          <p>&copy; 2025 LookBeyond.io. Built with AI transparency in mind.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
