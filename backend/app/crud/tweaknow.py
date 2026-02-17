from sqlalchemy.orm import Session
from typing import List
from app.models.tweaknow import TweakNowCharacter, Tweak, TweakTemplate
from app.schemas.tweaknow import (
    TweakNowCharacterCreate, TweakNowCharacterUpdate,
    TweakCreate, TweakUpdate,
    TweakTemplateCreate
)

# ===== CHARACTER CRUD =====
def get_characters(db: Session, universe_id: int) -> List[TweakNowCharacter]:
    return db.query(TweakNowCharacter).filter(
        TweakNowCharacter.universe_id == universe_id
    ).all()

def get_character(db: Session, character_id: int, universe_id: int):
    return db.query(TweakNowCharacter).filter(
        TweakNowCharacter.id == character_id,
        TweakNowCharacter.universe_id == universe_id
    ).first()

def create_character(db: Session, character: TweakNowCharacterCreate):
    db_character = TweakNowCharacter(**character.dict())
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

def update_character(db: Session, character_id: int, universe_id: int, character_update: TweakNowCharacterUpdate):
    db_character = get_character(db, character_id, universe_id)
    if not db_character:
        return None
    
    update_data = character_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_character, field, value)
    
    db.commit()
    db.refresh(db_character)
    return db_character

def delete_character(db: Session, character_id: int, universe_id: int):
    db_character = get_character(db, character_id, universe_id)
    if db_character:
        db.delete(db_character)
        db.commit()
        return True
    return False


# ===== TWEAK CRUD =====
def get_tweaks(db: Session, universe_id: int) -> List[Tweak]:
    return db.query(Tweak).filter(
        Tweak.universe_id == universe_id
    ).order_by(Tweak.custom_date.desc()).all()

def get_tweak(db: Session, tweak_id: int, universe_id: int):
    return db.query(Tweak).filter(
        Tweak.id == tweak_id,
        Tweak.universe_id == universe_id
    ).first()

def create_tweak(db: Session, tweak: TweakCreate):
    db_tweak = Tweak(**tweak.dict())
    db.add(db_tweak)
    db.commit()
    db.refresh(db_tweak)
    return db_tweak

def update_tweak(db: Session, tweak_id: int, universe_id: int, tweak_update: TweakUpdate):
    db_tweak = get_tweak(db, tweak_id, universe_id)
    if not db_tweak:
        return None
    
    update_data = tweak_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tweak, field, value)
    
    db.commit()
    db.refresh(db_tweak)
    return db_tweak

def delete_tweak(db: Session, tweak_id: int, universe_id: int):
    db_tweak = get_tweak(db, tweak_id, universe_id)
    if db_tweak:
        db.delete(db_tweak)
        db.commit()
        return True
    return False

def create_retweet(db: Session, original_tweak_id: int, character_id: int, universe_id: int):
    """Create a retweet of an existing tweak"""
    original = db.query(Tweak).filter(Tweak.id == original_tweak_id).first()
    if not original:
        return None
    
    # Create retweet entry
    db_retweet = Tweak(
        universe_id=universe_id,
        character_id=character_id,
        content=original.content,
        images=original.images,
        retweet_of_id=original_tweak_id,
        is_retweet=True,
        comment_count=0,
        retweet_count=0,
        quote_count=0,
        like_count=0,
        view_count=0,
    )
    db.add(db_retweet)
    
    # Increment original tweet's retweet count
    original.retweet_count = (original.retweet_count or 0) + 1
    
    db.commit()
    db.refresh(db_retweet)
    return db_retweet

def create_quote_tweet(db: Session, tweak: TweakCreate):
    """Create a quote tweet - same as create_tweak but with quoted_tweak_id"""
    db_tweak = Tweak(**tweak.dict())
    db.add(db_tweak)
    
    # Increment quote count on the quoted tweet
    if tweak.quoted_tweak_id:
        quoted = db.query(Tweak).filter(Tweak.id == tweak.quoted_tweak_id).first()
        if quoted:
            quoted.quote_count = (quoted.quote_count or 0) + 1
    
    db.commit()
    db.refresh(db_tweak)
    return db_tweak


# ===== TEMPLATE CRUD =====
def get_templates(db: Session, user_id: int) -> List[TweakTemplate]:
    return db.query(TweakTemplate).filter(TweakTemplate.user_id == user_id).all()

def create_template(db: Session, template: TweakTemplateCreate, user_id: int):
    db_template = TweakTemplate(**template.dict(), user_id=user_id)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

def delete_template(db: Session, template_id: int, user_id: int):
    db_template = db.query(TweakTemplate).filter(
        TweakTemplate.id == template_id,
        TweakTemplate.user_id == user_id
    ).first()
    if db_template:
        db.delete(db_template)
        db.commit()
        return True
    return False


# ===== FOLLOW CRUD =====
def follow_character(db: Session, follower_id: int, following_id: int):
    from app.models.tweaknow import CharacterFollow
    
    existing = db.query(CharacterFollow).filter(
        CharacterFollow.follower_id == follower_id,
        CharacterFollow.following_id == following_id
    ).first()
    
    if existing:
        return existing
    
    db_follow = CharacterFollow(follower_id=follower_id, following_id=following_id)
    db.add(db_follow)
    db.commit()
    db.refresh(db_follow)
    return db_follow

def unfollow_character(db: Session, follower_id: int, following_id: int):
    from app.models.tweaknow import CharacterFollow
    
    db_follow = db.query(CharacterFollow).filter(
        CharacterFollow.follower_id == follower_id,
        CharacterFollow.following_id == following_id
    ).first()
    
    if db_follow:
        db.delete(db_follow)
        db.commit()
        return True
    return False

def is_following(db: Session, follower_id: int, following_id: int) -> bool:
    from app.models.tweaknow import CharacterFollow
    
    return db.query(CharacterFollow).filter(
        CharacterFollow.follower_id == follower_id,
        CharacterFollow.following_id == following_id
    ).first() is not None

def get_followers_count(db: Session, character_id: int) -> int:
    from app.models.tweaknow import CharacterFollow
    
    return db.query(CharacterFollow).filter(
        CharacterFollow.following_id == character_id
    ).count()

def get_following_count(db: Session, character_id: int) -> int:
    from app.models.tweaknow import CharacterFollow
    
    return db.query(CharacterFollow).filter(
        CharacterFollow.follower_id == character_id
    ).count()