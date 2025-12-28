/**
 * dc-nav-header - Top navigation header component
 *
 * Attributes:
 * - user-name: string (display name of logged in user)
 * - user-role: 'advisor' | 'admin' | 'customer'
 * - active-route: string (current route path)
 *
 * Usage:
 * <dc-nav-header user-name="John Doe" user-role="advisor" active-route="/dashboard"></dc-nav-header>
 */

class DcNavHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['user-name', 'user-role', 'active-route'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  setupEventListeners() {
    if (!this._listenerAdded) {
      this.shadowRoot.addEventListener('click', (e) => {
        const link = e.target.closest('[data-route]');
        if (link) {
          e.preventDefault();
          const route = link.getAttribute('data-route');
          this.dispatchEvent(new CustomEvent('navigate', {
            detail: { route },
            bubbles: true,
            composed: true
          }));
        }

        // Handle user menu toggle
        if (e.target.closest('.user-menu-button')) {
          const menu = this.shadowRoot.querySelector('.user-menu-dropdown');
          menu.classList.toggle('show');
        }

        // Handle logout
        if (e.target.closest('[data-action="logout"]')) {
          this.dispatchEvent(new CustomEvent('logout', {
            bubbles: true,
            composed: true
          }));
        }
      });
      this._listenerAdded = true;
    }
  }

  getNavItems() {
    const role = this.getAttribute('user-role');
    const items = [];

    if (role === 'advisor') {
      items.push(
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Klanten', route: '/customers' },
        { label: 'Offertes', route: '/offers' }
      );
    } else if (role === 'admin') {
      items.push(
        { label: 'Dashboard', route: '/admin/dashboard' },
        { label: 'Adviseurs', route: '/admin/advisors' },
        { label: 'Producten', route: '/admin/products' },
        { label: 'Master Data', route: '/admin/master-data' }
      );
    } else if (role === 'customer') {
      items.push(
        { label: 'Mijn Offerte', route: '/my-offer' }
      );
    }

    return items;
  }

  render() {
    const userName = this.getAttribute('user-name') || 'Gebruiker';
    const activeRoute = this.getAttribute('active-route') || '';
    const navItems = this.getNavItems();

    this.shadowRoot.innerHTML = `
      <style>
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        :host {
          display: block;
        }

        .header {
          background-color: var(--color-white);
          border-bottom: var(--border-width-thin) solid var(--color-border);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          padding: 0 var(--space-6);
        }

        .header-container {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .logo {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-500);
          text-decoration: none;
          cursor: pointer;
        }

        .nav {
          display: flex;
          gap: var(--space-1);
          align-items: center;
        }

        .nav-link {
          padding: var(--space-2) var(--space-4);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          border-radius: var(--border-radius-md);
          transition: var(--transition-base);
          cursor: pointer;
        }

        .nav-link:hover {
          background-color: var(--color-neutral-100);
          color: var(--color-text-primary);
        }

        .nav-link.active {
          background-color: var(--color-neutral-100);
          color: var(--color-primary-500);
        }

        .right-section {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .user-menu {
          position: relative;
        }

        .user-menu-button {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          transition: var(--transition-base);
        }

        .user-menu-button:hover {
          background-color: var(--color-neutral-50);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--border-radius-full);
          background-color: var(--color-primary-500);
          color: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-sm);
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + var(--space-2));
          right: 0;
          background: var(--color-white);
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: var(--transition-base);
          z-index: var(--z-dropdown);
        }

        .user-menu-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .menu-item {
          padding: var(--space-3) var(--space-4);
          cursor: pointer;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          transition: var(--transition-base);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .menu-item:hover {
          background-color: var(--color-neutral-50);
        }

        .menu-item:first-child {
          border-top-left-radius: var(--border-radius-md);
          border-top-right-radius: var(--border-radius-md);
        }

        .menu-item:last-child {
          border-bottom-left-radius: var(--border-radius-md);
          border-bottom-right-radius: var(--border-radius-md);
          color: var(--color-error);
        }

        .menu-divider {
          height: 1px;
          background-color: var(--color-border);
          margin: var(--space-1) 0;
        }
      </style>

      <header class="header">
        <div class="header-container">
          <a class="logo" data-route="/">Domogo</a>

          <nav class="nav">
            ${navItems.map(item => `
              <a
                class="nav-link ${activeRoute === item.route ? 'active' : ''}"
                data-route="${item.route}"
              >
                ${item.label}
              </a>
            `).join('')}
          </nav>

          <div class="right-section">
            <dc-language-switcher></dc-language-switcher>

            <div class="user-menu">
              <button class="user-menu-button">
                <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                <span>${userName}</span>
              </button>

              <div class="user-menu-dropdown">
                <button class="menu-item" data-route="/profile">Profiel</button>
                <button class="menu-item" data-route="/settings">Instellingen</button>
                <div class="menu-divider"></div>
                <button class="menu-item" data-action="logout">Uitloggen</button>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;

    this.setupEventListeners();
  }
}

customElements.define('dc-nav-header', DcNavHeader);
