# MarketLens — Production Deployment

Production orchestration for **MarketLens** (ACI Retail Execution Intelligence).

Maintainer: sharmin.islam@aci-bd.com

---

## Repository Structure

```
deploy branch
├── prod.docker-compose.yml   # Production stack (pull from registry, no local build)
├── env.example               # Environment variable template
├── nginx/
│   └── nginx.conf            # Nginx server block (mounted to conf.d/default.conf)
├── data/
│   └── init.sql              # DB schema + seed data — run once on first deploy
├── DEPLOY-COMPOSE-GUIDE.md   # ACI standard compose guide
└── README.md
```

---

## Seed Data

The file `data/init.sql` contains the full PostgreSQL schema and initial seed data:

- **Tables**: `users`, `outlets`, `products`, `visits`, `shelf_captures`, `detections`, `recommendations`
- **Seed**: 1 supervisor user (`staff_id: supervisor`, password: `supervisor`) + 18 FMCG product SKUs (ACI + competitors)

> **Run once on first deploy** after provisioning the central DB (see Step 2 below).

---

## Deployment Steps

### Step 1 — Provision the Central Database

```bash
cd /office/production_deployment/central-db/postgres
./pcc marketlens
```

Copy the output credentials into your `.env` file.

### Step 2 — Load Schema and Seed Data

```bash
docker exec -i pg_central psql -U marketlens_owner -d marketlens < data/init.sql
```

This creates all tables and inserts the initial supervisor user and product catalog. Only needed on first deploy — skip on updates.

### Step 3 — Configure Environment

```bash
cp env.example .env
nano .env   # fill in DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, IMAGE_TAG
```

### Step 4 — Pull Images and Start

```bash
docker compose -f prod.docker-compose.yml pull
docker compose -f prod.docker-compose.yml up -d
```

### Step 5 — Verify

```bash
docker compose -f prod.docker-compose.yml ps
```

All containers (`marketlens_backend_prod`, `marketlens_frontend_prod`, `marketlens_nginx_prod`) should show `healthy`.

---

## Updating to a New Image Version

```bash
# 1. Update IMAGE_TAG in .env
nano .env   # set IMAGE_TAG=v2

# 2. Pull new images and recreate containers
docker compose -f prod.docker-compose.yml pull
docker compose -f prod.docker-compose.yml up -d --force-recreate
```

---

## Networks

| Network | Purpose |
|---|---|
| `marketlens-net` | Internal bridge between backend, frontend, nginx |
| `pg_central_net` | Backend → central PostgreSQL via PgBouncer |
| `monitoring_central_net` | Backend → central Prometheus (scrapes `/metrics`) |
| `acimisai_tunnel_network` | Nginx → Cloudflare tunnel (public ingress) |

---

## Default Credentials (from seed data)

| Field | Value |
|---|---|
| Staff ID | `supervisor` |
| Password | `supervisor` |

> Change the supervisor password after first login.
