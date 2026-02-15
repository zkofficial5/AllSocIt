from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UniverseBase(BaseModel):
    name: str
    description: Optional[str] = None

class UniverseCreate(UniverseBase):
    pass

class UniverseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Universe(UniverseBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True