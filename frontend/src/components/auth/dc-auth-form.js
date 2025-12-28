/**
 * dc-auth-form - Authentication form component (login/register)
 *
 * Attributes:
 * - mode: 'login' | 'register' (default: 'login')
 * - loading: boolean
 * - error: string (error message to display)
 *
 * Events:
 * - submit: { mode, data } - Emitted when form is submitted
 * - mode-change: { mode } - Emitted when switching between login/register
 *
 * Usage:
 * <dc-auth-form mode="login"></dc-auth-form>
 */

class DcAuthForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['mode', 'loading', 'error'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  setupEventListeners() {
    // Use event delegation on shadow root - only add once
    if (!this._listenerAdded) {
      this.shadowRoot.addEventListener('submit', (e) => {
        e.preventDefault();
        const mode = this.getAttribute('mode') || 'login';

        // Collect values from dc-input components
        const inputs = e.target.querySelectorAll('dc-input');
        const data = {};
        inputs.forEach(input => {
          const name = input.getAttribute('name');
          const value = input.getValue();
          if (name) {
            data[name] = value;
          }
        });

        // Basic validation
        if (mode === 'register') {
          if (data.password !== data.confirmPassword) {
            this.setAttribute('error', 'Wachtwoorden komen niet overeen');
            return;
          }
          delete data.confirmPassword;
        }

        // Clear any previous errors
        if (!this.getAttribute('error') || this.getAttribute('error') === '') {
          // Only clear if no validation errors were just set
        }

        this.dispatchEvent(new CustomEvent('submit', {
          detail: { mode, data },
          bubbles: true,
          composed: true
        }));
      });

      this.shadowRoot.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-mode')) {
          const currentMode = this.getAttribute('mode') || 'login';
          const newMode = currentMode === 'login' ? 'register' : 'login';
          this.setAttribute('mode', newMode);
          this.setAttribute('error', ''); // Clear errors
          this.dispatchEvent(new CustomEvent('mode-change', {
            detail: { mode: newMode },
            bubbles: true,
            composed: true
          }));
        }
      });

      this._listenerAdded = true;
    }
  }

  render() {
    const mode = this.getAttribute('mode') || 'login';
    const loading = this.hasAttribute('loading');
    const error = this.getAttribute('error') || '';
    const isLogin = mode === 'login';

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

        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-neutral-50) 0%, var(--color-primary-50) 100%);
          padding: var(--space-4);
        }

        .auth-card {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-xl);
          padding: var(--space-8);
          width: 100%;
          max-width: 440px;
        }

        .logo {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .logo-text {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-500);
          margin-bottom: var(--space-2);
        }

        .logo-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .auth-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .auth-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .error-banner {
          padding: var(--space-3) var(--space-4);
          background-color: rgba(239, 68, 68, 0.1);
          border: var(--border-width-thin) solid var(--color-error);
          border-radius: var(--border-radius-md);
          color: var(--color-error);
          font-size: var(--font-size-sm);
          display: ${error ? 'block' : 'none'};
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .submit-button {
          margin-top: var(--space-2);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: var(--space-6) 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: var(--border-width-thin) solid var(--color-border);
        }

        .divider span {
          padding: 0 var(--space-3);
          color: var(--color-text-tertiary);
          font-size: var(--font-size-sm);
        }

        .toggle-mode {
          text-align: center;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .toggle-link {
          color: var(--color-primary-500);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          text-decoration: none;
        }

        .toggle-link:hover {
          text-decoration: underline;
        }

        .footer-links {
          margin-top: var(--space-4);
          text-align: center;
        }

        .footer-link {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          text-decoration: none;
          margin: 0 var(--space-2);
        }

        .footer-link:hover {
          color: var(--color-primary-500);
          text-decoration: underline;
        }
      </style>

      <div class="auth-container">
        <div class="auth-card">
          <div class="logo">
            <div class="logo-text">Domogo</div>
            <div class="logo-subtitle">Battery ROI Calculator</div>
          </div>

          <div class="auth-header">
            <h1 class="auth-title">${isLogin ? 'Inloggen' : 'Account Aanmaken'}</h1>
            <p class="auth-subtitle">
              ${isLogin
                ? 'Vul je gegevens in om in te loggen'
                : 'Maak een account aan om te beginnen'}
            </p>
          </div>

          ${error ? `<div class="error-banner">${error}</div>` : ''}

          <form class="form">
            <div class="form-group">
              ${!isLogin ? `
                <dc-input
                  name="name"
                  label="Naam"
                  type="text"
                  placeholder="Jan de Vries"
                  required
                  ${loading ? 'disabled' : ''}
                ></dc-input>
              ` : ''}

              <dc-input
                name="email"
                label="Email"
                type="email"
                placeholder="jan@example.com"
                required
                ${loading ? 'disabled' : ''}
              ></dc-input>

              <dc-input
                name="password"
                label="Wachtwoord"
                type="password"
                placeholder="${isLogin ? 'Voer je wachtwoord in' : 'Minimaal 8 karakters'}"
                required
                ${loading ? 'disabled' : ''}
              ></dc-input>

              ${!isLogin ? `
                <dc-input
                  name="confirmPassword"
                  label="Bevestig Wachtwoord"
                  type="password"
                  placeholder="Voer je wachtwoord nogmaals in"
                  required
                  ${loading ? 'disabled' : ''}
                ></dc-input>
              ` : ''}
            </div>

            ${isLogin ? `
              <div class="footer-links">
                <a href="#" class="footer-link">Wachtwoord vergeten?</a>
              </div>
            ` : ''}

            <dc-button
              class="submit-button"
              variant="primary"
              size="md"
              type="submit"
              ${loading ? 'loading' : ''}
              ${loading ? 'disabled' : ''}
            >
              ${isLogin ? 'Inloggen' : 'Account Aanmaken'}
            </dc-button>
          </form>

          <div class="divider">
            <span>of</span>
          </div>

          <div class="toggle-mode">
            ${isLogin
              ? 'Nog geen account? <a class="toggle-link">Registreer hier</a>'
              : 'Heb je al een account? <a class="toggle-link">Log in</a>'}
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }
}

customElements.define('dc-auth-form', DcAuthForm);
