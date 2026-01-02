/**
 * Customer List Page Component
 *
 * Displays a list of customers with search, filtering, and management capabilities.
 *
 * Features:
 * - Search by name, email, phone, address
 * - Filter by status (Active/Archived/All)
 * - Sort and paginate
 * - Archive/Unarchive customers
 * - Navigate to customer detail
 * - Create new customer
 *
 * Events:
 * - navigate: {route} - Emitted when navigation is requested
 *
 * Usage:
 * <customer-list-page></customer-list-page>
 */

import { getCustomers, archiveCustomer, unarchiveCustomer } from '../../services/customer-api.js';

class CustomerListPage extends HTMLElement {
  constructor() {
    super();

    // State
    this.customers = [];
    this.filteredCustomers = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.sortColumn = 'created_at';
    this.sortDirection = 'desc';
    this.searchTerm = '';
    this.statusFilter = 'active'; // 'active', 'archived', 'all'
    this.loading = false;
    this.error = null;
    this.customerToArchive = null;
  }

  connectedCallback() {
    this.loadCustomers();
  }

  /**
   * Load customers from API
   */
  async loadCustomers() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      // Determine archived filter based on status
      let archivedFilter = null;
      if (this.statusFilter === 'active') {
        archivedFilter = false;
      } else if (this.statusFilter === 'archived') {
        archivedFilter = true;
      }
      // If 'all', leave archivedFilter as null

      const customers = await getCustomers({
        archived: archivedFilter,
        sortBy: this.sortColumn === 'full_name' ? 'name' : this.sortColumn
      });

      this.customers = customers;
      this.applyFilters();
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Failed to load customers:', error);
      this.error = error.message || 'Failed to load customers';
      this.loading = false;
      this.render();
    }
  }

  /**
   * Apply search filter to customers
   */
  applyFilters() {
    if (!this.searchTerm) {
      this.filteredCustomers = [...this.customers];
    } else {
      const search = this.searchTerm.toLowerCase();
      this.filteredCustomers = this.customers.filter(customer => {
        return (
          customer.full_name?.toLowerCase().includes(search) ||
          customer.email?.toLowerCase().includes(search) ||
          customer.phone?.toLowerCase().includes(search) ||
          customer.city?.toLowerCase().includes(search) ||
          customer.postal_code?.toLowerCase().includes(search)
        );
      });
    }

    // Apply sorting (with secondary sort by id for stability)
    this.filteredCustomers.sort((a, b) => {
      const aVal = a[this.sortColumn] || '';
      const bVal = b[this.sortColumn] || '';
      const modifier = this.sortDirection === 'asc' ? 1 : -1;

      let comparison;
      if (typeof aVal === 'string') {
        comparison = aVal.localeCompare(bVal) * modifier;
      } else {
        comparison = (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * modifier;
      }

      // If values are equal, sort by id descending (most recent first)
      if (comparison === 0) {
        return b.id - a.id;
      }
      return comparison;
    });

    // Reset to page 1 when filters change
    this.currentPage = 1;
  }

  /**
   * Get paginated customers for current page
   */
  getPaginatedCustomers() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCustomers.slice(start, end);
  }

  /**
   * Handle search input
   */
  handleSearch(e) {
    const input = e.target;
    const cursorPosition = input.selectionStart;

    this.searchTerm = input.value;
    this.applyFilters();
    this.render();

    // Restore focus and cursor position after render
    requestAnimationFrame(() => {
      const searchInput = this.querySelector('#searchInput');
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }

  /**
   * Handle status filter change
   */
  handleStatusFilter(status) {
    this.statusFilter = status;
    this.loadCustomers(); // Reload from API with new filter
  }

  /**
   * Handle sort change from table
   */
  handleSort(e) {
    this.sortColumn = e.detail.column;
    this.sortDirection = e.detail.direction;
    this.applyFilters();
    this.render();
  }

  /**
   * Handle page change from table
   */
  handlePageChange(e) {
    this.currentPage = e.detail.page;
    this.render();
  }

  /**
   * Show archive confirmation modal
   */
  showArchiveModal(customer) {
    this.customerToArchive = customer;
    this.render();

    // Open modal after render
    requestAnimationFrame(() => {
      const modal = this.querySelector('#archiveModal');
      if (modal) {
        modal.setAttribute('open', '');
      }
    });
  }

  /**
   * Close archive modal
   */
  closeArchiveModal() {
    this.customerToArchive = null;
    this.render();
  }

  /**
   * Archive customer
   */
  async confirmArchive() {
    if (!this.customerToArchive) return;

    try {
      if (this.customerToArchive.archived) {
        await unarchiveCustomer(this.customerToArchive.id);
      } else {
        await archiveCustomer(this.customerToArchive.id);
      }

      this.closeArchiveModal();
      await this.loadCustomers(); // Reload list
    } catch (error) {
      console.error('Failed to archive/unarchive customer:', error);
      alert(`Fout: ${error.message}`);
    }
  }

  /**
   * Navigate to customer detail page
   */
  navigateToCustomer(customerId) {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { route: `/customers/${customerId}` },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Navigate to new customer form
   */
  navigateToNewCustomer() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { route: '/customers/new' },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = this.querySelector('#searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    // Status filter tabs
    const filterTabs = this.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const status = e.target.getAttribute('data-status');
        this.handleStatusFilter(status);
      });
    });

    // New customer button
    const newButton = this.querySelector('#newCustomerBtn');
    if (newButton) {
      newButton.addEventListener('click', () => this.navigateToNewCustomer());
    }

    // Table events
    const table = this.querySelector('#customersTable');
    if (table) {
      table.addEventListener('sort-change', (e) => this.handleSort(e));
      table.addEventListener('page-change', (e) => this.handlePageChange(e));
      table.addEventListener('row-click', (e) => {
        const customerId = e.detail.rowId;
        this.navigateToCustomer(customerId);
      });
    }

    // Action buttons
    const archiveButtons = this.querySelectorAll('.archive-btn');
    archiveButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const customerId = parseInt(btn.getAttribute('data-customer-id'));
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
          this.showArchiveModal(customer);
        }
      });
    });

    const viewButtons = this.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const customerId = btn.getAttribute('data-customer-id');
        this.navigateToCustomer(customerId);
      });
    });

    // Modal events
    const modal = this.querySelector('#archiveModal');
    if (modal) {
      modal.addEventListener('close', () => this.closeArchiveModal());
    }

    const cancelBtn = this.querySelector('#cancelArchiveBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeArchiveModal());
    }

    const confirmBtn = this.querySelector('#confirmArchiveBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmArchive());
    }
  }

  render() {
    const page = this.getPaginatedCustomers();
    const totalItems = this.filteredCustomers.length;

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

        .page-header {
          margin-bottom: var(--space-6);
        }

        .section-title {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .section-subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-base);
        }

        .section-header {
          margin-bottom: var(--space-4);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
        }

        .header-actions {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .search-box {
          position: relative;
          min-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-tertiary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: var(--space-2) var(--space-3) var(--space-2) var(--space-8);
          border: var(--border-width-thin) solid var(--color-input-border);
          border-radius: var(--border-radius-lg);
          font-size: var(--font-size-sm);
          font-family: var(--font-sans);
          background: var(--color-input);
          transition: var(--transition-fast);
        }

        .search-input::placeholder {
          color: var(--color-text-tertiary);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px var(--color-primary-50);
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-2);
        }

        .filter-tab {
          padding: var(--space-3) var(--space-4);
          border: none;
          background: var(--color-neutral-100);
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          line-height: 1;
          cursor: pointer;
          transition: var(--transition-fast);
          color: var(--color-text-secondary);
          font-family: var(--font-sans);
        }

        .filter-tab:hover {
          background: var(--color-neutral-200);
        }

        .filter-tab.active {
          background: var(--color-cyan-500);
          color: var(--color-white);
        }

        .actions-cell {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          align-items: center;
        }

        .action-icon {
          width: 16px;
          height: 16px;
        }

        .email-link {
          color: var(--color-primary-500);
          text-decoration: none;
        }

        .email-link:hover {
          text-decoration: underline;
        }


        .archived-badge {
          display: inline-block;
          padding: var(--space-1) var(--space-2);
          background: var(--color-neutral-100);
          color: var(--color-neutral-600);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          margin-left: var(--space-2);
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
          text-align: center;
          padding: var(--space-8);
          color: var(--color-text-secondary);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
          color: var(--color-text-secondary);
        }

        .empty-subtitle {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }
      </style>

      <main class="page-container">
        <div class="content-wrapper">
          ${this.error ? `
            <div class="error-message">
              <strong>Fout:</strong> ${this.error}
            </div>
          ` : ''}

          <div class="page-header">
            <h1 class="section-title">Klanten</h1>
            <p class="section-subtitle">
              ${totalItems} ${totalItems === 1 ? 'klant' : 'klanten'}
              ${this.statusFilter === 'active' ? '(actief)' : ''}
              ${this.statusFilter === 'archived' ? '(gearchiveerd)' : ''}
            </p>
          </div>

          <div class="section-header">
            <div class="search-box">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Zoek klant..."
                value="${this.searchTerm}"
              />
            </div>

            <div class="header-actions">
              <div class="filter-tabs">
                <button
                  class="filter-tab ${this.statusFilter === 'active' ? 'active' : ''}"
                  data-status="active">
                  Actief
                </button>
                <button
                  class="filter-tab ${this.statusFilter === 'archived' ? 'active' : ''}"
                  data-status="archived">
                  Gearchiveerd
                </button>
                <button
                  class="filter-tab ${this.statusFilter === 'all' ? 'active' : ''}"
                  data-status="all">
                  Alle
                </button>
              </div>

              <dc-button variant="dark" size="sm" id="newCustomerBtn">
                + Klant aanmaken
              </dc-button>
            </div>
          </div>

          ${this.loading ? `
            <div class="loading-message">Laden...</div>
          ` : totalItems === 0 ? `
            <div class="empty-state">
              ${this.searchTerm ? 'Geen klanten gevonden met deze zoekterm.' : 'Nog geen klanten.'}
            </div>
          ` : `
            <dc-table
              id="customersTable"
              current-page="${this.currentPage}"
              page-size="${this.pageSize}"
              total-items="${totalItems}"
              sort-column="${this.sortColumn}"
              sort-direction="${this.sortDirection}">
              <table slot="table">
                <thead>
                  <tr class="table-header">
                    <th data-sortable="full_name">Naam</th>
                    <th data-sortable="email">Email</th>
                    <th data-sortable="phone">Telefoon</th>
                    <th data-sortable="city">Stad</th>
                    <th data-sortable="created_at">Aangemaakt</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  ${page.map(customer => `
                    <tr class="table-row" data-row-id="${customer.id}">
                      <td class="table-cell">
                        <strong>${customer.full_name || '-'}</strong>
                        ${customer.archived ? '<span class="archived-badge">Gearchiveerd</span>' : ''}
                      </td>
                      <td class="table-cell">
                        ${customer.email ? `<a href="mailto:${customer.email}" class="email-link">${customer.email}</a>` : '-'}
                      </td>
                      <td class="table-cell">${customer.phone || '-'}</td>
                      <td class="table-cell">${customer.city || '-'}</td>
                      <td class="table-cell">${customer.created_at ? new Date(customer.created_at).toLocaleDateString('nl-NL') : '-'}</td>
                      <td class="table-cell">
                        <div class="actions-cell">
                          <dc-button variant="ghost" size="sm" class="view-btn" data-customer-id="${customer.id}">
                            <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Bewerken
                          </dc-button>
                          <dc-button variant="ghost" size="sm" class="archive-btn" data-customer-id="${customer.id}">
                            <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                            </svg>
                            ${customer.archived ? 'Herstellen' : 'Archiveren'}
                          </dc-button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </dc-table>
          `}
        </div>
      </main>

      <!-- Archive confirmation modal -->
      ${this.customerToArchive ? `
        <dc-modal id="archiveModal" title="${this.customerToArchive.archived ? 'Klant herstellen?' : 'Klant archiveren?'}">
          <p>
            ${this.customerToArchive.archived
              ? `Weet u zeker dat u <strong>${this.customerToArchive.full_name}</strong> wilt herstellen?`
              : `Weet u zeker dat u <strong>${this.customerToArchive.full_name}</strong> wilt archiveren?`
            }
          </p>
          <p class="empty-subtitle">
            ${this.customerToArchive.archived
              ? 'De klant wordt weer actief en kan gebruikt worden voor nieuwe berekeningen.'
              : 'De klant wordt gearchiveerd maar niet verwijderd. Bestaande berekeningen blijven behouden.'
            }
          </p>
          <div slot="footer">
            <dc-button variant="secondary" id="cancelArchiveBtn">Annuleren</dc-button>
            <dc-button variant="primary" id="confirmArchiveBtn">
              ${this.customerToArchive.archived ? 'Herstellen' : 'Archiveren'}
            </dc-button>
          </div>
        </dc-modal>
      ` : ''}
    `;

    this.setupEventListeners();
  }
}

customElements.define('customer-list-page', CustomerListPage);
