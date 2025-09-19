from pydantic import BaseModel
from typing import Optional, List  # Agregué List para RedirectList

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RedirectCreate(BaseModel):
    shortcode: str
    target_url: str

class RedirectResponse(BaseModel):
    id: int
    shortcode: str
    target_url: str

    class Config:
        from_attributes = True  # Corrección para Pydantic v2: permite from_orm

class RedirectList(BaseModel):
    redirects: List[RedirectResponse]
    
class RedirectUpdate(BaseModel):
    shortcode: Optional[str] = None
    target_url: Optional[str] = None
