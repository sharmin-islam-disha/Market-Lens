# MarketLens — Production Orchestration & Deployment

This branch contains the thin production orchestration manifests, reverse proxy rules, database migration schemas, and observability scrapers for **MarketLens** (ACI Retail Execution Intelligence).

---

## 1. Architecture Overview

- **Frontend**: Next.js 16 Standalone Container (serving SSR and static assets)
- **Backend**: FastAPI Application (JWT authentication, Gemini multimodal VLM integration, analytics)
- **Database**: PostgreSQL 17
- **Reverse Proxy**: Nginx Alpine (`ports: 8081:80`, `acimisai_tunnel_network` edge routing)
- **Observability (Optional Profile)**: Prometheus + Grafana (`--profile monitoring`)

```text
├── .gitignore
├── README.md
├── build_push.sh
├── data/
│   └── init.sql
├── env.example
├── nginx/
│   └── nginx.conf
├── prod.docker-compose.yml
└── prometheus/
    └── prometheus.yml
```

---

## 2. Quickstart Deployment Guide

### Step 1: Clone & Checkout Deploy Branch
```bash
git clone <repository_url>
cd MarketLens
git checkout deploy
```

### Step 2: Configure Environment
```bash
cp env.example .env
chmod 600 .env
nano .env
```

### Step 3: Setup Storage & File Permissions
```bash
mkdir -p docker-data/postgres_data
chmod o+rx ./prometheus
chmod o+r ./prometheus/prometheus.yml
```

### Step 4: Launch Application Stack

#### Core Stack (Nginx + Frontend + Backend + PostgreSQL):
```bash
docker compose -f prod.docker-compose.yml up -d
```

#### Full Stack with Monitoring (Prometheus + Grafana):
```bash
docker compose -f prod.docker-compose.yml --profile monitoring up -d
```

### Step 5: Verify Health Status
```bash
docker compose -f prod.docker-compose.yml ps
```

---

## 3. Production Ports & Access

- **Web Application / Nginx**: `http://localhost:8081` (Direct host access)
- **Edge Tunnel**: Internal port `80` connected to `acimisai_tunnel_network`
- **Edge Healthcheck**: `http://localhost:8081/healthz`
- **Grafana Dashboard** (when monitoring active): `http://localhost:3000`
- **Prometheus Scraper** (when monitoring active): `http://localhost:9090`
