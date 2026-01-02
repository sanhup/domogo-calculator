/**
 * dc-modal - Reusable modal dialog component
 *
 * Attributes:
 * - open: boolean - Whether the modal is open
 * - title: string - Modal title
 * - size: 'sm' | 'md' | 'lg' | 'xl' - Modal size (default: 'md')
 *
 * Slots:
 * - default: Modal content
 * - footer: Modal footer (typically for buttons)
 *
 * Events:
 * - close: Emitted when modal should close (backdrop click or ESC key)
 * - confirm: Emitted when confirm action is triggered
 * - cancel: Emitted when cancel action is triggered
 *
 * Usage:
 * <dc-modal id="myModal" title="Confirm Action" open>
 *   <p>Are you sure you want to proceed?</p>
 *   <div slot="footer">
 *     <dc-button variant="secondary" id="cancelBtn">Cancel</dc-button>
 *     <dc-button variant="primary" id="confirmBtn">Confirm</dc-button>
 *   </div>
 * </dc-modal>
 */

class DcModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handleEscape = this._handleEscape.bind(this);
  }

  static get observedAttributes() {
    return ['open', 'title', 'size'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._handleEscape);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'open') {
        if (this.hasAttribute('open')) {
          document.addEventListener('keydown', this._handleEscape);
          document.body.style.overflow = 'hidden';
        } else {
          document.removeEventListener('keydown', this._handleEscape);
          document.body.style.overflow = '';
        }
      }
      this.render();
    }
  }

  _handleEscape(e) {
    if (e.key === 'Escape' && this.hasAttribute('open')) {
      this.close();
    }
  }

  setupEventListeners() {
    // Close on backdrop click
    const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.close();
        }
      });
    }

    // Close button
    const closeBtn = this.shadowRoot.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const isOpen = this.hasAttribute('open');
    const title = this.getAttribute('title') || '';
    const size = this.getAttribute('size') || 'md';

    this.shadowRoot.innerHTML = `
      <style>
        .modal-backdrop {
          display: ${isOpen ? 'flex' : 'none'};
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--color-backdrop);
          z-index: var(--z-modal-backdrop);
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          opacity: ${isOpen ? '1' : '0'};
          transition: opacity var(--transition-base);
        }

        .modal {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: var(--size-modal-${size});
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          transform: ${isOpen ? 'scale(1)' : 'scale(0.95)'};
          transition: transform var(--transition-base);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          border-bottom: var(--border-width-thin) solid var(--color-neutral-200);
        }

        .modal-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-2);
          color: var(--color-neutral-500);
          font-size: var(--font-size-2xl);
          line-height: 1;
          transition: color var(--transition-fast);
          border-radius: var(--border-radius-md);
        }

        .close-button:hover {
          color: var(--color-neutral-900);
          background: var(--color-neutral-100);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-6);
        }

        .modal-footer {
          padding: var(--space-6);
          border-top: var(--border-width-thin) solid var(--color-neutral-200);
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
        }

        .modal-footer:empty {
          display: none;
        }

        /* Scrollbar styling */
        .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: var(--color-neutral-100);
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: var(--color-neutral-300);
          border-radius: 4px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: var(--color-neutral-400);
        }
      </style>

      <div class="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h2 id="modal-title" class="modal-title">${title}</h2>
            <button class="close-button" aria-label="Close">×</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }
}

customElements.define('dc-modal', DcModal);
