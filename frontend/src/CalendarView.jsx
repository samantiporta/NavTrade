import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

function calculateTradePnl(trade) {
  if (trade.exit_price === null || trade.exit_price === undefined) return 0;
  if (trade.direction === "Long") {
    return (trade.exit_price - trade.entry_price) * trade.size;
  }
  return (trade.entry_price - trade.exit_price) * trade.size;
}

function buildPnlByDate(trades) {
  const map = {};
  trades.forEach((t) => {
    const pnl = calculateTradePnl(t);
    if (pnl === 0) return;
    if (!map[t.date]) map[t.date] = 0;
    map[t.date] += pnl;
  });
  return map;
}

function toDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function CalendarView({ trades }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const pnlByDate = buildPnlByDate(trades);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));

  let monthTotal = 0;
  Object.entries(pnlByDate).forEach(([date, pnl]) => {
    if (date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) monthTotal += pnl;
  });

  return (
    <div className="rounded-xl border border-[#131720] bg-[#080B10] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-[#F0B429]" />
          <span className="font-display text-base font-semibold">{MONTH_NAMES[month]} {year}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${monthTotal >= 0 ? "bg-[#0A1B14] text-[#3DD68C]" : "bg-[#211013] text-[#FF6B6B]"}`}>
            {monthTotal >= 0 ? "+" : ""}${Math.round(monthTotal * 100) / 100}
          </span>
          <div className="flex items-center gap-1 text-[#5C6478]">
            <button onClick={goPrev} className="p-1 hover:text-[#DDE1E8] transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={goNext} className="p-1 hover:text-[#DDE1E8] transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-wider text-[#4A5164] mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const key = toDateKey(year, month, day);
          const pnl = pnlByDate[key];
          const isToday = key === todayKey;
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs border transition-colors ${
                isToday ? "border-[#F0B429]" : "border-transparent"
              } ${
                pnl > 0 ? "bg-[#0A1B14] text-[#3DD68C]" :
                pnl < 0 ? "bg-[#211013] text-[#FF6B6B]" :
                "bg-[#0B0E14] text-[#4A5164]"
              }`}
            >
              <span className="font-medium text-lg">{day}</span>
              {pnl !== undefined && (
                <span className="font-mono text-xs leading-none mt-1">
                  {pnl > 0 ? "+" : ""}{Math.round(pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
