from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import schemas

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "NavTrade API is running"}

@app.post("/trades", response_model=schemas.TradeResponse)
def create_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    new_trade = models.Trade(**trade.dict())
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade

@app.get("/trades", response_model=list[schemas.TradeResponse])
def get_trades(db: Session = Depends(get_db)):
    return db.query(models.Trade).all()

@app.put("/trades/{trade_id}", response_model=schemas.TradeResponse)
def update_trade(trade_id: int, trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    db_trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    for key, value in trade.dict().items():
        setattr(db_trade, key, value)
    db.commit()
    db.refresh(db_trade)
    return db_trade

@app.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    db_trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(db_trade)
    db.commit()
    return {"message": f"Trade {trade_id} deleted"}
