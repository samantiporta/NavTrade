from pydantic import BaseModel
from datetime import date
from typing import Optional

class TradeCreate(BaseModel):
    ticker: str
    entry_price: float
    exit_price: Optional[float] = None
    size: float
    date: date
    direction: str
    notes: Optional[str] = None

class TradeResponse(BaseModel):
    id: int
    ticker: str
    entry_price: float
    exit_price: Optional[float]
    size: float
    date: date
    direction: str
    notes: Optional[str]

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class StatsResponse(BaseModel):
    total_trades: int
    wins: int
    losses: int
    win_rate: float
    total_pnl: float
    avg_win: float
    avg_loss: float
    best_trade: float
    worst_trade: float
