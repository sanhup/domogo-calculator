/**
 * dc-table - Data table component with sorting and pagination
 *
 * Attributes:
 * - current-page: number (default: 1)
 * - page-size: number (default: 10)
 * - total-items: number
 * - sort-column: string
 * - sort-direction: 'asc' | 'desc'
 *
 * Events:
 * - page-change: { page } - Emitted when page changes
 * - sort-change: { column, direction } - Emitted when sort changes
 * - row-click: { row, index } - Emitted when row is clicked
 *
 * Usage:
 * <dc-table id="myTable" page-size="10" total-items="100">
 *   <table slot="table">
 *     <thead>
 *       <tr>
 *         <th data-sortable="name">Name</th>
 *         <th data-sortable="email">Email</th>
 *         <th>Actions</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr data-row-id="1">
 *         <td>John Doe</td>
 *         <td>john@example.com</td>
 *         <td><button>View</button></td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </dc-table>
 */

class DcTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['current-page', 'page-size', 'total-items', 'sort-column', 'sort-direction'];
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
    if (!this._listenerAdded) {
      // Handle sortable column clicks
      this.addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sortable]');
        if (th) {
          const column = th.getAttribute('data-sortable');
          const currentColumn = this.getAttribute('sort-column');
          const currentDirection = this.getAttribute('sort-direction') || 'asc';

          let newDirection = 'asc';
          if (column === currentColumn) {
            newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
          }

          this.setAttribute('sort-column', column);
          this.setAttribute('sort-direction', newDirection);

          this.dispatchEvent(new CustomEvent('sort-change', {
            detail: { column, direction: newDirection },
            bubbles: true,
            composed: true
          }));
        }

        // Handle row clicks
        const row = e.target.closest('tbody tr');
        if (row && !e.target.closest('button, a')) {
          const rowId = row.getAttribute('data-row-id');
          const rowIndex = Array.from(row.parentElement.children).indexOf(row);

          this.dispatchEvent(new CustomEvent('row-click', {
            detail: { rowId, rowIndex, row },
            bubbles: true,
            composed: true
          }));
        }
      });

      // Handle pagination button clicks
      this.shadowRoot.addEventListener('click', (e) => {
        const button = e.target.closest('[data-page]');
        if (button && !button.disabled) {
          const page = parseInt(button.getAttribute('data-page'));
          this.setAttribute('current-page', page);

          this.dispatchEvent(new CustomEvent('page-change', {
            detail: { page },
            bubbles: true,
            composed: true
          }));
        }
      });

      this._listenerAdded = true;
    }
  }

  getTotalPages() {
    const pageSize = parseInt(this.getAttribute('page-size')) || 10;
    const totalItems = parseInt(this.getAttribute('total-items')) || 0;
    return Math.ceil(totalItems / pageSize);
  }

  getCurrentPage() {
    return parseInt(this.getAttribute('current-page')) || 1;
  }

  getPaginationRange() {
    const currentPage = this.getCurrentPage();
    const totalPages = this.getTotalPages();
    const range = [];

    // Always show first page
    range.push(1);

    // Calculate range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis before if needed
    if (start > 2) {
      range.push('...');
    }

    // Add pages around current
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add ellipsis after if needed
    if (end < totalPages - 1) {
      range.push('...');
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }

  render() {
    const currentPage = this.getCurrentPage();
    const totalPages = this.getTotalPages();
    const pageSize = parseInt(this.getAttribute('page-size')) || 10;
    const totalItems = parseInt(this.getAttribute('total-items')) || 0;
    const sortColumn = this.getAttribute('sort-column');
    const sortDirection = this.getAttribute('sort-direction') || 'asc';

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

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

        .table-container {
          background: var(--color-white);
          border: var(--border-width-thin) solid var(--color-neutral-200);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
        }

        ::slotted(table) {
          width: 100%;
          border-collapse: collapse;
        }

        ::slotted(th) {
          text-align: left;
          padding: var(--space-3) var(--space-4);
          background: var(--color-neutral-50);
          font-weight: var(--font-weight-normal);
          font-size: var(--font-size-xs);
          color: var(--color-neutral-600);
          border-bottom: var(--border-width-thin) solid var(--color-neutral-200);
        }

        ::slotted(th[data-sortable]) {
          cursor: pointer;
          user-select: none;
          position: relative;
        }

        ::slotted(th[data-sortable]:hover) {
          color: var(--color-neutral-900);
        }

        ::slotted(td) {
          padding: var(--space-4);
          border-bottom: var(--border-width-thin) solid var(--color-neutral-100);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        ::slotted(tbody tr) {
          transition: background-color 0.15s ease;
          cursor: pointer;
          background: var(--color-white);
        }

        ::slotted(tbody tr:hover) {
          background: var(--color-neutral-50);
        }

        ::slotted(tbody tr:last-child td) {
          border-bottom: none;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-top: var(--border-width-thin) solid var(--color-neutral-200);
          background: transparent;
        }

        .pagination-info {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
        }

        .pagination-buttons {
          display: flex;
          gap: var(--space-2);
        }

        .page-button {
          min-width: var(--size-button-sm);
          height: var(--size-button-sm);
          padding: var(--space-2);
          border: var(--border-width-thin) solid var(--color-border);
          background: var(--color-white);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: var(--transition-base);
        }

        .page-button:hover:not(:disabled) {
          background: var(--color-neutral-100);
          border-color: var(--color-neutral-300);
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-button.active {
          background: var(--color-primary-500);
          color: var(--color-white);
          border-color: var(--color-primary-500);
        }

        .page-button.ellipsis {
          border: none;
          background: transparent;
          cursor: default;
        }

        .page-button.ellipsis:hover {
          background: transparent;
        }
      </style>

      <div class="table-container">
        <slot name="table"></slot>

        ${totalPages > 1 ? `
          <div class="pagination">
            <div class="pagination-info">
              Weergave ${startItem}-${endItem} van ${totalItems}
            </div>

            <div class="pagination-buttons">
              <button
                class="page-button"
                data-page="${currentPage - 1}"
                ${currentPage === 1 ? 'disabled' : ''}
              >
                ←
              </button>

              ${this.getPaginationRange().map(page => {
                if (page === '...') {
                  return '<button class="page-button ellipsis" disabled>...</button>';
                }
                return `
                  <button
                    class="page-button ${page === currentPage ? 'active' : ''}"
                    data-page="${page}"
                  >
                    ${page}
                  </button>
                `;
              }).join('')}

              <button
                class="page-button"
                data-page="${currentPage + 1}"
                ${currentPage === totalPages ? 'disabled' : ''}
              >
                →
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Update sort indicators on slotted table headers
    requestAnimationFrame(() => {
      const headers = this.querySelectorAll('th[data-sortable]');
      headers.forEach(th => {
        const column = th.getAttribute('data-sortable');
        const existing = th.querySelector('.sort-indicator');
        if (existing) existing.remove();

        if (column === sortColumn) {
          const indicator = document.createElement('span');
          indicator.className = 'sort-indicator';
          indicator.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
          th.appendChild(indicator);
        }
      });
    });

    this.setupEventListeners();
  }
}

// Inject global styles for table content
// These styles are generic and reusable for any table usage
// Specific styling (colors, custom layouts) should be done from the consuming page
if (!document.getElementById('dc-table-global-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dc-table-global-styles';
  styleSheet.textContent = `
    /* Generic table header styling */
    .table-header {
      border-bottom: var(--border-width-thin) solid var(--color-neutral-200);
      background: var(--color-neutral-50);
    }

    .table-header th {
      text-align: left;
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-normal);
      color: var(--color-neutral-600);
    }

    /* Generic table row styling */
    .table-row {
      cursor: pointer;
      background: var(--color-white);
      transition: background-color 0.15s;
    }

    .table-row:hover {
      background: var(--color-neutral-50);
    }

    /* Generic table cell styling */
    .table-cell {
      padding: var(--space-4);
      font-size: var(--font-size-sm);
      max-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-cell-flex {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      overflow: hidden;
    }

    .table-cell-content {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Generic chevron icon for expandable rows */
    .chevron-icon {
      flex-shrink: 0;
      transition: transform 0.2s;
      color: var(--color-neutral-500);
    }

    /* Generic expanded row styling */
    .expanded-row {
      background: var(--color-neutral-50);
    }

    .expanded-content {
      margin-left: 32px;
      margin-right: var(--space-4);
    }

    /* Generic nested table styling */
    .nested-table-wrapper {
      background: white;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
    }

    .nested-table {
      width: 100%;
      border-collapse: collapse;
    }

    .nested-table-cell {
      padding: var(--space-4);
      font-size: var(--font-size-sm);
      max-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Nested table header override for consistent padding */
    .nested-table .table-header th {
      padding: var(--space-4);
    }

    /* Generic nested row styling */
    .nested-row {
      border-bottom: var(--border-width-thin) solid var(--color-neutral-100);
      cursor: pointer;
      background: var(--color-white);
      transition: background-color 0.15s;
    }

    .nested-row:hover {
      background: var(--color-neutral-50);
    }
  `;
  document.head.appendChild(styleSheet);
}

customElements.define('dc-table', DcTable);
