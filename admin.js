const cartFeed = document.getElementById('cart-feed');
const refreshBtn = document.getElementById('refresh-btn');
const toast = document.getElementById('toast');
const adminStatus = document.getElementById('admin-status');
const totalItems = document.getElementById('total-items');
const totalProducts = document.getElementById('total-products');
const totalCustomers = document.getElementById('total-customers');

let toastTimer = null;

const getApiBaseUrl = () => {
    const renderBackendUrl = 'https://camera-3-weni.onrender.com';
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal) {
        return 'http://localhost:3000';
    }

    return renderBackendUrl;
};

const API_BASE_URL = getApiBaseUrl();

function showMessage(message, type = 'error') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.className = 'toast';
    }, 3800);
}

function getLoggedInUser() {
    try {
        const data = localStorage.getItem('cameraStoreUser');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Admin user parse error:', error);
        return null;
    }
}

function getAuthToken() {
    const user = getLoggedInUser();
    return (user && user.token) || localStorage.getItem('cameraStoreToken') || '';
}

function setAccessState(message, variant) {
    adminStatus.textContent = message;
    adminStatus.style.background = variant === 'ok' ? 'rgba(22, 163, 74, 0.16)' : 'rgba(245, 158, 11, 0.18)';
    adminStatus.style.color = variant === 'ok' ? '#86efac' : '#fbbf24';
}

function formatDate(value) {
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function toEndOfDay(dateValue) {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    parsed.setHours(23, 59, 59, 999);
    return parsed;
}

function isExpiredConfirmedOrder(purchase) {
    const status = String(purchase?.status || '').toLowerCase();
    if (status !== 'confirmed' || !purchase?.deliveryDate) {
        return false;
    }

    const deliveryEnd = toEndOfDay(purchase.deliveryDate);
    if (!deliveryEnd) {
        return false;
    }

    return Date.now() > deliveryEnd.getTime();
}

function renderCartItems(items) {
    const visibleItems = Array.isArray(items)
        ? items.filter((purchase) => !isExpiredConfirmedOrder(purchase))
        : [];

    if (visibleItems.length === 0) {
        cartFeed.innerHTML = '<div class="empty-state"><h3>No orders yet</h3><p>Customer orders will appear here after checkout.</p></div>';
        totalItems.textContent = '0';
        totalProducts.textContent = '0';
        totalCustomers.textContent = '0';
        return;
    }

    const uniqueProducts = new Set();
    const uniqueCustomers = new Set(visibleItems.map((item) => item.userId));

    visibleItems.forEach((purchase) => {
        (purchase.items || []).forEach((item) => uniqueProducts.add(item.name));
    });

    totalItems.textContent = String(visibleItems.length);
    totalProducts.textContent = String(uniqueProducts.size);
    totalCustomers.textContent = String(uniqueCustomers.size);

    cartFeed.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Ordered Products</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Order Date</th>
                    <th>Delivery</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${visibleItems.map((purchase) => {
        const lines = (purchase.items || []).map((item) => `${item.name} x${item.quantity}`).join('<br>');
        const status = String(purchase.status || '').toLowerCase();
        const isConfirmed = status === 'confirmed';

        return `
                    <tr>
                        <td>
                            <div class="item-name">${purchase.customerName || 'Unknown User'}</div>
                            <div class="meta">${purchase.customerEmail || 'No email on file'}</div>
                        </td>
                        <td>
                            <div class="item-name">Order #${purchase.purchaseId}</div>
                            <div class="meta">${lines || 'No line items'}</div>
                        </td>
                        <td>${purchase.status || 'pending'}</td>
                        <td>$${Number(purchase.totalAmount).toFixed(2)}</td>
                        <td>${formatDate(purchase.createdAt)}</td>
                        <td>${purchase.deliveryDate ? formatDate(purchase.deliveryDate) : '-'}</td>
                        <td>
                            ${isConfirmed ? '<span class="pill">Confirmed</span>' : `
                                <input type="date" id="delivery-${purchase.purchaseId}" style="margin-bottom:8px; width: 160px;" />
                                <button class="btn secondary" type="button" data-confirm-id="${purchase.purchaseId}">Confirm</button>
                            `}
                        </td>
                    </tr>
                `;
    }).join('')}
            </tbody>
        </table>
    `;

    document.querySelectorAll('[data-confirm-id]').forEach((button) => {
        button.addEventListener('click', async () => {
            const purchaseId = button.getAttribute('data-confirm-id');
            const dateInput = document.getElementById(`delivery-${purchaseId}`);
            const selectedDate = dateInput ? dateInput.value : '';
            await confirmOrder(purchaseId, selectedDate);
        });
    });
}

async function confirmOrder(purchaseId, selectedDate) {
    const token = getAuthToken();
    if (!token) {
        showMessage('Please sign in as admin.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/purchases/${purchaseId}/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ deliveryDate: selectedDate || null })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Unable to confirm order.');
        }

        showMessage(data.message || 'Order confirmed.', 'success');
        await loadCartFeed();
    } catch (error) {
        console.error('Confirm order error:', error);
        showMessage(error.message || 'Unable to confirm order.', 'error');
    }
}

async function loadCartFeed() {
    const user = getLoggedInUser();
    const token = getAuthToken();

    if (!token) {
        setAccessState('Sign in required', 'warning');
        cartFeed.innerHTML = '<div class="error-state"><h3>Sign in required</h3><p>Please sign in with your admin account to view cart activity.</p><p><a href="login.html?role=admin">Go to admin login</a></p></div>';
        showMessage('Please sign in with an admin account.', 'error');
        return;
    }

    try {
        setAccessState('Checking admin access', 'warning');
        cartFeed.innerHTML = '<div class="loading-state">Loading ordered products...</div>';

        const response = await fetch(`${API_BASE_URL}/api/admin/purchases`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load cart data.');
        }

        const loggedInAs = user?.email ? ` as ${user.email}` : '';
        setAccessState(`Admin access granted${loggedInAs}`, 'ok');
        renderCartItems(data.purchases || []);
        showMessage('Order feed loaded successfully.', 'success');
    } catch (error) {
        console.error('Admin cart load error:', error);
        setAccessState('Access denied', 'warning');
        cartFeed.innerHTML = '<div class="error-state"><h3>Admin access required</h3><p>This account is not authorized to view order dashboard.</p><p><a href="admin-auth.html">Sign in with admin account</a></p></div>';
        showMessage(error.message || 'Unable to load order feed.', 'error');
    }
}

refreshBtn.addEventListener('click', loadCartFeed);
loadCartFeed();

setInterval(loadCartFeed, 60 * 1000);