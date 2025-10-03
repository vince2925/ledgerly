# Ledgerly Development Plan

## Status: MVP Complete (Development Mode)

---

## ✅ COMPLETED TASKS

### 1. Backend (FastAPI)

- ✅ Scaffolded FastAPI project with Poetry
- ✅ Added `/health` endpoint → returns "ok"
- ✅ Added `/audit/templates` → CRUD for audit templates
- ✅ Added `/audit/reports/generate` → generates PDF with ReportLab
- ✅ Integrated SQLAlchemy + PostgreSQL
- ✅ Added Alembic migrations (created and applied)
- ✅ Added Keycloak auth middleware (OIDC token validation) - **CONFIGURED BUT DISABLED**

**Backend Status**: Running on `http://localhost:8000`

### 2. Frontend (React + Next.js + Tailwind)

- ✅ Scaffolded Next.js app with TypeScript
- ✅ Configured TailwindCSS
- ✅ Created base layout (clean, Apple-style: white background, soft shadows, rounded corners)
- ✅ Added pages:
  - `/` → home page with navigation
  - `/login` → mock login (redirects to dashboard in demo mode)
  - `/dashboard` → main dashboard (accessible without auth in demo)
  - `/audits` → list + create templates UI
  - `/reports` → generate/download PDF UI
- ✅ Added API client to talk to FastAPI
- ✅ Added Keycloak JS adapter for auth - **CONFIGURED BUT DISABLED**

**Frontend Status**: Running on `http://localhost:3000`

### 3. PDF Generation

- ✅ Installed ReportLab in backend
- ✅ Added `/audit/reports/generate` endpoint → returns generated PDF with audit content
- ✅ Frontend UI ready for "Download Report" button → needs integration with API

### 4. Developer Experience

- ✅ Added linting: ruff (Python), eslint (JavaScript)
- ✅ Added docker-compose.dev.yml for local development (PostgreSQL)
- ✅ Added basic GitHub Actions workflow:
  - Lint code (ruff for backend, eslint for frontend)
  - Build frontend

### 5. Database & Infrastructure

- ✅ PostgreSQL running in Docker container (port 5432)
- ✅ Database models created (AuditTemplate, AuditReport)
- ✅ Migrations created and applied
- ✅ Environment configuration files created

---

## ⚠️ PENDING TASKS

### Authentication & Authorization

- ⏳ Deploy Keycloak in Docker
- ⏳ Create `ledgerly` realm in Keycloak
- ⏳ Define roles: admin, auditor, viewer
- ⏳ Configure client apps:
  - ledgerly-frontend (public)
  - ledgerly-backend (confidential)
- ⏳ Test login → JWT validation → role-based access
- ⏳ Enable authentication by setting `KEYCLOAK_ENABLED=true`

### Frontend Integration

- ⏳ Connect "Create Template" button to backend API
- ⏳ Connect "Generate Report" button to backend API
- ⏳ Add form validation for template creation
- ⏳ Add error handling and user feedback (toasts/alerts)
- ⏳ Implement actual data fetching (currently using mock empty arrays)
- ⏳ Add loading states for API calls

### Deployment (Oracle Free Tier)

- ⏳ Provision 2 Oracle Free Tier VMs:
  - VM1 → Backend + Frontend + Nginx
  - VM2 → Keycloak + PostgreSQL
- ⏳ Create production Dockerfiles
- ⏳ Write docker-compose.prod.yml:
  - Service: backend (FastAPI + Uvicorn)
  - Service: frontend (Next.js)
  - Service: nginx (reverse proxy + SSL certs via Let's Encrypt)
- ⏳ Configure PostgreSQL with persistent storage
- ⏳ Set up Keycloak container
- ⏳ Configure domain + HTTPS with Let's Encrypt
- ⏳ Set up database backups
- ⏳ Configure monitoring and logging

### Testing

- ⏳ Add backend unit tests (pytest)
- ⏳ Add frontend component tests
- ⏳ Add integration tests
- ⏳ Update GitHub Actions to run tests

### Security Hardening

- ⏳ Change CORS from `*` to specific origins
- ⏳ Add rate limiting to API endpoints
- ⏳ Implement CSRF protection
- ⏳ Add request validation and sanitization
- ⏳ Set up security headers

---

## 🔧 PRODUCTION READINESS CHECKLIST

### Environment Configuration Changes

1. **Backend (.env)**
   ```env
   # Current (Development)
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ledgerly
   KEYCLOAK_ENABLED=false

   # Production (Change to)
   DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db-server-ip:5432/ledgerly
   KEYCLOAK_ENABLED=true
   KEYCLOAK_SERVER_URL=https://auth.yourdomain.com
   KEYCLOAK_REALM=ledgerly
   KEYCLOAK_CLIENT_ID=ledgerly-backend
   ```

2. **Frontend (.env.local)**
   ```env
   # Current (Development)
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_KEYCLOAK_ENABLED=false

   # Production (Change to)
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_KEYCLOAK_ENABLED=true
   NEXT_PUBLIC_KEYCLOAK_URL=https://auth.yourdomain.com
   NEXT_PUBLIC_KEYCLOAK_REALM=ledgerly
   NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ledgerly-frontend
   ```

### Code Changes for Production

1. **CORS Configuration** (`backend/app/main.py`)
   ```python
   # Current (Development)
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # ⚠️ Allow all origins
       ...
   )

   # Production (Change to)
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourdomain.com"],  # ✅ Specific origin
       ...
   )
   ```

2. **Enable Authentication in Routes**
   - Currently: Auth middleware exists but is bypassed with mock user
   - Production: Set `KEYCLOAK_ENABLED=true` to enforce real authentication

### Infrastructure Steps

1. Build production Docker images (see README.md)
2. Deploy Keycloak and configure realm
3. Deploy PostgreSQL with backups
4. Configure Nginx reverse proxy
5. Setup SSL certificates with Let's Encrypt
6. Run database migrations
7. Start services and verify health checks

---

## 📝 KNOWN ISSUES

1. **Corporate Proxy (Zscaler)**
   - npm requires `--registry http://registry.npmjs.org/` and `--strict-ssl false`
   - Poetry/pip requires `--trusted-host` flags in Docker builds
   - Solution: Configure proxy certificates or use `--trusted-host` flags

2. **Next.js Bus Error in WSL2**
   - Next.js 15 causes bus errors in WSL2
   - Solution: Downgraded to Next.js 14.2.5 (stable)

3. **Authentication Currently Disabled**
   - Demo mode allows bypassing login
   - Solution: Deploy Keycloak and set `KEYCLOAK_ENABLED=true`

---

## 🚀 NEXT STEPS (Priority Order)

1. **Connect Frontend to Backend API**
   - Implement template creation/listing
   - Implement report generation
   - Add error handling

2. **Deploy Keycloak**
   - Set up Keycloak container
   - Configure realm and clients
   - Test authentication flow

3. **Add Tests**
   - Backend unit tests
   - Frontend component tests
   - Integration tests

4. **Production Deployment**
   - Provision Oracle Cloud VMs
   - Deploy with production configurations
   - Set up monitoring

5. **Advanced Features**
   - AI-assisted document analysis
   - Email notifications
   - Excel/Word export formats
   - Multi-tenancy support

---

## 📊 CURRENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                   Browser (User)                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│          Frontend (Next.js) - Port 3000             │
│  - React 18 + TypeScript                            │
│  - TailwindCSS                                      │
│  - Keycloak Adapter (disabled)                      │
└─────────────────────────────────────────────────────┘
                        ↓ HTTP
┌─────────────────────────────────────────────────────┐
│          Backend (FastAPI) - Port 8000              │
│  - Python 3.12                                      │
│  - SQLAlchemy + Alembic                             │
│  - ReportLab for PDFs                               │
│  - Keycloak Middleware (disabled)                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│       PostgreSQL (Docker) - Port 5432               │
│  - audit_templates table                            │
│  - audit_reports table                              │
└─────────────────────────────────────────────────────┘

(Keycloak - Not yet deployed)
```

---

## 📚 RESOURCES

- Backend API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- GitHub Actions: `.github/workflows/ci.yml`
- README: Detailed setup and deployment instructions
