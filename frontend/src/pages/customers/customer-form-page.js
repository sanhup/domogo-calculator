/**
 * Customer Form Page Component
 *
 * Provides form for creating new customers or editing existing ones.
 * Integrates with customer API and emits navigation events.
 * Uses FormChangeTracker for save button state management.
 *
 * Attributes:
 * - customer-id: ID of customer to edit (optional, omit for create mode)
 *
 * Events:
 * - navigate: Emitted when navigation is requested
 *   detail: { route: string }
 * - save: Emitted when customer is successfully saved
 *   detail: { customer: object }
 */

import { getCustomer, createCustomer, updateCustomer } from '../../services/customer-api.js';
import { FormChangeTracker } from '../../utils/form-change-tracker.js';

class CustomerFormPage extends HTMLElement {
  constructor() {
    super();
    this.changeTracker = new FormChangeTracker(this);
    this.customerId = null;
    this.customer = null;
    this.formData = null; // Current form state (for validation errors)
    this.loading = false;
    this.error = null;
    this.validationErrors = {};
  }

  static get observedAttributes() {
    return ['customer-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'customer-id' && oldValue !== newValue) {
      this.customerId = newValue;
      if (this.isConnected) {
        this.loadCustomer();
      }
    }
  }

  connectedCallback() {
    if (this.customerId) {
      this.loadCustomer();
    } else {
      this.render();
    }
  }

  /**
   * Load customer data for editing
   */
  async loadCustomer() {
    if (!this.customerId) return;

    this.loading = true;
    this.error = null;
    this.render();

    try {
      this.customer = await getCustomer(this.customerId);
      // Set original data for change tracking
      this.changeTracker.setOriginalData(this.customer);
      this.formData = null; // Clear any previous form state
      this.loading = false;
      this.render();
    } catch (err) {
      this.loading = false;
      this.error = err.message || 'Fout bij het laden van klantgegevens';
      this.render();
    }
  }

  /**
   * Validate form data
   * Returns object with field errors, or empty object if valid
   */
  validateForm(formData) {
    const errors = {};

    if (!formData.full_name?.trim()) {
      errors.full_name = 'Naam is verplicht';
    }

    if (!formData.email?.trim()) {
      errors.email = 'E-mail is verplicht';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    if (!formData.phone?.trim()) {
      errors.phone = 'Telefoonnummer is verplicht';
    }

    if (!formData.street_address?.trim()) {
      errors.street_address = 'Straat en huisnummer zijn verplicht';
    }

    if (!formData.postal_code?.trim()) {
      errors.postal_code = 'Postcode is verplicht';
    } else if (!/^\d{4}\s?[A-Z]{2}$/i.test(formData.postal_code.trim())) {
      errors.postal_code = 'Ongeldige postcode (gebruik formaat: 1234AB)';
    }

    if (!formData.city?.trim()) {
      errors.city = 'Plaats is verplicht';
    }

    return errors;
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    // Read values from dc-input elements using getValue() method
    const form = e.target;
    const data = {
      full_name: form.querySelector('[name="full_name"]')?.getValue() || '',
      email: form.querySelector('[name="email"]')?.getValue() || '',
      phone: form.querySelector('[name="phone"]')?.getValue() || '',
      street_address: form.querySelector('[name="street_address"]')?.getValue() || '',
      postal_code: form.querySelector('[name="postal_code"]')?.getValue() || '',
      city: form.querySelector('[name="city"]')?.getValue() || '',
    };

    // Validate
    this.validationErrors = this.validateForm(data);
    if (Object.keys(this.validationErrors).length > 0) {
      // Store form data to preserve user input when re-rendering
      this.formData = data;
      this.render();
      return;
    }

    // Submit
    this.loading = true;
    this.error = null;
    this.render();

    try {
      let savedCustomer;
      const isNewCustomer = !this.customerId;

      if (this.customerId) {
        savedCustomer = await updateCustomer(this.customerId, data);
      } else {
        savedCustomer = await createCustomer(data);
      }

      // Update component state with saved data
      this.customer = savedCustomer;
      this.customerId = savedCustomer.id;
      this.formData = null;
      this.validationErrors = {};
      this.loading = false;
      this.error = null;

      // Reset change tracker with new data (disables save button)
      this.changeTracker.setOriginalData(savedCustomer);

      // Show success message (stays until user starts editing)
      this.successMessage = isNewCustomer ? 'Klant succesvol aangemaakt' : 'Wijzigingen opgeslagen';
      this.render();

      // Emit save event
      this.dispatchEvent(new CustomEvent('save', {
        detail: { customer: savedCustomer },
        bubbles: true,
      }));

      // Update URL if this was a new customer (without triggering navigation)
      if (isNewCustomer) {
        window.history.replaceState(null, '', `#/customers/${savedCustomer.id}/edit`);
      }
    } catch (err) {
      this.loading = false;
      this.error = err.message || 'Fout bij het opslaan van klantgegevens';
      this.render();
    }
  }

  /**
   * Handle cancel/close button
   */
  handleCancel() {
    // Check if there are unsaved changes
    if (this.changeTracker.hasChanges) {
      const confirmed = confirm(
        'Er zijn niet-opgeslagen wijzigingen.\n\n' +
        'Weet u zeker dat u het formulier wilt sluiten?'
      );
      if (!confirmed) {
        return; // Don't close if user cancels
      }
    }

    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { route: '/customers' },
      bubbles: true,
    }));
  }

  render() {
    const isEditMode = !!this.customerId;
    const title = isEditMode ? 'Klant bewerken' : 'Nieuwe klant';

    // Use formData if validation failed, otherwise use customer data
    const displayData = this.formData || this.customer || {};

    this.innerHTML = `
      <style>
        .page-container {
          padding: var(--space-8) var(--space-6);
          background: var(--color-background-subtle);
          min-height: calc(100vh - 64px);
        }

        .content-wrapper {
          max-width: 900px;
          margin: 0 auto;
        }

        .back-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          transition: color 0.15s;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
        }

        .back-link:hover {
          color: var(--color-text-primary);
        }

        .form-card {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .form-header {
          background: var(--color-dark-surface);
          color: var(--color-white);
          padding: var(--space-6);
        }

        .form-title {
          margin: 0;
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-white);
        }

        .form-body {
          padding: var(--space-6);
        }

        .form-grid {
          display: grid;
          gap: var(--space-4);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .form-label.required::after {
          content: ' *';
          color: var(--color-danger-500);
        }

        .label-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          margin-top: var(--space-6);
          padding-top: var(--space-6);
          border-top: var(--border-width-thin) solid var(--color-border);
        }

        .error-message {
          padding: var(--space-4);
          background: var(--color-danger-50);
          border: var(--border-width-thin) solid var(--color-danger-200);
          border-radius: var(--border-radius-md);
          color: var(--color-danger-700);
          margin-bottom: var(--space-4);
        }

        .loading-message {
          padding: var(--space-4);
          background: var(--color-primary-50);
          border: var(--border-width-thin) solid var(--color-primary-200);
          border-radius: var(--border-radius-md);
          color: var(--color-primary-700);
          margin-bottom: var(--space-4);
        }

        .success-message {
          padding: var(--space-4);
          background: #10b981;
          background: var(--color-success-50, #d1fae5);
          border: var(--border-width-thin) solid var(--color-success-200, #6ee7b7);
          border-radius: var(--border-radius-md);
          color: var(--color-success-700, #047857);
          margin-bottom: var(--space-4);
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <main class="page-container">
        <div class="content-wrapper">
          <a href="#" class="back-link" id="backLink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Terug naar klanten
          </a>

          <div class="form-card">
            <div class="form-header">
              <h1 class="form-title">${title}</h1>
            </div>

            ${this.error ? `
              <div class="error-message">
                ${this.error}
              </div>
            ` : ''}

            <div class="form-body">
              ${this.successMessage ? `
                <div class="success-message">
                  ${this.successMessage}
                </div>
              ` : ''}

              ${this.loading && !this.customer ? `
                <div class="loading-message">
                  Laden...
                </div>
              ` : `
                <form id="customerForm" novalidate>
                  <div class="form-grid">
                    <div class="form-group full-width">
                      <label for="full_name" class="form-label required">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-blue)" stroke-width="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Volledige naam
                      </label>
                    <dc-input
                      id="full_name"
                      name="full_name"
                      value="${displayData.full_name || ''}"
                      placeholder="bijv. Jan de Vries"
                      ${this.validationErrors.full_name ? `error="${this.validationErrors.full_name}"` : ''}
                      ${this.loading ? 'disabled' : ''}
                      required>
                    </dc-input>
                  </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="email" class="form-label required">
                          <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-magenta)" stroke-width="2">
                            <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                            <path d="m3 7 9 6 9-6"></path>
                          </svg>
                          E-mail
                        </label>
                      <dc-input
                        id="email"
                        name="email"
                        type="email"
                        value="${displayData.email || ''}"
                        placeholder="naam@voorbeeld.nl"
                        ${this.validationErrors.email ? `error="${this.validationErrors.email}"` : ''}
                        ${this.loading ? 'disabled' : ''}
                        required>
                      </dc-input>
                      </div>

                      <div class="form-group">
                        <label for="phone" class="form-label required">
                          <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-green)" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          Telefoon
                        </label>
                      <dc-input
                        id="phone"
                        name="phone"
                        type="tel"
                        value="${displayData.phone || ''}"
                        placeholder="06-12345678"
                        ${this.validationErrors.phone ? `error="${this.validationErrors.phone}"` : ''}
                        ${this.loading ? 'disabled' : ''}
                        required>
                      </dc-input>
                      </div>
                    </div>

                    <div class="form-group full-width">
                      <label for="street_address" class="form-label required">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-red)" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Straat en huisnummer
                      </label>
                    <dc-input
                      id="street_address"
                      name="street_address"
                      value="${displayData.street_address || ''}"
                      placeholder="Hoofdstraat 123"
                      ${this.validationErrors.street_address ? `error="${this.validationErrors.street_address}"` : ''}
                      ${this.loading ? 'disabled' : ''}
                      required>
                    </dc-input>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="postal_code" class="form-label required">
                          <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-orange)" stroke-width="2">
                            <line x1="4" y1="9" x2="20" y2="9"></line>
                            <line x1="4" y1="15" x2="20" y2="15"></line>
                            <line x1="10" y1="3" x2="8" y2="21"></line>
                            <line x1="16" y1="3" x2="14" y2="21"></line>
                          </svg>
                          Postcode
                        </label>
                      <dc-input
                        id="postal_code"
                        name="postal_code"
                        value="${displayData.postal_code || ''}"
                        placeholder="1234AB"
                        ${this.validationErrors.postal_code ? `error="${this.validationErrors.postal_code}"` : ''}
                        ${this.loading ? 'disabled' : ''}
                        required>
                      </dc-input>
                      </div>

                      <div class="form-group">
                        <label for="city" class="form-label required">
                          <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-cyan)" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          Plaats
                        </label>
                      <dc-input
                        id="city"
                        name="city"
                        value="${displayData.city || ''}"
                        placeholder="Amsterdam"
                        ${this.validationErrors.city ? `error="${this.validationErrors.city}"` : ''}
                        ${this.loading ? 'disabled' : ''}
                        required>
                      </dc-input>
                      </div>
                    </div>

                    <div class="form-actions">
                    <dc-button
                      type="button"
                      variant="secondary"
                      id="cancelButton"
                      ${this.loading ? 'disabled' : ''}>
                      Sluiten
                    </dc-button>
                    <dc-button
                      type="submit"
                      variant="primary"
                      ${this.loading ? 'disabled' : ''}>
                      ${this.loading ? 'Opslaan...' : (isEditMode ? 'Opslaan' : 'Klant aanmaken')}
                    </dc-button>
                    </div>
                  </div>
                </form>
              `}
            </div>
          </div>
        </div>
      </main>
    `;

    // Set up event listeners
    const backLink = this.querySelector('#backLink');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleCancel();
      });
    }

    const form = this.querySelector('#customerForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Handle submit button click (dc-button may not trigger form submit)
    const submitButton = this.querySelector('dc-button[type="submit"]');
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (form) {
          // Manually trigger form submission
          const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
          form.dispatchEvent(submitEvent);
        }
      });
    }

    const cancelButton = this.querySelector('#cancelButton');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.handleCancel());
    }

    // Set up form change tracking
    this.changeTracker.setupListeners('#customerForm');

    // Clear success message when user starts editing
    if (this.successMessage) {
      const successMessageElement = this.querySelector('.success-message');
      const form = this.querySelector('#customerForm');

      if (form && successMessageElement) {
        const clearSuccess = () => {
          if (this.successMessage) {
            this.successMessage = null;
            // Just remove the message element, don't re-render entire form
            successMessageElement.remove();
          }
        };

        // Listen to all inputs
        const allInputs = form.querySelectorAll('dc-input, input, textarea, select');
        allInputs.forEach(input => {
          input.addEventListener('input', clearSuccess, { once: true });
        });
      }
    }
  }
}

customElements.define('customer-form-page', CustomerFormPage);
