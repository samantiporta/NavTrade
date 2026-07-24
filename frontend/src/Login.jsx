import { useState } from "react";
import { Compass } from "lucide-react";
import { apiRequest } from "./api";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
      .then((data) => {
        localStorage.setItem("token", data.access_token);
        onLoginSuccess();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-full bg-[#05070B] text-[#DDE1E8] font-sans flex items-center justify-center px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F0B429] to-[#C98A12] flex items-center justify-center">
            <Compass size={18} className="text-[#05070B]" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-xl">NavTrade</span>
        </div>
        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-6">
          <h1 className="font-display text-lg font-semibold mb-5">Log In</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#7A8296] mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F0B429]"
              />
            </div>
            <div>
              <label className="text-xs text-[#7A8296] mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F0B429]"
              />
            </div>
            {error && <p className="text-[#FF6B6B] text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F0B429] hover:bg-[#E0A61E] text-[#05070B] font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
