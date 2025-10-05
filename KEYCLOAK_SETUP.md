# Keycloak Setup Guide

This guide will help you configure Keycloak for the Ledgerly application.

## Prerequisites

- Keycloak running at `http://localhost:8080`
- Admin credentials: `admin` / `admin`

## Step 1: Access Keycloak Admin Console

1. Open your browser and go to: **http://localhost:8080**
2. Click on **Administration Console**
3. Login with:
   - **Username**: `admin`
   - **Password**: `admin`

## Step 2: Create Ledgerly Realm

1. In the top-left corner, click on the dropdown that says **master**
2. Click **Create Realm**
3. Fill in:
   - **Realm name**: `ledgerly`
4. Click **Create**

## Step 3: Create Roles

1. In the left sidebar, click **Realm roles**
2. Click **Create role**
3. Create the following roles one by one:

   **Role 1: Admin**
   - **Role name**: `admin`
   - **Description**: `Administrator with full access`
   - Click **Save**

   **Role 2: Auditor**
   - **Role name**: `auditor`
   - **Description**: `Auditor with template and report access`
   - Click **Save**

   **Role 3: Viewer**
   - **Role name**: `viewer`
   - **Description**: `View-only access`
   - Click **Save**

## Step 4: Create Frontend Client

1. In the left sidebar, click **Clients**
2. Click **Create client**
3. Fill in the General Settings:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `ledgerly-frontend`
4. Click **Next**
5. Configure Capability config:
   - **Client authentication**: `OFF` (public client)
   - **Authorization**: `OFF`
   - **Authentication flow**: Check all (Standard flow, Direct access grants, etc.)
6. Click **Next**
7. Configure Login settings:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Valid post logout redirect URIs**: `http://localhost:3000`
   - **Web origins**: `http://localhost:3000`
8. Click **Save**

## Step 5: Create Backend Client

1. In the left sidebar, click **Clients**
2. Click **Create client**
3. Fill in the General Settings:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `ledgerly-backend`
4. Click **Next**
5. Configure Capability config:
   - **Client authentication**: `ON` (confidential client)
   - **Authorization**: `OFF`
   - **Authentication flow**:
     - Standard flow: `ON`
     - Direct access grants: `ON`
     - Service accounts roles: `ON`
6. Click **Next**
7. Configure Login settings:
   - **Root URL**: `http://localhost:8000`
   - **Valid redirect URIs**: `http://localhost:8000/*`
   - **Web origins**: `http://localhost:8000`
8. Click **Save**
9. Go to the **Credentials** tab
10. Copy the **Client secret** (you'll need this for the backend .env file)

## Step 6: Create Test Users

1. In the left sidebar, click **Users**
2. Click **Create new user**

   **User 1: Admin User**
   - **Username**: `testadmin`
   - **Email**: `admin@ledgerly.com`
   - **First name**: `Test`
   - **Last name**: `Admin`
   - Click **Create**
   - Go to the **Credentials** tab
   - Click **Set password**
   - **Password**: `password`
   - **Temporary**: `OFF`
   - Click **Save**
   - Go to the **Role mapping** tab
   - Click **Assign role**
   - Filter by **Filter by clients** and select `ledgerly-frontend`
   - OR filter by **Filter by realm roles** and select `admin`
   - Click **Assign**

   **User 2: Auditor User**
   - **Username**: `testauditor`
   - **Email**: `auditor@ledgerly.com`
   - **First name**: `Test`
   - **Last name**: `Auditor`
   - Click **Create**
   - Set password: `password` (Temporary: OFF)
   - Assign role: `auditor`

   **User 3: Viewer User**
   - **Username**: `testviewer`
   - **Email**: `viewer@ledgerly.com`
   - **First name**: `Test`
   - **Last name**: `Viewer`
   - Click **Create**
   - Set password: `password` (Temporary: OFF)
   - Assign role: `viewer`

## Step 7: Update Environment Variables

### Backend (.env)

Update `/home/leo/Projects/ledgerly/backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ledgerly
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=ledgerly
KEYCLOAK_CLIENT_ID=ledgerly-backend
KEYCLOAK_CLIENT_SECRET=<paste-client-secret-from-step-5>
```

### Frontend (.env.local)

Update `/home/leo/Projects/ledgerly/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=ledgerly
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ledgerly-frontend
```

## Step 8: Restart Services

After updating the environment variables, restart the services:

```bash
# Stop services (Ctrl+C or kill processes)

# Start PostgreSQL and Keycloak
docker compose -f docker-compose.dev.yml up postgres keycloak -d

# Start backend
cd backend
poetry run uvicorn app.main:app --reload

# Start frontend (in new terminal)
cd frontend
npm run dev
```

## Step 9: Test Authentication

1. Open browser to: **http://localhost:3000**
2. Click **Login** or **Dashboard**
3. Click **Sign in** button
4. You should be redirected to Keycloak login page
5. Login with:
   - **Username**: `testadmin`
   - **Password**: `password`
6. You should be redirected back to the dashboard

## Troubleshooting

### Issue: "Invalid redirect URI"
- Check that the redirect URIs in Keycloak client match your frontend URL exactly
- Make sure to include `/*` at the end of valid redirect URIs

### Issue: "Client not found"
- Verify the client IDs in Keycloak match those in your .env files
- Check that you're in the correct realm (ledgerly, not master)

### Issue: Authentication not working
- Make sure `KEYCLOAK_ENABLED=true` in both backend and frontend
- Restart both services after changing environment variables
- Check browser console for errors

### Issue: CORS errors
- Make sure Web origins is set to `http://localhost:3000` in the frontend client
- Check that backend CORS configuration allows the frontend origin

## Notes

- **Development Only**: This setup uses `start-dev` mode for Keycloak, which is NOT suitable for production
- **Default Passwords**: Change all default passwords before deploying to production
- **HTTPS**: In production, always use HTTPS for Keycloak
- **Client Secret**: Keep the backend client secret secure and never commit it to version control

## Next Steps

Once authentication is working:
1. Implement role-based access control (RBAC) in the backend
2. Add user profile display in the frontend
3. Implement proper logout functionality
4. Add token refresh logic
5. Test all authentication flows thoroughly
