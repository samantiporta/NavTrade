import { useState } from "react";
import { Compass } from "lucide-react";
import { apiRequest } from "./api";

function Login({ onLoginSuccess, switchToSignup }) {
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
    <div className="min-h-screen w-full bg-[#05070B] text-[#DDE1E8] font-sans flex items-center justify-center px-6 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#F0B429]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F0B429] to-[#C98A12] flex items-center justify-center">
            <Compass size={24} className="text-[#05070B]" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-3xl">NavTrade</span>
        </div>

        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-8 shadow-2xl shadow-black/40">
          <h1 className="font-display text-2xl font-semibold mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-[#7A8296] mb-6">Sign in to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-[#7A8296] mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#F0B429]"
              />
            </div>
            <div>
              <label className="text-sm text-[#7A8296] mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#F0B429]"
              />
            </div>

            {error && <p className="text-[#FF6B6B] text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F0B429] hover:bg-[#E0A61E] text-[#05070B] font-medium text-base py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {switchToSignup && (
            <p className="text-center text-sm text-[#7A8296] mt-6">
              Don't have an account?{" "}
              <button
                onClick={switchToSignup}
                className="text-[#F0B429] hover:text-[#E0A61E] font-medium"
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
