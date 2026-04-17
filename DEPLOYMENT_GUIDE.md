# Full-Stack Deployment Guide: Vercel + Render

This guide covers everything needed to deploy your ecommerce project to production.

---

## 📁 Recommended Folder Structure

```
hci-project/
├── frontend/                    # React/static frontend
│   ├── index.html
│   ├── package.json
│   ├── register.html
│   ├── login.html
│   ├── *.css
│   ├── *.js
│   └── public/                  # Static assets
│       └── images/
├── backend/                     # Node.js/Express API
│   ├── server.js
│   ├── db.js
│   ├── mysql.js
│   ├── package.json
│   ├── .env.example
│   ├── data/
│   └── routes/                  # (optional) organize endpoints
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions workflow
├── .env.example                 # Environment variables template
├── README.md
└── DEPLOYMENT_GUIDE.md
```

**Current Migration**: Move all HTML/CSS/JS files to `frontend/` folder to separate concerns.

---

## 🚀 Quick Start: Environment Variables

### 1. Root `.env.example`
```bash
# Frontend (Vercel)
VITE_API_URL=https://camera-3-weni.onrender.com
REACT_APP_API_URL=https://camera-3-weni.onrender.com

# Backend (Render)
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here

# MySQL
MYSQL_HOST=your-mysql-host.com
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=camera_store

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Camera Store <your-email@gmail.com>
```

### 2. Backend `.env.example`
```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=camera_store
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Camera Store <your-email@gmail.com>
```

### 3. Create Local `.env` Files
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

---

## ⚙️ Production Scripts Setup

### Frontend `package.json`
```json
{
  "name": "camera-store-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "http-server -p 5000 -c-1",
    "build": "echo 'Frontend ready'",
    "start": "http-server -p 3000 -g",
    "serve": "http-server -p 5000",
    "test": "echo 'No tests yet'"
  },
  "dependencies": {
    "dotenv": "^17.3.1"
  },
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
```

### Backend `package.json` (Updated)
```json
{
  "name": "camera-store-backend",
  "version": "1.0.0",
  "description": "Backend API for camera e-commerce project",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'Backend ready'",
    "test": "echo 'No tests yet'"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.11.5",
    "nodemailer": "^6.9.15",
    "sqlite": "^5.1.1",
    "sqlite3": "^5.1.7",
    "dotenv": "^17.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

---

## 🔌 Connect Frontend to Backend API

### Create `frontend/config.js`
```javascript
// Configuration for API endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     (typeof window !== 'undefined' && window.location.origin === 'http://localhost:3000' 
                       ? 'http://localhost:3000' 
                       : 'https://camera-3-weni.onrender.com');

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },
  PRODUCTS: {
    LIST: `${API_BASE_URL}/api/products`,
    GET: (id) => `${API_BASE_URL}/api/products/${id}`,
  },
  CART: {
    GET: (userId) => `${API_BASE_URL}/api/cart/${userId}`,
    ADD: `${API_BASE_URL}/api/cart`,
    REMOVE: (itemId) => `${API_BASE_URL}/api/cart/${itemId}`,
  },
  RENTALS: {
    CONFIRM: `${API_BASE_URL}/api/rentals/confirm`,
  },
  PURCHASES: {
    CONFIRM: `${API_BASE_URL}/api/purchases/confirm`,
    HISTORY: (userId) => `${API_BASE_URL}/api/purchases/history/${userId}`,
  },
};

export default API_BASE_URL;
```

### Update Frontend JavaScript Files
```javascript
// In register.html (reglog1.js)
import { API_ENDPOINTS } from './config.js';

// OLD:
// fetch('/api/auth/register', ...)

// NEW:
fetch(API_ENDPOINTS.AUTH.REGISTER, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData),
  credentials: 'include'  // For cookies/CORS
})
```

---

## 🛡️ CORS Configuration for Express

Already handled in the updated `backend/server.js` file with:

```javascript
const cors = require('cors');

// Configure CORS for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

Add to backend `.env`:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 📋 GitHub Actions Workflow

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel & Render

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm install
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build backend
        run: |
          cd backend
          npm run build
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST https://api.render.com/deploy/${{ secrets.RENDER_SERVICE_ID }} \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🔑 GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. **Settings → Secrets and variables → Actions → New repository secret**

```
VERCEL_TOKEN          → Get from vercel.com/account/tokens
VERCEL_ORG_ID         → Get from Vercel dashboard
VERCEL_PROJECT_ID     → Get from Vercel dashboard
RENDER_API_KEY        → Get from render.com/account/api-tokens
RENDER_SERVICE_ID     → Get after creating service on Render
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Render Account
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set Environment: Node.js 18
5. Build Command: `cd backend && npm install && npm run build`
6. Start Command: `npm start`
7. Add environment variables in Render dashboard

### Step 2: Prepare Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Import project
3. Set Framework Preset: Other (static)
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `.`
7. Add environment variables:
  - `REACT_APP_API_URL=https://camera-3-weni.onrender.com`

### Step 3: Push to GitHub & Monitor
```bash
git add .
git commit -m "Setup deployment configuration"
git push origin main
```

Check GitHub Actions for build status.

---

## ✅ Testing Checklist

- [ ] Backend starts: `npm start` in `backend/`
- [ ] Frontend loads: `npm start` in `frontend/`
- [ ] CORS issues resolved (check browser console)
- [ ] Register/Login works end-to-end
- [ ] Environment variables loaded from `.env`
- [ ] GitHub Actions workflow runs without errors
- [ ] Render deployment successful
- [ ] Vercel deployment successful
- [ ] Frontend can reach backend API
- [ ] Database connections working

---

## 🐛 Debugging

### CORS Errors
```javascript
// Check backend CORS config
console.log('CORS allowed origin:', corsOptions.origin);
```

### API Connection Issues
```javascript
// In browser console:
fetch('https://camera-3-weni.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('API Error:', e));
```

### Deployment Logs
- **Vercel**: vercel.com → Deployments → Logs
- **Render**: render.com → Service → Logs

---

## 📚 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)
- [Node.js Environment Variables](https://nodejs.org/en/learn/how-to-work-with/what-is-cors/)
