import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/auth/users/", {
        email: email,
        username: username,
        password: password,
        re_password: passwordConfirm,
      });

      console.log("Registration successful:", response.data);
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data) {
        // Handle different types of errors
        const errorData = error.response.data;
        if (errorData.email) {
          setError(`Email: ${errorData.email[0]}`);
        } else if (errorData.username) {
          setError(`Username: ${errorData.username[0]}`);
        } else if (errorData.password) {
          setError(`Password: ${errorData.password[0]}`);
        } else if (errorData.non_field_errors) {
          setError(errorData.non_field_errors[0]);
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="content-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-title text-center">Create Account</div>
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
                <label className="form-label">Username:</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a username"
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
                  placeholder="Create a password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password:</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              {error && (
                <div className="card mb-3" style={{ backgroundColor: '#fdf2f2', borderColor: '#fecaca', color: '#dc3545', padding: '0.75rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                Create Account
              </button>
            </form>

            <div className="text-center mt-3">
              <span style={{ color: '#6c757d' }}>Already have an account? </span>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
