# 📸 Camera Store - Full Stack E-Commerce Platform

Production-ready full-stack ecommerce application with separate frontend and backend deployments.

**Frontend**: React/Static HTML → Vercel  
**Backend**: Node.js/Express → Render  
**Database**: MySQL (Production) + SQLite (Development)  

---

## 🚀 Quick Start

```bash
# 1. Setup environment
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Start development servers
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm start

# Open browser: http://localhost:5000
```

---

## 📁 Project Structure

```
├── frontend/              # Static frontend (HTML, CSS, JS)
│   ├── index.html        # Home page
│   ├── register.html     # User registration
│   ├── login.html        # User login
│   ├── config.js         # API configuration
│   ├── package.json
│   └── *.css, *.js       # Styles & scripts
├── backend/              # Express.js API server
│   ├── server.js         # Main server
│   ├── db.js             # SQLite setup
│   ├── mysql.js          # MySQL pool
│   ├── CORS_SETUP.js     # CORS configuration
│   ├── .env.example
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions CI/CD
├── .env.example          # Environment variables template
├── QUICK_START.md        # Quick start guide
├── DEPLOYMENT_GUIDE.md   # Full deployment documentation
└── GITHUB_SETUP.md       # GitHub & CI/CD setup
```

---

## 📋 Features

✅ **User Authentication**
- Registration & Login with JWT
- Secure password hashing (bcryptjs)
- Session management

✅ **E-Commerce Core**
- Product catalog
- Shopping cart management
- Rental system with email confirmation
- Purchase history tracking
- MySQL integration for persistence

✅ **Production Ready**
- CORS configured for cross-origin requests
- Environment-based configuration
- Error handling & logging
- Health check endpoints

✅ **Automated Deployment**
- GitHub Actions CI/CD workflow
- Frontend deployment to Vercel
- Backend deployment to Render
- Automatic build & deploy on push to main

---

## 🔑 Environment Variables

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3000
```

### Backend (backend/.env)
```bash
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5000
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=camera_store
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

---

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login user
POST   /api/auth/logout            Logout user
GET    /api/auth/verify            Verify token
```

### Products
```
GET    /api/products               List all products
GET    /api/products/:id           Get product details
POST   /api/products               Create product (admin)
PUT    /api/products/:id           Update product (admin)
DELETE /api/products/:id           Delete product (admin)
```

### Cart
```
GET    /api/cart/:userId           Get user cart
POST   /api/cart                   Add item to cart
PUT    /api/cart/:itemId           Update cart item
DELETE /api/cart/:itemId           Remove from cart
DELETE /api/cart/:userId           Clear cart
```

### Rentals
```
POST   /api/rentals/confirm        Confirm rental
GET    /api/rentals/user/:userId   Get user rentals
```

### Purchases
```
POST   /api/purchases/confirm      Confirm purchase
GET    /api/purchases/history/:userId  Purchase history
```

### Health
```
GET    /health                     Server status
```

---

## 🛠️ Development

### Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Run Locally
```bash
# Terminal 1 - Backend (port 3000)
cd backend
npm start

# Terminal 2 - Frontend (port 5000)
cd frontend
npm start
```

### Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

---

## 📚 Documentation

- [Quick Start Guide](./QUICK_START.md) - Get running in 5 minutes
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Full production deployment
- [GitHub Setup Guide](./GITHUB_SETUP.md) - CI/CD & GitHub Actions

---

## 🔒 Security Features

- JWT token-based authentication
- CORS protection with origin validation
- Password hashing with bcryptjs
- Environment variable protection
- HTTPS in production (Vercel & Render)
- Secure email communication with SMTP

---

## 🚀 Production Deployment

### Deploy Backend (Render)
1. Create service on render.com
2. Connect GitHub repository
3. Set environment variables
4. Deploy automatically or manually

### Deploy Frontend (Vercel)
1. Import project on vercel.com
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy automatically on push

### Automate with GitHub Actions
Push to `main` branch triggers:
1. Install dependencies
2. Build both frontend & backend
3. Deploy to Render (backend)
4. Deploy to Vercel (frontend)
5. Report status

---

## 🐛 Troubleshooting

### CORS Error
```
Access to fetch at 'http://localhost:3000/api/...' blocked by CORS
```
**Solution**: Check `FRONTEND_URL` in backend/.env

### Port Already in Use
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MySQL Connection Failed
```bash
# Check MySQL is running and credentials are correct
mysql -u root -p
```

### API Not Responding
```javascript
// Test in browser console:
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) → Debugging for more.

---

## 📞 Support & Resources

- [Express.js Docs](https://expressjs.com)
- [Vercel Deployment](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👤 Author

Camera Store Development Team

**Last Updated**: April 2026
