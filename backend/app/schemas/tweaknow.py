from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import Optional, List

# ===== CHARACTER SCHEMAS =====
class TweakNowCharacterBase(BaseModel):
    name: str
    username: str
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    birth_date: Optional[str] = None
    pro_category: Optional[str] = None
    official_mark: Optional[str] = "None"
    is_private: Optional[bool] = False
    profile_picture: Optional[str] = None
    banner_image: Optional[str] = None
    display_followers_count: int = 0
    display_following_count: int = 0

class TweakNowCharacterCreate(TweakNowCharacterBase):
    universe_id: int

class TweakNowCharacterUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    birth_date: Optional[str] = None
    pro_category: Optional[str] = None
    official_mark: Optional[str] = None
    is_private: Optional[bool] = None
    profile_picture: Optional[str] = None
    banner_image: Optional[str] = None
    display_followers_count: Optional[int] = None
    display_following_count: Optional[int] = None

class TweakNowCharacter(TweakNowCharacterBase):
    id: int
    universe_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ===== TWEAK (TWEET) SCHEMAS =====
class TweakBase(BaseModel):
    content: str
    images: Optional[List[str]] = None
    comment_count: Optional[int] = 0
    retweet_count: Optional[int] = 0
    quote_count: Optional[int] = 0
    like_count: Optional[int] = 0
    view_count: Optional[int] = 0
    source_label: Optional[str] = "Twitter for iPhone"
    custom_date: Optional[datetime] = None
    reply_to_tweak_id: Optional[int] = None
    quoted_tweak_id: Optional[int] = None

class TweakCreate(TweakBase):
    universe_id: int
    character_id: int

class TweakUpdate(BaseModel):
    content: Optional[str] = None
    comment_count: Optional[int] = None
    retweet_count: Optional[int] = None
    quote_count: Optional[int] = None
    like_count: Optional[int] = None
    view_count: Optional[int] = None
    source_label: Optional[str] = None
    custom_date: Optional[datetime] = None
    quoted_tweak_id: Optional[int] = None

class Tweak(TweakBase):
    id: int
    universe_id: int
    character_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ===== RETWEET SCHEMAS =====
class RetweetCreate(BaseModel):
    character_id: int
    tweak_id: int

class RetweetResponse(BaseModel):
    id: int
    character_id: int
    tweak_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== TEMPLATE SCHEMAS =====
class TweakTemplateBase(BaseModel):
    name: str
    comment_count: Optional[int] = 0
    retweet_count: Optional[int] = 0
    quote_count: Optional[int] = 0
    like_count: Optional[int] = 0
    view_count: Optional[int] = 0
    source_label: Optional[str] = "Twitter for iPhone"

class TweakTemplateCreate(TweakTemplateBase):
    pass

class TweakTemplate(TweakTemplateBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Follow schemas
class CharacterFollowCreate(BaseModel):
    follower_id: int
    following_id: int

class CharacterFollow(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True