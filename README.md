# Ledgerly

**Ledgerly** is an open platform for audit automation and compliance.
It is designed to help auditors and compliance professionals reduce manual work, generate accurate reports, and adapt to different legislative frameworks across countries.

---

## Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** - Relational database for audit data
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration tool
- **ReportLab** - PDF generation for audit reports
- **Poetry** - Python dependency management
- **Keycloak** - Authentication and authorization (optional)

### Frontend
- **Next.js 14** - React framework with server-side rendering
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Axios/Fetch** - HTTP client for API calls

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL (Docker)** - Database container
- **Nginx** - Reverse proxy (production)
- **GitHub Actions** - CI/CD pipeline

---

## Features (MVP)

- **Audit Templates** - Create and manage reusable audit templates
- **CRUD Operations** - Full create, read, update, delete for templates
- **PDF Report Generation** - Generate professional audit reports
- **Authentication** - Keycloak integration (optional, disabled by default)
- **Clean UI** - Apple-inspired design with soft shadows and rounded corners
- **RESTful API** - Well-documented FastAPI endpoints

---

## Current Status

The application is in **development mode** with the following features implemented:
- ✅ Backend API with FastAPI
- ✅ Database models and migrations
- ✅ CRUD endpoints for audit templates
- ✅ PDF report generation
- ✅ Frontend UI with Next.js
- ✅ Dashboard and navigation
- ⚠️ Keycloak authentication (configured but disabled by default)

**Note**: The app is currently running in **demo mode** without authentication. See the Production Deployment section for enabling authentication.

## Getting Started

### Prerequisites

- **Python 3.11+** with Poetry installed
- **Node.js 18+** with npm
- **Docker & Docker Compose**
- **PostgreSQL** (or use Docker container)
- **Corporate Proxy Configuration** (if behind proxy like Zscaler)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ledgerly.git
   cd ledgerly
   ```

2. **Start PostgreSQL**
   ```bash
   docker compose -f docker-compose.dev.yml up postgres -d
   ```

3. **Backend Setup**
   ```bash
   cd backend

   # Install dependencies
   poetry install

   # Copy environment file
   cp .env.example .env

   # Run migrations
   poetry run alembic revision --autogenerate -m "Initial tables"
   poetry run alembic upgrade head

   # Start backend server
   poetry run uvicorn app.main:app --reload
   ```

   Backend will be available at `http://localhost:8000`

   API docs: `http://localhost:8000/docs`

4. **Frontend Setup**
   ```bash
   cd frontend

   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ledgerly
KEYCLOAK_ENABLED=false
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=ledgerly
KEYCLOAK_CLIENT_ID=ledgerly-backend
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KEYCLOAK_ENABLED=false
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=ledgerly
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ledgerly-frontend
```

---

## API Endpoints

### Health Check
- `GET /health` - Returns service status

### Audit Templates
- `GET /audit/templates` - List all templates
- `POST /audit/templates` - Create new template
- `GET /audit/templates/{id}` - Get specific template
- `PUT /audit/templates/{id}` - Update template
- `DELETE /audit/templates/{id}` - Delete template

### Reports
- `POST /audit/reports/generate` - Generate PDF report from template

---

## Deployment

### Production Deployment Steps

#### 1. Provision Infrastructure (Oracle Cloud Free Tier)

- **VM1**: Backend + Frontend + Nginx (2 OCPU, 12GB RAM)
- **VM2**: PostgreSQL + Keycloak (1 OCPU, 6GB RAM)

#### 2. Configure Environment Variables for Production

**Backend (.env)**
```env
# Change from localhost to actual database host
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db-server-ip:5432/ledgerly

# Enable Keycloak authentication
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=https://auth.yourdomain.com
KEYCLOAK_REALM=ledgerly
KEYCLOAK_CLIENT_ID=ledgerly-backend
```

**Frontend (.env.local)**
```env
# Update API URL to production domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Enable Keycloak
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.yourdomain.com
NEXT_PUBLIC_KEYCLOAK_REALM=ledgerly
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ledgerly-frontend
```

#### 3. Deploy Keycloak (VM2)

```bash
# Using Docker
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=STRONG_PASSWORD \
  quay.io/keycloak/keycloak:latest start-dev
```

**Configure Keycloak**:
1. Access admin console at `http://vm2-ip:8080`
2. Create realm: `ledgerly`
3. Create clients:
   - `ledgerly-backend` (confidential)
   - `ledgerly-frontend` (public)
4. Create roles: `admin`, `auditor`, `viewer`
5. Create users and assign roles

#### 4. Deploy PostgreSQL (VM2)

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=STRONG_PASSWORD \
  -e POSTGRES_DB=ledgerly \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 5. Build and Deploy Application (VM1)

**Create Production Dockerfile for Backend**
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-dev

COPY backend/ ./

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Create Production Dockerfile for Frontend**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["npm", "start"]
```

**Build Images**
```bash
docker build -f backend/Dockerfile -t ledgerly-backend:prod .
docker build -f frontend/Dockerfile -t ledgerly-frontend:prod .
```

#### 6. Setup Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/ledgerly
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 7. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### 8. Run Database Migrations

```bash
# On VM1
cd backend
poetry run alembic upgrade head
```

#### 9. Start Services

```bash
# Backend
docker run -d \
  --name ledgerly-backend \
  -p 8000:8000 \
  --env-file backend/.env \
  ledgerly-backend:prod

# Frontend
docker run -d \
  --name ledgerly-frontend \
  -p 3000:3000 \
  --env-file frontend/.env.local \
  ledgerly-frontend:prod

# Nginx
sudo systemctl restart nginx
```

### Production Checklist

Before deploying to production, ensure:

- [ ] Change all default passwords
- [ ] Use environment variables for secrets (never commit `.env` files)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules (allow only 80, 443, 22)
- [ ] Set `KEYCLOAK_ENABLED=true` in both backend and frontend
- [ ] Update `DATABASE_URL` to production database
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting on API endpoints
- [ ] Configure CORS properly (not `*` in production)
- [ ] Test authentication flow end-to-end

---

## Development

### Running Tests
```bash
# Backend tests
cd backend
poetry run pytest

# Frontend tests
cd frontend
npm run test
```

### Linting
```bash
# Backend (ruff)
cd backend
poetry run ruff check .

# Frontend (eslint)
cd frontend
npm run lint
```

### Database Migrations
```bash
cd backend

# Create new migration
poetry run alembic revision --autogenerate -m "Description"

# Apply migrations
poetry run alembic upgrade head

# Rollback
poetry run alembic downgrade -1
```

---

## Project Structure

```
ledgerly/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py          # Database models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── database.py        # Database configuration
│   │   ├── auth.py            # Authentication logic
│   │   └── routers/
│   │       ├── templates.py   # Template CRUD endpoints
│   │       └── reports.py     # Report generation
│   ├── alembic/               # Database migrations
│   ├── .env                   # Environment variables
│   └── pyproject.toml         # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── login/             # Login page
│   │   ├── dashboard/         # Dashboard page
│   │   ├── audits/            # Audits page
│   │   └── reports/           # Reports page
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── keycloak.ts        # Keycloak integration
│   ├── .env.local             # Frontend environment
│   └── package.json           # Node dependencies
├── docker-compose.dev.yml     # Development compose file
└── README.md                  # This file
```

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## Roadmap

- AI-assisted document analysis
- Region-specific compliance packs
- Email notifications and client communication
- Workflow orchestration for teams
- Excel and Word export formats
- Advanced role-based access control
- Audit trails and logging
- Multi-tenancy support

---

## License

This project is licensed under the [Apache 2.0 License](LICENSE).

---

## Support

For issues and questions, please open an issue on GitHub.
