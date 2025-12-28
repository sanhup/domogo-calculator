# 0004 Setup Frontend - Details & Implementation Plan

This document provides detailed specifications, tasks, and implementation guidance for setting up the frontend.

## Table of Contents
1. [Data Model & Hierarchy](#data-model--hierarchy)
2. [Technical Specifications](#technical-specifications)
3. [Architecture Decisions](#architecture-decisions)
4. [Confirmed Decisions](#confirmed-decisions)
5. [Questions to Answer](#questions-to-answer)
6. [Project Structure](#project-structure)
7. [Implementation Tasks](#implementation-tasks)
8. [Design System (Token CSS)](#design-system-token-css)
9. [Component Library](#component-library)
10. [API Integration](#api-integration)
11. [Authentication](#authentication)
12. [Internationalization (i18n)](#internationalization-i18n)
13. [PDF & Email Generation](#pdf--email-generation)
14. [Testing Strategy](#testing-strategy)
15. [Deployment](#deployment)

---

## Data Model & Hierarchy

### Three-Level Structure: Lead → Advisory → Version

The application uses a three-level data hierarchy to organize customer consultations:

```
Lead (Customer/Household)
│
├── Customer Details (Shared across all advisories)
│   ├── Name, email, phone, address
│   └── Saved at Lead level
│
└── Advisory 1: "Initial consultation - Jan 15, 2024"
    │
    ├── Advisory metadata
    │   ├── Name/label (advisor-defined)
    │   ├── Created date
    │   ├── Status (active, completed, archived)
    │   └── Advisor assigned
    │
    ├── Current Situation (Shared within this advisory)
    │   ├── Grid consumption
    │   ├── Solar panel configuration
    │   ├── Feed-in data
    │   └── Current energy costs
    │
    └── Versions/Calculations
        │
        ├── Version 1: "Product A - Standard config"
        │   ├── Version metadata
        │   │   ├── Name/label
        │   │   ├── Status (draft, sent, approved, invalid, archived)
        │   │   └── Created/modified dates
        │   │
        │   ├── Product Selection
        │   │   ├── Battery product
        │   │   ├── Capacity, phase
        │   │   └── Operating modes
        │   │
        │   ├── Costs
        │   │   ├── Purchase price
        │   │   ├── Installation
        │   │   └── Maintenance
        │   │
        │   ├── Finance Options
        │   │   ├── Duration, interest rate
        │   │   └── Monthly payment
        │   │
        │   ├── VAT Scenario
        │   │   └── Selected scenario (1-4)
        │   │
        │   └── Results (Calculated)
        │       ├── ROI, payback period
        │       └── 20-year savings
        │
        ├── Version 2: "Product B - Alternative"
        │   └── [Same structure, different product/config]
        │
        └── Version 3: "Product A - Different financing"
            └── [Same product, different financing terms]

└── Advisory 2: "Follow-up consultation - Apr 10, 2024"
    │
    ├── Current Situation (UPDATED - customer installed more solar panels)
    │   └── Different from Advisory 1
    │
    └── Versions/Calculations
        ├── Version 1: "New recommendation"
        └── Version 2: "Budget option"
```

### Data Sharing & Copying Rules

| Data Type | Scope | Shared Across | Notes |
|-----------|-------|---------------|-------|
| **Customer Details** | Lead-level | All advisories & versions | Editable only at Lead level |
| **Current Situation** | Advisory-level | All versions within advisory | Specific to point in time |
| **Product/Battery** | Version-specific | Only this version | Different configs per version |
| **Costs/Finance** | Version-specific | Only this version | Different pricing per version |
| **VAT Scenario** | Version-specific | Only this version | Different scenarios per version |
| **Results** | Version-specific | Only this version | Calculated per version |

**When creating a new Advisory:**
- Customer details are inherited from Lead (read-only)
- Current situation starts empty or can be copied from previous advisory
- Advisor can update current situation if customer's setup changed

**When creating a new Version within an Advisory:**
- Current situation is inherited from Advisory (read-only within version)
- Product/costs/finance can start empty or be copied from another version
- Results are calculated fresh for this version

### Use Cases

**Scenario 1: New Lead - First Advisory & Calculation**
1. Advisor creates new Lead (customer details: name, email, address)
2. Creates Advisory 1 ("Initial consultation - Jan 15")
3. Fills in current situation (grid consumption, solar panels)
4. Creates Version 1 within Advisory 1
5. Selects product, enters costs, finance options
6. Generates offer

**Scenario 2: Same Advisory - Compare Different Products**
1. Advisor is in Advisory 1 for existing Lead
2. Creates Version 2 ("Alternative product comparison")
3. Current situation inherited from Advisory (shared, no changes)
4. Selects different battery product
5. Adjusts costs for new product
6. Compares Version 1 vs Version 2 results

**Scenario 3: Same Lead - New Advisory After 3 Months**
1. Customer returns after 3 months, installed more solar panels
2. Advisor creates Advisory 2 ("Follow-up consultation - Apr 10")
3. Updates current situation (increased solar capacity from 5kW to 8kW)
4. Creates Version 1 in Advisory 2
5. Recommends different product based on new situation
6. Generates new offer

**Scenario 4: Same Advisory - Different Financing Options**
1. Customer wants to see different payment terms for same product
2. Advisor creates Version 3 in Advisory 1
3. Current situation same (inherited from Advisory)
4. Product same (copied from Version 1)
5. Only finance duration/interest changed (10yr → 15yr)
6. Compares monthly payments

### UI Navigation Implications

**Top-level Navigation:**
- Lead selector/search: Choose which customer to work with
- Version selector dropdown: Switch between calculations for this lead
- "New Version" button: Create new calculation (with option to copy from existing)

**Version Status Lifecycle:**
```
Draft → Sent → Approved → Archived
```

| Status | Description | Can Delete? | Can Invalidate? | Can Archive? |
|--------|-------------|-------------|-----------------|--------------|
| **Draft** | Version being worked on | ✅ Yes | N/A | ❌ No |
| **Sent** | Offer sent to customer | ❌ No | ✅ Yes (mark invalid) | ❌ No |
| **Approved** | Customer approved offer | ❌ No | ❌ No | ✅ Yes |
| **Invalid** | Marked as no longer valid | ❌ No | N/A | ✅ Yes |
| **Archived** | Historical record | ❌ No | ❌ No | Already archived |

**Version Actions:**
- **Create new version** - Blank or copy from another version
- **Rename version** - Edit name/label (e.g., "Initial consultation → Initial consultation - Jan 15")
- **Duplicate version** - Create exact copy to modify (available for all statuses)
- **Delete version** - Only available for Draft status (with confirmation)
- **Mark as Invalid** - Only available for Sent status (with reason/note)
- **Archive version** - Available for Approved and Invalid statuses
- **Compare versions** - Side-by-side comparison view (future feature)

**Sidebar Navigation Indicators:**
- All sections are editable per version
- Show completion status per section (empty, in-progress, completed)
- Indicate which sections have been modified from the copied version (optional feature)

**Version List View (Dashboard):**
```
Lead: Jan de Vries
  └── Version 1: "Initial consultation - Jan 15, 2024" [Active]
  └── Version 2: "Alternative product - Jan 15, 2024" [Draft]
  └── Version 3: "Follow-up - Apr 10, 2024" [Completed]
```

---

## Technical Specifications

### Core Technologies
- **Web Components** - Native Custom Elements API (no framework)
- **CSS Custom Properties** - For design tokens
- **ES Modules** - Native JavaScript modules
- **Fetch API** - For backend communication
- **Vite** (optional) - Development server with HMR (minimal dependency)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No IE11 support required

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

---

## Architecture Decisions

### 1. No Framework Approach
**Decision:** Use Web Components instead of React/Vue/Angular

**Rationale:**
- Minimal dependencies as per requirements
- Native browser support
- Smaller bundle size
- No framework lock-in
- Sufficient for form-heavy application

**Trade-offs:**
- ✅ Smaller bundle, faster load
- ✅ No framework updates/breaking changes
- ❌ Less ecosystem/libraries
- ❌ More manual work for complex interactions

### 2. Token-Based CSS
**Decision:** Use CSS Custom Properties for design tokens

**Rationale:**
- Native CSS support
- Easy theming
- Consistent design
- Similar to shadcn approach

### 3. Multi-Page vs Single-Page
**Decision:** [TO BE DECIDED]

**Options:**
- **A) Single-Page Application (SPA)** - Client-side routing, one HTML file
- **B) Multi-Page Application (MPA)** - Server-side routing, multiple HTML files

**Recommendation:** SPA with hash-based routing for simplicity

### 4. State Management
**Decision:** [TO BE DECIDED]

**Options:**
- **A) URL State** - Store form progress in URL hash/query params
- **B) LocalStorage** - Save draft locally
- **C) Backend Draft API** - Auto-save to backend
- **D) Combination** - LocalStorage + Backend sync

**Recommendation:** LocalStorage + Backend draft endpoint for reliability

### 5. Build Process
**Decision:** [TO BE DECIDED]

**Options:**
- **A) No build** - Serve raw files in development, manual minification for prod
- **B) Vite** - Minimal build tool, excellent DX with HMR
- **C) esbuild** - Fast bundler, minimal config

**Recommendation:** Vite (single dev dependency, great DX)

---

## Confirmed Decisions

These decisions have been finalized:

### User Types & Roles ✅
**Decision:** Three user types with different access levels

1. **Advisors** - Primary users who create calculations and offers
   - Full access to calculation wizard
   - Can create/edit/delete calculations
   - Can generate and send offers
   - Can manage their own customers

2. **Admin** - System administrators
   - All advisor permissions
   - User management (create/edit/delete advisors)
   - Master data management (products, yearly parameters)
   - System settings
   - Analytics/reporting dashboard

3. **Customer Portal** - End customers view their offers
   - Read-only access to their specific offer
   - View ROI calculations and breakdown
   - Download PDF
   - No editing capabilities

**Impact:** Requires role-based access control (RBAC), separate UI views for each role

### Calculation Workflow ✅
**Decision:** Calculate button at end (not live recalculation)

- User fills all sections of wizard
- Click "Calculate" button to execute ROI calculation
- Results displayed after calculation completes
- Better performance, less API calls

### Offer Management ✅
**Decision:** Advisor can edit after generation, NO version history, NO draft/final states

- Advisor can regenerate offer with different parameters
- Each generation overwrites previous (no versioning)
- All calculations are "final" once generated
- Simpler implementation

### Email System ✅
**Decision:** Email triggered from backend

- Backend handles SMTP configuration
- Backend sends email with PDF attachment
- Frontend triggers via API call

### Deployment ✅
**Decision:** Same server as backend

- Frontend served from FastAPI static files or Docker nginx
- Single deployment unit
- Simpler infrastructure

### Internationalization ✅
**Decision:** Basic i18n system required

- Support multiple languages (NL, EN minimum)
- Translatable UI text
- Date/number formatting per locale
- Keep it simple - no heavy framework

---

## Questions to Answer

### Critical (Must answer before implementation)

1. **Authentication Method**
   - [x] JWT tokens in localStorage/sessionStorage?
   - [ ] HTTP-only cookies with session?
   - [ ] No auth (trust internal network)?
   - **Impact:** Determines API call structure and security approach

2. **Navigation Pattern**
   - [ ] Linear wizard (forced step-by-step)?
   - [x] Free navigation with validation warnings?
   - [ ] Hybrid (free nav within sections)?
   - **Impact:** UI/UX design and validation strategy

3. **Data Persistence**
   - [x] Auto-save every N seconds?
   - [x] Save on section complete?
   - [ ] Manual save only?
   - [ ] No save (one-shot calculation)?
   - **Impact:** Backend API requirements and user experience

4. **PDF Generation Location**
   - [ ] Frontend (jsPDF/pdfmake)?
   - [x] Backend (Python ReportLab/WeasyPrint)?
   - **Recommendation:** Backend for professional quality and branding
   - **Impact:** API design and library choices

5. **Email System**
   - [ ] Which SMTP provider? (SendGrid)
   - [x] Email triggered from backend?
   - [x] Email templates stored where? (Database)
   - **Impact:** Backend configuration and API endpoints

### Important (Should clarify during implementation)

6. **User Roles**
   - [x] Only advisors?
   - [x] Admin panel needed?
   - [x] Customer portal (view their offer)?
   - **Impact:** Scope and features

7. **Calculation Preview**
   - [ ] Live recalculation as user types?
   - [x] Calculate button at end?
   - **Impact:** Performance and API call frequency

8. **Offer Workflow**
   - [x] Can advisor edit after generation?
   - [x] Version history needed?
   - [x] Draft vs. final states?
   - **Impact:** Database schema and API design

9. **Deployment**
   - [x] Same server as backend?
   - [ ] Static hosting (Netlify/Vercel/S3)?
   - [ ] Docker container?
   - **Impact:** Build and deployment strategy

---

## Project Structure

### Recommended Structure

```
frontend/
├── public/                     # Static assets
│   ├── index.html             # Entry point
│   ├── favicon.ico
│   └── assets/
│       ├── images/
│       └── fonts/
├── src/
│   ├── components/            # Reusable Web Components
│   │   ├── base/              # Base components
│   │   │   ├── dc-button.js
│   │   │   ├── dc-input.js
│   │   │   ├── dc-select.js
│   │   │   ├── dc-card.js
│   │   │   ├── dc-modal.js
│   │   │   └── dc-table.js
│   │   ├── form/              # Form-specific components
│   │   │   ├── dc-form-section.js
│   │   │   ├── dc-field-group.js
│   │   │   └── dc-validation-message.js
│   │   └── domain/            # Domain-specific components
│   │       ├── dc-product-card.js
│   │       ├── dc-roi-chart.js
│   │       └── dc-offer-preview.js
│   ├── pages/                 # Page-level components
│   │   ├── login-page.js
│   │   ├── dashboard-page.js
│   │   ├── calculation/       # Calculation wizard pages
│   │   │   ├── personal-details-page.js
│   │   │   ├── current-situation-page.js
│   │   │   ├── future-situation-page.js
│   │   │   ├── product-selection-page.js
│   │   │   ├── battery-usage-page.js
│   │   │   ├── costs-page.js
│   │   │   ├── vat-refund-page.js
│   │   │   └── finance-page.js
│   │   ├── roi-results-page.js
│   │   ├── disadvantage-page.js
│   │   └── offer-page.js
│   ├── services/              # API and business logic
│   │   ├── api.js             # Fetch wrapper
│   │   ├── auth.js            # Authentication
│   │   ├── calculator-api.js  # Calculator endpoints
│   │   ├── product-api.js     # Product endpoints
│   │   └── storage.js         # LocalStorage wrapper
│   ├── utils/                 # Utilities
│   │   ├── router.js          # Simple hash router
│   │   ├── validator.js       # Form validation
│   │   └── formatter.js       # Number/currency formatting
│   ├── styles/                # Global styles
│   │   ├── tokens.css         # Design tokens
│   │   ├── base.css           # Reset and base styles
│   │   ├── layout.css         # Layout utilities
│   │   └── components.css     # Component styles (if needed)
│   ├── app.js                 # Main application entry
│   └── main.js                # Bootstrap
├── .gitignore
├── package.json               # Minimal dependencies
├── vite.config.js             # Vite config (if using)
└── README.md
```

### Directory Responsibilities

**`components/base/`** - Generic, reusable UI components (buttons, inputs, cards)
**`components/form/`** - Form-specific components (field groups, validation)
**`components/domain/`** - Business domain components (product cards, charts)
**`pages/`** - Full page components, one per route
**`services/`** - API calls and external integrations
**`utils/`** - Pure functions and helpers
**`styles/`** - Global CSS (tokens, base, layout)

---

## Implementation Tasks

### Phase 1: Foundation ✅ COMPLETED

#### 1.1 Project Setup
- [x] Create `frontend/` directory
- [x] Initialize `package.json` (Vite 7.2)
- [x] Set up Vite dev server
- [x] Create basic project structure
- [x] Set up Git ignore patterns
- [x] Configure CORS on backend for `http://localhost:3000`

#### 1.2 Design System
- [x] Create `tokens.css` with design variables (shadcn-inspired)
  - [x] Color palette (slate grays, cyan primary, semantic colors)
  - [x] Spacing scale (1-16)
  - [x] Typography scale
  - [x] Border radius values
  - [x] Shadow values
- [x] Create `base.css` with CSS reset
- [x] Create `layout.css` with layout utilities

#### 1.3 Base Components
- [x] `dc-button` - Button component (primary/secondary, sizes, loading)
- [x] `dc-input` - Text input component (with validation)
- [x] `dc-select` - Select dropdown component (Shadow DOM fix applied)
- [x] `dc-card` - Card container component (default/elevated variants)
- [x] `dc-language-switcher` - Language toggle component
- [x] Test components in isolation (index.html)
- [x] Add favicon

### Phase 2: Authentication & Navigation ✅ COMPLETED

#### 2.1 Authentication System
- [x] Decide on auth method (JWT with localStorage)
- [x] Create `auth.js` service (with demo credentials)
- [x] Implement `dc-auth-form` component (login/register)
- [x] Add auth state management
- [x] Add logout functionality
- [x] Create auth-test.html demo page

#### 2.2 Routing
- [x] Implement client-side router in `router.js`
- [x] Add parameterized route support
- [x] Create `dc-nav-header` component (role-based navigation)
- [x] Create `dc-sidebar-nav` component (section navigation)
- [x] Handle 404/not found
- [x] Add before-navigate hooks

#### 2.3 API Service Layer
- [x] Create base authentication utilities
  - [x] Handle auth headers (getAuthHeader method)
  - [x] Auth state persistence (localStorage)
  - [x] Role-based access control
- [ ] Create domain-specific API modules (deferred to Phase 3)
  - [ ] `calculator-api.js`
  - [ ] `product-api.js`
  - [ ] `customer-api.js`

### Phase 3: Data Collection Forms (Week 3-4)

#### 3.1 Form Components
- [ ] `dc-form-section` - Section wrapper with title
- [ ] `dc-field-group` - Label + input + validation
- [ ] `dc-validation-message` - Error/warning display
- [ ] Create validation utilities

#### 3.2 Calculation Wizard Pages
Create each page with proper validation:
- [ ] Personal Details
  - Name, address, postal code, city, email, phone
- [ ] Current Situation
  - Grid consumption, feed-in, solar production
- [ ] Future Situation
  - Battery mode changes, mode switch year
- [ ] Product Selection
  - Product catalog display
  - Filter by phase, capacity
  - Product comparison
- [ ] Battery Usage
  - Operating modes (active trading, self-consumption, peak shaving)
  - Cycles per day configuration
- [ ] Costs
  - Purchase price, installation, maintenance
  - Connection upgrade costs
- [ ] VAT Refund
  - Scenario selection (4 scenarios)
  - Automatic calculation preview
- [ ] Finance
  - Financing duration, interest rate
  - Monthly payment calculation

#### 3.3 Data Persistence
- [ ] Implement draft save (localStorage + backend)
- [ ] Auto-save every 30 seconds
- [ ] Load draft on page load
- [ ] Clear draft on submission

### Phase 4: Results & Offer (Week 5)

#### 4.1 ROI Results Display
- [ ] Create `roi-results-page.js`
- [ ] Display summary metrics
  - Total investment, net investment
  - Total savings (20 years)
  - Payback period
  - ROI percentage
- [ ] Create yearly breakdown table
- [ ] Add ROI chart component (consider chart library or canvas)

#### 4.2 Saldering Disadvantage Page
- [ ] Display current vs. post-saldering costs
- [ ] Show annual disadvantage
- [ ] Explain saldering phase-out

#### 4.3 Offer Generation
- [ ] Create `offer-page.js`
- [ ] Preview offer content
- [ ] Edit offer details (if allowed)
- [ ] Trigger PDF generation via backend API
- [ ] Trigger email send via backend API
- [ ] Show success/error states
- [ ] Download PDF option

### Phase 5: Polish & Testing (Week 6)

#### 5.1 UI/UX Polish
- [ ] Add loading states to all async operations
- [ ] Add error states and recovery options
- [ ] Improve form validation feedback
- [ ] Add progress indicator to wizard
- [ ] Mobile responsiveness check
- [ ] Accessibility audit (keyboard nav, ARIA labels)

#### 5.2 Testing
- [ ] Manual testing of all user flows
- [ ] Cross-browser testing
- [ ] Form validation edge cases
- [ ] API error handling
- [ ] Offline behavior

#### 5.3 Documentation
- [ ] Update frontend README
- [ ] Document component usage
- [ ] API integration guide
- [ ] Deployment instructions

---

## Design System (Token CSS)

### tokens.css

```css
:root {
  /* ============================================
     COLORS
     ============================================ */

  /* Primary - Brand color */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;  /* Main primary */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  /* Neutral - Grays */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-500: #737373;
  --color-neutral-700: #404040;
  --color-neutral-900: #171717;

  /* Semantic colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Surface colors */
  --color-background: #ffffff;
  --color-surface: #fafafa;
  --color-surface-raised: #ffffff;
  --color-border: #e5e5e5;

  /* Text colors */
  --color-text-primary: #171717;
  --color-text-secondary: #737373;
  --color-text-tertiary: #a3a3a3;
  --color-text-inverse: #ffffff;

  /* ============================================
     SPACING
     ============================================ */

  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  /* ============================================
     TYPOGRAPHY
     ============================================ */

  /* Font families */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;

  /* Font sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* Font weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* ============================================
     BORDERS
     ============================================ */

  --border-width-thin: 1px;
  --border-width-medium: 2px;
  --border-width-thick: 4px;

  --border-radius-sm: 0.25rem;  /* 4px */
  --border-radius-md: 0.5rem;   /* 8px */
  --border-radius-lg: 0.75rem;  /* 12px */
  --border-radius-xl: 1rem;     /* 16px */
  --border-radius-full: 9999px;

  /* ============================================
     SHADOWS
     ============================================ */

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04);

  /* ============================================
     TRANSITIONS
     ============================================ */

  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ============================================
     Z-INDEX LAYERS
     ============================================ */

  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

---

## Component Library

### Example: dc-button Component

```javascript
// src/components/base/dc-button.js

class DcButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    this.render();
  }

  setupEventListeners() {
    const button = this.shadowRoot.querySelector('button');
    button.addEventListener('click', (e) => {
      if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
        e.stopPropagation();
        return;
      }
    });
  }

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const disabled = this.hasAttribute('disabled');
    const loading = this.hasAttribute('loading');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          font-family: var(--font-sans);
          font-weight: var(--font-weight-medium);
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }

        button:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        /* Variants */
        .primary {
          background: var(--color-primary-500);
          color: var(--color-text-inverse);
        }

        .primary:hover:not(:disabled) {
          background: var(--color-primary-600);
        }

        .secondary {
          background: transparent;
          color: var(--color-primary-500);
          border: var(--border-width-thin) solid var(--color-border);
        }

        .secondary:hover:not(:disabled) {
          background: var(--color-primary-50);
        }

        /* Sizes */
        .sm {
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-sm);
        }

        .md {
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-base);
        }

        .lg {
          padding: var(--space-4) var(--space-6);
          font-size: var(--font-size-lg);
        }

        /* States */
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          position: relative;
          color: transparent;
        }

        .spinner {
          position: absolute;
          width: 1em;
          height: 1em;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <button
        class="${variant} ${size} ${loading ? 'loading' : ''}"
        ?disabled="${disabled || loading}"
      >
        ${loading ? '<span class="spinner"></span>' : ''}
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('dc-button', DcButton);
```

### Usage Example

```html
<dc-button variant="primary" size="md">Save</dc-button>
<dc-button variant="secondary" size="sm">Cancel</dc-button>
<dc-button variant="primary" loading>Loading...</dc-button>
```

---

## API Integration

### Base API Service

```javascript
// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function fetchApi(endpoint, options = {}) {
  const { headers = {}, ...restOptions } = options;

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      throw new ApiError(
        errorData.message || 'API request failed',
        response.status,
        errorData
      );
    }

    return isJson ? await response.json() : await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error
    throw new ApiError('Network error', 0, error);
  }
}

export const api = {
  get: (endpoint, options) => fetchApi(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options) =>
    fetchApi(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data, options) =>
    fetchApi(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint, options) =>
    fetchApi(endpoint, { ...options, method: 'DELETE' }),
};
```

### Calculator API Service

```javascript
// src/services/calculator-api.js

import { api } from './api.js';

export async function createCalculation(data) {
  return api.post('/api/calculations', data);
}

export async function getCalculation(id) {
  return api.get(`/api/calculations/${id}`);
}

export async function updateCalculation(id, data) {
  return api.put(`/api/calculations/${id}`, data);
}

export async function executeCalculation(id) {
  return api.post(`/api/calculations/${id}/calculate`);
}

export async function getCalculationResults(id) {
  return api.get(`/api/calculations/${id}/results`);
}

export async function getYearlyDetails(id) {
  return api.get(`/api/calculations/${id}/yearly-details`);
}

export async function generatePdf(id) {
  return api.post(`/api/calculations/${id}/generate-pdf`);
}

export async function sendOfferEmail(id, emailData) {
  return api.post(`/api/calculations/${id}/send-email`, emailData);
}
```

### Product API Service

```javascript
// src/services/product-api.js

import { api } from './api.js';

export async function getProducts(filters = {}) {
  const params = new URLSearchParams(filters);
  return api.get(`/api/products?${params}`);
}

export async function getProduct(id) {
  return api.get(`/api/products/${id}`);
}
```

---

## Authentication

### Decision Required
Choose authentication method:

**Option A: JWT Tokens**
- Store in localStorage or sessionStorage
- Include in Authorization header
- Refresh token logic needed

**Option B: Session Cookies**
- HTTP-only cookies
- Backend manages sessions
- Simpler frontend logic

### Auth Service Example (JWT)

```javascript
// src/services/auth.js

import { api } from './api.js';

export async function login(email, password) {
  const response = await api.post('/api/auth/login', { email, password });

  // Store token
  localStorage.setItem('auth_token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));

  return response;
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

export function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}
```

### Backend Requirements
- [ ] Add `/api/auth/login` endpoint
- [ ] Add `/api/auth/logout` endpoint (if needed)
- [ ] Add `/api/auth/refresh` endpoint (if using JWT)
- [ ] Add authentication middleware
- [ ] Configure CORS for credentials

---

## Internationalization (i18n)

### Approach: Lightweight Custom Solution

Since we want minimal dependencies, we'll implement a simple i18n system without heavy libraries.

### Supported Languages

**Initial:**
- Dutch (NL) - Primary language
- English (EN) - Secondary

**Structure allows easy addition of:**
- German (DE)
- French (FR)
- etc.

### Implementation Strategy

#### 1. Translation Files

JSON files for each language:

```
src/i18n/
├── index.js           # i18n manager
├── locales/
│   ├── nl.json        # Dutch translations
│   └── en.json        # English translations
```

**nl.json example:**
```json
{
  "common": {
    "save": "Opslaan",
    "cancel": "Annuleren",
    "delete": "Verwijderen",
    "edit": "Bewerken",
    "loading": "Laden..."
  },
  "auth": {
    "login": "Inloggen",
    "logout": "Uitloggen",
    "email": "E-mailadres",
    "password": "Wachtwoord",
    "forgotPassword": "Wachtwoord vergeten?"
  },
  "wizard": {
    "personalDetails": "Persoonlijke gegevens",
    "currentSituation": "Huidige situatie",
    "productSelection": "Product selectie",
    "calculate": "Berekenen"
  },
  "validation": {
    "required": "Dit veld is verplicht",
    "email": "Ongeldig e-mailadres",
    "number": "Moet een getal zijn",
    "min": "Minimale waarde is {min}",
    "max": "Maximale waarde is {max}"
  },
  "roi": {
    "totalInvestment": "Totale investering",
    "paybackPeriod": "Terugverdientijd",
    "totalSavings": "Totale besparing (20 jaar)",
    "roiPercentage": "ROI percentage"
  }
}
```

**en.json example:**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading..."
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email address",
    "password": "Password",
    "forgotPassword": "Forgot password?"
  },
  "wizard": {
    "personalDetails": "Personal details",
    "currentSituation": "Current situation",
    "productSelection": "Product selection",
    "calculate": "Calculate"
  },
  "validation": {
    "required": "This field is required",
    "email": "Invalid email address",
    "number": "Must be a number",
    "min": "Minimum value is {min}",
    "max": "Maximum value is {max}"
  },
  "roi": {
    "totalInvestment": "Total investment",
    "paybackPeriod": "Payback period",
    "totalSavings": "Total savings (20 years)",
    "roiPercentage": "ROI percentage"
  }
}
```

#### 2. i18n Manager

Simple translation manager:

```javascript
// src/i18n/index.js

class I18n {
  constructor() {
    this.locale = localStorage.getItem('locale') || 'nl';
    this.translations = {};
    this.observers = [];
  }

  async init() {
    await this.loadTranslations(this.locale);
  }

  async loadTranslations(locale) {
    try {
      const module = await import(`./locales/${locale}.json`);
      this.translations = module.default;
      this.locale = locale;
      localStorage.setItem('locale', locale);
      this.notifyObservers();
    } catch (error) {
      console.error(`Failed to load translations for ${locale}`, error);
      // Fallback to Dutch
      if (locale !== 'nl') {
        await this.loadTranslations('nl');
      }
    }
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    }

    // Replace parameters {param}
    return Object.keys(params).reduce((str, param) => {
      return str.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    }, value);
  }

  setLocale(locale) {
    return this.loadTranslations(locale);
  }

  getLocale() {
    return this.locale;
  }

  observe(callback) {
    this.observers.push(callback);
  }

  notifyObservers() {
    this.observers.forEach(callback => callback(this.locale));
  }
}

export const i18n = new I18n();
```

#### 3. Usage in Components

**In Web Components:**
```javascript
import { i18n } from '../../i18n/index.js';

class DcButton extends HTMLElement {
  connectedCallback() {
    // Subscribe to locale changes
    i18n.observe(() => this.render());
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <button>${i18n.t('common.save')}</button>
    `;
  }
}
```

**With parameters:**
```javascript
// validation.required → "This field is required"
const message = i18n.t('validation.required');

// validation.min with params → "Minimum value is 100"
const minMessage = i18n.t('validation.min', { min: 100 });
```

#### 4. Language Switcher Component

```javascript
// src/components/base/dc-language-switcher.js

import { i18n } from '../../i18n/index.js';

class DcLanguageSwitcher extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const select = this.shadowRoot.querySelector('select');
    select.addEventListener('change', async (e) => {
      await i18n.setLocale(e.target.value);
    });
  }

  render() {
    const currentLocale = i18n.getLocale();

    this.shadowRoot.innerHTML = `
      <style>
        select {
          padding: var(--space-2);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-sm);
        }
      </style>
      <select>
        <option value="nl" ${currentLocale === 'nl' ? 'selected' : ''}>Nederlands</option>
        <option value="en" ${currentLocale === 'en' ? 'selected' : ''}>English</option>
      </select>
    `;
  }
}

customElements.define('dc-language-switcher', DcLanguageSwitcher);
```

#### 5. Number & Currency Formatting

```javascript
// src/utils/formatter.js

import { i18n } from '../i18n/index.js';

const LOCALE_MAP = {
  'nl': 'nl-NL',
  'en': 'en-US'
};

export function formatCurrency(value, currency = 'EUR') {
  const locale = LOCALE_MAP[i18n.getLocale()] || 'nl-NL';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
}

export function formatNumber(value, decimals = 0) {
  const locale = LOCALE_MAP[i18n.getLocale()] || 'nl-NL';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatDate(date) {
  const locale = LOCALE_MAP[i18n.getLocale()] || 'nl-NL';
  return new Intl.DateTimeFormat(locale).format(date);
}

export function formatPercent(value, decimals = 1) {
  const locale = LOCALE_MAP[i18n.getLocale()] || 'nl-NL';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
```

**Usage:**
```javascript
import { formatCurrency, formatNumber, formatPercent } from './utils/formatter.js';

formatCurrency(10500);        // "€ 10.500,00" (NL) or "€10,500.00" (EN)
formatNumber(3.6, 1);         // "3,6" (NL) or "3.6" (EN)
formatPercent(0.21, 0);       // "21%" (both)
```

#### 6. Date/Time Formatting

For dates, leverage native `Intl.DateTimeFormat`:

```javascript
export function formatDateTime(date, options = {}) {
  const locale = LOCALE_MAP[i18n.getLocale()] || 'nl-NL';
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}
```

### Backend Integration

#### PDF Generation
- Backend must generate PDFs in user's language
- Pass `locale` parameter to PDF generation endpoint
- Backend uses same translation keys (JSON files shared or duplicated)

```javascript
await generatePdf(calculationId, { locale: i18n.getLocale() });
```

#### Email Templates
- Backend email templates in multiple languages
- Select template based on customer's preferred language

### Implementation Tasks

#### Phase 1: i18n Foundation
- [ ] Create `src/i18n/` directory structure
- [ ] Create `i18n/index.js` manager
- [ ] Create `locales/nl.json` (Dutch translations)
- [ ] Create `locales/en.json` (English translations)
- [ ] Create `utils/formatter.js` for number/currency/date formatting
- [ ] Initialize i18n in app bootstrap

#### Phase 2: Component Integration
- [ ] Create `dc-language-switcher` component
- [ ] Update all components to use `i18n.t()`
- [ ] Add language switcher to main navigation
- [ ] Test locale switching

#### Phase 3: Backend Integration
- [ ] Pass locale to PDF generation API
- [ ] Create backend translation files (or share with frontend)
- [ ] Update email templates for multiple languages
- [ ] Store customer language preference in database

### Translation Workflow

1. **During Development:**
   - Add keys to `nl.json` as you build features
   - Translate to `en.json` immediately or batch at end

2. **For New Languages:**
   - Copy `nl.json` to new language file (e.g., `de.json`)
   - Translate all values
   - Add language to switcher component

3. **Missing Translations:**
   - System shows the key if translation missing
   - Console warning for developers
   - Fallback to Dutch if language file fails to load

### File Size Considerations

With ~200 translation keys across all pages:
- `nl.json`: ~8-10 KB
- `en.json`: ~8-10 KB
- Total i18n code: ~2 KB

**Total overhead: ~20 KB** (acceptable for the functionality gained)

### Accessibility Considerations

- [ ] Set `lang` attribute on `<html>` based on locale
- [ ] Update `dir` attribute for RTL languages (future)
- [ ] Announce locale changes to screen readers

```javascript
// Update document lang attribute
document.documentElement.lang = locale;
```

---

## PDF & Email Generation

### Recommendation: Backend Generation

**Why backend:**
- Professional PDF quality
- Consistent branding
- Server-side templates
- No client-side library bloat
- Works regardless of browser

### Backend Requirements

#### PDF Generation
```python
# backend/services/pdf_generator.py

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

def generate_offer_pdf(calculation_id, output_path):
    # Fetch calculation data
    # Generate PDF with branding
    # Return file path
    pass
```

**Libraries to consider:**
- **ReportLab** - Python PDF generation
- **WeasyPrint** - HTML to PDF (easier templates)
- **xhtml2pdf** - Another HTML to PDF option

#### Email Service
```python
# backend/services/email_service.py

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

def send_offer_email(to_email, pdf_path, calculation_data):
    # Create email with PDF attachment
    # Use HTML template
    # Send via SMTP
    pass
```

**SMTP Configuration needed:**
- SMTP server hostname
- Port (usually 587 for TLS)
- Username/password
- From email address

### Frontend API Calls

```javascript
// Generate PDF
const pdfResponse = await generatePdf(calculationId);
// pdfResponse = { pdf_url: '/downloads/calculation-123.pdf' }

// Download PDF
window.open(pdfResponse.pdf_url, '_blank');

// Send email
await sendOfferEmail(calculationId, {
  recipient_email: customer.email,
  subject: 'Your Battery ROI Calculation',
  message: 'Please find attached...'
});
```

### Backend Endpoints Needed

```
POST /api/calculations/:id/generate-pdf
  → Returns: { pdf_url: string }

POST /api/calculations/:id/send-email
  Body: { recipient_email, subject?, message? }
  → Returns: { success: boolean, message: string }
```

---

## Testing Strategy

### Manual Testing Checklist

#### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Session persistence (refresh page)
- [ ] Session expiry handling

#### Data Collection Forms
For each page:
- [ ] All fields validate correctly
- [ ] Required field validation
- [ ] Format validation (email, numbers)
- [ ] Range validation (min/max)
- [ ] Error messages are clear
- [ ] Can save draft
- [ ] Draft loads correctly
- [ ] Can navigate back/forward
- [ ] Data persists between pages

#### Calculation & Results
- [ ] Calculation executes successfully
- [ ] Results display correctly
- [ ] Yearly breakdown loads
- [ ] Charts render (if implemented)
- [ ] Numbers format correctly (€, %, kWh)

#### Offer Generation
- [ ] PDF generates successfully
- [ ] PDF downloads
- [ ] Email sends successfully
- [ ] Error handling for failures

#### Edge Cases
- [ ] Slow network (throttle to 3G)
- [ ] Network failure mid-operation
- [ ] Invalid API responses
- [ ] Large datasets
- [ ] Browser back button
- [ ] Multiple tabs open

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader compatible (basic check)
- [ ] Color contrast meets WCAG AA
- [ ] Form labels associated correctly

---

## Deployment

### Option 1: Static Hosting (Recommended for SPA)

**Platforms:**
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

**Build command:**
```bash
npm run build
```

**Deploy directory:** `dist/`

**Environment variables needed:**
- `VITE_API_URL` - Backend API URL

### Option 2: Docker Container (with Backend)

```dockerfile
# frontend/Dockerfile

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Option 3: Serve from Backend

Serve frontend static files from FastAPI:

```python
# backend/main.py

from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy-frontend.yml

name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod --dir=frontend/dist
```

---

## Dependencies

### Minimal package.json

```json
{
  "name": "domogo-calculator-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  },
  "dependencies": {}
}
```

### Optional Dependencies (if needed)

```json
{
  "dependencies": {
    "chart.js": "^4.0.0",  // If using charts for ROI visualization
    "date-fns": "^3.0.0"    // If complex date manipulation needed
  }
}
```

---

## Open Questions Summary

Before starting implementation, answer these questions:

1. **[ ] Authentication method?** (JWT vs Session)
2. **[ ] Navigation pattern?** (Linear wizard vs Free nav)
3. **[ ] Data auto-save?** (Yes/no, frequency)
4. **[ ] PDF generation location?** (Frontend vs Backend - recommend backend)
5. **[ ] Email SMTP provider?** (Which service)
6. **[ ] User roles?** (Advisor only vs Admin panel)
7. **[ ] Calculation preview?** (Live vs On-demand)
8. **[ ] Offer editing?** (After generation, yes/no)
9. **[ ] Deployment target?** (Static hosting vs Docker vs Backend-served)
10. **[ ] Build tool?** (Vite vs No build vs esbuild)

---

## Next Steps

1. **Review this document** and answer open questions
2. **Clarify requirements** with stakeholders if needed
3. **Make architecture decisions** on open items
4. **Update main ticket** (0004-setup-frontend.md) with confirmed decisions
5. **Begin Phase 1 implementation** (Foundation)

---

## Notes

- Keep components simple and focused
- Prioritize accessibility from the start
- Test on real devices early
- Consider mobile-first approach
- Document components as you build
- Keep bundle size small (target < 100KB initial load)