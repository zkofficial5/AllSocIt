from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.schemas.tweaknow import (
    TweakNowCharacter, TweakNowCharacterCreate, TweakNowCharacterUpdate,
    Tweak, TweakCreate, TweakUpdate,
    TweakTemplate, TweakTemplateCreate
)
from app.schemas.user import User
from app.crud import tweaknow as crud_tweaknow
from app.crud import universe as crud_universe

router = APIRouter()

# ===== CHARACTER ROUTES =====
@router.get("/universes/{universe_id}/characters", response_model=List[TweakNowCharacter])
def get_characters(
    universe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    return crud_tweaknow.get_characters(db, universe_id=universe_id)

@router.post("/universes/{universe_id}/characters", response_model=TweakNowCharacter, status_code=status.HTTP_201_CREATED)
def create_character(
    universe_id: int,
    character: TweakNowCharacterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    # Ensure character is created in the correct universe
    character.universe_id = universe_id
    return crud_tweaknow.create_character(db=db, character=character)

@router.put("/universes/{universe_id}/characters/{character_id}", response_model=TweakNowCharacter)
def update_character(
    universe_id: int,
    character_id: int,
    character_update: TweakNowCharacterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    db_character = crud_tweaknow.update_character(
        db, character_id=character_id, universe_id=universe_id, character_update=character_update
    )
    if not db_character:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@router.delete("/universes/{universe_id}/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character(
    universe_id: int,
    character_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    success = crud_tweaknow.delete_character(db, character_id=character_id, universe_id=universe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Character not found")
    return None


# ===== TWEAK ROUTES =====
@router.get("/universes/{universe_id}/tweaks", response_model=List[Tweak])
def get_tweaks(
    universe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    return crud_tweaknow.get_tweaks(db, universe_id=universe_id)

@router.post("/universes/{universe_id}/tweaks", response_model=Tweak, status_code=status.HTTP_201_CREATED)
def create_tweak(
    universe_id: int,
    tweak: TweakCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    # Ensure tweak is created in the correct universe
    tweak.universe_id = universe_id
    return crud_tweaknow.create_tweak(db=db, tweak=tweak)

@router.put("/universes/{universe_id}/tweaks/{tweak_id}", response_model=Tweak)
def update_tweak(
    universe_id: int,
    tweak_id: int,
    tweak_update: TweakUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    db_tweak = crud_tweaknow.update_tweak(
        db, tweak_id=tweak_id, universe_id=universe_id, tweak_update=tweak_update
    )
    if not db_tweak:
        raise HTTPException(status_code=404, detail="Tweak not found")
    return db_tweak

@router.delete("/universes/{universe_id}/tweaks/{tweak_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tweak(
    universe_id: int,
    tweak_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    success = crud_tweaknow.delete_tweak(db, tweak_id=tweak_id, universe_id=universe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tweak not found")
    return None


# ===== TEMPLATE ROUTES =====
@router.get("/templates", response_model=List[TweakTemplate])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_tweaknow.get_templates(db, user_id=current_user.id)

@router.post("/templates", response_model=TweakTemplate, status_code=status.HTTP_201_CREATED)
def create_template(
    template: TweakTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_tweaknow.create_template(db=db, template=template, user_id=current_user.id)

@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = crud_tweaknow.delete_template(db, template_id=template_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return None


# ===== FOLLOW ROUTES =====
@router.post("/universes/{universe_id}/characters/{follower_id}/follow/{following_id}", status_code=status.HTTP_201_CREATED)
def follow_character(
    universe_id: int,
    follower_id: int,
    following_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    # Verify both characters exist in this universe
    follower = crud_tweaknow.get_character(db, follower_id, universe_id)
    following = crud_tweaknow.get_character(db, following_id, universe_id)
    
    if not follower or not following:
        raise HTTPException(status_code=404, detail="Character not found")
    
    if follower_id == following_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    crud_tweaknow.follow_character(db, follower_id, following_id)
    return {"success": True}

@router.delete("/universes/{universe_id}/characters/{follower_id}/unfollow/{following_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_character(
    universe_id: int,
    follower_id: int,
    following_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    crud_tweaknow.unfollow_character(db, follower_id, following_id)
    return None

@router.get("/universes/{universe_id}/characters/{follower_id}/is-following/{following_id}")
def check_following(
    universe_id: int,
    follower_id: int,
    following_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify universe belongs to user
    universe = crud_universe.get_universe(db, universe_id, current_user.id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    
    is_following = crud_tweaknow.is_following(db, follower_id, following_id)
    followers_count = crud_tweaknow.get_followers_count(db, following_id)
    following_count = crud_tweaknow.get_following_count(db, following_id)
    
    return {
        "is_following": is_following,
        "followers_count": followers_count,
        "following_count": following_count
    }