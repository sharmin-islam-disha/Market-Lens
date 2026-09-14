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
