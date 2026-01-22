class AmazonAdsAuth {
  constructor() {
    // Auto-detect API URL based on environment
    this.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : `${window.location.origin}/api`;
    
    console.log('🔧 [AUTH] API URL:', this.API_URL);
  }

  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('❌ [REGISTER] Error:', error);
      throw error;
    }
  }

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('❌ [LOGIN] Error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Get user data
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Make authenticated request
  async makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Get Amazon auth URL
  async getAmazonAuthUrl(userData) {
    try {
      const response = await fetch(`${this.API_URL}/auth/get-auth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get auth URL');
      }

      return data.authUrl;
    } catch (error) {
      console.error('❌ [AUTH_URL] Error:', error);
      throw error;
    }
  }

  // Exchange auth code for tokens
  async exchangeToken(code, state) {
    try {
      const response = await fetch(`${this.API_URL}/auth/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token exchange failed');
      }

      // Save token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('❌ [EXCHANGE] Error:', error);
      throw error;
    }
  }
}