# Testing Backend-Frontend Connection Guide

This guide will help you test the authentication connection between your Django backend and React frontend.

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js and npm** installed
3. **PostgreSQL** running (or use Docker)
4. **MongoDB** running (or use Docker)

## Option 1: Using Docker Compose (Recommended)

### Step 1: Start all services
```bash
# From the project root
docker-compose up -d
```

This will start:
- Backend on `http://localhost:8000`
- Frontend on `http://localhost:3000`
- PostgreSQL on port `5432`
- MongoDB on port `27017`

### Step 2: Run database migrations
```bash
# Access the backend container
docker-compose exec backend python manage.py migrate
```

### Step 3: Create a superuser (optional, for admin access)
```bash
docker-compose exec backend python manage.py createsuperuser
```

## Option 2: Manual Setup (Without Docker)

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
Create or update `backend/.env` with:
```env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
POSTGRES_DB=nutrichoice_psql
POSTGRES_USER=nutrichoice_admin
POSTGRES_PASSWORD=admin1234
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
MONGO_URL=mongodb://localhost:27017/capstone_db
```

5. **Run migrations:**
```bash
python manage.py migrate
```

6. **Start the backend server:**
```bash
python manage.py runserver
```

The backend should now be running on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create or update `frontend/.env` with:
```env
VITE_API_URL=http://localhost:8000
```

4. **Start the frontend server:**
```bash
npm run dev
```

The frontend should now be running on `http://localhost:3000` (or the port Vite assigns)

## Testing the Connection

### 1. Test Backend Health Endpoint

Open your browser or use curl:
```bash
curl http://localhost:8000/api/health/
```

Expected response:
```json
{"status": "ok"}
```

### 2. Test Frontend-Backend Connection

1. **Open the frontend in your browser:**
   - Navigate to `http://localhost:3000`

2. **Test User Registration:**
   - Click on "Sign Up" or toggle to signup form
   - Fill in the form:
     - Username: `testuser` (4-24 characters)
     - First Name: `Test`
     - Last Name: `User`
     - Email: `test@example.com`
     - Password: `testpass123` (min 8 characters)
     - Confirm Password: `testpass123`
   - Click "Create Account"
   - **Expected:** Should redirect to `/home` on success

3. **Test User Login:**
   - If you logged out, go to login form
   - Enter:
     - Username: `testuser` (use the username you registered with)
     - Password: `testpass123`
   - Click "Sign In"
   - **Expected:** Should redirect to `/home` on success

4. **Test Password Reset Request:**
   - Click "Forgot your password?"
   - Enter your email: `test@example.com`
   - Click "Send Reset Link"
   - **Expected:** Success message with reset link (in dev mode, the link is shown)

5. **Test Password Reset Confirm:**
   - Copy the reset link from the previous step
   - Open it in a new tab
   - Enter new password and confirm
   - **Expected:** Success message and redirect to login

6. **Test Password Change (requires being logged in):**
   - Navigate to account settings
   - Enter current password and new password
   - **Expected:** Success message

### 3. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab:** Look for any JavaScript errors
- **Network tab:** 
  - Check API calls to `http://localhost:8000/api/auth/*`
  - Verify requests have correct status codes (200 for success, 400/401 for errors)
  - Check request/response payloads

### 4. Check Backend Logs

Watch the Django server console for:
- Request logs showing API calls
- Any error messages or stack traces
- Database query logs

## Common Issues and Troubleshooting

### Issue: CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` in `backend/server/settings.py` includes `http://localhost:3000`
- Make sure frontend is running on port 3000 (or update CORS settings)

### Issue: Connection Refused

**Symptoms:** Network tab shows "Failed to fetch" or connection errors

**Solution:**
- Verify backend is running: `curl http://localhost:8000/api/health/`
- Check `VITE_API_URL` in `frontend/.env` matches backend URL
- Verify no firewall blocking the connection

### Issue: 401 Unauthorized

**Symptoms:** API calls return 401 status

**Solution:**
- Check if token is stored: Open browser DevTools → Application → Local Storage → Check for `auth_token`
- Verify token is being sent in Authorization header
- Try logging in again to get a fresh token

### Issue: 400 Bad Request

**Symptoms:** Registration/login fails with validation errors

**Solution:**
- Check the error message in the response
- Verify username is 4-24 characters
- Verify password meets requirements (min 8 characters)
- Check that all required fields are filled

### Issue: Database Connection Errors

**Symptoms:** Backend shows database connection errors

**Solution:**
- Verify PostgreSQL is running
- Check database credentials in `.env` file
- Run migrations: `python manage.py migrate`

### Issue: Token Not Persisting

**Symptoms:** User gets logged out on page refresh

**Solution:**
- Check browser localStorage is enabled
- Verify token is being saved after login
- Check if token is being retrieved on app load

## Testing with API Client (Postman/Insomnia)

You can also test the backend directly:

### Register User
```http
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "testpass123",
  "password_confirm": "testpass123",
  "first_name": "Test",
  "last_name": "User"
}
```

### Login
```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass123"
}
```

### Get Current User (requires token)
```http
GET http://localhost:8000/api/auth/me/
Authorization: Token YOUR_TOKEN_HERE
```

## Next Steps

Once basic authentication is working:
1. Test protected routes
2. Test token refresh
3. Test logout functionality
4. Add error handling improvements
5. Add loading states
6. Test edge cases (expired tokens, invalid credentials, etc.)

## Debugging Tips

1. **Enable Django Debug Toolbar** (if installed) to see SQL queries
2. **Use Django's logging** to see detailed request/response info
3. **Check browser Network tab** to see exact request/response data
4. **Use React DevTools** to inspect component state
5. **Check Django admin** at `http://localhost:8000/admin` to verify user creation
