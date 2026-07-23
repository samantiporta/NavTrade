import { useState, useEffect } from "react";
import { apiRequest } from "./api";
import Login from "./Login";
import AddTrade from "./AddTrade";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const handleDelete = (id) => {
    apiRequest(`/trades/${id}`, { method: "DELETE" })
      .then(() => fetchTrades())
      .catch((err) => setError(err.message));
  };

  const startEdit = (trade) => {
    setEditingId(trade.id);
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

  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem("token"))} />;
  }

  if (loading) return <p>Loading trades...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>NavTrade</h1>
      <AddTrade onTradeAdded={fetchTrades} />
      <h2>Your Trades</h2>
      {trades.length === 0 ? (
        <p>No trades yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Direction</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Size</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) =>
              editingId === trade.id ? (
                <tr key={trade.id}>
                  <td><input value={editForm.ticker} onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value })} /></td>
                  <td>
                    <select value={editForm.direction} onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })}>
                      <option value="Long">Long</option>
                      <option value="Short">Short</option>
                    </select>
                  </td>
                  <td><input type="number" step="0.01" value={editForm.entry_price} onChange={(e) => setEditForm({ ...editForm, entry_price: e.target.value })} /></td>
                  <td><input type="number" step="0.01" value={editForm.exit_price} onChange={(e) => setEditForm({ ...editForm, exit_price: e.target.value })} /></td>
                  <td><input type="number" step="0.01" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} /></td>
                  <td><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></td>
                  <td>
                    <button onClick={() => saveEdit(trade.id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={trade.id}>
                  <td>{trade.ticker}</td>
                  <td>{trade.direction}</td>
                  <td>${trade.entry_price}</td>
                  <td>{trade.exit_price ? `$${trade.exit_price}` : "Open"}</td>
                  <td>{trade.size}</td>
                  <td>{trade.date}</td>
                  <td>
                    <button onClick={() => startEdit(trade)}>Edit</button>
                    <button onClick={() => handleDelete(trade.id)}>Delete</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
