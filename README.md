# MarketLens — ACI Retail Execution Intelligence

MarketLens is a containerized AI-powered retail execution platform. It features an automated Gemini VLM vision audit pipeline, staff BYOK onboarding, FMCG product catalog analytics, and an integrated PostgreSQL data store.

---

## 1. Architecture Overview

The entire application runs strictly through Docker:

- **Frontend Container**: Next.js 16 Standalone (serving UI on `${FRONTEND_PORT}`)
- **Backend Container**: FastAPI + Uvicorn (serving REST API and AI pipeline on `${BACKEND_PORT}`)
- **Database Container**: PostgreSQL 15/17 (storing models, captures, audits on `${DB_PORT}`)
- **Reverse Proxy (Production)**: Nginx Alpine (routing ingress on `${NGINX_PORT}`)
- **Observability (Optional Profile)**: Prometheus + Grafana (`--profile monitoring`)

---

## 2. Quickstart: Run Everything with Docker

### Step 1: Configure Environment Variables
Copy the template and verify your ports:
```bash
cp .env.example .env
```
All ports are customizable in `.env` and can be adapted to any machine:
```env
FRONTEND_PORT=3000
BACKEND_PORT=8000
DB_PORT=5432
NGINX_PORT=8081
NEXT_PUBLIC_API_URL=/api
```

### Step 2: Build & Start the Entire Stack
Run all services (Frontend, Backend, and PostgreSQL) via Docker Compose:
```bash
docker compose up --build
```
To run in detached background mode:
```bash
docker compose up -d --build
```

### Step 3: Access the Application
- **Frontend Application**: `http://localhost:${FRONTEND_PORT}` (Default: `http://localhost:3000`)
- **Backend API & Swagger Docs**: `http://localhost:${BACKEND_PORT}/docs` (Default: `http://localhost:8000/docs`)

---

## 3. Production Deployment (Reverse Proxy & Ingress)

For production deployments with Nginx and edge networking:
```bash
docker compose -f prod.docker-compose.yml up -d
```
With monitoring enabled:
```bash
docker compose -f prod.docker-compose.yml --profile monitoring up -d
```
To check container status:
```bash
docker compose ps
```
