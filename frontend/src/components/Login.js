import React, { useState } from "react";
import axios from "axios";  // ✅ Poprawny import
import { useNavigate } from "react-router-dom";
// import api from "../api/axios"; // Importuj skonfigurowany axios

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const Login = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post("http://localhost:8000/api/token/", {
          email: "test@test.com",
          password: "test123",
        });
        console.log("Odpowiedź:", response.data);
      } catch (error) {
        console.error("Błąd:", error);
      }
    };

    return <form onSubmit={handleSubmit}>{<div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Log in</button>
      </form>
    </div>}</form>;
  };
};

export default Login;
