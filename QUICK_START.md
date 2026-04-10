# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Setup Environment Variables

```bash
# Copy environment template
cp .env.example .env
cp backend/.env.example backend/.env

# Edit .env with your actual values:
# - MYSQL_PASSWORD
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - SMTP credentials (if using email)
```

## Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

## Step 3: Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm start
# Backend runs at: http://localhost:3000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
# Frontend runs at: http://localhost:5000
```

## Step 4: Test the Connection

Open browser and visit:
```
http://localhost:5000
```

Try registering a new account - check browser console for any CORS errors.

---

## 📝 Common Tasks

### Generate JWT Secret
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Reset MySQL Database
```bash
# Delete existing database
mysql -u root -p
DROP DATABASE camera_store;
CREATE DATABASE camera_store;
EXIT;

# Backend will recreate tables on next start
```

### Test API Endpoint
```bash
# In any terminal:
curl -X GET http://localhost:3000/api/products

# Or use Postman/Insomnia
```

### Enable Email Sending
```bash
# Set in backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
# Google: Enable 2FA + get app password
# https://support.google.com/accounts/answer/185833
```

---

## 🔗 Update Frontend API Calls

In your JavaScript files, replace hardcoded URLs:

```javascript
// BEFORE:
fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify(data),
})

// AFTER:
import { API_ENDPOINTS, fetchAPI, getAuthHeader } from './config.js';

fetchAPI(API_ENDPOINTS.AUTH.REGISTER, {
  method: 'POST',
  headers: getAuthHeader(),
  body: JSON.stringify(data),
})
```

---

## 📁 Folder Structure

```
├── frontend/          ← All HTML, CSS, JS files
├── backend/           ← Express API server
│   ├── server.js      ← Main entry point
│   ├── db.js          ← SQLite setup
│   ├── mysql.js       ← MySQL setup
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml ← CI/CD pipeline
├── .env               ← Environment variables (don't commit!)
└── DEPLOYMENT_GUIDE.md ← Full documentation
```

---

## 🐛 Troubleshooting

### CORS Error in Browser
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5000' 
has been blocked by CORS policy
```

**Solution:**
- Ensure backend is running on port 3000
- Check `FRONTEND_URL` in backend/.env
- Restart backend server

### "Cannot find module 'cors'"
```bash
cd backend
npm install cors
```

### MySQL Connection Error
```bash
# Check MySQL is running:
mysql -u root -p
# Type your password

# If connection succeeds, check backend/.env has correct password
```

### Port Already in Use
```bash
# Find process using port 3000:
netstat -ano | findstr :3000

# Kill the process (Windows):
taskkill /PID <PID> /F
```

---

## ✅ Deployment Checklist

- [ ] All environment variables set in `.env`
- [ ] Backend starts without errors
- [ ] Frontend loads in browser
- [ ] Can register/login successfully
- [ ] No CORS errors in console
- [ ] Connected to MySQL (not SQLite)
- [ ] Email sending configured (optional)
- [ ] GitHub repository created
- [ ] GitHub secrets added:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID
  - [ ] RENDER_API_KEY
  - [ ] RENDER_SERVICE_ID

---

## 🎯 Next Steps

1. Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Test production URLs
5. Monitor GitHub Actions workflow

---

## 📞 Need Help?

Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) → Debugging section

