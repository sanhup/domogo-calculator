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

class AuthManager {
  constructor() {
    this.storageKey = 'domogo_auth';
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
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User object
   */
  async login(email, password) {
    // TODO: Replace with actual API call
    // For now, simulate API call
    const response = await this.simulateLogin(email, password);

    if (response.success) {
      this.state = {
        user: response.user,
        token: response.token
      };
      this.saveToStorage();
      this.notifyListeners('login', this.state.user);
      return response.user;
    } else {
      throw new Error(response.error || 'Login failed');
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User object
   */
  async register(userData) {
    // TODO: Replace with actual API call
    const response = await this.simulateRegister(userData);

    if (response.success) {
      this.state = {
        user: response.user,
        token: response.token
      };
      this.saveToStorage();
      this.notifyListeners('register', this.state.user);
      return response.user;
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  logout() {
    const user = this.state.user;
    this.state = { user: null, token: null };
    this.saveToStorage();
    this.notifyListeners('logout', user);
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
    return this.state.user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array<string>} roles - Roles to check
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    return roles.includes(this.state.user?.role);
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

  // ===== Simulation methods (remove in production) =====

  /**
   * Simulate login API call (for demo purposes)
   */
  async simulateLogin(email, password) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (email === 'demo@domogo.nl' && password === 'demo123') {
          resolve({
            success: true,
            user: {
              id: '1',
              name: 'Jan de Vries',
              email: 'demo@domogo.nl',
              role: 'advisor'
            },
            token: 'demo-token-' + Date.now()
          });
        } else if (email === 'admin@domogo.nl' && password === 'admin123') {
          resolve({
            success: true,
            user: {
              id: '2',
              name: 'Admin User',
              email: 'admin@domogo.nl',
              role: 'admin'
            },
            token: 'demo-token-' + Date.now()
          });
        } else {
          resolve({
            success: false,
            error: 'Ongeldige inloggegevens'
          });
        }
      }, 1000);
    });
  }

  /**
   * Simulate register API call (for demo purposes)
   */
  async simulateRegister(userData) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 'new-' + Date.now(),
            name: userData.name,
            email: userData.email,
            role: 'customer'
          },
          token: 'demo-token-' + Date.now()
        });
      }, 1000);
    });
  }
}

// Export singleton instance
export const auth = new AuthManager();
