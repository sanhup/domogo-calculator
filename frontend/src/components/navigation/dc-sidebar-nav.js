/**
 * dc-sidebar-nav - Left sidebar navigation for page sections
 *
 * Attributes:
 * - active-section: string (ID of active section)
 *
 * Slots:
 * - default: nav items (dc-sidebar-nav-item components)
 *
 * Usage:
 * <dc-sidebar-nav active-section="customer-details">
 *   <dc-sidebar-nav-item section="customer-details" label="Klantgegevens"></dc-sidebar-nav-item>
 *   <dc-sidebar-nav-item section="household" label="Huishouden"></dc-sidebar-nav-item>
 * </dc-sidebar-nav>
 */

class DcSidebarNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['active-section'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.updateActiveStates();
    }
  }

  setupEventListeners() {
    if (!this._listenerAdded) {
      this.addEventListener('click', (e) => {
        const item = e.target.closest('dc-sidebar-nav-item');
        if (item) {
          const section = item.getAttribute('section');
          this.setAttribute('active-section', section);
          this.dispatchEvent(new CustomEvent('section-change', {
            detail: { section },
            bubbles: true,
            composed: true
          }));
        }
      });
      this._listenerAdded = true;
    }
  }

  updateActiveStates() {
    const activeSection = this.getAttribute('active-section');
    const items = this.querySelectorAll('dc-sidebar-nav-item');
    items.forEach(item => {
      const section = item.getAttribute('section');
      if (section === activeSection) {
        item.setAttribute('active', '');
      } else {
        item.removeAttribute('active');
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: var(--size-sidebar-width);
          background-color: var(--color-white);
          border-right: var(--border-width-thin) solid var(--color-border);
          padding: var(--space-6) 0;
          position: sticky;
          top: 80px;
          height: calc(100vh - 80px);
          overflow-y: auto;
        }

        .nav-title {
          padding: 0 var(--space-4);
          margin-bottom: var(--space-4);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        ::slotted(dc-sidebar-nav-item) {
          display: block;
        }
      </style>

      <div class="nav-title">Secties</div>
      <nav>
        <slot></slot>
      </nav>
    `;

    this.updateActiveStates();
  }
}

/**
 * dc-sidebar-nav-item - Individual navigation item for sidebar
 *
 * Attributes:
 * - section: string (section ID)
 * - label: string (display text)
 * - active: boolean (is this section active)
 * - completed: boolean (has this section been completed)
 *
 * Usage:
 * <dc-sidebar-nav-item section="customer-details" label="Klantgegevens"></dc-sidebar-nav-item>
 */
class DcSidebarNavItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['section', 'label', 'active', 'completed'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  render() {
    const label = this.getAttribute('label') || '';
    const active = this.hasAttribute('active');
    const completed = this.hasAttribute('completed');

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

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: var(--transition-base);
          border-left: 2px solid transparent;
          text-decoration: none;
        }

        .nav-item:hover {
          background-color: var(--color-neutral-50);
          color: var(--color-text-primary);
        }

        .nav-item.active {
          background-color: var(--color-primary-50);
          color: var(--color-primary-600);
          border-left-color: var(--color-primary-500);
        }

        .status-indicator {
          width: var(--size-icon-md);
          height: var(--size-icon-md);
          border-radius: var(--border-radius-full);
          border: 2px solid var(--color-neutral-300);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: var(--transition-base);
        }

        .nav-item.active .status-indicator {
          border-color: var(--color-primary-500);
          background-color: var(--color-primary-500);
        }

        .nav-item.completed .status-indicator {
          border-color: var(--color-success);
          background-color: var(--color-success);
        }

        .checkmark {
          width: var(--size-icon-xs);
          height: var(--size-icon-xs);
          color: var(--color-white);
          display: none;
        }

        .nav-item.completed .checkmark {
          display: block;
        }

        .nav-item.active .checkmark {
          display: none;
        }

        .nav-item.active .status-indicator::after {
          content: '';
          width: 8px;
          height: 8px;
          background-color: var(--color-white);
          border-radius: var(--border-radius-full);
        }
      </style>

      <div class="nav-item ${active ? 'active' : ''} ${completed ? 'completed' : ''}">
        <div class="status-indicator">
          <svg class="checkmark" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>${label}</span>
      </div>
    `;
  }
}

customElements.define('dc-sidebar-nav', DcSidebarNav);
customElements.define('dc-sidebar-nav-item', DcSidebarNavItem);
