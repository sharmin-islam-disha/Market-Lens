from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from db.database import get_db
from db import models
from db.seed import seed_initial_data
from services.vision_service import analyze_shelf_image

router = APIRouter()

# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------

class OutletCreate(BaseModel):
    code: str
    name: str
    channel: str = "Supermarket"
    address: str
    city: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None

class ProductCreate(BaseModel):
    sku_code: str
    name: str
    brand: str
    category: str = "staples"
    is_aci: bool = False
    mrp: float = 0.0
    target_shelf_share: float = 30.0

class VisitCreate(BaseModel):
    outlet_id: int
    rep_name: str = "Field Rep"
    status: str = "completed"
    notes: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

# -------------------------------------------------------------
# General Endpoints
# -------------------------------------------------------------

@router.get("/")
def read_root():
    return {"message": "Welcome to MarketLens API"}

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.post("/reset")
def clear_all_data(db: Session = Depends(get_db)):
    db.query(models.Detection).delete()
    db.query(models.Recommendation).delete()
    db.query(models.ShelfCapture).delete()
    db.query(models.Visit).delete()
    db.query(models.Product).delete()
    db.query(models.Outlet).delete()
    db.commit()
    return {"message": "All data wiped clean. Ready for fresh data entry."}

# -------------------------------------------------------------
# Outlets Endpoints
# -------------------------------------------------------------

@router.get("/outlets")
def list_outlets(
    city: Optional[str] = None,
    channel: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Outlet)
    if city:
        query = query.filter(models.Outlet.city.ilike(f"%{city}%"))
    if channel:
        query = query.filter(models.Outlet.channel.ilike(f"%{channel}%"))
    
    outlets = query.order_by(models.Outlet.id.asc()).all()
    results = []
    for o in outlets:
        last_capture = db.query(models.ShelfCapture).filter(
            models.ShelfCapture.outlet_id == o.id
        ).order_by(models.ShelfCapture.created_at.desc()).first()

        results.append({
            "id": o.id,
            "code": o.code,
            "name": o.name,
            "channel": o.channel,
            "address": o.address,
            "city": o.city,
            "contact_person": o.contact_person,
            "phone": o.phone,
            "audits_count": len(o.shelf_captures),
            "last_audited": last_capture.created_at.strftime("%b %d, %Y") if last_capture else "Never",
            "created_at": o.created_at.isoformat(),
        })
    return results

@router.post("/outlets", status_code=status.HTTP_201_CREATED)
def create_outlet(outlet_in: OutletCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Outlet).filter(models.Outlet.code == outlet_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Outlet code already exists")
    
    outlet = models.Outlet(
        code=outlet_in.code,
        name=outlet_in.name,
        channel=outlet_in.channel,
        address=outlet_in.address,
        city=outlet_in.city,
        contact_person=outlet_in.contact_person,
        phone=outlet_in.phone,
    )
    db.add(outlet)
    db.commit()
    db.refresh(outlet)
    return outlet

@router.delete("/outlets/{outlet_id}")
def delete_outlet(outlet_id: int, db: Session = Depends(get_db)):
    outlet = db.query(models.Outlet).filter(models.Outlet.id == outlet_id).first()
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")
    db.delete(outlet)
    db.commit()
    return {"message": "Outlet deleted"}

# -------------------------------------------------------------
# Products Endpoints
# -------------------------------------------------------------

@router.get("/products")
def list_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    is_aci: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    if brand:
        query = query.filter(models.Product.brand.ilike(f"%{brand}%"))
    if is_aci is not None:
        query = query.filter(models.Product.is_aci == is_aci)
    
    return query.order_by(models.Product.is_aci.desc(), models.Product.brand.asc(), models.Product.name.asc()).all()

@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Product).filter(models.Product.sku_code == product_in.sku_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU code already exists")
    
    product = models.Product(
        sku_code=product_in.sku_code,
        name=product_in.name,
        brand=product_in.brand,
        category=product_in.category,
        is_aci=product_in.is_aci,
        mrp=product_in.mrp,
        target_shelf_share=product_in.target_shelf_share,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

# -------------------------------------------------------------
# Visits Endpoints
# -------------------------------------------------------------

@router.get("/visits")
def list_visits(db: Session = Depends(get_db)):
    visits = db.query(models.Visit).order_by(models.Visit.visit_date.desc()).all()
    results = []
    for v in visits:
        results.append({
            "id": v.id,
            "outlet_id": v.outlet_id,
            "outlet_name": v.outlet.name if v.outlet else "Unknown",
            "outlet_city": v.outlet.city if v.outlet else "Unknown",
            "rep_name": v.rep_name,
            "visit_date": v.visit_date.strftime("%b %d, %Y - %I:%M %p"),
            "status": v.status,
            "notes": v.notes,
            "captures_count": len(v.shelf_captures),
        })
    return results

@router.post("/visits", status_code=status.HTTP_201_CREATED)
def create_visit(visit_in: VisitCreate, db: Session = Depends(get_db)):
    outlet = db.query(models.Outlet).filter(models.Outlet.id == visit_in.outlet_id).first()
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")
    
    visit = models.Visit(
        outlet_id=visit_in.outlet_id,
        rep_name=visit_in.rep_name,
        status=visit_in.status,
        notes=visit_in.notes,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit

# -------------------------------------------------------------
# Shelf Captures & Vision Analysis
# -------------------------------------------------------------

@router.get("/captures")
def list_captures(limit: int = 20, db: Session = Depends(get_db)):
    captures = db.query(models.ShelfCapture).order_by(models.ShelfCapture.created_at.desc()).limit(limit).all()
    results = []
    for c in captures:
        results.append({
            "id": c.id,
            "outlet_name": c.outlet.name if c.outlet else "Unknown",
            "shelf_section": c.shelf_section,
            "total_facings": c.total_facings,
            "aci_facings": c.aci_facings,
            "competitor_facings": c.competitor_facings,
            "aci_shelf_share": c.aci_shelf_share,
            "posm_present": c.posm_present,
            "posm_type": c.posm_type,
            "image_url": c.image_url,
            "created_at": c.created_at.strftime("%b %d, %Y - %I:%M %p"),
            "detections_count": len(c.detections),
        })
    return results

from fastapi import Header
from services.vision_service import analyze_shelf_image, record_manual_audit

class ManualAuditFacing(BaseModel):
    product_id: Optional[int] = None
    sku_name: str
    brand: str
    is_aci: bool = False
    facing_count: int = 0
    observed_price: Optional[float] = None
    is_out_of_stock: bool = False

class ManualAuditCreate(BaseModel):
    outlet_id: int
    shelf_section: str = "staples"
    field_notes: Optional[str] = None
    posm_present: bool = False
    posm_type: Optional[str] = None
    facings: List[ManualAuditFacing]

@router.post("/captures/analyze")
async def analyze_capture(
    file: UploadFile = File(...),
    outlet_id: int = Form(...),
    shelf_section: str = Form("staples"),
    field_notes: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    outlet = db.query(models.Outlet).filter(models.Outlet.id == outlet_id).first()
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file uploaded")

    # Helper to validate Google API key formats (both AIza... and AQ.... prefixes supported)
    def _is_valid_key(k: Optional[str]) -> bool:
        if not k:
            return False
        clean = k.strip()
        return len(clean) >= 15 and clean != "AIza..." and not clean.startswith("dummy")

    resolved_api_key = api_key if _is_valid_key(api_key) else None
    user_id = None

    if not resolved_api_key and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            from core import security
            import jwt
            payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
            staff_id = payload.get("sub")
            if staff_id:
                user = db.query(models.User).filter(models.User.staff_id == staff_id).first()
                if user:
                    user_id = user.id
                    if _is_valid_key(user.gemini_api_key):
                        resolved_api_key = user.gemini_api_key
        except Exception:
            pass

    if not resolved_api_key:
        from core.config import settings
        env_key = settings.GEMINI_API_KEY
        if _is_valid_key(env_key):
            resolved_api_key = env_key

    if not resolved_api_key:
        raise HTTPException(
            status_code=400,
            detail="A valid Google Gemini API Key is required for vision analysis. Please provide your Gemini API key in the form or save it in your account settings."
        )

    try:
        result = analyze_shelf_image(
            file_bytes=contents,
            filename=file.filename or "shelf.jpg",
            outlet=outlet,
            shelf_section=shelf_section,
            field_notes=field_notes,
            api_key=resolved_api_key,
            user_id=user_id,
            db=db,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini Vision analysis error: {str(e)}")

@router.post("/captures/manual", status_code=status.HTTP_201_CREATED)
def manual_audit_capture(
    audit_in: ManualAuditCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    outlet = db.query(models.Outlet).filter(models.Outlet.id == audit_in.outlet_id).first()
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            from core import security
            import jwt
            payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
            staff_id = payload.get("sub")
            if staff_id:
                user = db.query(models.User).filter(models.User.staff_id == staff_id).first()
                if user:
                    user_id = user.id
        except Exception:
            pass

    result = record_manual_audit(
        outlet=outlet,
        shelf_section=audit_in.shelf_section,
        field_notes=audit_in.field_notes,
        facings_input=[f.dict() for f in audit_in.facings],
        posm_present=audit_in.posm_present,
        posm_type=audit_in.posm_type,
        user_id=user_id,
        db=db,
    )
    return result

@router.get("/captures/{capture_id}")
def get_capture(capture_id: int, db: Session = Depends(get_db)):
    capture = db.query(models.ShelfCapture).filter(models.ShelfCapture.id == capture_id).first()
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    
    return {
        "id": capture.id,
        "outlet_name": capture.outlet.name if capture.outlet else "Unknown",
        "shelf_section": capture.shelf_section,
        "image_url": capture.image_url,
        "field_notes": capture.field_notes,
        "total_facings": capture.total_facings,
        "aci_facings": capture.aci_facings,
        "competitor_facings": capture.competitor_facings,
        "aci_shelf_share": capture.aci_shelf_share,
        "posm_present": capture.posm_present,
        "posm_type": capture.posm_type,
        "created_at": capture.created_at.strftime("%b %d, %Y - %I:%M %p"),
        "detections": [
            {
                "id": d.id,
                "sku_name": d.sku_name,
                "brand": d.brand,
                "is_aci": d.is_aci,
                "facing_count": d.facing_count,
                "observed_price": d.observed_price,
                "is_out_of_stock": d.is_out_of_stock,
                "confidence": d.confidence,
            }
            for d in capture.detections
        ],
    }

# -------------------------------------------------------------
# Recommendations
# -------------------------------------------------------------

@router.patch("/recommendations/{rec_id}/status")
def update_recommendation_status(rec_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    rec = db.query(models.Recommendation).filter(models.Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = payload.status
    db.commit()
    return {"message": "Status updated", "id": rec.id, "status": rec.status}

# -------------------------------------------------------------
# Analytics APIs
# -------------------------------------------------------------

@router.get("/analytics/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    # 1. Total and ACI facings across all captures
    captures = db.query(models.ShelfCapture).all()
    total_facings = sum(c.total_facings for c in captures)
    aci_facings = sum(c.aci_facings for c in captures)
    
    if total_facings > 0:
        aci_shelf_share = round(aci_facings / total_facings * 100, 1)
        competitor_share = round(100.0 - aci_shelf_share, 1)
    else:
        aci_shelf_share = 0.0
        competitor_share = 0.0

    # 2. Distinct audited outlets
    audited_outlet_ids = db.query(models.ShelfCapture.outlet_id).distinct().all()
    outlets_audited_count = len(audited_outlet_ids)
    total_outlets_count = db.query(models.Outlet).count()

    # 3. Open stockouts (distinct SKUs)
    open_stockouts_count = db.query(models.Recommendation.sku_code).filter(
        models.Recommendation.issue_type == "Stock-out",
        models.Recommendation.status == "open"
    ).distinct().count()

    # 4. Brand share breakdown calculated from all Detections
    brand_facings = (
        db.query(models.Detection.brand, func.sum(models.Detection.facing_count))
        .group_by(models.Detection.brand)
        .all()
    )

    brand_shares = []
    total_detection_facings = sum(cnt for _, cnt in brand_facings if cnt) or 1
    
    for brand, cnt in brand_facings:
        if not brand or not cnt:
            continue
        share_pct = round((cnt / total_detection_facings) * 100, 1)
        is_aci = (brand == "ACI")
        brand_shares.append({
            "brand": brand,
            "facings": cnt,
            "share_pct": share_pct,
            "is_aci": is_aci,
            "color": "#f59e0b" if is_aci else "#831843",
        })

    # Sort brand shares: ACI first, then descending by share
    brand_shares.sort(key=lambda x: (not x["is_aci"], -x["share_pct"]))

    # 5. Open recommendations queue
    open_recs = (
        db.query(models.Recommendation)
        .filter(models.Recommendation.status == "open")
        .order_by(models.Recommendation.priority.asc(), models.Recommendation.created_at.desc())
        .limit(10)
        .all()
    )
    recommendations_list = []
    for r in open_recs:
        recommendations_list.append({
            "id": r.id,
            "sku_code": r.sku_code,
            "sku_name": r.sku_name,
            "issue_type": r.issue_type,
            "priority": r.priority,
            "description": r.description,
            "assigned_to": r.assigned_to,
            "outlet_name": r.outlet.name if r.outlet else "Unknown Outlet",
            "outlet_id": r.outlet_id,
            "created_at": r.created_at.strftime("%b %d"),
        })

    return {
        "aci_shelf_share": aci_shelf_share,
        "competitor_shelf_share": competitor_share,
        "open_stock_outs": open_stockouts_count,
        "outlets_audited": outlets_audited_count,
        "total_outlets": total_outlets_count,
        "total_facings": total_facings,
        "total_analyses": len(captures),
        "brand_shares": brand_shares,
        "recommendations": recommendations_list,
    }

@router.get("/analytics/insights")
def get_insights_analytics(db: Session = Depends(get_db)):
    # 1. Stockout frequency by SKU
    stockouts_by_sku = (
        db.query(
            models.Recommendation.sku_code,
            models.Recommendation.sku_name,
            func.count(models.Recommendation.id).label("count")
        )
        .filter(models.Recommendation.issue_type == "Stock-out")
        .group_by(models.Recommendation.sku_code, models.Recommendation.sku_name)
        .order_by(func.count(models.Recommendation.id).desc())
        .all()
    )

    stockouts_summary = []
    for code, name, cnt in stockouts_by_sku:
        affected_outlets = [
            r.outlet.name for r in db.query(models.Recommendation)
            .filter(models.Recommendation.sku_code == code)
            .all() if r.outlet
        ]
        stockouts_summary.append({
            "sku_code": code,
            "sku_name": name,
            "frequency": cnt,
            "affected_outlets": list(set(affected_outlets)),
            "priority": "High" if cnt >= 2 else "Medium",
        })

    # 2. Price compliance & variance (MRP vs observed price)
    products = db.query(models.Product).all()
    price_variance = []
    for p in products:
        observed = (
            db.query(func.avg(models.Detection.observed_price))
            .filter(models.Detection.sku_name.ilike(f"%{p.name}%"))
            .scalar()
        )
        if observed:
            obs_val = round(float(observed), 1)
            diff = round(obs_val - p.mrp, 1)
            price_variance.append({
                "sku_code": p.sku_code,
                "name": p.name,
                "brand": p.brand,
                "is_aci": p.is_aci,
                "mrp": p.mrp,
                "observed_avg": obs_val,
                "variance": diff,
                "status": "Compliant" if abs(diff) <= 1.0 else ("Overpriced" if diff > 1.0 else "Discounted"),
            })

    # 3. Distribution gaps: ACI products absent from audited outlets
    aci_products = db.query(models.Product).filter(models.Product.is_aci == True).all()
    outlets = db.query(models.Outlet).all()
    distribution_gaps = []

    for o in outlets:
        # Check which ACI SKUs appeared in detections for this outlet
        detected_skus = set(
            d.sku_name for d in db.query(models.Detection)
            .join(models.ShelfCapture)
            .filter(models.ShelfCapture.outlet_id == o.id)
            .all()
        )
        missing_skus = [p for p in aci_products if not any(p.name in d_sku for d_sku in detected_skus)]
        for m in missing_skus:
            distribution_gaps.append({
                "outlet_name": o.name,
                "outlet_city": o.city,
                "channel": o.channel,
                "sku_code": m.sku_code,
                "sku_name": m.name,
                "category": m.category,
                "target_share": f"{m.target_shelf_share}%",
            })

    # 4. Category-wise shelf share
    categories = ["staples", "cooking", "beverages", "spices"]
    category_breakdown = []
    for cat in categories:
        caps = db.query(models.ShelfCapture).filter(models.ShelfCapture.shelf_section == cat).all()
        tot = sum(c.total_facings for c in caps)
        aci = sum(c.aci_facings for c in caps)
        share = round((aci / tot * 100) if tot > 0 else 0.0, 1)
        category_breakdown.append({
            "category": cat.capitalize(),
            "total_facings": tot,
            "aci_facings": aci,
            "aci_shelf_share": share,
            "competitor_share": round(100.0 - share, 1) if tot > 0 else 0.0,
        })

    return {
        "stockout_frequency": stockouts_summary,
        "price_variance": price_variance,
        "distribution_gaps": distribution_gaps[:15],
        "category_breakdown": category_breakdown,
    }
