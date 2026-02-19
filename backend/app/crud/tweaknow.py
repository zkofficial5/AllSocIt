from sqlalchemy.orm import Session
from typing import List
from app.models.tweaknow import TweakNowCharacter, Tweak, TweakTemplate, Retweet
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

# def get_feed_with_retweets(db: Session, universe_id: int):
#     """
#     Get feed that includes both original tweets AND retweets.
#     Returns list of dict with: {type: 'tweet'|'retweet', tweak: Tweak, retweeted_by_character_id: int|None, timestamp: str}
#     """
#     from datetime import datetime
    
#     # Get all original tweets
#     tweets = db.query(Tweak).filter(
#         Tweak.universe_id == universe_id
#     ).all()
    
#     # Get all retweets for this universe
#     retweets = db.query(Retweet).join(
#         Tweak, Retweet.tweak_id == Tweak.id
#     ).filter(
#         Tweak.universe_id == universe_id
#     ).all()
    
#     feed_items = []
    
#     # Add original tweets
#     for tweet in tweets:
#         if not tweet.reply_to_tweak_id:  # Skip replies from main feed
#             feed_items.append({
#                 'type': 'tweet',
#                 'tweak': tweet,
#                 'tweak_id': tweet.id,
#                 'retweeted_by_character_id': None,
#                 'timestamp': tweet.custom_date or tweet.created_at
#             })
    
#     # Add retweets
#     for retweet in retweets:
#         tweet = db.query(Tweak).filter(Tweak.id == retweet.tweak_id).first()
#         if tweet and not tweet.reply_to_tweak_id:  # Skip replies
#             feed_items.append({
#                 'type': 'retweet',
#                 'tweak': tweet,
#                 'tweak_id': tweet.id,
#                 'retweeted_by_character_id': retweet.character_id,
#                 'timestamp': retweet.created_at
#             })
    
#     # Sort by timestamp (newest first)
#     feed_items.sort(key=lambda x: x['timestamp'], reverse=True)
    
#     return feed_items

def get_feed_with_retweets(db: Session, universe_id: int):
    """
    Get feed that includes both original tweets AND retweets.
    Returns list of dict with: {type: 'tweet'|'retweet', tweak: Tweak, retweeted_by_character_id: int|None, timestamp: str, quoted_tweak: Tweak|None}
    """
    from sqlalchemy.orm import joinedload
    
    # Get all original tweets WITH their quoted tweets loaded
    tweets = db.query(Tweak).filter(
        Tweak.universe_id == universe_id
    ).all()
    
    # Get all retweets for this universe
    retweets = db.query(Retweet).join(
        Tweak, Retweet.tweak_id == Tweak.id
    ).filter(
        Tweak.universe_id == universe_id
    ).all()
    
    feed_items = []
    
    # Add original tweets
    for tweet in tweets:
        if not tweet.reply_to_tweak_id:  # Skip replies from main feed
            # Get quoted tweet if exists
            quoted_tweak = None
            if tweet.quoted_tweak_id:
                quoted_tweak = db.query(Tweak).filter(Tweak.id == tweet.quoted_tweak_id).first()
            
            feed_items.append({
                'type': 'tweet',
                'tweak': tweet,
                'tweak_id': tweet.id,
                'retweeted_by_character_id': None,
                'timestamp': tweet.custom_date or tweet.created_at,
                'quoted_tweak': quoted_tweak  # Include full quoted tweet object
            })
    
    # Add retweets
    for retweet in retweets:
        tweet = db.query(Tweak).filter(Tweak.id == retweet.tweak_id).first()
        if tweet and not tweet.reply_to_tweak_id:  # Skip replies
            # Get quoted tweet if the retweeted tweet is a quote
            quoted_tweak = None
            if tweet.quoted_tweak_id:
                quoted_tweak = db.query(Tweak).filter(Tweak.id == tweet.quoted_tweak_id).first()
            
            feed_items.append({
                'type': 'retweet',
                'tweak': tweet,
                'tweak_id': tweet.id,
                'retweeted_by_character_id': retweet.character_id,
                'timestamp': retweet.created_at,
                'quoted_tweak': quoted_tweak  # Include full quoted tweet object
            })
    
    # Sort by timestamp (newest first)
    feed_items.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return feed_items

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

def create_quote_tweet(db: Session, tweak: TweakCreate):
    """Create a quote tweet"""
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


# ===== RETWEET CRUD (NEW APPROACH) =====
def create_retweet(db: Session, character_id: int, tweak_id: int):
    """Create a retweet entry - doesn't duplicate the tweet"""
    # Check if tweet exists
    tweak = db.query(Tweak).filter(Tweak.id == tweak_id).first()
    if not tweak:
        return None
    
    # Check if already retweeted
    existing = db.query(Retweet).filter(
        Retweet.character_id == character_id,
        Retweet.tweak_id == tweak_id
    ).first()
    
    if existing:
        return existing
    
    # Create retweet entry
    retweet = Retweet(character_id=character_id, tweak_id=tweak_id)
    db.add(retweet)
    
    # Increment retweet count on original tweet
    tweak.retweet_count = (tweak.retweet_count or 0) + 1
    
    db.commit()
    db.refresh(retweet)
    return retweet

def delete_retweet(db: Session, character_id: int, tweak_id: int):
    """Undo a retweet"""
    retweet = db.query(Retweet).filter(
        Retweet.character_id == character_id,
        Retweet.tweak_id == tweak_id
    ).first()
    
    if retweet:
        db.delete(retweet)
        
        # Decrement retweet count
        tweak = db.query(Tweak).filter(Tweak.id == tweak_id).first()
        if tweak:
            tweak.retweet_count = max(0, (tweak.retweet_count or 0) - 1)
        
        db.commit()
        return True
    return False

def check_retweet(db: Session, character_id: int, tweak_id: int) -> bool:
    """Check if a character has retweeted a tweet"""
    return db.query(Retweet).filter(
        Retweet.character_id == character_id,
        Retweet.tweak_id == tweak_id
    ).first() is not None

def get_retweets_by_character(db: Session, character_id: int) -> List[Retweet]:
    """Get all retweets by a character"""
    return db.query(Retweet).filter(
        Retweet.character_id == character_id
    ).order_by(Retweet.created_at.desc()).all()


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