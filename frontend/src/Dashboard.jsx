import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";
import { TrendingUp, Target, Layers, Trophy, TrendingDown, Wallet, Flame, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { apiRequest } from "./api";

function calculateTradePnl(trade) {
  if (trade.exit_price === null || trade.exit_price === undefined) return 0;
  if (trade.direction === "Long") {
    return (trade.exit_price - trade.entry_price) * trade.size;
  }
  return (trade.entry_price - trade.exit_price) * trade.size;
}

function buildEquityCurve(trades, startingBalance) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = startingBalance;
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

function computeDrawdown(equityCurve, startingBalance) {
  let peak = startingBalance;
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
        <span className="text-sm uppercase tracking-wider text-[#5C6478]">{label}</span>
        {Icon && <Icon size={14} className="text-[#F0B429]" />}
      </div>
      <div className={`font-mono text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Dashboard({ trades }) {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest("/stats")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [trades]);

  useEffect(() => {
    apiRequest("/users/me")
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-[#FF6B6B]">Error loading dashboard: {error}</p>;
  if (!stats || !profile) return <p className="text-[#5C6478]">Loading dashboard...</p>;

  const startingBalance = profile.starting_balance;
  const equityData = buildEquityCurve(trades, startingBalance);
  const symbolData = buildSymbolBreakdown(trades);
  const { maxDD, peak } = computeDrawdown(equityData, startingBalance);
  const streak = computeStreak(trades);
  const currentBalance = Math.round((startingBalance + stats.total_pnl) * 100) / 100;
  const maxAbsSymbol = Math.max(1, ...symbolData.map((d) => Math.abs(d.pnl)));
  const profitFactor = stats.avg_loss !== 0
    ? Math.abs((stats.avg_win * stats.wins) / (stats.avg_loss * stats.losses || 1)).toFixed(2)
    : "—";

  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="w-full">
      <h2 className="font-display text-xl font-semibold mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard icon={TrendingUp} label="Total P&L" value={`$${stats.total_pnl}`} positive={stats.total_pnl >= 0} />
        <StatCard icon={Target} label="Win Rate" value={`${stats.win_rate}%`} positive={stats.win_rate >= 50} />
        <StatCard icon={Layers} label="Total Trades" value={stats.total_trades} />
        <StatCard icon={Trophy} label="Best Trade" value={`$${stats.best_trade}`} positive={stats.best_trade >= 0} />
        <StatCard icon={TrendingDown} label="Worst Trade" value={`$${stats.worst_trade}`} positive={stats.worst_trade >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3 mb-4">
        <div className="rounded-xl border border-[#131720] bg-[#080B10] p-5">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-sm text-[#5C6478] mb-1">Account Balance</div>
              <div className="font-mono text-xl font-semibold">${currentBalance.toLocaleString()}</div>
            </div>
            <span className={`text-sm font-mono px-2 py-0.5 rounded ${stats.total_pnl >= 0 ? "bg-[#0A1B14] text-[#3DD68C]" : "bg-[#211013] text-[#FF6B6B]"}`}>
              {stats.total_pnl >= 0 ? "+" : ""}{startingBalance > 0 ? ((stats.total_pnl / startingBalance) * 100).toFixed(2) : "0.00"}%
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="dashEq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0B429" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#F0B429" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#4A5164", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5164", fontSize: 12 }} axisLine={false} tickLine={false} width={65} domain={["dataMin - 50", "dataMax + 50"]} />
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
              { label: "Starting Balance", value: `$${startingBalance.toLocaleString()}` },
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
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
              { label: "Long / Short", value: `${trades.filter((t) => t.direction === "Long").length} / ${trades.filter((t) => t.direction === "Short").length}` },
              { label: "Open Positions", value: trades.filter((t) => t.exit_price === null || t.exit_price === undefined).length },
              { label: "Total Volume", value: `$${Math.round(trades.reduce((sum, t) => sum + t.entry_price * t.size, 0)).toLocaleString()}` },
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
            <p className="text-sm text-[#5C6478]">No closed trades yet.</p>
          ) : (
            <div style={{ height: Math.max(120, symbolData.length * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolData} layout="vertical" margin={{ left: 4, right: 44 }}>
                  <XAxis type="number" domain={[-maxAbsSymbol, maxAbsSymbol]} hide />
                  <YAxis type="category" dataKey="symbol" tick={{ fill: "#8B93A6", fontSize: 13, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<MiniTooltip />} cursor={{ fill: "#0F131A" }} />
                  <Bar dataKey="pnl" radius={[3, 3, 3, 3]}>
                    {symbolData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#3DD68C" : "#FF6B6B"} />)}
                    <LabelList
                      dataKey="pnl"
                      content={({ x, y, width, height, value }) => {
                        const isPositive = value >= 0;
                        const labelX = isPositive ? x + width + 6 : x - 6;
                        return (
                          <text
                            x={labelX}
                            y={y + height / 2}
                            dy={4}
                            fontSize={13}
                            fill="#8B93A6"
                            textAnchor={isPositive ? "start" : "end"}
                          >
                            {isPositive ? "+" : ""}{value}
                          </text>
                        );
                      }}
                    />
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
            <span className="font-mono text-xl font-semibold">{streak.current}</span>
            <span className={`text-sm ${streak.type === 1 ? "text-[#3DD68C]" : streak.type === -1 ? "text-[#FF6B6B]" : "text-[#7A8296]"}`}>
              {streak.type === 1 ? "wins in a row" : streak.type === -1 ? "losses in a row" : "trades logged"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-md bg-[#0A1B14] text-[#3DD68C]">Best streak {streak.bestWin}</span>
            <span className="px-2 py-0.5 rounded-md bg-[#211013] text-[#FF6B6B]">Worst streak {streak.bestLoss}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#131720] bg-[#080B10] overflow-hidden">
        <div className="px-4 pt-3.5 pb-3">
          <span className="text-sm font-medium text-[#DDE1E8]">Recent Trades</span>
        </div>
        {recentTrades.length === 0 ? (
          <p className="text-sm text-[#5C6478] px-4 pb-4">No trades yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-sm uppercase tracking-wider text-[#4A5164] border-y border-[#131720]">
                <th className="px-4 py-2 font-medium">Symbol</th>
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium">Entry</th>
                <th className="px-4 py-2 font-medium">Exit</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t) => {
                const pnl = calculateTradePnl(t);
                return (
                  <tr key={t.id} className="border-b border-[#0E1218] last:border-0 hover:bg-[#0C0F16] transition-colors">
                    <td className="px-4 py-2.5 font-mono font-medium">{t.ticker}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${t.direction === "Long" ? "bg-[#0A1B14] text-[#3DD68C]" : "bg-[#211013] text-[#FF6B6B]"}`}>
                        {t.direction === "Long" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#8B93A6]">${t.entry_price}</td>
                    <td className="px-4 py-2.5 font-mono text-[#8B93A6]">{(t.exit_price === null || t.exit_price === undefined) ? "Open" : `$${t.exit_price}`}</td>
                    <td className="px-4 py-2.5 text-[#7A8296]">{t.date}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-medium ${pnl > 0 ? "text-[#3DD68C]" : pnl < 0 ? "text-[#FF6B6B]" : "text-[#5C6478]"}`}>
                      {(t.exit_price === null || t.exit_price === undefined) ? "Open" : `${pnl >= 0 ? "+" : ""}${Math.round(pnl * 100) / 100}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
