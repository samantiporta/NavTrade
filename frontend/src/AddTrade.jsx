import { useState } from "react";
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

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h3>Add Trade</h3>
      <input placeholder="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} />
      <input placeholder="Entry Price" type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
      <input placeholder="Exit Price (optional)" type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
      <input placeholder="Size" type="number" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} />
      <input placeholder="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <select value={direction} onChange={(e) => setDirection(e.target.value)}>
        <option value="Long">Long</option>
        <option value="Short">Short</option>
      </select>
      <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button type="submit">Add Trade</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default AddTrade;
