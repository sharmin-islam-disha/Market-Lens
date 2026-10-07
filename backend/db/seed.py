from sqlalchemy.orm import Session
from db import models

def seed_initial_data(db: Session, force: bool = False):
    """Seed FMCG product catalog if database is empty."""
    product_count = db.query(models.Product).count()
    if product_count > 0 and not force:
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

    # Products (SKUs)
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
