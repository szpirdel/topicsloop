import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    try {
      const response = await axios.post("http://localhost:8000/api/token/", {
        email: email,
        password: password,
      });
      
      // Use context login method
      login(response.data.access, response.data.refresh);

      console.log("Login successful:", response.data);
      navigate("/"); // Redirect to home page
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data) {
        setError(error.response.data.detail || "Login failed");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="content-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-title text-center">Welcome Back</div>
          <div className="card-content">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email:</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password:</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="card mb-3" style={{ backgroundColor: '#fdf2f2', borderColor: '#fecaca', color: '#dc3545', padding: '0.75rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Log in
              </button>
            </form>

            <div className="text-center mt-3">
              <span style={{ color: '#6c757d' }}>Don't have an account? </span>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
