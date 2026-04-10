# GitHub & CI/CD Setup Guide

Complete step-by-step guide to set up deployment automation.

---

## 1️⃣ Initialize Git Repository

```bash
# In project root
git init
git add .
git commit -m "Initial commit: Full-stack ecommerce project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hci-project.git
git push -u origin main
```

---

## 2️⃣ Create GitHub Secrets

1. Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

2. Click **New repository secret** and add these:

### A. Vercel Secrets

#### Get `VERCEL_TOKEN`
1. Visit: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `GitHub CI/CD`
4. Copy token
5. Add to GitHub Secrets as `VERCEL_TOKEN`

#### Get `VERCEL_ORG_ID`
1. Visit: https://vercel.com/account/settings
2. Find "Project Settings" section
3. Copy your ORG ID (or Team ID)
4. Add to GitHub Secrets as `VERCEL_ORG_ID`

#### Get `VERCEL_PROJECT_ID`
1. Visit: https://vercel.com (dashboard)
2. Select your project
3. Go to Settings → General
4. Find "Project ID"
5. Copy it
6. Add to GitHub Secrets as `VERCEL_PROJECT_ID`

### B. Render Secrets

#### Get `RENDER_API_KEY`
1. Visit: https://dashboard.render.com/tokens
2. Click "Create API Token"
3. Name: `GitHub CI/CD`
4. Copy full token
5. Add to GitHub Secrets as `RENDER_API_KEY`

#### Get `RENDER_SERVICE_ID`
1. After creating web service on Render
2. Service Dashboard → Settings
3. Find "ID" at the top
4. Add to GitHub Secrets as `RENDER_SERVICE_ID`

#### Get `BACKEND_URL` (optional, for health checks)
1. From Render dashboard: `https://your-service.onrender.com`
2. Add to GitHub Secrets as `BACKEND_URL`

---

## 3️⃣ Setup Vercel Project

### Option A: From Vercel Dashboard

1. Go to: https://vercel.com
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Paste GitHub repo URL
5. Select "Other" for Framework
6. **Root Directory**: `frontend`
7. **Build Command**: `npm run build`
8. **Output Directory**: `.`
9. Click "Deploy"

### Option B: Using Vercel CLI

```bash
npm install -g vercel

# In project root
vercel --prod --name camera-store-frontend
```

---

## 4️⃣ Setup Render Service

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. **Connect Repository**: Choose your GitHub repo
4. Start Configuration:
   - **Name**: `camera-store-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `npm start`

5. **Add Environment Variables**:
   - Click "Add from .env"
   - Or add manually:
     ```
     PORT=3000
     NODE_ENV=production
     FRONTEND_URL=https://your-vercel-app.vercel.app
     JWT_SECRET=<generate new secure key>
     MYSQL_HOST=<your mysql host>
     MYSQL_USER=<mysql user>
     MYSQL_PASSWORD=<mysql password>
     MYSQL_DATABASE=camera_store
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your@email.com
     SMTP_PASS=your-app-password
     ```

6. Click "Deploy Web Service"

---

## 5️⃣ .gitignore Setup

Create `.gitignore` in project root:

```
# Environment vars - NEVER commit
.env
.env.local
.env.*.local
backend/.env

# Node modules
node_modules/
npm-debug.log
yarn-error.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
build/
dist/
.next/

# Database
*.db
*.sqlite3
backend/data/store.db

# Logs
logs/
*.log

# Dependency directories
package-lock.json
yarn.lock
```

---

## 6️⃣ GitHub Actions Workflow

File already created: `.github/workflows/deploy.yml`

The workflow:
1. **Triggers**: on every push to `main` branch
2. **Build stage**: installs dependencies, builds both frontend & backend
3. **Deploy backend**: triggers Render deployment
4. **Deploy frontend**: triggers Vercel deployment
5. **Notify**: reports success/failure

Monitor: **GitHub Repository → Actions** tab

---

## 7️⃣ First Deployment Test

```bash
# Push your code
git add .
git commit -m "Add deployment configuration"
git push origin main

# Watch it deploy:
# 1. GitHub Actions: github.com/YOUR_USERNAME/repo/actions
# 2. Vercel: vercel.com/deployments
# 3. Render: render.com/dashboard
```

---

## 8️⃣ Connect Frontend to Backend

After deployment, update environment variables:

### On Vercel:
1. Project Settings → Environment Variables
2. Add: `REACT_APP_API_URL=https://your-backend.onrender.com`
3. Redeploy

### On Render:
1. Web Service Settings
2. Add: `FRONTEND_URL=https://your-vercel-project.vercel.app`
3. Restart service

---

## 9️⃣ Verify Deployment

### Backend Health Check
```bash
curl -X GET https://your-backend.onrender.com/health
# Or check console logs on Render dashboard
```

### Frontend Test
```bash
# Open in browser:
https://your-vercel-project.vercel.app
```

### API Connection Test
```javascript
// In browser console:
fetch('https://your-backend.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log('✅ Connected!', d))
  .catch(e => console.error('❌ Error:', e))
```

---

## 🔟 Troubleshooting Deployments

### GitHub Actions Failing

Check logs:
1. Go to: **Actions tab → Latest workflow run**
2. Click on failed job
3. Expand step details
4. Read error message

Common issues:
- Missing secrets → Add in Settings → Secrets
- Wrong branch → Ensure pushing to `main`
- Build errors → Check build command in `.env`

### Vercel Deployment Failed

Check:
1. Vercel dashboard → Deployments → failed deployment
2. Look for build logs
3. Check if `REACT_APP_API_URL` is set correctly

### Render Deployment Failed

Check:
1. Render dashboard → Service → Logs
2. Check if environment variables present
3. Verify Start Command works: `npm start`

---

## 📋 Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] `.gitignore` configured
- [ ] Vercel project created
- [ ] Render service created
- [ ] All GitHub Secrets added (8 total)
- [ ] GitHub Actions workflow file in place
- [ ] First deployment triggered and successful
- [ ] CORS configured with correct frontend URL on Render
- [ ] Frontend can reach backend API
- [ ] Database connections working
- [ ] Email functionality tested (if configured)

---

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Render API Documentation](https://api-docs.render.com)
- [Environment Variables Best Practices](https://12factor.net/config)

