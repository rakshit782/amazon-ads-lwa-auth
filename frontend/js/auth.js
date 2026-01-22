const API_BASE_URL = 'http://localhost:3000/api';

class AmazonAdsAuth {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    async getAuthUrl(marketplace, email, name) {
        const response = await fetch(`${API_BASE_URL}/auth/get-auth-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ marketplace, email, name })
        });

        if (!response.ok) {
            throw new Error('Failed to get authorization URL');
        }

        return await response.json();
    }

    async exchangeToken(code, state) {
        const response = await fetch(`${API_BASE_URL}/auth/exchange-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, state })
        });

        if (!response.ok) {
            throw new Error('Failed to exchange token');
        }

        const data = await response.json();
        
        // Store token and user info
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        return data;
    }

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get profile');
        }

        return await response.json();
    }

    async makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return await response.json();
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token;
    }
}