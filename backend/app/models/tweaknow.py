from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.dialects.postgresql import ARRAY

class TweakNowCharacter(Base):
    __tablename__ = "tweaknow_characters"
    
    id = Column(Integer, primary_key=True, index=True)
    universe_id = Column(Integer, ForeignKey("universes.id"), nullable=False)
    
    # Profile fields
    name = Column(String, nullable=False)
    username = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    pro_category = Column(String, nullable=True)
    display_followers_count = Column(Integer, default=0)
    display_following_count = Column(Integer, default=0)
    
    # Official mark: Blue/Gold/Grey/None
    official_mark = Column(String, default="None")
    is_private = Column(Boolean, default=False)
    
    # Profile picture (stored as base64 or URL)
    profile_picture = Column(Text, nullable=True)
    banner_image = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    universe = relationship("Universe", back_populates="tweaknow_characters")
    tweaks = relationship("Tweak", back_populates="character", cascade="all, delete-orphan")


class Tweak(Base):
    __tablename__ = "tweaks"
    
    id = Column(Integer, primary_key=True, index=True)
    universe_id = Column(Integer, ForeignKey("universes.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("tweaknow_characters.id"), nullable=False)
    
    # Tweet content
    content = Column(Text, nullable=False)
    images = Column(ARRAY(Text), nullable=True)
    
    # Engagement metrics
    comment_count = Column(Integer, default=0)
    retweet_count = Column(Integer, default=0)
    quote_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    
    # Custom metadata
    source_label = Column(String, default="Twitter for iPhone")
    custom_date = Column(DateTime(timezone=True), nullable=True)
    reply_to_tweak_id = Column(Integer, ForeignKey("tweaks.id"), nullable=True)
    quoted_tweak_id = Column(Integer, ForeignKey("tweaks.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    universe = relationship("Universe", back_populates="tweaks")
    character = relationship("TweakNowCharacter", back_populates="tweaks")
    replies = relationship("Tweak", backref="parent_tweak", foreign_keys=[reply_to_tweak_id], remote_side=[id])


class Retweet(Base):
    """Separate table to track retweets - doesn't create duplicate tweets"""
    __tablename__ = "retweets"
    
    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("tweaknow_characters.id"), nullable=False)
    tweak_id = Column(Integer, ForeignKey("tweaks.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Prevent duplicate retweets
    __table_args__ = (
        UniqueConstraint('character_id', 'tweak_id', name='unique_retweet'),
    )


class TweakTemplate(Base):
    __tablename__ = "tweak_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    comment_count = Column(Integer, default=0)
    retweet_count = Column(Integer, default=0)
    quote_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    source_label = Column(String, default="Twitter for iPhone")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CharacterFollow(Base):
    __tablename__ = "character_follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("tweaknow_characters.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("tweaknow_characters.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Prevent duplicate follows
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
    )