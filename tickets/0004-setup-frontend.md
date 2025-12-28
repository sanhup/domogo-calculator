### 0004 Setup frontend
Status: open

## Description

Build a minimal-dependency frontend for the Battery ROI Calculator with support for three user types (Advisors, Admin, Customer Portal) and internationalization (NL/EN).

## Requirements Summary

### Tech Stack
- **Web Components** - Native Custom Elements (no framework)
- **Token CSS** - CSS Custom Properties for design system
- **Vanilla JavaScript** - ES Modules
- **Vite** - Development server (minimal build dependency)
- **Design Style** - Minimalistic, shadcn-inspired

### User Types

**1. Advisors** (Primary users)
- Create and manage ROI calculations
- Fill multi-step calculation wizard
- Generate and send customer offers
- Manage customer information

**2. Admin**
- All advisor permissions
- User management (create/edit/delete advisors)
- Master data management (products, yearly parameters)
- System settings and analytics

**3. Customer Portal**
- View-only access to their specific offer
- View ROI calculations and breakdown
- Download PDF offers
- No editing capabilities

### Application Flow

**For Advisors:**
1. Login
2. Data Collection Wizard (8 steps):
   - Personal Details
   - Current Situation (energy usage)
   - Future Situation (battery mode changes)
   - Product Selection (from catalog)
   - Battery Usage (operating modes)
   - Costs (purchase, installation, maintenance)
   - VAT Refund (4 scenarios)
   - Finance (optional financing)
3. Calculate ROI (button at end)
4. View Results:
   - ROI summary (investment, savings, payback)
   - Financial disadvantage without battery
   - 20-year breakdown
5. Generate & Send Offer:
   - Generate PDF (backend)
   - Email to customer (backend)

**For Customers:**
1. Login with unique link/credentials
2. View their offer
3. Download PDF

**For Admin:**
1. Login
2. Dashboard with analytics
3. User management
4. Product catalog management
5. Master data (yearly parameters) management

### Internationalization (i18n)

- **Languages:** Dutch (NL) primary, English (EN) secondary
- **Implementation:** Lightweight custom i18n system (~20KB total)
- **Features:**
  - Translation JSON files (nl.json, en.json)
  - Language switcher component
  - Locale-aware number/currency/date formatting
  - Backend integration for PDFs and emails

### Key Technical Decisions

**Authentication:**
- JWT tokens (to be confirmed)
- Role-based access control (RBAC)

**Data Persistence:**
- LocalStorage for draft calculations
- Backend API for final save

**Calculation:**
- Calculate button at end (not live)
- Single API call for 20-year projection

**Offer Management:**
- Advisors can regenerate offers
- No version history
- No draft/final states (all are final)

**PDF & Email:**
- Generated on backend (Python ReportLab/WeasyPrint)
- SMTP: SendGrid
- Email templates: Stored in database
- Multi-language support

**Deployment:**
- Same server as backend
- Served as static files from FastAPI or nginx

### Navigation

- Simple navigation menu
- Hash-based routing for SPA
- Free navigation within wizard (not strictly linear)
- Progress indicator showing completion

## Implementation Details

See `0004-setup-frontend_details.md` for:
- Complete project structure
- Component library specifications
- Token CSS design system
- Implementation tasks (6 phases)
- i18n implementation code
- API integration examples
- Testing strategy
- Deployment options

## Acceptance Criteria

- [ ] All three user types can login with appropriate access
- [ ] Advisors can complete full calculation wizard
- [ ] ROI calculation executes and displays results
- [ ] Offers can be generated as PDF
- [ ] Offers can be emailed to customers
- [ ] Customers can view their offers
- [ ] Admin can manage users and master data
- [ ] UI is available in Dutch and English
- [ ] All numbers/currencies format correctly per locale
- [ ] Application works on modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Bundle size < 100KB initial load

## Dependencies

**Production:**
- None (pure Web Components)

**Development:**
- Vite (dev server with HMR)

**Optional:**
- chart.js (if visualizations needed)

## Backend Requirements

New endpoints needed:
- [ ] Authentication (login, logout, refresh)
- [ ] User management (CRUD for advisors)
- [ ] Customer portal access
- [ ] Draft calculation save/load
- [ ] PDF generation with locale parameter
- [ ] Email sending with multi-language templates
- [ ] Role-based authorization middleware

## Related Documents

- **Details & Implementation:** `0004-setup-frontend_details.md`
- **Backend API:** `backend/README.md`
- **Project Context:** `CLAUDE.md`