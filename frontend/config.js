/**
 * Frontend Configuration
 * Handles API endpoint configuration for both development and production
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
    // For production (Vercel)
    if (typeof window !== 'undefined' && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Default: same origin (both on same server)
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // Fallback
    return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * API Endpoints Configuration
 * Use these in your fetch() calls instead of hardcoding URLs
 */
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        REGISTER: `${API_BASE_URL}/api/auth/register`,
        LOGIN: `${API_BASE_URL}/api/auth/login`,
        LOGOUT: `${API_BASE_URL}/api/auth/logout`,
        VERIFY: `${API_BASE_URL}/api/auth/verify`,
    },

    // Products
    PRODUCTS: {
        LIST: `${API_BASE_URL}/api/products`,
        GET: (id) => `${API_BASE_URL}/api/products/${id}`,
        CREATE: `${API_BASE_URL}/api/products`,
        UPDATE: (id) => `${API_BASE_URL}/api/products/${id}`,
        DELETE: (id) => `${API_BASE_URL}/api/products/${id}`,
    },

    // Shopping Cart
    CART: {
        GET: (userId) => `${API_BASE_URL}/api/cart/${userId}`,
        ADD: `${API_BASE_URL}/api/cart`,
        UPDATE: (itemId) => `${API_BASE_URL}/api/cart/${itemId}`,
        REMOVE: (itemId) => `${API_BASE_URL}/api/cart/${itemId}`,
        CLEAR: (userId) => `${API_BASE_URL}/api/cart/${userId}`,
    },

    // Rentals
    RENTALS: {
        CONFIRM: `${API_BASE_URL}/api/rentals/confirm`,
        GET_USER: (userId) => `${API_BASE_URL}/api/rentals/user/${userId}`,
        GET_ONE: (rentalId) => `${API_BASE_URL}/api/rentals/${rentalId}`,
    },

    // Purchases
    PURCHASES: {
        CONFIRM: `${API_BASE_URL}/api/purchases/confirm`,
        HISTORY: (userId) => `${API_BASE_URL}/api/purchases/history/${userId}`,
        GET_ONE: (purchaseId) => `${API_BASE_URL}/api/purchases/${purchaseId}`,
    },

    // User/Account
    USERS: {
        GET_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}`,
        UPDATE_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}`,
        GET_ORDER_HISTORY: (userId) => `${API_BASE_URL}/api/users/${userId}/orders`,
    },
};

/**
 * Fetch Helper with CORS and error handling
 */
export const fetchAPI = async (url, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // Include cookies for session management
        ...options,
    };

    try {
        const response = await fetch(url, defaultOptions);

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
            console.warn('Unauthorized - redirecting to login');
            localStorage.removeItem('token');
            if (typeof window !== 'undefined') {
                window.location.href = '/login.html';
            }
        }

        // Parse JSON response
        const data = await response.json();

        // Return error if not ok
        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'API Error',
                details: data,
            };
        }

        return data;
    } catch (error) {
        console.error('Fetch API Error:', error);
        throw error;
    }
};

/**
 * Get authorization header with JWT token
 */
export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }
    return {};
};

// Export base URL for reference
export default API_BASE_URL;
