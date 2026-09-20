# ACI Production Docker Compose Guide

Standard template for all ACI production deployments.

---

## 1. Infrastructure Overview

Every production app on the ACI server connects to shared central services via external Docker networks. Your app **never** runs its own database, monitoring stack, or object storage — it joins the central ones.

| Central Service | Network | What it provides |
|---|---|---|
| PostgreSQL + PgBouncer | `pg_central_net` | Shared relational DB (provisioned via `pcc`) |
| MinIO | `minio_central_net` | Shared object storage |
| Prometheus + Grafana | `monitoring_central_net` | Shared observability stack |
| Cloudflare Tunnel | `acimisai_tunnel_network` | Public ingress (nginx connects here) |

Your app creates **one app-level bridge network** for internal service communication (backend ↔ frontend ↔ nginx), then joins whichever central networks it needs.

---

## 2. Network Rules

```
                        ┌─────────────────────────┐
  Internet ──────────── │  acimisai_tunnel_network │
                        └────────────┬────────────┘
                                     │
                              ┌──────▼──────┐
                              │    nginx     │  ← only nginx touches tunnel
                              └──────┬──────┘
                                     │ app-net (internal)
                    ┌────────────────┼─────────────────┐
                    │                │                  │
             ┌──────▼──────┐ ┌──────▼──────┐          │
             │   backend   │ │   frontend  │          ...
             └──────┬──────┘ └─────────────┘
                    │
        ┌───────────┼──────────────┐
        │           │              │
  pg_central   minio_central  monitoring
    _net           _net         _central_net
```

**Rules:**
- Only `nginx` connects to `acimisai_tunnel_network`
- Only `backend` (or app) connects to `pg_central_net`, `minio_central_net`, `monitoring_central_net`
- `frontend` only connects to the app-level bridge network
- No service exposes ports to the host (`ports:` is removed — use `expose:` on nginx only)

---

## 3. Compose File Template

```yaml
name: <appname>-prod                          # unique project name

networks:
  <appname>-net:                              # internal bridge network
    name: <appname>-net
    driver: bridge

  acimisai_tunnel_network:                    # public ingress
    name: acimisai_tunnel_network
    external: true

  pg_central_net:                             # add if app uses postgres
    name: pg_central_net
    external: true

  minio_central_net:                          # add if app uses MinIO/S3
    name: minio_central_net
    external: true

  monitoring_central_net:                     # add if app exposes /metrics
    name: monitoring_central_net
    external: true

services:
  <appname>-app:
    image: registry.acimisai.com/<appname>-app:${IMAGE_TAG:-v1}
    container_name: <appname>_app_prod        # pattern: <appname>_<service>_prod
    restart: unless-stopped
    env_file:
      - ./.env
    healthcheck:
      test: ["CMD-SHELL", "<health check command>"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      - <appname>-net
      - pg_central_net                        # only if using postgres
      - minio_central_net                     # only if using MinIO
      - monitoring_central_net                # only if exposing /metrics

  <appname>-nginx:
    image: nginx:alpine
    container_name: <appname>_nginx_prod
    restart: unless-stopped
    expose:
      - "80"                                  # internal only, no host port binding
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      <appname>-app:
        condition: service_healthy
    networks:
      - <appname>-net
      - acimisai_tunnel_network               # only nginx gets tunnel access
```

---

## 4. Service Patterns

### 4.1 Container Naming
Pattern: `<appname>_<service>_prod`

```
marketlens_backend_prod
marketlens_frontend_prod
marketlens_nginx_prod
paddypulse_app_prod
paddypulse_nginx_prod
```

### 4.2 Image Tags
Always pull from registry. Tag comes from `.env`:

```yaml
image: registry.acimisai.com/<appname>-backend:${IMAGE_TAG:-v1}
```

In `.env`:
```env
IMAGE_TAG=v1
```

Bump to `v2`, `v3` etc. when you push a new image. Never use `latest` in production.

### 4.3 Environment Variables
Use `env_file` for all secrets. Inline `environment:` only for non-secret overrides:

```yaml
env_file:
  - ./.env
environment:
  - PORT=${BACKEND_PORT:-8000}          # runtime override, not secret
  - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}
```

Never hardcode secrets, ports, URLs, or API keys in the compose file.

### 4.4 No Host Port Bindings
```yaml
# WRONG — do not expose ports to host in prod
ports:
  - "8000:8000"

# CORRECT — internal only
expose:
  - "80"   # only on nginx
```

All traffic enters via `acimisai_tunnel_network` through nginx. Direct host port access is not needed.

### 4.5 Healthchecks
Every service that other services `depends_on` must have a healthcheck:

```yaml
# Backend (Python/FastAPI)
healthcheck:
  test: ["CMD-SHELL", "python -c 'import urllib.request, os; urllib.request.urlopen(\"http://127.0.0.1:\" + str(os.environ.get(\"PORT\", 8000)) + \"/openapi.json\")' || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s

# Frontend (Next.js)
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:${PORT:-3000}/ || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s

# Nginx
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1/healthz || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 5s
```

### 4.6 Nginx Config
Mount to `conf.d/default.conf` (not the full `nginx.conf`). Write only the `server {}` block — nginx's base config handles `events {}` and `http {}`:

```nginx
# nginx/nginx.conf  →  mounted at /etc/nginx/conf.d/default.conf

upstream app {
    server <appname>-app:8000;
}

server {
    listen 80;
    server_name _;

    location /healthz {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Database Setup (PostgreSQL via PgBouncer)

Never run a local postgres container in prod. Use the central DB provisioned by `pcc`:

```bash
# On server — provision DB for your app
cd /office/production_deployment/central-db/postgres
./pcc <appname>
```

Copy the output to your `.env`:
```env
DATABASE_URL=postgresql://<user>:<password>@pg_central_pgbouncer:6432/<dbname>
POSTGRES_HOST=pg_central_pgbouncer
POSTGRES_PORT=6432
POSTGRES_DB=<dbname>
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
```

If your app has an `init.sql`, run it once manually after provisioning:
```bash
docker exec -i pg_central psql -U <user> -d <dbname> < data/init.sql
```

---

## 6. Pre-Deploy Checklist

- [ ] `IMAGE_TAG` set in `.env` and matches what was pushed to registry
- [ ] `DATABASE_URL` points to `pg_central_pgbouncer:6432` (not localhost or a local container)
- [ ] `init.sql` run against central DB (first deploy only)
- [ ] No `ports:` on app or backend services (only `expose: "80"` on nginx)
- [ ] Container names follow `<appname>_<service>_prod` pattern
- [ ] `acimisai_tunnel_network` only on nginx service
- [ ] `pg_central_net` only on backend/app service (not frontend, not nginx)
- [ ] nginx config mounted to `/etc/nginx/conf.d/default.conf`
- [ ] All secrets in `.env`, nothing hardcoded in compose file
- [ ] `deploy` branch has: `prod.docker-compose.yml`, `.env.example`, `README.md`, `data/init.sql` (if needed)

---

## 7. Deploy Commands

```bash
# First deploy
docker compose -f prod.docker-compose.yml up -d

# Update to new image version (after pushing new image)
# 1. Update IMAGE_TAG in .env on server
# 2. Pull and recreate
docker compose -f prod.docker-compose.yml pull
docker compose -f prod.docker-compose.yml up -d --force-recreate

# Check status
docker compose -f prod.docker-compose.yml ps

# View logs
docker compose -f prod.docker-compose.yml logs -f <service-name>
```

---

## 8. Full Example — MarketLens

```yaml
name: marketlens-prod

networks:
  marketlens-net:
    name: marketlens-net
    driver: bridge

  acimisai_tunnel_network:
    name: acimisai_tunnel_network
    external: true

  pg_central_net:
    name: pg_central_net
    external: true

  monitoring_central_net:
    name: monitoring_central_net
    external: true

services:
  marketlens-backend:
    image: registry.acimisai.com/marketlens-backend:${IMAGE_TAG:-v1}
    container_name: marketlens_backend_prod
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      - PORT=${BACKEND_PORT:-8000}
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}
    healthcheck:
      test: ["CMD-SHELL", "python -c 'import urllib.request, os; urllib.request.urlopen(\"http://127.0.0.1:\" + str(os.environ.get(\"PORT\", 8000)) + \"/openapi.json\")' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      - marketlens-net
      - pg_central_net
      - monitoring_central_net

  marketlens-frontend:
    image: registry.acimisai.com/marketlens-frontend:${IMAGE_TAG:-v1}
    container_name: marketlens_frontend_prod
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      - PORT=${FRONTEND_PORT:-3000}
      - BACKEND_URL=http://marketlens-backend:${BACKEND_PORT:-8000}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}
    depends_on:
      marketlens-backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:${FRONTEND_PORT:-3000}/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      - marketlens-net

  marketlens-nginx:
    image: nginx:alpine
    container_name: marketlens_nginx_prod
    restart: unless-stopped
    expose:
      - "80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      marketlens-frontend:
        condition: service_healthy
      marketlens-backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1/healthz || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    networks:
      - marketlens-net
      - acimisai_tunnel_network
```
