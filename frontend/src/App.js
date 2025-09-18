import './App.css';
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import PostList from "./components/PostList";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";
import Profile from "./components/Profile";

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp < Date.now() / 1000;

          if (!isExpired) {
            setIsAuthenticated(true);
            setUserInfo({
              email: payload.email,
              username: payload.username,
              user_id: payload.user_id
            });
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error parsing token:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  return (
    <div>
      <h1>Welcome to TopicsLoop</h1>
      {isAuthenticated && userInfo && (
        <p>Hello, {userInfo.username}! ({userInfo.email})</p>
      )}
      <nav style={{ margin: '20px 0' }}>
        <a href="/posts" style={{ marginRight: '20px' }}>View Posts</a>
        {isAuthenticated ? (
          <>
            <a href="/create" style={{ marginRight: '20px' }}>Create Post</a>
            <a href="/profile" style={{ marginRight: '20px' }}>My Profile</a>
            <button
              onClick={handleLogout}
              style={{
                marginRight: '20px',
                padding: '5px 10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" style={{ marginRight: '20px' }}>Login</a>
            <a href="/register">Register</a>
          </>
        )}
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/posts" element={<PostList />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/edit/:id" element={
          <div>
            <h1>EDIT ROUTE WORKS</h1>
            <EditPost />
          </div>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;