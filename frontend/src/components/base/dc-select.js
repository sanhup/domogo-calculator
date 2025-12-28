/**
 * dc-select - Select dropdown component
 *
 * Attributes:
 * - label: string
 * - value: string (selected value)
 * - required: boolean
 * - disabled: boolean
 * - error: string (error message to display)
 *
 * Usage:
 * <dc-select label="Choose option">
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </dc-select>
 */

class DcSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['label', 'value', 'required', 'disabled', 'error'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.syncOptions();

    // Watch for changes to options in light DOM
    this._observer = new MutationObserver(() => this.syncOptions());
    this._observer.observe(this, { childList: true, subtree: true });
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot.innerHTML && oldValue !== newValue) {
      if (name === 'value') {
        const select = this.shadowRoot.querySelector('select');
        if (select && select.value !== newValue) {
          select.value = newValue || '';
        }
      } else {
        this.render();
        this.syncOptions();
      }
    }
  }

  syncOptions() {
    // Copy option elements from light DOM to shadow DOM select
    const select = this.shadowRoot.querySelector('select');
    if (!select) return;

    // Clear existing options
    select.innerHTML = '';

    // Copy all option elements from light DOM
    const options = Array.from(this.querySelectorAll('option'));
    options.forEach(option => {
      const newOption = document.createElement('option');
      newOption.value = option.value;
      newOption.textContent = option.textContent;
      if (option.selected) newOption.selected = true;
      select.appendChild(newOption);
    });

    // Restore selected value if set
    const value = this.getAttribute('value');
    if (value) {
      select.value = value;
    }
  }

  setupEventListeners() {
    // Use event delegation on the shadow root to avoid re-adding listeners
    if (!this._listenerAdded) {
      this.shadowRoot.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT') {
          this.setAttribute('value', e.target.value);
          this.dispatchEvent(new CustomEvent('change', {
            detail: { value: e.target.value },
            bubbles: true,
            composed: true
          }));
        }
      });
      this._listenerAdded = true;
    }
  }

  getValue() {
    const select = this.shadowRoot.querySelector('select');
    return select ? select.value : '';
  }

  setValue(value) {
    this.setAttribute('value', value);
  }

  render() {
    const label = this.getAttribute('label') || '';
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

        .select-group {
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

        select {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-base);
          line-height: var(--line-height-normal);
          color: var(--color-text-primary);
          background-color: var(--color-white);
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-md);
          transition: var(--transition-base);
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23737373' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
          background-position: right var(--space-2) center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: calc(var(--space-10) + var(--space-2));
          position: relative;
          z-index: 1;
        }

        select:hover:not(:disabled) {
          border-color: var(--color-neutral-400);
        }

        select:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: var(--shadow-focus);
        }

        select:disabled {
          background-color: var(--color-neutral-50);
          color: var(--color-text-tertiary);
          cursor: not-allowed;
        }

        select.error {
          border-color: var(--color-error);
        }

        select.error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .error-message {
          font-size: var(--font-size-sm);
          color: var(--color-error);
        }

        select option {
          padding: var(--space-2) var(--space-3);
          color: var(--color-text-primary);
          background-color: var(--color-white);
        }

        select option:checked {
          background-color: var(--color-primary-50);
        }
      </style>
      <div class="select-group">
        ${label ? `<label>${label}${required ? ' <span class="required">*</span>' : ''}</label>` : ''}
        <select
          ${required ? 'required' : ''}
          ${disabled ? 'disabled' : ''}
          class="${error ? 'error' : ''}"
        ></select>
        ${error ? `<span class="error-message">${error}</span>` : ''}
      </div>
    `;

    // Set selected value if provided
    if (value) {
      const select = this.shadowRoot.querySelector('select');
      if (select) {
        select.value = value;
      }
    }

    this.setupEventListeners();
  }
}

customElements.define('dc-select', DcSelect);
