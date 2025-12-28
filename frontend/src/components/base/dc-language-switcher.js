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

        select {
          padding: var(--space-3) var(--space-4);
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-base);
          line-height: var(--line-height-normal);
          color: var(--color-text-primary);
          background-color: var(--color-white);
          cursor: pointer;
          transition: var(--transition-base);
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23737373' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
          background-position: right var(--space-2) center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: calc(var(--space-10) + var(--space-2));
        }

        select:hover {
          border-color: var(--color-neutral-400);
          background-color: var(--color-neutral-50);
        }

        select:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: var(--shadow-focus);
        }
      </style>
      <select>
        <option value="nl">Nederlands</option>
        <option value="en">English</option>
      </select>
    `;
  }
}

customElements.define('dc-language-switcher', DcLanguageSwitcher);
