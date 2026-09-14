# Technical Instruction: Thin Production Deployment Branch Pattern

This guide provides a generic, reusable blueprint for creating an isolated **`deploy` branch** for multi-tier web applications (Frontend, Backend, Database, Reverse Proxy, and Observability).

---

## 1. Architectural Concept: The "Thin Deploy" Pattern

Instead of maintaining application source code on production servers:
1. **Source Branches (`main` / `develop`)**: Contain raw application code, build definitions, unit tests, and local development configurations.
2. **Build Stage**: Builds production-ready container images for target production architectures (e.g., `linux/amd64`) and pushes them to a secure container registry.
3. **Deploy Branch (`deploy`)**: Contains **no source code**. It holds only the runtime orchestration manifests, reverse proxy rules, metric scrapers, seed schemas, and environment templates.

---

## 2. Directory Structure

On the `deploy` branch, all source folders (e.g., `frontend/`, `backend/`, `src/`) are purged. The branch contains only runtime orchestration assets:

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

## 3. Naming Conventions

Maintain strict, deterministic naming across all configuration files:

| Resource | Convention | Example |
| :--- | :--- | :--- |
| **Deploy Branch** | `deploy` | `deploy` |
| **Compose Project Name** | `<app_name>-prod` | `name: marketlens-prod` |
| **Service Names** | `<app_name>-<service>` | `marketlens-backend`, `marketlens-db` |
| **Container Names** | `<app_name>_prod_<service>` | `marketlens_prod_backend` |
| **Internal Network** | `<app_name>-net` | `marketlens-net` (bridge) |
| **External Network** | `acimisai_tunnel_network` | `acimisai_tunnel_network` (external) |
| **Image Tags** | `<registry_domain>/<app_name>-<service>:<version>` | `registry.acimisai.com/marketlens-backend:v1` |
| **Data Volumes** | `./docker-data/<service>_data` | `./docker-data/postgres_data` |
| **Monitoring Profile** | `monitoring` | `--profile monitoring` (Prometheus & Grafana) |

---

## 4. Configuration Files & Code Snippets

### A. Container Image Build & Push Script (`build_push.sh`)
*Executed from the source branch or CI/CD pipeline prior to deploying.*

```bash
#!/bin/bash
set -e

REGISTRY="registry.acimisai.com"
APP_NAME="marketlens"
TAG="${1:-v1}"

echo "Building Backend for linux/amd64,linux/arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t "${REGISTRY}/${APP_NAME}-backend:${TAG}" \
  --push ./backend

echo "Building Frontend for linux/amd64,linux/arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t "${REGISTRY}/${APP_NAME}-frontend:${TAG}" \
  --push ./frontend

echo "Successfully built and pushed multi-platform images to ${REGISTRY} with tag ${TAG}!"
```

---

### B. Production Orchestration Manifest (`prod.docker-compose.yml`)

Key configurations implemented:
- **Project & Service Namespacing**: Uses `marketlens-prod` as the project identifier and prefixes service names (`marketlens-db`, `marketlens-backend`, etc.) to prevent namespace conflicts in multi-tenant environments.
- **Service Profiles**: Prometheus and Grafana are assigned to `profiles: [monitoring]`, allowing the core stack to run independently without monitoring overhead unless explicitly activated via `--profile monitoring`.
- **Cascading Healthchecks**: Downstream services wait for `condition: service_healthy` before starting.
- **In-Container Native Healthchecks**:
  - Backend uses native Python `urllib` to verify `/openapi.json` without requiring `curl` or `wget` binaries in the image.
  - PostgreSQL uses `pg_isready`.
  - Frontend and Nginx use lightweight `wget` spider checks.
- **Port Publishing & Tunnel Ingress**: Nginx publishes `ports: - "8081:80"` to allow direct host/developer access on port `8081` without colliding with standard HTTP (80) or backend (8000) services, while also declaring `expose: - "80"` for edge routing via `acimisai_tunnel_network`.
- **Persistent Storage**: Bind-mounted under `./docker-data/`.
- **Restart Policies**: Set to `restart: unless-stopped`.
- **Dual-Network Segregation**: An internal bridge network (`marketlens-net`) and a hardcoded external tunnel network (`acimisai_tunnel_network`) for edge routing/SSL termination.

```yaml
name: marketlens-prod

services:
  marketlens-db:
    image: postgres:17
    container_name: marketlens_prod_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - ./docker-data/postgres_data:/var/lib/postgresql/data
      - ./data/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      marketlens-net:
        aliases:
          - db

  marketlens-backend:
    image: registry.acimisai.com/marketlens-backend:v1
    container_name: marketlens_prod_backend
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - ALLOWED_ORIGINS=*
    depends_on:
      marketlens-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "python -c 'import urllib.request; urllib.request.urlopen(\"http://127.0.0.1:8000/openapi.json\")' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      marketlens-net:
        aliases:
          - backend

  marketlens-frontend:
    image: registry.acimisai.com/marketlens-frontend:v1
    container_name: marketlens_prod_frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      marketlens-backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:3000/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      marketlens-net:
        aliases:
          - frontend

  marketlens-prometheus:
    image: prom/prometheus:latest
    container_name: marketlens_prod_prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    depends_on:
      marketlens-backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:9090/-/healthy || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - marketlens-net
    profiles:
      - monitoring

  marketlens-grafana:
    image: grafana/grafana:latest
    container_name: marketlens_prod_grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
    depends_on:
      marketlens-prometheus:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:3000/api/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - marketlens-net
    profiles:
      - monitoring

  marketlens-nginx:
    image: nginx:alpine
    container_name: marketlens_prod_nginx
    restart: unless-stopped
    ports:
      - "8081:80"
    expose:
      - "80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
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

networks:
  marketlens-net:
    name: marketlens-net
    driver: bridge

  acimisai_tunnel_network:
    name: acimisai_tunnel_network
    external: true
```

---

### C. Nginx Reverse Proxy Configuration (`nginx/nginx.conf`)

Key configurations implemented:
- **Dedicated Health Probe Endpoint (`/healthz`)**: Used by edge load balancers / uptime monitors.
- **Private Subnet Restriction**: Sensitive operational endpoints (`/metrics`, `/docs`, `/openapi.json`) are blocked from public internet access and restricted to private CIDRs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`).
- **Path Routing**: Forwarding `/api/` to backend and root `/` to frontend.
- **Timeout and Payload Guards**: Configured `client_max_body_size` and `proxy_read_timeout`.

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile           on;
    keepalive_timeout  65;
    client_max_body_size 50M;

    upstream frontend {
        server marketlens-frontend:3000;
    }

    upstream backend {
        server marketlens-backend:8000;
    }

    server {
        listen 80;
        server_name _;

        # Edge / Host Healthcheck
        location /healthz {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Restrict internal endpoints (metrics, API docs) to private networks only
        location ~ ^/(api/)?(docs|redoc|openapi\.json|metrics) {
            allow 192.168.0.0/16;
            allow 10.0.0.0/8;
            allow 172.16.0.0/12;
            allow 127.0.0.1;
            deny all;

            rewrite ^/api/(.*)$ /$1 break;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Backend API Routing
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
        }

        # Frontend Application Routing
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

### D. Observability Scraper Configuration (`prometheus/prometheus.yml`)

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'marketlens_backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['marketlens-backend:8000']
```

---

### E. Environment Variable Template (`env.example`)

```env
# Database Credentials
DB_USER=marketlens_user
DB_PASSWORD=replace_with_secure_database_password
DB_NAME=marketlens_db

# Connection String (matches internal docker-compose service name)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

# Application Base URL (defaults to relative /api routed through Nginx reverse proxy)
NEXT_PUBLIC_API_URL=/api

# Application Secrets (System fallback; users can also provide their own BYOK key post-login)
GEMINI_API_KEY=replace_with_gemini_api_key
SECRET_KEY=replace_with_secure_random_hex_or_string

# Monitoring Credentials
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=replace_with_secure_grafana_password
```

---

### F. Initial Migration / Seed Data (`data/init.sql`)

```sql
-- Initial schema definitions and bootstrap admin user
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

-- Seed Administrator User
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
```

---

## 5. Implementation Runbook: Creating the `deploy` Branch

Follow these exact steps to transition another repository to this pattern:

### Step 1: Create the Branch from Source
```bash
# Ensure working tree is clean on main
git checkout main
git pull origin main

# Create the deploy branch
git checkout -b deploy
```

### Step 2: Purge Source Directories from Git Tracking
Remove code directories (e.g. `backend/`, `frontend/`, `client/`, `server/`) from tracking while keeping configuration files:
```bash
git rm -r backend frontend
```

### Step 3: Add and Commit Deployment Manifests
Ensure only deployment assets are present and staged:
```bash
git add prod.docker-compose.yml nginx/ prometheus/ data/ env.example build_push.sh README.md .gitignore
git commit -m "chore: setup deployment configuration with reverse proxy and monitoring"
```

### Step 4: Push Deploy Branch to Remote
```bash
git push -u origin deploy
```

---

## 6. Target Production Server Execution

On the target host, deployment requires zero compilation:

```bash
# 1. Clone repository and checkout the deploy branch
git clone <repository_url>
cd <repository_folder>
git checkout deploy

# 2. Configure production secrets
cp env.example .env
chmod 600 .env
nano .env

# 3. Create required data volume directory and ensure file permissions
mkdir -p docker-data/postgres_data
# Ensure prometheus configuration has read permissions for non-root container users (UID 65534)
chmod o+rx ./prometheus
chmod o+r ./prometheus/prometheus.yml

# 4. Authenticate to container registry
docker login <registry_domain>

# 5. Launch stack
# Core stack only (db, backend, frontend, nginx):
docker compose -f prod.docker-compose.yml up -d

# Or core stack with monitoring enabled (Prometheus + Grafana):
docker compose -f prod.docker-compose.yml --profile monitoring up -d

# 6. Verify health status
docker compose -f prod.docker-compose.yml ps
# If running with monitoring:
docker compose -f prod.docker-compose.yml --profile monitoring ps
```

---

## 7. Lessons Learned & Production Hardening Gotchas

### A. Reverse Proxy Relative Routing vs. Host Port Binding
- **Problem**: When the Next.js frontend calls `http://localhost:8000/api` directly from client browsers, requests fail if host port 8000 is occupied by other containers (such as co-located backend services) or if CORS is misconfigured.
- **Solution**: Always configure `NEXT_PUBLIC_API_URL=/api` and let client browsers make relative requests to the same origin (`http://localhost:8081` or the production tunnel domain). Nginx then proxies `/api/` upstream to `marketlens-backend:8000` internally, eliminating host port conflicts and CORS issues.

### B. Multi-Architecture Builds (`linux/amd64` + `linux/arm64`)
- **Problem**: Building container images on macOS (Apple Silicon) defaults to `linux/arm64`. Deploying those images onto x86_64 production servers causes `exec format error`. Conversely, running an x86_64 image on ARM64 requires slow QEMU emulation.
- **Solution**: Always use Docker Buildx with `--platform linux/amd64,linux/arm64` in `build_push.sh` to generate multi-architecture manifest lists pushed directly to the container registry.

### C. Python 3.11 Pydantic Metaclass Compatibility with Gemini Structured Output
- **Problem**: Using standard `from typing import TypedDict` when passing structured JSON schemas (`response_schema=...`) to `google-genai` on Python 3.11 triggers a runtime error: `pydantic.errors.PydanticUserError: Please use typing_extensions.TypedDict instead of typing.TypedDict`.
- **Solution**: In all FastAPI backend models passed to the Gemini Client, import `TypedDict` from `typing_extensions` rather than `typing`.

### D. Bring Your Own Key (BYOK) Decryption Resilience
- **Problem**: Users submit their own Gemini API keys via `PATCH /api/users/me/key`. If key encryption (Fernet) fails or is not enabled, strict decryption crashes with `InvalidToken`.
- **Solution**: The backend decryption helper implements a graceful fallback: if Fernet decryption fails, it treats the key as plaintext, allowing both encrypted and unencrypted key storage to function without crashing `/api/analyze` endpoints.

### E. Container Names vs. Docker Network Aliases
- **Problem**: Nginx or Prometheus failing to resolve upstreams with errors such as `host not found in upstream "frontend:3000"` or `no such host: db`.
- **Solution**: Ensure service names in `prod.docker-compose.yml` (`marketlens-frontend`, `marketlens-backend`, `marketlens-db`) either match the Nginx/Prometheus target directives directly or have explicit network aliases defined:
  ```yaml
  networks:
    marketlens-net:
      aliases:
        - db
        - backend
        - frontend
  ```
