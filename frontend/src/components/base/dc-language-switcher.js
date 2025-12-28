/**
 * dc-language-switcher - Language switcher component
 *
 * This is a placeholder. Full implementation will be in Phase 2 (i18n).
 *
 * Usage:
 * <dc-language-switcher></dc-language-switcher>
 */

class DcLanguageSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
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
          display: inline-block;
        }

        .language-selector {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: none;
          background: transparent;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: var(--transition-base);
        }

        .language-selector:hover {
          background-color: var(--color-neutral-50);
          border-radius: var(--border-radius-md);
        }

        .globe-icon {
          width: 20px;
          height: 20px;
          color: var(--color-text-secondary);
        }

        .chevron-icon {
          width: 16px;
          height: 16px;
          color: var(--color-text-secondary);
        }
      </style>
      <button class="language-selector">
        <svg class="globe-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 2.25c-2.998 0-5.74 1.1-7.843 2.918m15.686 0A8.959 8.959 0 0121 12a8.96 8.96 0 01-1.043 4.251m-3.4-6.124a11.953 11.953 0 00-1.214-2.879m0 0a11.959 11.959 0 00-3.14-3.566M3.34 7.5a8.959 8.959 0 00-1.043 4.5 8.96 8.96 0 001.043 4.251m0-8.502a11.953 11.953 0 011.214 2.879m0 0a11.959 11.959 0 013.14 3.566m0 0a11.953 11.953 0 011.214 2.879"/>
        </svg>
        <span>Nederlands</span>
        <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/>
        </svg>
      </button>
    `;
  }
}

customElements.define('dc-language-switcher', DcLanguageSwitcher);
