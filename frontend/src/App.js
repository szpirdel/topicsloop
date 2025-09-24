import './App.css';
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import PostList from "./components/PostList";
import PostDetail from "./components/PostDetail";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";
import Profile from "./components/Profile";
import Visualization from "./components/Visualization";
import Categories from "./components/Categories";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Shared Search Component (for reuse on different pages)
const SearchComponent = ({ placeholder = "Search posts...", className = "" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={`search-container ${className}`} style={{
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'center',
      width: '100%'
    }}>
      <form onSubmit={handleSearch} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '500px',
        width: '100%'
      }}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            flex: 1,
            outline: 'none',
            transition: 'border-color 0.2s ease',
            ':focus': {
              borderColor: '#007bff'
            }
          }}
          onFocus={(e) => e.target.style.borderColor = '#007bff'}
          onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
        />
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          🔍 Search
        </button>
      </form>
    </div>
  );
};

// Navigation Component (without search bar)
const Navigation = () => {
  const { isAuthenticated, userInfo, logout } = useAuth();

  return (
    <nav style={{
      backgroundColor: 'white',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e9ecef'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link
          to="/"
          style={{
            color: '#2c3e50',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          TopicsLoop
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Categories always visible */}
          <Link to="/categories" style={navLinkStyle}>Categories</Link>

          {/* Posts only for authenticated users */}
          {isAuthenticated && (
            <Link to="/posts" style={navLinkStyle}>Posts</Link>
          )}

          {/* Knowledge Map always visible */}
          <Link to="/visualizations" style={navLinkStyle}>Knowledge Map</Link>

          {isAuthenticated ? (
            <>
              <Link to="/create" style={navLinkStyle}>Create Post</Link>
              <Link to="/profile" style={navLinkStyle}>Profile</Link>
              <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                {userInfo?.username}
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={navLinkStyle}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const navLinkStyle = {
  color: '#6c757d',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  transition: 'all 0.3s',
  fontWeight: '500'
};

const HomePage = () => {
  const { isAuthenticated, userInfo } = useAuth();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {/* Call-to-Action Section for non-authenticated users */}
      {!isAuthenticated && (
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px solid #e9ecef'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '2rem' }}>
            Join TopicsLoop Today
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Experience the future of content discovery and knowledge sharing
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Get Started
            </Link>
            <Link
              to="/login"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'transparent',
                color: '#007bff',
                textDecoration: 'none',
                borderRadius: '5px',
                border: '2px solid #007bff',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#007bff';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#007bff';
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}


      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2.2rem',
          marginBottom: '0.5rem',
          fontWeight: '600'
        }}>
          AI-Powered Knowledge Discovery Platform
        </h1>
        <p style={{
          fontSize: '1.1rem',
          marginBottom: isAuthenticated ? '0.5rem' : '0',
          opacity: 0.95
        }}>
          Explore connections, discover insights, share knowledge
        </p>
        {isAuthenticated && userInfo && (
          <p style={{ fontSize: '1rem', opacity: 0.9, marginTop: '0.5rem' }}>
            Hello, <strong>{userInfo.username}</strong>! Ready to explore?
          </p>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        <FeatureCard
          title="📚 Browse Posts"
          description="Explore diverse content across multiple categories with AI-powered semantic analysis"
          link="/posts"
        />
        <FeatureCard
          title="🕸️ Knowledge Map"
          description="Visualize connections between topics using advanced graph neural networks"
          link="/visualizations"
        />
        {isAuthenticated && (
          <FeatureCard
            title="✍️ Create Content"
            description="Share your knowledge and let AI automatically suggest relevant categories"
            link="/create"
          />
        )}
      </div>

    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ title, description, link }) => {
  return (
    <Link
      to={link}
      style={{
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
        border: '1px solid #e9ecef'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
      >
        <h3 style={{
          color: '#2c3e50',
          marginBottom: '1rem',
          fontSize: '1.3rem'
        }}>
          {title}
        </h3>
        <p style={{
          color: '#6c757d',
          lineHeight: '1.6'
        }}>
          {description}
        </p>
      </div>
    </Link>
  );
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <>
      <Navigation />
      <main style={{ minHeight: 'calc(100vh - 120px)' }}>
        {children}
      </main>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        <Route path="/login" element={
          <Layout>
            <Login />
          </Layout>
        } />
        <Route path="/register" element={
          <Layout>
            <Register />
          </Layout>
        } />
        <Route path="/posts" element={
          <Layout>
            <PostList />
          </Layout>
        } />
        <Route path="/posts/:id" element={
          <Layout>
            <PostDetail />
          </Layout>
        } />
        <Route path="/create" element={
          <Layout>
            <CreatePost />
          </Layout>
        } />
        <Route path="/edit/:id" element={
          <Layout>
            <EditPost />
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout>
            <Profile />
          </Layout>
        } />
        <Route path="/visualizations" element={
          <Layout>
            <Visualization />
          </Layout>
        } />
        <Route path="/categories" element={
          <Layout>
            <Categories />
          </Layout>
        } />
      </Routes>
    </Router>
    </AuthProvider>
  );
};

export default App;