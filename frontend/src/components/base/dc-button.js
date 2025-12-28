/**
 * dc-button - Button component
 *
 * Attributes:
 * - variant: 'primary' | 'secondary' (default: 'primary')
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - disabled: boolean
 * - loading: boolean
 *
 * Usage:
 * <dc-button variant="primary" size="md">Click me</dc-button>
 */

class DcButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading', 'type'];
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
    const button = this.shadowRoot.querySelector('button');
    if (button) {
      button.addEventListener('click', (e) => {
        if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        // If button type is submit and we're inside a form, submit the form
        const type = this.getAttribute('type');
        if (type === 'submit') {
          const form = this.closest('form');
          if (form) {
            // Trigger form submission
            form.requestSubmit();
          }
        }
      });
    }
  }

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const disabled = this.hasAttribute('disabled');
    const loading = this.hasAttribute('loading');

    this.shadowRoot.innerHTML = `
      <style>
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        :host {
          display: inline-block;
        }

        button {
          font-family: var(--font-sans);
          font-weight: var(--font-weight-medium);
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: var(--transition-base);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          position: relative;
        }

        button:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        /* Variants */
        .primary {
          background: var(--color-primary-500);
          color: var(--color-white);
        }

        .primary:hover:not(:disabled) {
          background: var(--color-primary-600);
        }

        .primary:active:not(:disabled) {
          background: var(--color-primary-700);
        }

        .secondary {
          background: transparent;
          color: var(--color-primary-500);
          border: var(--border-width-thin) solid var(--color-border);
        }

        .secondary:hover:not(:disabled) {
          background: var(--color-primary-50);
        }

        .secondary:active:not(:disabled) {
          background: var(--color-primary-100);
        }

        /* Sizes */
        .sm {
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-sm);
        }

        .md {
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-base);
        }

        .lg {
          padding: var(--space-4) var(--space-6);
          font-size: var(--font-size-lg);
        }

        /* States */
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          color: transparent;
        }

        .spinner {
          position: absolute;
          width: 1em;
          height: 1em;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          color: ${variant === 'primary' ? 'var(--color-white)' : 'var(--color-primary-500)'};
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <button
        class="${variant} ${size} ${loading ? 'loading' : ''}"
        ${disabled || loading ? 'disabled' : ''}
      >
        ${loading ? '<span class="spinner"></span>' : ''}
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('dc-button', DcButton);
