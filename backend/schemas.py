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
