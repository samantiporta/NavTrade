import { useState } from "react";
import { apiRequest } from "./api";

function Signup({ onSignupSuccess, switchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
      .then(() => {
        return apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      })
      .then((data) => {
        localStorage.setItem("token", data.access_token);
        setLoading(false);
        onSignupSuccess();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>NavTrade Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label>Password</label>
          <br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "1rem" }} disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Already have an account?{" "}
        <button onClick={switchToLogin} style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}>
          Log In
        </button>
      </p>
    </div>
  );
}

export default Signup;
