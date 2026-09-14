from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db import models

def seed_initial_data(db: Session, force: bool = False):
    """Seed FMCG retail master data if database is empty."""
    outlet_count = db.query(models.Outlet).count()
    if outlet_count > 0 and not force:
        return

    # Clear existing non-user data if forced
    if force:
        db.query(models.Detection).delete()
        db.query(models.Recommendation).delete()
        db.query(models.ShelfCapture).delete()
        db.query(models.Visit).delete()
        db.query(models.Product).delete()
        db.query(models.Outlet).delete()
        db.commit()

    # 1. Outlets
    outlets_data = [
        models.Outlet(
            code="OUT-DHK-001",
            name="Agora Superstore - Gulshan 2",
            channel="Supermarket",
            address="Plot 12, Road 45, Gulshan 2, Dhaka",
            city="Dhaka",
            contact_person="Rafiqul Islam",
            phone="+8801711223344",
        ),
        models.Outlet(
            code="OUT-DHK-002",
            name="Meena Bazar - Dhanmondi 27",
            channel="Supermarket",
            address="House 44, Road 27, Dhanmondi, Dhaka",
            city="Dhaka",
            contact_person="Farhana Akhtar",
            phone="+8801722334455",
        ),
        models.Outlet(
            code="OUT-DHK-003",
            name="Shwapno - Banani 11",
            channel="Supermarket",
            address="Road 11, Block D, Banani, Dhaka",
            city="Dhaka",
            contact_person="Tariq Mahmud",
            phone="+8801733445566",
        ),
        models.Outlet(
            code="OUT-DHK-004",
            name="Unimart - Gulshan Center Point",
            channel="Hypermarket",
            address="Gulshan Center Point, Gulshan 2, Dhaka",
            city="Dhaka",
            contact_person="Kamrul Hasan",
            phone="+8801744556677",
        ),
        models.Outlet(
            code="OUT-CTG-001",
            name="Meena Bazar - Agrabad Commercial Area",
            channel="Supermarket",
            address="Agrabad C/A, Chittagong",
            city="Chittagong",
            contact_person="Nasir Uddin",
            phone="+8801755667788",
        ),
        models.Outlet(
            code="OUT-DHK-005",
            name="Prince Bazar - Mirpur 1",
            channel="Departmental Store",
            address="Section 1, Mirpur, Dhaka",
            city="Dhaka",
            contact_person="Jahangir Alam",
            phone="+8801766778899",
        ),
    ]
    db.add_all(outlets_data)
    db.commit()

    # 2. Products (SKUs)
    products_data = [
        # ACI Products
        models.Product(sku_code="ACI-FLOUR-2KG", name="ACI Pure Atta 2kg", brand="ACI", category="staples", is_aci=True, mrp=145.0, target_shelf_share=35.0),
        models.Product(sku_code="ACI-FLOUR-1KG", name="ACI Pure Maida 1kg", brand="ACI", category="staples", is_aci=True, mrp=80.0, target_shelf_share=30.0),
        models.Product(sku_code="ACI-SALT-1KG", name="ACI Pure Vacuum Salt 1kg", brand="ACI", category="cooking", is_aci=True, mrp=42.0, target_shelf_share=45.0),
        models.Product(sku_code="ACI-SUGAR-1KG", name="ACI Pure Brown Sugar 1kg", brand="ACI", category="staples", is_aci=True, mrp=160.0, target_shelf_share=25.0),
        models.Product(sku_code="ACI-SPICE-CHILI-100G", name="ACI Pure Chili Powder 100g", brand="ACI", category="cooking", is_aci=True, mrp=95.0, target_shelf_share=35.0),
        models.Product(sku_code="ACI-SPICE-TURM-100G", name="ACI Pure Turmeric Powder 100g", brand="ACI", category="cooking", is_aci=True, mrp=85.0, target_shelf_share=35.0),
        models.Product(sku_code="ACI-NUTRILIFE-SOY", name="ACI Nutrilife Soya Oil 5L", brand="ACI", category="cooking", is_aci=True, mrp=820.0, target_shelf_share=25.0),
        models.Product(sku_code="ACI-TEA-400G", name="ACI Aroma Tea 400g", brand="ACI", category="beverages", is_aci=True, mrp=240.0, target_shelf_share=20.0),

        # Competitor Products
        models.Product(sku_code="PRAN-FLOUR-2KG", name="Pran Special Atta 2kg", brand="Pran", category="staples", is_aci=False, mrp=140.0, target_shelf_share=20.0),
        models.Product(sku_code="PRAN-SALT-1KG", name="Pran Iodized Salt 1kg", brand="Pran", category="cooking", is_aci=False, mrp=40.0, target_shelf_share=20.0),
        models.Product(sku_code="PRAN-MANGO-1L", name="Pran Frooto Mango Juice 1L", brand="Pran", category="beverages", is_aci=False, mrp=120.0, target_shelf_share=30.0),
        models.Product(sku_code="FRESH-FLOUR-2KG", name="Fresh Fortified Atta 2kg", brand="Fresh", category="staples", is_aci=False, mrp=145.0, target_shelf_share=20.0),
        models.Product(sku_code="FRESH-SUGAR-1KG", name="Fresh Refined Sugar 1kg", brand="Fresh", category="staples", is_aci=False, mrp=155.0, target_shelf_share=30.0),
        models.Product(sku_code="TEER-FLOUR-2KG", name="Teer Whole Wheat Atta 2kg", brand="Teer", category="staples", is_aci=False, mrp=142.0, target_shelf_share=15.0),
        models.Product(sku_code="TEER-OIL-5L", name="Teer Pure Soybean Oil 5L", brand="Teer", category="cooking", is_aci=False, mrp=815.0, target_shelf_share=25.0),
        models.Product(sku_code="NESTLE-MAGGI-8", name="Maggi 2-Minute Noodles 8pk", brand="Nestle", category="staples", is_aci=False, mrp=190.0, target_shelf_share=40.0),
        models.Product(sku_code="BDFOOD-MUSTARD-500", name="BdFood Pure Mustard Oil 500ml", brand="BdFood", category="cooking", is_aci=False, mrp=185.0, target_shelf_share=15.0),
    ]
    db.add_all(products_data)
    db.commit()

    # 3. Visits
    now = datetime.utcnow()
    visits_data = [
        models.Visit(outlet_id=outlets_data[0].id, rep_name="Tanim Ahmed", visit_date=now - timedelta(days=1), status="completed", notes="Quarterly execution audit for staples aisle."),
        models.Visit(outlet_id=outlets_data[1].id, rep_name="Sadia Jahan", visit_date=now - timedelta(days=2), status="completed", notes="Stock-out check and POSM compliance verified."),
        models.Visit(outlet_id=outlets_data[2].id, rep_name="Tanim Ahmed", visit_date=now - timedelta(days=3), status="completed", notes="Full shelf audit on cooking and staples."),
        models.Visit(outlet_id=outlets_data[3].id, rep_name="Mahmudur Rahman", visit_date=now - timedelta(days=4), status="completed", notes="End-cap display inspected."),
        models.Visit(outlet_id=outlets_data[4].id, rep_name="Zubair Khan", visit_date=now - timedelta(days=5), status="completed", notes="Chittagong central branch routine audit."),
        models.Visit(outlet_id=outlets_data[5].id, rep_name="Tanim Ahmed", visit_date=now + timedelta(days=2), status="scheduled", notes="Upcoming weekend restocking verification."),
    ]
    db.add_all(visits_data)
    db.commit()

    # 4. Shelf Captures & Detections (14 historical analyses generating ~783 facings)
    captures_specs = [
        # (outlet_idx, visit_idx, section, aci_fac, pran_fac, fresh_fac, teer_fac, nestle_fac, bdfood_fac, posm, posm_type)
        (0, 0, "staples", 32, 28, 14, 12, 10, 0, True, "ACI Pure End-cap Header"),
        (0, 0, "cooking", 26, 18, 12, 15, 0, 8, False, None),
        (1, 1, "staples", 22, 25, 10, 10, 8, 0, False, None),
        (1, 1, "cooking", 18, 15, 14, 12, 0, 6, True, "Shelf-talker Strip"),
        (2, 2, "staples", 28, 30, 12, 14, 12, 0, True, "Aroma Hanging Banner"),
        (2, 2, "cooking", 20, 22, 10, 16, 0, 7, False, None),
        (3, 3, "staples", 35, 32, 16, 14, 15, 0, True, "End-cap Gondola"),
        (3, 3, "cooking", 30, 24, 15, 18, 0, 10, True, "Pure Salt Display Hanger"),
        (4, 4, "staples", 20, 26, 12, 10, 8, 0, False, None),
        (4, 4, "cooking", 15, 18, 8, 12, 0, 5, False, None),
        (0, 0, "beverages", 14, 22, 0, 0, 0, 0, False, None),
        (1, 1, "beverages", 12, 18, 0, 0, 0, 0, False, None),
        (2, 2, "beverages", 10, 16, 0, 0, 0, 0, False, None),
        (3, 3, "beverages", 16, 20, 0, 0, 0, 0, True, "Frooto Island Display"),
    ]

    for idx, (o_i, v_i, sec, a_f, p_f, f_f, t_f, n_f, b_f, posm, posm_t) in enumerate(captures_specs):
        tot_comp = p_f + f_f + t_f + n_f + b_f
        tot = a_f + tot_comp
        share = round((a_f / tot * 100) if tot > 0 else 0, 1)

        cap = models.ShelfCapture(
            outlet_id=outlets_data[o_i].id,
            visit_id=visits_data[v_i].id if v_i < len(visits_data) else None,
            shelf_section=sec,
            image_url=f"/uploads/mock_shelf_{sec}_{idx + 1}.jpg",
            field_notes=f"Audit captured on {sec} gondola",
            total_facings=tot,
            aci_facings=a_f,
            competitor_facings=tot_comp,
            aci_shelf_share=share,
            posm_present=posm,
            posm_type=posm_t,
            created_at=now - timedelta(days=idx % 5, hours=idx),
        )
        db.add(cap)
        db.flush()

        # Add SKU detections for this capture
        if a_f > 0:
            db.add(models.Detection(
                capture_id=cap.id,
                sku_name="ACI Pure Atta 2kg" if sec == "staples" else ("ACI Pure Vacuum Salt 1kg" if sec == "cooking" else "ACI Aroma Tea 400g"),
                brand="ACI",
                is_aci=True,
                facing_count=a_f,
                observed_price=145.0 if sec == "staples" else (42.0 if sec == "cooking" else 240.0),
                is_out_of_stock=False,
                confidence=0.96,
            ))
        if p_f > 0:
            db.add(models.Detection(
                capture_id=cap.id,
                sku_name="Pran Special Atta 2kg" if sec == "staples" else ("Pran Iodized Salt 1kg" if sec == "cooking" else "Pran Frooto Mango 1L"),
                brand="Pran",
                is_aci=False,
                facing_count=p_f,
                observed_price=140.0 if sec == "staples" else (40.0 if sec == "cooking" else 120.0),
                is_out_of_stock=False,
                confidence=0.94,
            ))
        if f_f > 0:
            db.add(models.Detection(
                capture_id=cap.id,
                sku_name="Fresh Fortified Atta 2kg",
                brand="Fresh",
                is_aci=False,
                facing_count=f_f,
                observed_price=145.0,
                is_out_of_stock=False,
                confidence=0.93,
            ))
        if t_f > 0:
            db.add(models.Detection(
                capture_id=cap.id,
                sku_name="Teer Whole Wheat Atta 2kg" if sec == "staples" else "Teer Pure Soybean Oil 5L",
                brand="Teer",
                is_aci=False,
                facing_count=t_f,
                observed_price=142.0 if sec == "staples" else 815.0,
                is_out_of_stock=False,
                confidence=0.95,
            ))
        if n_f > 0:
            db.add(models.Detection(
                capture_id=cap.id,
                sku_name="Maggi 2-Minute Noodles 8pk",
                brand="Nestle",
                is_aci=False,
                facing_count=n_f,
                observed_price=190.0,
                is_out_of_stock=False,
                confidence=0.91,
            ))
        if b_f > 0:
            db.add(models.Detection(
                capture_id=cap.id,
                sku_name="BdFood Pure Mustard Oil 500ml",
                brand="BdFood",
                is_aci=False,
                facing_count=b_f,
                observed_price=185.0,
                is_out_of_stock=False,
                confidence=0.90,
            ))

    # 5. Recommendations (for open stock-outs and execution opportunities)
    recommendations_data = [
        models.Recommendation(
            outlet_id=outlets_data[0].id,
            sku_code="ACI-FLOUR-2KG",
            sku_name="ACI Pure Atta 2kg",
            issue_type="Stock-out",
            priority="High",
            description="Restock ACI Pure Atta 2kg — detected as out of stock on audited shelf.",
            assigned_to="field-team",
            status="open",
        ),
        models.Recommendation(
            outlet_id=outlets_data[1].id,
            sku_code="ACI-SPICE-CHILI-100G",
            sku_name="ACI Pure Chili Powder 100g",
            issue_type="Stock-out",
            priority="High",
            description="Zero facings detected in spices rack. Request priority replenishment.",
            assigned_to="field-team",
            status="open",
        ),
        models.Recommendation(
            outlet_id=outlets_data[2].id,
            sku_code="ACI-SALT-1KG",
            sku_name="ACI Pure Vacuum Salt 1kg",
            issue_type="Stock-out",
            priority="High",
            description="Safety stock breached. Competitor Pran Salt is dominating aisle eye-level.",
            assigned_to="field-team",
            status="open",
        ),
        models.Recommendation(
            outlet_id=outlets_data[4].id,
            sku_code="ACI-SUGAR-1KG",
            sku_name="ACI Pure Brown Sugar 1kg",
            issue_type="Stock-out",
            priority="Medium",
            description="Brown sugar empty for consecutive visits. Confirm distributor stock in CTG depot.",
            assigned_to="field-team",
            status="open",
        ),
        models.Recommendation(
            outlet_id=outlets_data[3].id,
            sku_code="ACI-NUTRILIFE-SOY",
            sku_name="ACI Nutrilife Soya Oil 5L",
            issue_type="Low Shelf Share",
            priority="Medium",
            description="Shelf share 18% is below 25% target. Competitor Teer Oil has expanded 3 extra facings.",
            assigned_to="merchandiser",
            status="open",
        ),
        models.Recommendation(
            outlet_id=outlets_data[5].id,
            sku_code="ACI-TEA-400G",
            sku_name="ACI Aroma Tea 400g",
            issue_type="Missing Distribution",
            priority="Medium",
            description="Core SKU missing from outlet listing. Pitch placement during next manager meeting.",
            assigned_to="sales-lead",
            status="open",
        ),
        models.Recommendation(
            outlet_id=outlets_data[0].id,
            sku_code="ACI-SPICE-TURM-100G",
            sku_name="ACI Pure Turmeric Powder 100g",
            issue_type="Stock-out",
            priority="High",
            description="Turmeric 100g completely exhausted; shelf slot occupied by competitor.",
            assigned_to="field-team",
            status="open",
        ),
    ]
    db.add_all(recommendations_data)
    db.commit()
