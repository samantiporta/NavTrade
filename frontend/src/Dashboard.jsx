import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";
import { TrendingUp, Target, Layers, Trophy, TrendingDown, Wallet, Flame, Activity } from "lucide-react";
import { apiRequest } from "./api";

const STARTING_BALANCE = 10000;

function calculateTradePnl(trade) {
  if (trade.exit_price === null || trade.exit_price === undefined) return 0;
  if (trade.direction === "Long") {
    return (trade.exit_price - trade.entry_price) * trade.size;
  }
  return (trade.entry_price - trade.exit_price) * trade.size;
}

function buildEquityCurve(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = STARTING_BALANCE;
  return sorted.map((trade) => {
    running += calculateTradePnl(trade);
    return { date: trade.date, equity: Math.round(running * 100) / 100 };
  });
}

function buildSymbolBreakdown(trades) {
  const map = {};
  trades.forEach((t) => {
    const pnl = calculateTradePnl(t);
    if (pnl === 0) return;
    if (!map[t.ticker]) map[t.ticker] = 0;
    map[t.ticker] += pnl;
  });
  return Object.entries(map)
    .map(([symbol, pnl]) => ({ symbol, pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => b.pnl - a.pnl);
}

function computeDrawdown(equityCurve) {
  let peak = STARTING_BALANCE;
  let maxDD = 0;
  equityCurve.forEach((p) => {
    if (p.equity > peak) peak = p.equity;
    const dd = peak - p.equity;
    if (dd > maxDD) maxDD = dd;
  });
  return { maxDD: Math.round(maxDD * 100) / 100, peak: Math.round(peak * 100) / 100 };
}

function computeStreak(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const results = sorted.map((t) => calculateTradePnl(t)).filter((p) => p !== 0).map((p) => (p > 0 ? 1 : -1));

  if (results.length === 0) return { current: 0, type: null, bestWin: 0, bestLoss: 0 };

  let current = 1;
  const lastType = results[results.length - 1];
  for (let i = results.length - 2; i >= 0; i--) {
    if (results[i] === lastType) current++;
    else break;
  }

  let bestWin = 0, bestLoss = 0, run = 1;
  if (results[0] === 1) bestWin = 1; else bestLoss = 1;
  for (let i = 1; i < results.length; i++) {
    run = results[i] === results[i - 1] ? run + 1 : 1;
    if (results[i] === 1) bestWin = Math.max(bestWin, run);
    else bestLoss = Math.max(bestLoss, run);
  }

  return { current, type: lastType, bestWin, bestLoss };
}

function MiniTooltip({ active, payload, label, prefix = "$" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[#1E2430] bg-[#0B0E14] px-2.5 py-1.5 shadow-xl">
      <div className="text-[9px] uppercase tracking-wider text-[#5C6478] mb-0.5">{label}</div>
      <div className="font-mono text-xs text-[#E8EAF0]">{prefix}{payload[0].value.toLocaleString()}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, positive }) {
  const color = positive === undefined ? "text-[#DDE1E8]" : positive ? "text-[#3DD68C]" : "text-[#FF6B6B]";
  return (
    <div className="rounded-xl border border-[#131720] bg-[#080B10] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-[#5C6478]">{label}</span>
        {Icon && <Icon size={14} className="text-[#F0B429]" />}
      </div>
      <div className={`font-mono text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Dashboard({ trades }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest("/stats")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [trades]);

  if (error) return <p className="text-[#FF6B6B]">Error loading stats: {error}</p>;
  if (!stats) return <p className="text-[#5C6478]">Loading stats...</p>;

  const equityData = buildEquityCurve(trades);
  const symbolData = buildSymbolBreakdown(trades);
  const { maxDD, peak } = computeDrawdown(equityData);
  const streak = computeStreak(trades);
  const currentBalance = Math.round((STARTING_BALANCE + stats.total_pnl) * 100) / 100;
  const maxAbsSymbol = Math.max(1, ...symbolData.map((d) => Math.abs(d.pnl)));
  const profitFactor = stats.avg_loss !== 0
    ? Math.abs((stats.avg_win * stats.wins) / (stats.avg_loss * stats.losses || 1)).toFixed(2)
    : "—";

  return (
    <div className="w-full">
      <h2 className="font-display text-lg font-semibold mb-4">Dashboard</h2>

      {/* Top stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard icon={TrendingUp} label="Total P&L" value={`$${stats.total_pnl}`} positive={stats.total_pnl >= 0} />
        <StatCard icon={Target} label="Win Rate" value={`${stats.win_rate}%`} positive={stats.win_rate >= 50} />
        <StatCard icon={Layers} label="Total Trades" value={stats.total_trades} />
        <StatCard icon={Trophy} label="Best Trade" value={`$${stats.best_trade}`} positive={stats.best_trade >= 0} />
        <StatCard icon={TrendingDown} label="Worst Trade" value={`$${stats.worst_trade}`} positive={stats.worst_trade >= 0} />
      </div>

      {/* Equity chart + Risk & Capital */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3 mb-4">
        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-5">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-xs text-[#5C6478] mb-1">Account Balance</div>
              <div className="font-mono text-2xl font-semibold">${currentBalance.toLocaleString()}</div>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${stats.total_pnl >= 0 ? "bg-[#0A1B14] text-[#3DD68C]" : "bg-[#211013] text-[#FF6B6B]"}`}>
              {stats.total_pnl >= 0 ? "+" : ""}{((stats.total_pnl / STARTING_BALANCE) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="dashEq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0B429" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#F0B429" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#4A5164", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5164", fontSize: 10 }} axisLine={false} tickLine={false} width={55} domain={["dataMin - 50", "dataMax + 50"]} />
                <Tooltip content={<MiniTooltip />} />
                <Area type="monotone" dataKey="equity" stroke="#F0B429" strokeWidth={2} fill="url(#dashEq)" dot={false} activeDot={{ r: 4, fill: "#F0B429", stroke: "#05070B", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={14} className="text-[#F0B429]" />
            <span className="text-sm font-medium text-[#B4BACA]">Risk & Capital</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Starting Balance", value: `$${STARTING_BALANCE.toLocaleString()}` },
              { label: "Current Balance", value: `$${currentBalance.toLocaleString()}` },
              { label: "Highest Balance", value: `$${peak.toLocaleString()}` },
              { label: "Max Drawdown", value: `$${maxDD.toLocaleString()}`, negative: maxDD > 0 },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-[#7A8296]">{s.label}</span>
                <span className={`font-mono ${s.negative ? "text-[#FF6B6B]" : "text-[#DDE1E8]"}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics + Symbol + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-[#F0B429]" />
            <span className="text-sm font-medium text-[#B4BACA]">Statistics</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Profit Factor", value: profitFactor },
              { label: "Avg Win", value: `$${stats.avg_win}` },
              { label: "Avg Loss", value: `$${stats.avg_loss}` },
              { label: "Wins / Losses", value: `${stats.wins} / ${stats.losses}` },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-[#7A8296]">{s.label}</span>
                <span className="font-mono text-[#DDE1E8]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-4">
          <div className="text-sm font-medium text-[#B4BACA] mb-3">P&L by Symbol</div>
          {symbolData.length === 0 ? (
            <p className="text-xs text-[#5C6478]">No closed trades yet.</p>
          ) : (
            <div style={{ height: Math.max(120, symbolData.length * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolData} layout="vertical" margin={{ left: 4, right: 44 }}>
                  <XAxis type="number" domain={[-maxAbsSymbol, maxAbsSymbol]} hide />
                  <YAxis type="category" dataKey="symbol" tick={{ fill: "#8B93A6", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<MiniTooltip />} cursor={{ fill: "#0F131A" }} />
                  <Bar dataKey="pnl" radius={[3, 3, 3, 3]}>
                    {symbolData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#3DD68C" : "#FF6B6B"} />)}
                    <LabelList dataKey="pnl" position="right" formatter={(v) => `${v >= 0 ? "+" : ""}${v}`} fill="#8B93A6" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-[#F0B429]" />
            <span className="text-sm font-medium text-[#B4BACA]">Streak</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-2xl font-semibold">{streak.current}</span>
            <span className={`text-sm ${streak.type === 1 ? "text-[#3DD68C]" : streak.type === -1 ? "text-[#FF6B6B]" : "text-[#7A8296]"}`}>
              {streak.type === 1 ? "wins in a row" : streak.type === -1 ? "losses in a row" : "trades logged"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-[#0A1B14] text-[#3DD68C]">Best streak {streak.bestWin}</span>
            <span className="px-2 py-0.5 rounded-md bg-[#211013] text-[#FF6B6B]">Worst streak {streak.bestLoss}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
