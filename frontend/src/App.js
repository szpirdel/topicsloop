import './App.css';
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import PostList from "./components/PostList";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";
import Profile from "./components/Profile";
import Visualization from "./components/Visualization";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Navigation Component
const Navigation = () => {
  const { isAuthenticated, userInfo, logout } = useAuth();
  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
            color: '#ecf0f1',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          TopicsLoop
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/posts" style={navLinkStyle}>Posts</Link>
          <Link to="/visualizations" style={navLinkStyle}>Knowledge Map</Link>

          {isAuthenticated ? (
            <>
              <Link to="/create" style={navLinkStyle}>Create Post</Link>
              <Link to="/profile" style={navLinkStyle}>Profile</Link>
              <span style={{ color: '#ecf0f1', fontSize: '0.9rem' }}>
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
  color: '#ecf0f1',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.3s',
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
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        borderRadius: '10px',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Welcome to TopicsLoop
        </h1>
        <p style={{
          fontSize: '1.3rem',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          AI-Powered Knowledge Discovery Platform
        </p>
        {isAuthenticated && userInfo && (
          <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>
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

      {!isAuthenticated && (
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            Join TopicsLoop Today
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
            Experience the future of content discovery and knowledge sharing
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/register"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
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
                border: '2px solid #007bff'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
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
      </Routes>
    </Router>
    </AuthProvider>
  );
};

export default App;