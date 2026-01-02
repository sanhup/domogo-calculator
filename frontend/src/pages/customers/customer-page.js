/**
 * Customer Page Component
 *
 * Displays customer details with view/edit modes and related data tabs.
 * Replaces the old pattern of navigating directly to edit form.
 *
 * Features:
 * - View mode: Read-only customer information
 * - Edit mode: Inline form for editing customer data
 * - Tabs: Adviezen, Facturen, Documenten, Notities
 * - Uses FormChangeTracker for save button management in edit mode
 *
 * Attributes:
 * - customer-id: ID of customer to display (required)
 *
 * Events:
 * - navigate: Emitted when navigation is requested
 *   detail: { route: string }
 */

import { getCustomer, createCustomer, updateCustomer } from '../../services/customer-api.js';
import { FormChangeTracker } from '../../utils/form-change-tracker.js';

class CustomerPage extends HTMLElement {
  constructor() {
    super();
    this.changeTracker = new FormChangeTracker(this);
    this.customerId = null;
    this.customer = null;
    this.mode = 'view'; // 'view' or 'edit'
    this.activeTab = 'adviezen'; // Current active tab
    this.loading = false;
    this.error = null;
    this.validationErrors = {};
    this.successMessage = null;
    this.formData = null; // Temporary form data (preserved on validation errors)
  }

  static get observedAttributes() {
    return ['customer-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'customer-id' && oldValue !== newValue) {
      this.customerId = newValue;
      if (this.isConnected) {
        if (this.customerId && this.customerId !== 'new') {
          this.loadCustomer();
        } else {
          // Create mode
          this.mode = 'edit';
          this.customer = {
            full_name: '',
            email: '',
            phone: '',
            street_address: '',
            postal_code: '',
            city: ''
          };
          this.render();
        }
      }
    }
  }

  connectedCallback() {
    if (this.customerId && this.customerId !== 'new') {
      this.loadCustomer();
    } else {
      // Create mode
      this.mode = 'edit';
      this.customer = {
        full_name: '',
        email: '',
        phone: '',
        street_address: '',
        postal_code: '',
        city: ''
      };
      this.render();
    }
  }

  /**
   * Load customer data
   */
  async loadCustomer() {
    if (!this.customerId) return;

    this.loading = true;
    this.error = null;
    this.render();

    try {
      this.customer = await getCustomer(this.customerId);
      this.loading = false;
      this.render();
    } catch (err) {
      this.loading = false;
      this.error = err.message || 'Fout bij het laden van klantgegevens';
      this.render();
    }
  }

  /**
   * Switch to edit mode
   */
  enterEditMode() {
    this.mode = 'edit';
    this.validationErrors = {};
    this.successMessage = null;
    this.formData = null; // Clear any previous form data
    // Set original data for change tracking
    this.changeTracker.setOriginalData(this.customer);
    this.render();
  }

  /**
   * Cancel edit mode
   */
  cancelEdit() {
    // Check for unsaved changes
    if (this.changeTracker.hasChanges) {
      const confirmed = confirm(
        'Er zijn niet-opgeslagen wijzigingen.\n\n' +
        'Weet u zeker dat u wilt annuleren?'
      );
      if (!confirmed) return;
    }

    const isCreateMode = !this.customerId || this.customerId === 'new';

    // If creating new customer, navigate back to list
    if (isCreateMode) {
      this.handleBack();
      return;
    }

    // If editing existing customer, switch back to view mode
    this.mode = 'view';
    this.validationErrors = {};
    this.successMessage = null;
    this.formData = null; // Clear form data when canceling
    this.render();
  }

  /**
   * Validate form data
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

    // Read values from dc-input elements
    const form = e.target;
    const rawData = {
      full_name: form.querySelector('[name="full_name"]')?.getValue() || '',
      email: form.querySelector('[name="email"]')?.getValue() || '',
      phone: form.querySelector('[name="phone"]')?.getValue() || '',
      street_address: form.querySelector('[name="street_address"]')?.getValue() || '',
      postal_code: form.querySelector('[name="postal_code"]')?.getValue() || '',
      city: form.querySelector('[name="city"]')?.getValue() || '',
    };

    // Validate
    this.validationErrors = this.validateForm(rawData);
    if (Object.keys(this.validationErrors).length > 0) {
      // Store form data to preserve user input when re-rendering
      this.formData = rawData;
      this.render();
      return;
    }

    // Filter out empty strings for API submission (send null for empty optional fields)
    const data = Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => [
        key,
        value.trim() === '' ? null : value
      ])
    );

    // Submit
    this.loading = true;
    this.error = null;
    this.render();

    try {
      let savedCustomer;
      const isCreateMode = !this.customerId || this.customerId === 'new';

      if (isCreateMode) {
        savedCustomer = await createCustomer(data);
        // Clear form data on success
        this.formData = null;
        this.validationErrors = {};
        // Navigate to the new customer's detail page
        this.dispatchEvent(new CustomEvent('navigate', {
          detail: { route: `/customers/${savedCustomer.id}` },
          bubbles: true,
        }));
      } else {
        savedCustomer = await updateCustomer(this.customerId, data);
        this.customer = savedCustomer;
        this.formData = null;
        this.loading = false;
        this.validationErrors = {};
        this.mode = 'view';
        this.successMessage = 'Wijzigingen opgeslagen';

        // Reset change tracker
        this.changeTracker.setOriginalData(savedCustomer);

        this.render();

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
          this.render();
        }, 3000);
      }
    } catch (err) {
      this.loading = false;
      console.error('Error saving customer:', err);

      // Preserve form data on error so user doesn't lose their input
      if (!this.formData) {
        this.formData = rawData;
      }

      // Show detailed error message
      if (err.data && typeof err.data === 'object') {
        // Backend validation error
        this.error = err.message || 'Validatiefout bij het opslaan van klantgegevens';
      } else {
        this.error = err.message || 'Fout bij het opslaan van klantgegevens';
      }

      this.render();
    }
  }

  /**
   * Handle tab change
   */
  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  /**
   * Navigate back to customer list
   */
  handleBack() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { route: '/customers' },
      bubbles: true,
    }));
  }

  /**
   * Render customer info view mode
   */
  renderCustomerView() {
    return `
      <div class="customer-card">
        <div class="customer-header">
          <h1 class="customer-title">Klant</h1>
          <dc-button variant="dark" id="editButton">
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Bewerken
          </dc-button>
        </div>

        <div class="customer-info">
          <div class="info-row">
            <div class="info-field full-width">
              <label class="info-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-blue)" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Volledige naam *
              </label>
              <div class="info-value">${this.customer.full_name || '-'}</div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-field">
              <label class="info-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-magenta)" stroke-width="2">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 7 9 6 9-6"></path>
                </svg>
                E-mail *
              </label>
              <div class="info-value">${this.customer.email || '-'}</div>
            </div>

            <div class="info-field">
              <label class="info-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-green)" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Telefoon *
              </label>
              <div class="info-value">${this.customer.phone || '-'}</div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-field full-width">
              <label class="info-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-red)" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Straat en huisnummer *
              </label>
              <div class="info-value">${this.customer.street_address || '-'}</div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-field">
              <label class="info-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-orange)" stroke-width="2">
                  <line x1="4" y1="9" x2="20" y2="9"></line>
                  <line x1="4" y1="15" x2="20" y2="15"></line>
                  <line x1="10" y1="3" x2="8" y2="21"></line>
                  <line x1="16" y1="3" x2="14" y2="21"></line>
                </svg>
                Postcode *
              </label>
              <div class="info-value">${this.customer.postal_code || '-'}</div>
            </div>

            <div class="info-field">
              <label class="info-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-cyan)" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Plaats *
              </label>
              <div class="info-value">${this.customer.city || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render customer info edit mode
   */
  renderCustomerEdit() {
    const isCreateMode = !this.customerId || this.customerId === 'new';
    const title = isCreateMode ? 'Nieuwe klant' : 'Klant bewerken';

    // Use formData if validation failed, otherwise use customer data
    const displayData = this.formData || this.customer || {};

    return `
      <div class="customer-card">
        <div class="customer-header">
          <h1 class="customer-title">${title}</h1>
          <dc-button variant="dark" id="cancelButton">
            ${isCreateMode ? 'Sluiten' : 'Annuleren'}
          </dc-button>
        </div>

        <form id="customerForm" class="customer-form" novalidate>
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="full_name" class="form-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-blue)" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Volledige naam *
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
                <label for="email" class="form-label">
                  <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-magenta)" stroke-width="2">
                    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                    <path d="m3 7 9 6 9-6"></path>
                  </svg>
                  E-mail *
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
                <label for="phone" class="form-label">
                  <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-green)" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Telefoon *
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
              <label for="street_address" class="form-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-red)" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Straat en huisnummer *
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
                <label for="postal_code" class="form-label">
                  <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-orange)" stroke-width="2">
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                  Postcode *
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
                <label for="city" class="form-label">
                  <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-cyan)" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  Plaats *
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
                type="submit"
                variant="primary"
                ${this.loading ? 'disabled' : ''}>
                ${this.loading ? 'Opslaan...' : (isCreateMode ? 'Klant aanmaken' : 'Opslaan')}
              </dc-button>
            </div>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Render tab content
   */
  renderTabContent() {
    switch (this.activeTab) {
      case 'adviezen':
        return this.renderAdviezenTab();
      case 'facturen':
        return this.renderPlaceholderTab('Facturen');
      case 'documenten':
        return this.renderPlaceholderTab('Documenten');
      case 'notities':
        return this.renderPlaceholderTab('Notities');
      default:
        return '';
    }
  }

  /**
   * Render Adviezen tab
   */
  renderAdviezenTab() {
    return `
      <div class="tab-content">
        <div class="tab-header">
          <div>
            <h3 class="tab-title">Adviezen voor ${this.customer.full_name}</h3>
            <p class="tab-subtitle">3 adviezen</p>
          </div>
          <dc-button variant="dark" size="sm" id="newAdviesButton">
            + Nieuw advies
          </dc-button>
        </div>

        <div class="empty-state">
          <p class="placeholder-text">
            Adviezen/berekeningen komen binnenkort beschikbaar
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render placeholder tab
   */
  renderPlaceholderTab(tabName) {
    return `
      <div class="tab-content">
        <div class="empty-state">
          <p class="placeholder-text">
            ${tabName} worden binnenkort beschikbaar
          </p>
        </div>
      </div>
    `;
  }

  render() {
    this.innerHTML = `
      <style>
        .page-container {
          padding: var(--space-8) var(--space-6);
          background: var(--color-background-subtle);
          min-height: calc(100vh - 64px);
        }

        .content-wrapper {
          max-width: 1440px;
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

        .customer-card {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-6);
        }

        .customer-header {
          background: var(--color-dark-surface);
          color: var(--color-white);
          padding: var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .customer-title {
          margin: 0;
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-white);
        }

        .customer-info {
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .info-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .info-field.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
        }

        .info-value {
          font-size: var(--font-size-base);
          color: var(--color-text-primary);
        }

        .label-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .customer-form {
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

        .form-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: var(--border-width-thin) solid var(--color-border);
        }

        .tabs {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .tabs-nav {
          display: flex;
          gap: 0;
          border-bottom: var(--border-width-thin) solid var(--color-border);
          padding: 0 var(--space-4);
        }

        .tab-button {
          padding: var(--space-4);
          border: none;
          background: transparent;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          font-family: var(--font-sans);
        }

        .tab-button:hover {
          color: var(--color-text-primary);
        }

        .tab-button.active {
          color: var(--color-cyan-500);
          border-bottom-color: var(--color-cyan-500);
        }

        .tab-content {
          padding: var(--space-6);
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
        }

        .tab-title {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .tab-subtitle {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .button-icon {
          margin-right: var(--space-2);
        }

        .placeholder-text {
          margin: 0;
          color: var(--color-text-secondary);
        }

        .empty-state {
          padding: var(--space-8);
          text-align: center;
          background: var(--color-background-subtle);
          border-radius: var(--border-radius-md);
        }

        .error-message {
          padding: var(--space-4);
          background: var(--color-danger-50);
          border: var(--border-width-thin) solid var(--color-danger-200);
          border-radius: var(--border-radius-md);
          color: var(--color-danger-700);
          margin-bottom: var(--space-4);
        }

        .success-message {
          padding: var(--space-4);
          background: var(--color-success-50, #d1fae5);
          border: var(--border-width-thin) solid var(--color-success-200, #6ee7b7);
          border-radius: var(--border-radius-md);
          color: var(--color-success-700, #047857);
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

        @media (max-width: 640px) {
          .info-row,
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

          ${this.error ? `
            <div class="error-message">
              ${this.error}
            </div>
          ` : ''}

          ${this.successMessage ? `
            <div class="success-message">
              ${this.successMessage}
            </div>
          ` : ''}

          ${this.loading && !this.customer ? `
            <div class="loading-message">
              Laden...
            </div>
          ` : this.customer ? `
            ${this.mode === 'view' ? this.renderCustomerView() : this.renderCustomerEdit()}

            ${this.mode === 'view' ? `
              <div class="tabs">
                <nav class="tabs-nav">
                  <button class="tab-button ${this.activeTab === 'adviezen' ? 'active' : ''}" data-tab="adviezen">
                    Adviezen
                  </button>
                  <button class="tab-button ${this.activeTab === 'facturen' ? 'active' : ''}" data-tab="facturen">
                    Facturen
                  </button>
                  <button class="tab-button ${this.activeTab === 'documenten' ? 'active' : ''}" data-tab="documenten">
                    Documenten
                  </button>
                  <button class="tab-button ${this.activeTab === 'notities' ? 'active' : ''}" data-tab="notities">
                    Notities
                  </button>
                </nav>

                ${this.renderTabContent()}
              </div>
            ` : ''}
          ` : ''}
        </div>
      </main>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Back link
    const backLink = this.querySelector('#backLink');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleBack();
      });
    }

    // Edit button (view mode)
    const editButton = this.querySelector('#editButton');
    if (editButton) {
      editButton.addEventListener('click', () => this.enterEditMode());
    }

    // Cancel button (edit mode)
    const cancelButton = this.querySelector('#cancelButton');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.cancelEdit());
    }

    // Form submission (edit mode)
    const form = this.querySelector('#customerForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));

      // Setup change tracking
      this.changeTracker.setupListeners('#customerForm');
    }

    // Submit button (edit mode) - dc-button may not trigger form submit
    const submitButton = this.querySelector('dc-button[type="submit"]');
    if (submitButton && form) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      });
    }

    // Tab buttons (view mode)
    const tabButtons = this.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // New advies button
    const newAdviesButton = this.querySelector('#newAdviesButton');
    if (newAdviesButton) {
      newAdviesButton.addEventListener('click', () => {
        alert('Nieuw advies maken - wordt nog geïmplementeerd');
      });
    }
  }
}

customElements.define('customer-page', CustomerPage);
