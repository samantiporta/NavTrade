import { useState } from "react";
import { apiRequest } from "./api";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
      .then((data) => {
        localStorage.setItem("token", data.access_token);
        onLoginSuccess();
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>NavTrade Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "1rem" }}>
          Log In
        </button>
      </form>
    </div>
  );
}

export default Login;
