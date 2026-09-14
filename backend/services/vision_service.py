import os
import json
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
import httpx

from db import models

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def analyze_shelf_image(
    file_bytes: bytes,
    filename: str,
    outlet: models.Outlet,
    shelf_section: str,
    field_notes: str | None,
    api_key: str | None,
    user_id: int | None,
    db: Session,
) -> dict:
    """
    Run real multimodal vision detection on an uploaded shelf image using Google Gemini VLM.
    Matches against the user's actual registered product catalog.
    No mock, simulated, or random data is ever generated.
    """
    clean_key = (api_key or "").strip()
    if not clean_key or len(clean_key) < 15 or clean_key == "AIza..." or clean_key.startswith("dummy"):
        raise ValueError(
            "A valid Google Gemini API Key is required to analyze shelf images. "
            "Please configure your Gemini API Key in Onboarding or provide it in the capture form."
        )

    # 1. Save uploaded image file locally
    ext = os.path.splitext(filename)[1] or ".jpg"
    unique_filename = f"capture_{uuid.uuid4().hex[:10]}_{int(datetime.utcnow().timestamp())}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    
    image_url = f"/uploads/{unique_filename}"

    # 2. Query registered catalog products to ground the vision model
    catalog_products = db.query(models.Product).all()

    # 3. Execute real Gemini Vision analysis on the image
    analysis_data = _run_gemini_vision(
        image_bytes=file_bytes,
        shelf_section=shelf_section,
        outlet_name=outlet.name,
        catalog_products=catalog_products,
        api_key=api_key,
    )

    # 4. Compute metrics from real detections
    total_facings = int(analysis_data.get("total_facings", 0))
    aci_facings = int(analysis_data.get("aci_facings", 0))
    comp_facings = int(analysis_data.get("competitor_facings", max(0, total_facings - aci_facings)))
    shelf_share = round((aci_facings / total_facings * 100) if total_facings > 0 else 0.0, 1)
    posm_present = bool(analysis_data.get("posm_present", False))
    posm_type = analysis_data.get("posm_type")

    # 5. Persist ShelfCapture record
    capture = models.ShelfCapture(
        outlet_id=outlet.id,
        user_id=user_id,
        shelf_section=shelf_section,
        image_url=image_url,
        field_notes=field_notes,
        total_facings=total_facings,
        aci_facings=aci_facings,
        competitor_facings=comp_facings,
        aci_shelf_share=shelf_share,
        posm_present=posm_present,
        posm_type=posm_type,
        analysis_raw=json.dumps(analysis_data),
        created_at=datetime.utcnow(),
    )
    db.add(capture)
    db.flush()

    # 6. Save Detection records and create recommendations for out-of-stock items
    created_detections = []
    for item in analysis_data.get("detections", []):
        # Match with catalog product if possible
        matched_prod = None
        for p in catalog_products:
            if p.sku_code == item.get("sku_code") or p.name.lower() in item.get("sku_name", "").lower():
                matched_prod = p
                break

        is_aci = bool(item.get("is_aci", matched_prod.is_aci if matched_prod else False))
        facing_count = int(item.get("facing_count", 0))
        is_oos = bool(item.get("is_out_of_stock", False) or facing_count == 0)

        detection = models.Detection(
            capture_id=capture.id,
            product_id=matched_prod.id if matched_prod else None,
            sku_name=item.get("sku_name", "Unknown SKU"),
            brand=item.get("brand", matched_prod.brand if matched_prod else "Competitor"),
            is_aci=is_aci,
            facing_count=facing_count,
            observed_price=float(item["observed_price"]) if item.get("observed_price") is not None else None,
            is_out_of_stock=is_oos,
            confidence=float(item.get("confidence", 0.90)),
        )
        db.add(detection)
        created_detections.append({
            "sku_name": detection.sku_name,
            "brand": detection.brand,
            "is_aci": detection.is_aci,
            "facing_count": detection.facing_count,
            "observed_price": detection.observed_price,
            "is_out_of_stock": detection.is_out_of_stock,
            "confidence": detection.confidence,
        })

        # Auto-create recommendation if an ACI product is out of stock
        if is_aci and is_oos:
            rec = models.Recommendation(
                outlet_id=outlet.id,
                product_id=matched_prod.id if matched_prod else None,
                sku_code=matched_prod.sku_code if matched_prod else "ACI-SKU",
                sku_name=detection.sku_name,
                issue_type="Stock-out",
                priority="High",
                description=f"Immediate Restock: {detection.sku_name} detected as out-of-stock during shelf audit at {outlet.name}.",
                assigned_to="field-team",
                status="open",
            )
            db.add(rec)

    db.commit()

    return {
        "id": capture.id,
        "outlet_id": outlet.id,
        "outlet_name": outlet.name,
        "shelf_section": shelf_section,
        "image_url": image_url,
        "total_facings": total_facings,
        "aci_facings": aci_facings,
        "competitor_facings": comp_facings,
        "aci_shelf_share": shelf_share,
        "posm_present": posm_present,
        "posm_type": posm_type,
        "detections": created_detections,
        "created_at": capture.created_at.isoformat(),
    }

def record_manual_audit(
    outlet: models.Outlet,
    shelf_section: str,
    field_notes: str | None,
    facings_input: list[dict],
    posm_present: bool,
    posm_type: str | None,
    user_id: int | None,
    db: Session,
) -> dict:
    """
    Record an authentic manual shelf audit conducted by a field representative without AI.
    Saves verified facing counts, calculates real shelf share, and generates alerts.
    """
    total_facings = sum(int(f.get("facing_count", 0)) for f in facings_input)
    aci_facings = sum(int(f.get("facing_count", 0)) for f in facings_input if f.get("is_aci"))
    comp_facings = max(0, total_facings - aci_facings)
    shelf_share = round((aci_facings / total_facings * 100) if total_facings > 0 else 0.0, 1)

    capture = models.ShelfCapture(
        outlet_id=outlet.id,
        user_id=user_id,
        shelf_section=shelf_section,
        image_url="/placeholder_manual_audit.jpg",
        field_notes=field_notes,
        total_facings=total_facings,
        aci_facings=aci_facings,
        competitor_facings=comp_facings,
        aci_shelf_share=shelf_share,
        posm_present=posm_present,
        posm_type=posm_type,
        analysis_raw=json.dumps({"type": "manual_audit", "items": facings_input}),
        created_at=datetime.utcnow(),
    )
    db.add(capture)
    db.flush()

    created_detections = []
    for f in facings_input:
        is_aci = bool(f.get("is_aci", False))
        count = int(f.get("facing_count", 0))
        is_oos = bool(f.get("is_out_of_stock", False) or count == 0)

        detection = models.Detection(
            capture_id=capture.id,
            product_id=f.get("product_id"),
            sku_name=f.get("sku_name", "SKU"),
            brand=f.get("brand", "Unknown"),
            is_aci=is_aci,
            facing_count=count,
            observed_price=float(f["observed_price"]) if f.get("observed_price") is not None else None,
            is_out_of_stock=is_oos,
            confidence=1.0,
        )
        db.add(detection)
        created_detections.append({
            "sku_name": detection.sku_name,
            "brand": detection.brand,
            "is_aci": detection.is_aci,
            "facing_count": detection.facing_count,
            "observed_price": detection.observed_price,
            "is_out_of_stock": detection.is_out_of_stock,
            "confidence": 1.0,
        })

        if is_aci and is_oos:
            rec = models.Recommendation(
                outlet_id=outlet.id,
                product_id=f.get("product_id"),
                sku_code=f.get("sku_code", "ACI-SKU"),
                sku_name=detection.sku_name,
                issue_type="Stock-out",
                priority="High",
                description=f"Immediate Restock: {detection.sku_name} verified as out-of-stock during manual audit at {outlet.name}.",
                assigned_to="field-team",
                status="open",
            )
            db.add(rec)

    db.commit()

    return {
        "id": capture.id,
        "outlet_id": outlet.id,
        "outlet_name": outlet.name,
        "shelf_section": shelf_section,
        "total_facings": total_facings,
        "aci_facings": aci_facings,
        "competitor_facings": comp_facings,
        "aci_shelf_share": shelf_share,
        "posm_present": posm_present,
        "posm_type": posm_type,
        "detections": created_detections,
        "created_at": capture.created_at.isoformat(),
    }

def _run_gemini_vision(
    image_bytes: bytes,
    shelf_section: str,
    outlet_name: str,
    catalog_products: list,
    api_key: str,
) -> dict:
    """
    Call Google Gemini Multimodal Vision API with base64 encoded shelf image.
    Uses registered product catalog for precise detection.
    """
    import base64
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    catalog_lines = []
    for p in catalog_products:
        catalog_lines.append(f"- Code: {p.sku_code} | Name: {p.name} | Brand: {p.brand} | Is ACI: {p.is_aci} | MRP: {p.mrp}")
    
    catalog_str = "\n".join(catalog_lines) if catalog_lines else "(No products registered in catalog yet)"

    prompt = (
        f"You are an expert FMCG retail execution computer vision auditor analyzing an in-store shelf photograph taken at '{outlet_name}' for section '{shelf_section}'.\n\n"
        f"Our registered catalog products of interest are:\n"
        f"{catalog_str}\n\n"
        f"Task:\n"
        f"1. Examine the shelf photo carefully and identify all visible front-facing product packages.\n"
        f"2. For each detected product, determine its brand, whether it is an ACI product (is_aci = true) or competitor (is_aci = false), and count the EXACT visible facings.\n"
        f"3. If an ACI product appears to have an allocated shelf slot or price tag but 0 physical products are on the shelf (an empty gap or void), mark is_out_of_stock = true and facing_count = 0.\n"
        f"4. Look for promotional POSM (Point of Sale Materials like shelf-talkers, end-cap headers, wobblers, posters) and report if present.\n"
        f"5. Return a strict JSON object with no preamble, no explanation, no markdown:\n"
        f"{{\n"
        f'  "total_facings": <sum of all detected facings>,\n'
        f'  "aci_facings": <sum of ACI brand facings>,\n'
        f'  "competitor_facings": <sum of competitor facings>,\n'
        f'  "posm_present": <true or false>,\n'
        f'  "posm_type": <description of POSM or null>,\n'
        f'  "detections": [\n'
        f"    {{\n"
        f'      "sku_name": "<name of detected product>",\n'
        f'      "brand": "<brand name>",\n'
        f'      "is_aci": <boolean>,\n'
        f'      "facing_count": <integer count>,\n'
        f'      "observed_price": <number or null>,\n'
        f'      "is_out_of_stock": <boolean>,\n'
        f'      "confidence": <float between 0.8 and 1.0>\n'
        f"    }}\n"
        f"  ]\n"
        f"}}"
    )

    from core.config import settings
    # Prioritize active Google Gemini vision models (gemini-2.5-flash responds in ~1.5s with HTTP 200)
    models_to_try = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"]
    if settings.GEMINI_MODEL and settings.GEMINI_MODEL not in models_to_try:
        models_to_try.append(settings.GEMINI_MODEL)

    last_error = ""

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": b64_image,
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }

        try:
            # 20s timeout per attempt
            resp = httpx.post(url, json=payload, timeout=20.0)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = raw_text.strip()
                if "```json" in cleaned:
                    cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in cleaned:
                    cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()
                return json.loads(cleaned)
            else:
                last_error = f"{model} returned HTTP {resp.status_code}: {resp.text}"
                logger.warning(f"Gemini model {model} attempt failed: {last_error}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Gemini model {model} exception: {last_error}")

    raise RuntimeError(f"Gemini Vision API request failed across all models: {last_error}")
