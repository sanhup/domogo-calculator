/**
 * Simple client-side router for single-page navigation
 *
 * Usage:
 * import { router } from './utils/router.js';
 *
 * router.add('/dashboard', () => {
 *   // Render dashboard page
 * });
 *
 * router.navigate('/dashboard');
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeNavigateHooks = [];

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
  }

  /**
   * Add a route handler
   * @param {string} path - Route path (e.g., '/dashboard', '/users/:id')
   * @param {Function} handler - Function to execute when route matches
   * @param {Object} options - Route options (auth required, roles, etc.)
   */
  add(path, handler, options = {}) {
    this.routes.set(path, { handler, options });
    return this;
  }

  /**
   * Add a hook to run before navigation
   * @param {Function} hook - Hook function, return false to cancel navigation
   */
  beforeNavigate(hook) {
    this.beforeNavigateHooks.push(hook);
    return this;
  }

  /**
   * Navigate to a route
   * @param {string} path - Path to navigate to
   * @param {Object} state - Optional state object
   */
  async navigate(path, state = {}) {
    // Run before navigate hooks
    for (const hook of this.beforeNavigateHooks) {
      const result = await hook(path, state);
      if (result === false) {
        console.log('Navigation cancelled by hook');
        return;
      }
    }

    // Update browser history
    window.history.pushState(state, '', path);

    // Handle the route
    await this.handleRoute(path, state);
  }

  /**
   * Handle a route (internal)
   */
  async handleRoute(path, state = {}) {
    this.currentRoute = path;

    // Try exact match first
    if (this.routes.has(path)) {
      const { handler, options } = this.routes.get(path);
      await handler({ path, params: {}, query: this.parseQuery(), state, options });
      return;
    }

    // Try parameterized routes
    for (const [routePath, { handler, options }] of this.routes) {
      const params = this.matchRoute(routePath, path);
      if (params) {
        await handler({ path, params, query: this.parseQuery(), state, options });
        return;
      }
    }

    // No route found, try 404 handler
    if (this.routes.has('*')) {
      const { handler } = this.routes.get('*');
      await handler({ path, params: {}, query: this.parseQuery(), state });
      return;
    }

    console.error('No route found for:', path);
  }

  /**
   * Match a parameterized route
   * @param {string} routePath - Route pattern (e.g., '/users/:id')
   * @param {string} actualPath - Actual path (e.g., '/users/123')
   * @returns {Object|null} - Params object or null if no match
   */
  matchRoute(routePath, actualPath) {
    const routeParts = routePath.split('/').filter(Boolean);
    const pathParts = actualPath.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        // This is a parameter
        const paramName = routePart.slice(1);
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        // Parts don't match
        return null;
      }
    }

    return params;
  }

  /**
   * Parse query string
   * @returns {Object} - Query parameters as object
   */
  parseQuery() {
    const query = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
      query[key] = value;
    }
    return query;
  }

  /**
   * Replace current route without adding to history
   */
  replace(path, state = {}) {
    window.history.replaceState(state, '', path);
    this.handleRoute(path, state);
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute || window.location.pathname;
  }

  /**
   * Start the router (call after defining all routes)
   */
  start() {
    this.handleRoute(window.location.pathname);
  }
}

// Export singleton instance
export const router = new Router();
