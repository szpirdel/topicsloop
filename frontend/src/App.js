import './App.css';
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import PostList from "./components/PostList";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";

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

        <Route path="/" element={
          <div>
            <h1>Welcome to TopicsLoop</h1>
            <nav style={{ margin: '20px 0' }}>
              <a href="/posts" style={{ marginRight: '20px' }}>View Posts</a>
              <a href="/create" style={{ marginRight: '20px' }}>Create Post</a>
              <a href="/login" style={{ marginRight: '20px' }}>Login</a>
              <a href="/register">Register</a>
            </nav>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;