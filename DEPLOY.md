# MarketLens — Production Deployment Runbook

## 1. Prerequisites

- Docker Engine 24+ and Docker Compose v2 (`docker compose` plugin)
- Access to `registry.acimisai.com` (run `docker login registry.acimisai.com` once)
- The following external Docker networks must already exist on the host:
  - `acimisai_tunnel_network` — reverse-proxy/tunnel network
  - `pg_central_net` — central PostgreSQL/PgBouncer network
  - `monitoring_central_net` — central Prometheus/Grafana network

---

## 2. First-Time Setup

### 2a. Provision the database

The app uses the central PgBouncer cluster. Provision a database and owner role before first launch:

```bash
# on the DB host, using the pcc helper
./postgres/pcc marketlens
```

This creates the `marketlens` database and `marketlens_owner` role.

### 2b. Configure environment

```bash
cp env.example .env
# Edit .env and replace all placeholder values:
#   SECRET_KEY       — generate with: openssl rand -hex 32
#   GEMINI_API_KEY   — your Google AI key
#   DATABASE_URL     — update the password from pcc output
#   ALLOWED_ORIGINS  — your production domain(s), comma-separated
#   VERSION          — image tag to deploy (e.g. 1.2.0)
nano .env
```

---

## 3. Pull and Launch

```bash
# Pull the images for the VERSION in .env
docker compose -f prod.docker-compose.yml pull

# Start all services (detached)
docker compose -f prod.docker-compose.yml up -d
```

Services start in dependency order: backend (health-checked) → frontend (health-checked) → nginx.

---

## 4. Updating

Always pull before bringing services up to ensure Docker uses the new image, not a locally cached layer.

```bash
# Set the new version in .env, then:
docker compose -f prod.docker-compose.yml pull
docker compose -f prod.docker-compose.yml up -d
```

This performs a rolling-style update — Compose recreates only the services whose image changed.

---

## 5. Logs and Health Checks

```bash
# Tail logs for all services
docker compose -f prod.docker-compose.yml logs -f

# Tail a specific service
docker compose -f prod.docker-compose.yml logs -f marketlens-backend

# Check container health status
docker compose -f prod.docker-compose.yml ps

# Manual health probe — backend
docker exec marketlens_prod_backend python -c \
  "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"

# Manual health probe — frontend
docker exec marketlens_prod_frontend wget -qO- http://127.0.0.1:3000/ > /dev/null && echo OK
```

---

## 6. Monitoring Notes

### Backend metrics

The backend exposes Prometheus metrics at `/metrics` (port 8000) via `prometheus-fastapi-instrumentator`.

Key metrics:
- `http_requests_total{handler, method, status}` — request counter (status: `2xx`, `4xx`, `5xx`)
- `http_request_duration_highr_seconds_bucket` — high-resolution latency histogram (no handler label, use for percentiles)
- `http_request_duration_seconds_bucket{handler}` — per-handler latency histogram

The backend is on `monitoring_central_net`, so the central Prometheus instance can scrape it directly at `marketlens-backend:8000/metrics`. The Grafana dashboard JSON is at `monitoring/grafana/marketlens_dashboard.json`.

### Nginx stub_status

Nginx exposes `stub_status` at `/stub_status` (port 80). **By default, nginx is NOT on `monitoring_central_net`**, so the central Prometheus cannot reach it.

To enable nginx scraping, add `monitoring_central_net` to the `marketlens-nginx` service in `prod.docker-compose.yml`:

```yaml
  marketlens-nginx:
    networks:
      - marketlens-net
      - acimisai_tunnel_network
      - monitoring_central_net  # add this line
```

Then restart nginx: `docker compose -f prod.docker-compose.yml up -d marketlens-nginx`

### Local browser test (port forwarding)

To test the stack locally without modifying `prod.docker-compose.yml`, use the override file (gitignored):

```bash
docker compose -f prod.docker-compose.yml -f docker-compose.local-test-ports.yml up -d
# Then visit http://localhost:8099
```
