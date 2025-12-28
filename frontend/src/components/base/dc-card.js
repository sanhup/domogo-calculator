/**
 * dc-card - Card container component
 *
 * Attributes:
 * - variant: 'default' | 'elevated' (default: 'default')
 * - padding: 'sm' | 'md' | 'lg' (default: 'md')
 *
 * Usage:
 * <dc-card>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </dc-card>
 */

class DcCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['variant', 'padding'];
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
    const variant = this.getAttribute('variant') || 'default';
    const padding = this.getAttribute('padding') || 'md';

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

        .card {
          background-color: var(--color-white);
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-lg);
          transition: var(--transition-base);
        }

        .card.default {
          box-shadow: var(--shadow-sm);
        }

        .card.elevated {
          box-shadow: var(--shadow-md);
        }

        .card.elevated:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .card.sm {
          padding: var(--space-3);
        }

        .card.md {
          padding: var(--space-6);
        }

        .card.lg {
          padding: var(--space-8);
        }

        ::slotted(h1),
        ::slotted(h2),
        ::slotted(h3),
        ::slotted(h4),
        ::slotted(h5),
        ::slotted(h6) {
          margin-top: 0;
        }

        ::slotted(p:last-child) {
          margin-bottom: 0;
        }
      </style>
      <div class="card ${variant} ${padding}">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('dc-card', DcCard);
