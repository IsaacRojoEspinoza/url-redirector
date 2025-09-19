from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    redirects = relationship("Redirect", back_populates="owner")

class Redirect(Base):
    __tablename__ = "redirects"
    id = Column(Integer, primary_key=True, index=True)
    shortcode = Column(String, unique=True, index=True)
    target_url = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="redirects")