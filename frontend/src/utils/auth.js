/**
 * Authentication state manager
 *
 * Handles user authentication state, token storage, and auth checks
 *
 * Usage:
 * import { auth } from './utils/auth.js';
 *
 * // Login
 * await auth.login(email, password);
 *
 * // Check if authenticated
 * if (auth.isAuthenticated()) {
 *   // User is logged in
 * }
 *
 * // Get current user
 * const user = auth.getUser();
 *
 * // Logout
 * auth.logout();
 */

const API_BASE_URL = 'http://localhost:8000';

class AuthManager {
  constructor() {
    this.storageKey = 'domogo_auth';
    this.refreshTokenKey = 'domogo_refresh_token';
    this.listeners = new Set();
    this.loadFromStorage();
  }

  /**
   * Load authentication state from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        this.state = { user: null, token: null };
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.state = { user: null, token: null };
    }
  }

  /**
   * Save authentication state to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Save refresh token
   */
  saveRefreshToken(token) {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  /**
   * Clear refresh token
   */
  clearRefreshToken() {
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Login user
   * @param {string} username - Username (or email)
   * @param {string} password - User password
   * @returns {Promise<Object>} - User object
   */
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();

    // Store access token
    this.state.token = data.access_token;

    // Store refresh token separately
    this.saveRefreshToken(data.refresh_token);

    // Fetch user info
    const user = await this.fetchCurrentUser();
    this.state.user = user;

    this.saveToStorage();
    this.notifyListeners('login', this.state.user);

    return user;
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User object
   */
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const user = await response.json();

    // After registration, login with the same credentials
    await this.login(userData.username, userData.password);

    return user;
  }

  /**
   * Logout user
   */
  logout() {
    const user = this.state.user;
    this.state = { user: null, token: null };
    this.clearRefreshToken();
    this.saveToStorage();
    this.notifyListeners('logout', user);
  }

  /**
   * Fetch current user info from API
   */
  async fetchCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.state.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this.state.token = data.access_token;
      this.saveRefreshToken(data.refresh_token);
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.state.token && !!this.state.user;
  }

  /**
   * Get current user
   * @returns {Object|null}
   */
  getUser() {
    return this.state.user;
  }

  /**
   * Get current token
   * @returns {string|null}
   */
  getToken() {
    return this.state.token;
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  hasRole(role) {
    return this.state.user?.roles?.includes(role) || false;
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array<string>} roles - Roles to check
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    if (!this.state.user?.roles) return false;
    return roles.some(role => this.state.user.roles.includes(role));
  }

  /**
   * Make an authenticated API request
   * Automatically includes JWT token and handles token refresh
   *
   * @param {string} endpoint - API endpoint (e.g., '/api/customers')
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async fetch(endpoint, options = {}) {
    const token = this.getToken();

    // Add authentication header
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        // Retry request with new token
        const newToken = this.getToken();
        headers['Authorization'] = `Bearer ${newToken}`;

        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, redirect to login
        this.logout();
        window.location.hash = '#/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  /**
   * Add an auth state change listener
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of auth state change
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  /**
   * Get authorization header for API requests
   * @returns {Object|null}
   */
  getAuthHeader() {
    if (this.state.token) {
      return {
        'Authorization': `Bearer ${this.state.token}`
      };
    }
    return null;
  }
}

// Export singleton instance
export const auth = new AuthManager();
