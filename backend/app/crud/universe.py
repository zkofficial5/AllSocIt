from sqlalchemy.orm import Session
from typing import List
from app.models.universe import Universe
from app.schemas.universe import UniverseCreate, UniverseUpdate

def get_universes(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Universe]:
    return db.query(Universe).filter(Universe.user_id == user_id).offset(skip).limit(limit).all()

def get_universe(db: Session, universe_id: int, user_id: int):
    return db.query(Universe).filter(
        Universe.id == universe_id,
        Universe.user_id == user_id
    ).first()

def create_universe(db: Session, universe: UniverseCreate, user_id: int):
    db_universe = Universe(**universe.dict(), user_id=user_id)
    db.add(db_universe)
    db.commit()
    db.refresh(db_universe)
    return db_universe

def update_universe(db: Session, universe_id: int, user_id: int, universe_update: UniverseUpdate):
    db_universe = get_universe(db, universe_id, user_id)
    if not db_universe:
        return None
    
    update_data = universe_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_universe, field, value)
    
    db.commit()
    db.refresh(db_universe)
    return db_universe

def delete_universe(db: Session, universe_id: int, user_id: int):
    db_universe = get_universe(db, universe_id, user_id)
    if db_universe:
        db.delete(db_universe)
        db.commit()
        return True
    return False