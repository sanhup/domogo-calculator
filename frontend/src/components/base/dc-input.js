/**
 * dc-input - Input component
 *
 * Attributes:
 * - label: string
 * - type: 'text' | 'email' | 'password' | 'number' | 'tel' (default: 'text')
 * - placeholder: string
 * - value: string
 * - required: boolean
 * - disabled: boolean
 * - error: string (error message to display)
 *
 * Usage:
 * <dc-input label="Email" type="email" placeholder="user@example.com"></dc-input>
 */

class DcInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['label', 'type', 'placeholder', 'value', 'required', 'disabled', 'error'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot.innerHTML && oldValue !== newValue) {
      if (name === 'value') {
        const input = this.shadowRoot.querySelector('input');
        if (input && input.value !== newValue) {
          input.value = newValue || '';
        }
      } else {
        this.render();
      }
    }
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector('input');
    if (input) {
      input.addEventListener('input', (e) => {
        this.setAttribute('value', e.target.value);
        this.dispatchEvent(new CustomEvent('input', {
          detail: { value: e.target.value },
          bubbles: true,
          composed: true
        }));
      });

      input.addEventListener('change', (e) => {
        this.dispatchEvent(new CustomEvent('change', {
          detail: { value: e.target.value },
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  getValue() {
    const input = this.shadowRoot.querySelector('input');
    return input ? input.value : '';
  }

  setValue(value) {
    this.setAttribute('value', value);
  }

  render() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const value = this.getAttribute('value') || '';
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');
    const error = this.getAttribute('error') || '';

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

        .input-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        label .required {
          color: var(--color-error);
        }

        input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-base);
          line-height: var(--line-height-normal);
          color: var(--color-text-primary);
          background-color: var(--color-white);
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-md);
          transition: var(--transition-base);
        }

        input:hover:not(:disabled) {
          border-color: var(--color-neutral-400);
        }

        input:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: var(--shadow-focus);
        }

        input:disabled {
          background-color: var(--color-neutral-50);
          color: var(--color-text-tertiary);
          cursor: not-allowed;
        }

        input.error {
          border-color: var(--color-error);
        }

        input.error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .error-message {
          font-size: var(--font-size-sm);
          color: var(--color-error);
        }
      </style>
      <div class="input-group">
        ${label ? `<label>${label}${required ? ' <span class="required">*</span>' : ''}</label>` : ''}
        <input
          type="${type}"
          placeholder="${placeholder}"
          value="${value}"
          ${required ? 'required' : ''}
          ${disabled ? 'disabled' : ''}
          class="${error ? 'error' : ''}"
        />
        ${error ? `<span class="error-message">${error}</span>` : ''}
      </div>
    `;

    this.setupEventListeners();
  }
}

customElements.define('dc-input', DcInput);
