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
import LandingPage from "./components/LandingPage";
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
  const location = window.location;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavLinkStyle = (path) => ({
    ...navLinkStyle,
    borderBottom: location.pathname === path ? '2px solid #667eea' : '2px solid transparent',
    color: location.pathname === path ? '#667eea' : '#6c757d',
    fontWeight: location.pathname === path ? '600' : '500'
  });

  return (
    <nav style={{
      backgroundColor: 'white',
      padding: '0.75rem 2rem',
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
        {/* Logo on the left */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none'
          }}
        >
          <img
            src="/logo.png"
            alt="LookBeyond.io Logo"
            style={{
              height: '40px',
              width: 'auto'
            }}
          />
          <span style={{
            color: '#667eea',
            fontSize: '1.25rem',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            LookBeyond.io
          </span>
        </Link>

        {/* All navigation links on the right with tighter spacing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* My LookBeyond only for authenticated users */}
          {isAuthenticated && (
            <Link to="/posts" style={getNavLinkStyle('/posts')}>My LookBeyond</Link>
          )}

          {/* Browse Systematically always visible */}
          <Link to="/categories" style={getNavLinkStyle('/categories')}>Browse Systematically</Link>

          {/* Browse on Graph always visible */}
          <Link to="/visualizations" style={getNavLinkStyle('/visualizations')}>Browse on Graph</Link>

          {isAuthenticated ? (
            <>
              <Link to="/create" style={getNavLinkStyle('/create')}>Create Post</Link>
              <Link to="/profile" style={getNavLinkStyle('/profile')}>Edit Profile</Link>
              <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                {userInfo?.username}
              </span>
              <button
                onClick={handleLogout}
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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to Posts (My TopicsLoop)
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/posts');
    }
  }, [isAuthenticated, navigate]);

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Return null while redirecting authenticated users
  return null;
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
const Layout = ({ children, showNav = true }) => {
  return (
    <>
      {showNav && <Navigation />}
      <main style={{ minHeight: showNav ? 'calc(100vh - 120px)' : '100vh' }}>
        {children}
      </main>
    </>
  );
};

// Home Layout - hides nav for non-authenticated users on landing page
const HomeLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return <Layout showNav={isAuthenticated}>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={
          <HomeLayout>
            <HomePage />
          </HomeLayout>
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