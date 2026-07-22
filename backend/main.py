from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import schemas
import auth

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

@app.post("/auth/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        email=user.email,
        hashed_password=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = auth.create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/trades", response_model=schemas.TradeResponse)
def create_trade(
    trade: schemas.TradeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_trade = models.Trade(**trade.dict(), user_id=current_user.id)
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade

@app.get("/trades", response_model=list[schemas.TradeResponse])
def get_trades(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Trade).filter(models.Trade.user_id == current_user.id).all()

@app.put("/trades/{trade_id}", response_model=schemas.TradeResponse)
def update_trade(
    trade_id: int,
    trade: schemas.TradeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_trade = db.query(models.Trade).filter(
        models.Trade.id == trade_id,
        models.Trade.user_id == current_user.id
    ).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    for key, value in trade.dict().items():
        setattr(db_trade, key, value)
    db.commit()
    db.refresh(db_trade)
    return db_trade

@app.delete("/trades/{trade_id}")
def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_trade = db.query(models.Trade).filter(
        models.Trade.id == trade_id,
        models.Trade.user_id == current_user.id
    ).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(db_trade)
    db.commit()
    return {"message": f"Trade {trade_id} deleted"}

def calculate_trade_pnl(trade):
    if trade.exit_price is None:
        return 0
    if trade.direction == "Long":
        return (trade.exit_price - trade.entry_price) * trade.size
    else:
        return (trade.entry_price - trade.exit_price) * trade.size

@app.get("/stats", response_model=schemas.StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    trades = db.query(models.Trade).filter(models.Trade.user_id == current_user.id).all()

    if not trades:
        return schemas.StatsResponse(
            total_trades=0, wins=0, losses=0, win_rate=0.0,
            total_pnl=0.0, avg_win=0.0, avg_loss=0.0,
            best_trade=0.0, worst_trade=0.0
        )

    pnls = [calculate_trade_pnl(t) for t in trades]
    wins_list = [p for p in pnls if p > 0]
    losses_list = [p for p in pnls if p < 0]

    total_trades = len(trades)
    wins = len(wins_list)
    losses = len(losses_list)
    win_rate = (wins / total_trades) * 100 if total_trades > 0 else 0.0
    total_pnl = sum(pnls)
    avg_win = sum(wins_list) / len(wins_list) if wins_list else 0.0
    avg_loss = sum(losses_list) / len(losses_list) if losses_list else 0.0
    best_trade = max(pnls) if pnls else 0.0
    worst_trade = min(pnls) if pnls else 0.0

    return schemas.StatsResponse(
        total_trades=total_trades, wins=wins, losses=losses,
        win_rate=round(win_rate, 2), total_pnl=round(total_pnl, 2),
        avg_win=round(avg_win, 2), avg_loss=round(avg_loss, 2),
        best_trade=round(best_trade, 2), worst_trade=round(worst_trade, 2)
    )
