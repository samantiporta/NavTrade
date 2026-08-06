import { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import { apiRequest } from "./api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [startingBalance, setStartingBalance] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/users/me"), apiRequest("/stats")])
      .then(([profileData, statsData]) => {
        setProfile(profileData);
        setStartingBalance(profileData.starting_balance);
        setDisplayName(profileData.display_name || "");
        setBio(profileData.bio || "");
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    apiRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify({
        starting_balance: parseFloat(startingBalance),
        display_name: displayName || null,
        bio: bio || null,
      }),
    })
      .then((data) => {
        setProfile(data);
        setSuccess(true);
      })
      .catch((err) => setError(err.message));
  };

  if (loading) return <p className="text-[#5C6478]">Loading profile...</p>;

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-display text-2xl font-semibold mb-6">Profile</h2>

      <div className="rounded-xl border border-[#131720] bg-[#080B10] p-8 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#12161F] border border-[#1A2028] flex items-center justify-center">
            <User size={40} className="text-[#F0B429]" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#DDE1E8]">
              {profile?.display_name || profile?.email}
            </div>
            {profile?.display_name && (
              <div className="text-base text-[#5C6478]">{profile.email}</div>
            )}
            <div className="text-sm text-[#5C6478] mt-2">
              Account ID: {profile?.id}
              {joinedDate && <> · Joined {joinedDate}</>}
            </div>
          </div>
        </div>

        {profile?.bio && (
          <p className="text-base text-[#7A8296] mt-6">{profile.bio}</p>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl border border-[#131720] bg-[#080B10] p-6">
            <div className="text-sm text-[#5C6478] mb-2">Total Trades</div>
            <div className="text-3xl font-semibold text-[#DDE1E8]">
              {stats.total_trades}
            </div>
          </div>
          <div className="rounded-xl border border-[#131720] bg-[#080B10] p-6">
            <div className="text-sm text-[#5C6478] mb-2">Win Rate</div>
            <div className="text-3xl font-semibold text-[#DDE1E8]">
              {stats.win_rate.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-xl border border-[#131720] bg-[#080B10] p-6">
            <div className="text-sm text-[#5C6478] mb-2">Total P&L</div>
            <div
              className={`text-3xl font-semibold ${
                stats.total_pnl >= 0 ? "text-[#3DD68C]" : "text-[#FF6B6B]"
              }`}
            >
              {stats.total_pnl >= 0 ? "+" : ""}
              {stats.total_pnl.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#131720] bg-[#080B10] p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-sm text-[#7A8296] mb-2 block">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile?.email}
              className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#F0B429]"
            />
          </div>

          <div>
            <label className="text-sm text-[#7A8296] mb-2 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Add a short bio to introduce your trading style."
              className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#F0B429] resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-[#7A8296] mb-2 block">
              Starting Balance
            </label>
            <p className="text-sm text-[#5C6478] mb-3">
              Used to calculate your account balance, drawdown, and gain %
              on the dashboard.
            </p>
            <input
              type="number"
              step="0.01"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232A38] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#F0B429]"
            />
          </div>

          {error && <p className="text-[#FF6B6B] text-sm">{error}</p>}
          {success && (
            <p className="text-[#3DD68C] text-sm">Saved successfully.</p>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 bg-[#F0B429] hover:bg-[#E0A61E] text-[#05070B] font-medium text-base px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={16} strokeWidth={2.5} />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
