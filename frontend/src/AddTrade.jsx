import { useState } from "react";
import { Plus } from "lucide-react";
import { apiRequest } from "./api";

function AddTrade({ onTradeAdded }) {
  const [ticker, setTicker] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [size, setSize] = useState("");
  const [date, setDate] = useState("");
  const [direction, setDirection] = useState("Long");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    apiRequest("/trades", {
      method: "POST",
      body: JSON.stringify({
        ticker,
        entry_price: parseFloat(entryPrice),
        exit_price: exitPrice ? parseFloat(exitPrice) : null,
        size: parseFloat(size),
        date,
        direction,
        notes,
      }),
    })
      .then(() => {
        setTicker("");
        setEntryPrice("");
        setExitPrice("");
        setSize("");
        setDate("");
        setDirection("Long");
        setNotes("");
        onTradeAdded();
      })
      .catch((err) => setError(err.message));
  };

  const inputClass = "bg-[#0B0E14] border border-[#232A38] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F0B429] placeholder:text-[#4A5164]";

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-display text-sm font-semibold mb-3 text-[#B4BACA]">Add Trade</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <input placeholder="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} className={`${inputClass} w-24`} />
        <input placeholder="Entry Price" type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className={`${inputClass} w-28`} />
        <input placeholder="Exit Price" type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className={`${inputClass} w-28`} />
        <input placeholder="Size" type="number" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} className={`${inputClass} w-20`} />
        <input placeholder="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputClass}>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
        <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} flex-1 min-w-[120px]`} />
      </div>
      {error && <p className="text-[#FF6B6B] text-sm mb-2">{error}</p>}
      <button type="submit" className="flex items-center gap-1.5 bg-[#F0B429] hover:bg-[#E0A61E] text-[#05070B] font-medium text-sm px-4 py-2 rounded-lg transition-colors">
        <Plus size={14} strokeWidth={2.5} />
        Add Trade
      </button>
    </form>
  );
}

export default AddTrade;
