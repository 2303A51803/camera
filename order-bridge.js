(function () {
    function getApiBaseUrl() {
        var renderBackendUrl = 'https://camera-3-weni.onrender.com';
        var hostname = window.location.hostname;
        var isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

        if (isLocal) {
            return 'http://localhost:3000';
        }

        return renderBackendUrl;
    }

    function getLoggedInUser() {
        try {
            var userData = localStorage.getItem('cameraStoreUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            return null;
        }
    }

    function getAuthToken() {
        var user = getLoggedInUser();
        return (user && user.token) || localStorage.getItem('cameraStoreToken') || '';
    }

    function isAdminUser(user) {
        var role = String((user && user.role) || '').toLowerCase();
        return role === 'admin';
    }

    async function createPendingOrder(items) {
        var user = getLoggedInUser();
        var token = getAuthToken();

        if (!user || !user.id || !token) {
            return { ok: false, reason: 'not-logged-in' };
        }

        if (isAdminUser(user)) {
            return {
                ok: false,
                reason: 'admin-not-allowed',
                message: 'Admin account cannot place orders. Please login with a user account.'
            };
        }

        try {
            var response = await fetch(getApiBaseUrl() + '/api/purchases/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({
                    userId: user.id,
                    items: items
                })
            });

            var data = await response.json();
            if (!response.ok) {
                return { ok: false, reason: 'api-error', message: data.message || 'Unable to create order.' };
            }

            return { ok: true, data: data };
        } catch (error) {
            return { ok: false, reason: 'network-error', message: error.message };
        }
    }

    window.orderBridge = {
        createPendingOrder: createPendingOrder,
        isAdminUser: isAdminUser
    };
})();
