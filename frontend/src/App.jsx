import { useState, useEffect } from "react";
import { apiRequest } from "./api";
import Login from "./Login";
import Signup from "./Signup";
import AddTrade from "./AddTrade";
import Dashboard from "./Dashboard";
import { Compass, Plus, LogOut, PieChart, Table2, MessageSquareText, ChevronDown } from "lucide-react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authView, setAuthView] = useState("login");
  const [activeView, setActiveView] = useState("overview");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const fetchTrades = () => {
    setLoading(true);
    apiRequest("/trades")
      .then((data) => {
        setTrades(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchTrades();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTrades([]);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this trade? This can't be undone.")) return;
    apiRequest(`/trades/${id}`, { method: "DELETE" })
      .then(() => fetchTrades())
      .catch((err) => setError(err.message));
  };

  const startEdit = (trade) => {
    setEditingId(trade.id);
    setExpandedId(null);
    setEditForm({
      ticker: trade.ticker,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price ?? "",
      size: trade.size,
      date: trade.date,
      direction: trade.direction,
      notes: trade.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id) => {
    apiRequest(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...editForm,
        entry_price: parseFloat(editForm.entry_price),
        exit_price: editForm.exit_price ? parseFloat(editForm.exit_price) : null,
        size: parseFloat(editForm.size),
      }),
    })
      .then(() => {
        setEditingId(null);
        fetchTrades();
      })
      .catch((err) => setError(err.message));
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!token) {
    if (authView === "signup") {
      return (
        <Signup
          onSignupSuccess={() => setToken(localStorage.getItem("token"))}
          switchToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <div>
        <Login onLoginSuccess={() => setToken(localStorage.getItem("token"))} />
        <div className="px-8 pb-8 text-center">
          <p className="text-[#7A8296]">
            Don't have an account?{" "}
            <button onClick={() => setAuthView("signup")} className="text-[#F0B429] hover:underline">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    );
  }

  const TradesTable = () => (
    <>
      <div className="rounded-xl border border-[#131720] bg-[#080B10] p-4 mb-4">
        <AddTrade onTradeAdded={fetchTrades} />
      </div>
      <h2 className="font-display text-lg font-semibold mb-3">Your Trades</h2>
      {trades.length === 0 ? (
        <p className="text-[#5C6478]">No trades yet.</p>
      ) : (
        <div className="rounded-xl border border-[#131720] bg-[#080B10] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[#4A5164] border-b border-[#131720]">
                <th className="px-4 py-2.5 font-medium">Ticker</th>
                <th className="px-4 py-2.5 font-medium">Direction</th>
                <th className="px-4 py-2.5 font-medium">Entry</th>
                <th className="px-4 py-2.5 font-medium">Exit</th>
                <th className="px-4 py-2.5 font-medium">Size</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) =>
                editingId === trade.id ? (
                  <tr key={trade.id} className="border-b border-[#0E1218] last:border-0">
                    <td className="px-2 py-2"><input className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 w-20 text-sm" value={editForm.ticker} onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value })} /></td>
                    <td className="px-2 py-2">
                      <select className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 text-sm" value={editForm.direction} onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })}>
                        <option value="Long">Long</option>
                        <option value="Short">Short</option>
                      </select>
                    </td>
                    <td className="px-2 py-2"><input className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 w-20 text-sm" type="number" step="0.01" value={editForm.entry_price} onChange={(e) => setEditForm({ ...editForm, entry_price: e.target.value })} /></td>
                    <td className="px-2 py-2"><input className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 w-20 text-sm" type="number" step="0.01" value={editForm.exit_price} onChange={(e) => setEditForm({ ...editForm, exit_price: e.target.value })} /></td>
                    <td className="px-2 py-2"><input className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 w-16 text-sm" type="number" step="0.01" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} /></td>
                    <td className="px-2 py-2"><input className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 text-sm" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input className="bg-[#0B0E14] border border-[#232A38] rounded px-2 py-1 text-sm w-32 mr-1" placeholder="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                      <button onClick={() => saveEdit(trade.id)} className="text-xs bg-[#F0B429] text-[#05070B] px-2 py-1 rounded mr-1">Save</button>
                      <button onClick={cancelEdit} className="text-xs border border-[#232A38] px-2 py-1 rounded">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr
                      key={trade.id}
                      onClick={() => toggleExpand(trade.id)}
                      className="border-b border-[#0E1218] last:border-0 hover:bg-[#0C0F16] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-2.5 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          {trade.ticker}
                          {trade.notes && <MessageSquareText size={11} className="text-[#F0B429]" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center text-[11px] px-1.5 py-0.5 rounded ${trade.direction === "Long" ? "bg-[#0A1B14] text-[#3DD68C]" : "bg-[#211013] text-[#FF6B6B]"}`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#8B93A6]">${trade.entry_price}</td>
                      <td className="px-4 py-2.5 font-mono text-[#8B93A6]">{trade.exit_price ? `$${trade.exit_price}` : "Open"}</td>
                      <td className="px-4 py-2.5 font-mono text-[#8B93A6]">{trade.size}</td>
                      <td className="px-4 py-2.5 text-[#7A8296]">{trade.date}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => startEdit(trade)} className="text-xs text-[#8B93A6] hover:text-[#DDE1E8] mr-3">Edit</button>
                        <button onClick={() => handleDelete(trade.id)} className="text-xs text-[#FF6B6B] hover:underline">Delete</button>
                        <ChevronDown size={12} className={`inline ml-2 text-[#4A5164] transition-transform ${expandedId === trade.id ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    {expandedId === trade.id && (
                      <tr key={`${trade.id}-notes`} className="border-b border-[#0E1218] last:border-0 bg-[#0A0D12]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-start gap-2 text-sm text-[#B4BACA]">
                            <MessageSquareText size={13} className="text-[#F0B429] mt-0.5 shrink-0" />
                            <span>{trade.notes ? trade.notes : <span className="text-[#4A5164] italic">No notes for this trade.</span>}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen w-full bg-[#05070B] text-[#DDE1E8] font-sans flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <aside className="hidden md:flex w-60 flex-col border-r border-[#131720] bg-[#070A0F] px-4 py-5 shrink-0">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B429] to-[#C98A12] flex items-center justify-center">
            <Compass size={16} className="text-[#05070B]" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-[15px] tracking-tight">NavTrade</span>
        </div>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveView("overview")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${activeView === "overview" ? "bg-[#12161F] text-[#F0B429] font-medium" : "text-[#7A8296] hover:text-[#B4BACA] hover:bg-[#0C0F16]"}`}
          >
            <PieChart size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveView("trades")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${activeView === "trades" ? "bg-[#12161F] text-[#F0B429] font-medium" : "text-[#7A8296] hover:text-[#B4BACA] hover:bg-[#0C0F16]"}`}
          >
            <Table2 size={16} />
            Trades
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <button
            onClick={() => setActiveView("trades")}
            className="flex items-center gap-2 justify-center bg-[#F0B429] hover:bg-[#E0A61E] text-[#05070B] font-medium text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add Trade
          </button>
          <div className="pt-3 mt-1 border-t border-[#131720]">
            <button onClick={handleLogout} className="flex items-center gap-2 justify-center w-full text-sm text-[#7A8296] hover:text-[#DDE1E8] px-3 py-2 rounded-lg transition-colors">
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-6 md:px-8 py-6">
        {loading ? (
          <p className="text-[#5C6478]">Loading trades...</p>
        ) : error ? (
          <p className="text-[#FF6B6B]">Error: {error}</p>
        ) : activeView === "overview" ? (
          <Dashboard trades={trades} />
        ) : (
          <TradesTable />
        )}
      </main>
    </div>
  );
}

export default App;
