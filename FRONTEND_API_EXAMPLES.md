# Example: How to Update Frontend API Calls

This guide shows how to update your JavaScript files to use the new centralized API configuration.

---

## 1️⃣ Before: Hardcoded URLs (❌ Not recommended)

```javascript
// register.html - OLD WAY
async function handleRegister(event) {
  event.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // ❌ Hardcoded URL - doesn't work in production
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Registration successful!');
      window.location.href = '/login.html';
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error');
  }
}
```

---

## 2️⃣ After: Using Config (✅ Correct way)

```javascript
// Import configuration at the top of your file
import { API_ENDPOINTS, fetchAPI, getAuthHeader } from './config.js';

async function handleRegister(event) {
  event.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // ✅ Use API_ENDPOINTS - works in dev & production
    const data = await fetchAPI(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()  // Add JWT token if available
      },
      body: JSON.stringify({ name, email, password })
    });
    
    alert('Registration successful!');
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Registration failed');
  }
}
```

---

## 3️⃣ Complete Example: Login

```javascript
// log.js - Using config
import { API_ENDPOINTS, fetchAPI } from './config.js';

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  try {
    const data = await fetchAPI(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe })
    });

    // Store JWT token
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    
    // Redirect to dashboard
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Login error:', error);
    // Display error to user
    document.getElementById('errorMessage').textContent = 
      error.message || 'Login failed. Please try again.';
  }
}
```

---

## 4️⃣ Working with Cart

```javascript
// brands1.js
import { API_ENDPOINTS, fetchAPI, getAuthHeader } from './config.js';

async function addToCart(productId, quantity) {
  // Get user ID from localStorage
  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    alert('Please login first');
    window.location.href = '/login.html';
    return;
  }

  try {
    const data = await fetchAPI(API_ENDPOINTS.CART.ADD, {
      method: 'POST',
      headers: getAuthHeader(),  // Include JWT token
      body: JSON.stringify({
        userId,
        productId,
        quantity
      })
    });

    alert('Added to cart!');
    console.log('Cart item:', data);
  } catch (error) {
    console.error('Cart error:', error);
    alert('Failed to add to cart: ' + error.message);
  }
}

// Get user's cart
async function loadCart() {
  const userId = localStorage.getItem('userId');
  
  try {
    const data = await fetchAPI(
      API_ENDPOINTS.CART.GET(userId),
      { headers: getAuthHeader() }
    );
    
    console.log('Cart items:', data);
    displayCart(data);
  } catch (error) {
    console.error('Failed to load cart:', error);
  }
}
```

---

## 5️⃣ Working with Purchases

```javascript
// purchase-history.js
import { API_ENDPOINTS, fetchAPI, getAuthHeader } from './config.js';

async function loadPurchaseHistory() {
  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    document.getElementById('purchasesList').innerHTML = 
      '<p>Please login to view your purchases</p>';
    return;
  }

  try {
    const purchases = await fetchAPI(
      API_ENDPOINTS.PURCHASES.HISTORY(userId),
      { headers: getAuthHeader() }
    );

    displayPurchases(purchases);
  } catch (error) {
    console.error('Error loading purchases:', error);
    document.getElementById('purchasesList').innerHTML = 
      '<p>Failed to load purchase history</p>';
  }
}

async function confirmPurchase(cartItems) {
  const userId = localStorage.getItem('userId');

  try {
    const data = await fetchAPI(API_ENDPOINTS.PURCHASES.CONFIRM, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        userId,
        items: cartItems,
        totalAmount: calculateTotal(cartItems)
      })
    });

    alert('Purchase confirmed! Order #' + data.orderId);
    // Clear cart and redirect
    localStorage.removeItem('cart');
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Purchase error:', error);
    alert('Purchase failed: ' + error.message);
  }
}
```

---

## 6️⃣ Update Frontend package.json

In `frontend/package.json`, ensure you can use ES6 imports:

```json
{
  "name": "camera-store-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "http-server -p 5000 -c-1",
    "dev": "http-server -p 5000"
  },
  "dependencies": {
    "dotenv": "^17.3.1"
  },
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
```

---

## 7️⃣ Update HTML Files to Use Modules

```html
<!-- register.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Register</title>
  <link rel="stylesheet" href="reglog.css">
</head>
<body>
  <form id="registerForm">
    <input type="text" id="name" placeholder="Full Name" required>
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Password" required>
    <button type="submit">Register</button>
  </form>

  <!-- Use type="module" to enable ES6 imports -->
  <script type="module" src="reglog1.js"></script>
</body>
</html>
```

---

## 8️⃣ Error Handling Best Practices

```javascript
import { API_ENDPOINTS, fetchAPI } from './config.js';

async function makeApiCall() {
  try {
    const data = await fetchAPI(API_ENDPOINTS.PRODUCTS.LIST, {
      method: 'GET'
    });
    return data;
  } catch (error) {
    // Error object structure from fetchAPI:
    // error.status - HTTP status code
    // error.message - Error message
    // error.details - Full response data

    if (error.status === 401) {
      // Unauthorized - redirect to login
      console.log('Session expired');
      window.location.href = '/login.html';
    } else if (error.status === 500) {
      // Server error
      console.error('Server error:', error.details);
    } else if (error.status === 0) {
      // Network error
      console.error('Network error - check if backend is running');
    }

    throw error;  // Re-throw for caller to handle
  }
}
```

---

## 9️⃣ Checklist: Update All Files

Files that should use `config.js` for API calls:

- [ ] `reglog1.js` - Registration form
- [ ] `log.js` - Login form
- [ ] `brands1.js` - Add to cart
- [ ] `brands2.js` - Browse catalog
- [ ] `brands3.js` - Rental functionality
- [ ] `brands4.js` - More rentals
- [ ] `sales.js` - Sales/checkout
- [ ] `purchase-history.js` - Order history
- [ ] Any other files making API calls

---

## 🔟 Testing the Connection

In browser console (F12):

```javascript
// Import and test
import { API_ENDPOINTS, fetchAPI } from './config.js';

// Test getting products
fetchAPI(API_ENDPOINTS.PRODUCTS.LIST)
  .then(d => console.log('✅ Connected!', d))
  .catch(e => console.error('❌ Error:', e))

// Check API base URL
import API_BASE_URL from './config.js';
console.log('API URL:', API_BASE_URL);
```

---

## 📝 Summary

| Before | After |
|--------|-------|
| `fetch('/api/auth/register', ...)` | `fetchAPI(API_ENDPOINTS.AUTH.REGISTER, ...)` |
| Hardcoded URLs | Centralized config |
| ❌ Works only in dev | ✅ Works everywhere |
| Manual error handling | Built-in error handling |
| No CORS by default | CORS-ready |

The new setup automatically handles:
- ✅ Switching between dev & production URLs
- ✅ Adding JWT tokens to requests
- ✅ CORS with credentials
- ✅ Error handling & redirects
- ✅ Environment-specific configuration

---

## ❓ Questions?

Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for more examples and troubleshooting.
