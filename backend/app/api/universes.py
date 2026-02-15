from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.schemas.universe import Universe, UniverseCreate, UniverseUpdate
from app.schemas.user import User
from app.crud import universe as crud_universe

router = APIRouter()

@router.get("/", response_model=List[Universe])
def get_universes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_universe.get_universes(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/", response_model=Universe, status_code=status.HTTP_201_CREATED)
def create_universe(
    universe: UniverseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_universe.create_universe(db=db, universe=universe, user_id=current_user.id)

@router.get("/{universe_id}", response_model=Universe)
def get_universe(
    universe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_universe = crud_universe.get_universe(db, universe_id=universe_id, user_id=current_user.id)
    if db_universe is None:
        raise HTTPException(status_code=404, detail="Universe not found")
    return db_universe

@router.put("/{universe_id}", response_model=Universe)
def update_universe(
    universe_id: int,
    universe_update: UniverseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_universe = crud_universe.update_universe(
        db, universe_id=universe_id, user_id=current_user.id, universe_update=universe_update
    )
    if db_universe is None:
        raise HTTPException(status_code=404, detail="Universe not found")
    return db_universe

@router.delete("/{universe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_universe(
    universe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = crud_universe.delete_universe(db, universe_id=universe_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Universe not found")
    return None