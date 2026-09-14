-- MarketLens Initial PostgreSQL Schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    name VARCHAR,
    gmail VARCHAR,
    hashed_password VARCHAR NOT NULL,
    gemini_api_key VARCHAR,
    is_supervisor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outlets (
    id SERIAL PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    channel VARCHAR NOT NULL,
    address TEXT,
    city VARCHAR NOT NULL,
    contact_person VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku_code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    brand VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    is_aci BOOLEAN DEFAULT FALSE,
    mrp DOUBLE PRECISION DEFAULT 0.0,
    target_shelf_share DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER REFERENCES outlets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rep_name VARCHAR NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shelf_captures (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER REFERENCES outlets(id) ON DELETE CASCADE,
    visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    shelf_section VARCHAR NOT NULL,
    image_url TEXT NOT NULL,
    field_notes TEXT,
    total_facings INTEGER DEFAULT 0,
    aci_facings INTEGER DEFAULT 0,
    competitor_facings INTEGER DEFAULT 0,
    aci_shelf_share DOUBLE PRECISION DEFAULT 0.0,
    posm_present BOOLEAN DEFAULT FALSE,
    posm_type VARCHAR,
    analysis_raw TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    capture_id INTEGER REFERENCES shelf_captures(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    sku_name VARCHAR NOT NULL,
    brand VARCHAR NOT NULL,
    is_aci BOOLEAN DEFAULT FALSE,
    facing_count INTEGER DEFAULT 0,
    observed_price DOUBLE PRECISION,
    is_out_of_stock BOOLEAN DEFAULT FALSE,
    confidence DOUBLE PRECISION DEFAULT 0.90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER REFERENCES outlets(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    sku_code VARCHAR NOT NULL,
    sku_name VARCHAR NOT NULL,
    issue_type VARCHAR NOT NULL,
    priority VARCHAR NOT NULL,
    description TEXT NOT NULL,
    assigned_to VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Administrator User (initial password = supervisor)
INSERT INTO users (staff_id, email, full_name, name, gmail, hashed_password, is_supervisor)
VALUES (
    'supervisor',
    'supervisor@aci.com',
    'System Supervisor',
    'System Supervisor',
    'supervisor@aci.com',
    '$2b$12$KkQZpP4f.y6a25/C.Yw2H.c26X3Xm02yQe3ePq/0ZqQxY5x/jXnI2',
    TRUE
)
ON CONFLICT (staff_id) DO NOTHING;

-- Seed FMCG Master Product Catalog
INSERT INTO products (sku_code, name, brand, category, is_aci, mrp, target_shelf_share)
VALUES
    ('ACI-FLOUR-2KG', 'ACI Pure Atta 2kg', 'ACI', 'staples', TRUE, 145.0, 35.0),
    ('ACI-FLOUR-1KG', 'ACI Pure Maida 1kg', 'ACI', 'staples', TRUE, 80.0, 30.0),
    ('ACI-SALT-1KG', 'ACI Pure Vacuum Salt 1kg', 'ACI', 'cooking', TRUE, 42.0, 45.0),
    ('ACI-SUGAR-1KG', 'ACI Pure Brown Sugar 1kg', 'ACI', 'staples', TRUE, 160.0, 25.0),
    ('ACI-SPICE-CHILI-100G', 'ACI Pure Chili Powder 100g', 'ACI', 'cooking', TRUE, 95.0, 35.0),
    ('ACI-SPICE-TURM-100G', 'ACI Pure Turmeric Powder 100g', 'ACI', 'cooking', TRUE, 85.0, 35.0),
    ('ACI-NUTRILIFE-SOY', 'ACI Nutrilife Soya Oil 5L', 'ACI', 'cooking', TRUE, 820.0, 25.0),
    ('ACI-TEA-400G', 'ACI Aroma Tea 400g', 'ACI', 'beverages', TRUE, 240.0, 20.0),
    ('PRAN-FLOUR-2KG', 'Pran Special Atta 2kg', 'Pran', 'staples', FALSE, 140.0, 20.0),
    ('PRAN-SALT-1KG', 'Pran Iodized Salt 1kg', 'Pran', 'cooking', FALSE, 40.0, 20.0),
    ('PRAN-MANGO-1L', 'Pran Frooto Mango Juice 1L', 'Pran', 'beverages', FALSE, 120.0, 30.0),
    ('FRESH-FLOUR-2KG', 'Fresh Fortified Atta 2kg', 'Fresh', 'staples', FALSE, 145.0, 20.0),
    ('FRESH-SUGAR-1KG', 'Fresh Refined Sugar 1kg', 'Fresh', 'staples', FALSE, 155.0, 30.0),
    ('TEER-FLOUR-2KG', 'Teer Whole Wheat Atta 2kg', 'Teer', 'staples', FALSE, 142.0, 15.0),
    ('TEER-OIL-5L', 'Teer Pure Soybean Oil 5L', 'Teer', 'cooking', FALSE, 815.0, 25.0),
    ('LAYS-CLASSIC', 'Lay''s Classic Chips', 'Lay''s', 'beverages', FALSE, 50.0, 15.0),
    ('LAYS-SOUR-CREAM', 'Lay''s Sour Cream & Onion Chips', 'Lay''s', 'beverages', FALSE, 50.0, 15.0),
    ('LAYS-BARBECUE', 'Lay''s Barbecue Chips', 'Lay''s', 'beverages', FALSE, 50.0, 15.0)
ON CONFLICT (sku_code) DO NOTHING;
