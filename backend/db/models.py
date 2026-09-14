from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    gmail = Column(String, unique=True, index=True)
    staff_id = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    gemini_api_key = Column(String, nullable=True)
    
    visits = relationship("Visit", back_populates="user")
    captures = relationship("ShelfCapture", back_populates="user")

class Outlet(Base):
    __tablename__ = "outlets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    channel = Column(String, index=True)  # Supermarket, Hypermarket, General Trade
    address = Column(String)
    city = Column(String, index=True)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    visits = relationship("Visit", back_populates="outlet", cascade="all, delete-orphan")
    shelf_captures = relationship("ShelfCapture", back_populates="outlet", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="outlet", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku_code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    brand = Column(String, index=True)
    category = Column(String, index=True)  # staples, cooking, beverages, spices
    is_aci = Column(Boolean, default=False)
    mrp = Column(Float, default=0.0)
    target_shelf_share = Column(Float, default=30.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    outlet_id = Column(Integer, ForeignKey("outlets.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    rep_name = Column(String, default="Field Rep")
    visit_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="completed")  # completed, in_progress, scheduled
    notes = Column(String, nullable=True)

    outlet = relationship("Outlet", back_populates="visits")
    user = relationship("User", back_populates="visits")
    shelf_captures = relationship("ShelfCapture", back_populates="visit")

class ShelfCapture(Base):
    __tablename__ = "shelf_captures"

    id = Column(Integer, primary_key=True, index=True)
    outlet_id = Column(Integer, ForeignKey("outlets.id"), index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    shelf_section = Column(String, default="staples")  # staples, cooking, beverages, spices
    image_url = Column(String)
    field_notes = Column(String, nullable=True)
    total_facings = Column(Integer, default=0)
    aci_facings = Column(Integer, default=0)
    competitor_facings = Column(Integer, default=0)
    aci_shelf_share = Column(Float, default=0.0)  # percentage
    posm_present = Column(Boolean, default=False)
    posm_type = Column(String, nullable=True)
    analysis_raw = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    outlet = relationship("Outlet", back_populates="shelf_captures")
    visit = relationship("Visit", back_populates="shelf_captures")
    user = relationship("User", back_populates="captures")
    detections = relationship("Detection", back_populates="capture", cascade="all, delete-orphan")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    capture_id = Column(Integer, ForeignKey("shelf_captures.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku_name = Column(String)
    brand = Column(String)
    is_aci = Column(Boolean, default=False)
    facing_count = Column(Integer, default=0)
    observed_price = Column(Float, nullable=True)
    is_out_of_stock = Column(Boolean, default=False)
    confidence = Column(Float, default=0.92)

    capture = relationship("ShelfCapture", back_populates="detections")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    outlet_id = Column(Integer, ForeignKey("outlets.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku_code = Column(String)
    sku_name = Column(String)
    issue_type = Column(String, default="Stock-out")  # Stock-out, Low Shelf Share, Missing Distribution
    priority = Column(String, default="High")  # High, Medium, Low
    description = Column(String)
    assigned_to = Column(String, default="field-team")
    status = Column(String, default="open")  # open, resolved, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    outlet = relationship("Outlet", back_populates="recommendations")
