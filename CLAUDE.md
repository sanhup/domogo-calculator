# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 IMPORTANT: Workflow for Every Session

**At the start of EVERY session, Claude must:**

1. **Read this file (CLAUDE.md) completely** to understand project conventions, patterns, and requirements
2. Review recent changes (git log, open tickets) to understand current state
3. Only then begin implementing features or making changes

**This ensures consistency with:**
- Established code patterns (mixins, logging, soft deletes)
- Project-specific conventions (Dutch postal codes, decimal precision, etc.)
- Documentation standards
- Testing expectations

## 📝 Documentation Standards

**When modifying existing code, ALWAYS update:**

1. **Docstrings** - Module, class, and function documentation
2. **Inline comments** - Especially for complex business logic
3. **Type hints** - Keep them accurate and complete
4. **README files** - If behavior changes affect usage

**Common mistakes to avoid:**
- ❌ Updating a class to use a mixin but not updating the docstring
- ❌ Adding new fields without documenting their purpose
- ❌ Changing function signatures without updating docstrings
- ❌ Removing functionality without updating documentation

**Example of proper updates:**
```python
# BEFORE
class Customer(Base):
    """Customer model."""
    created_at = Column(DateTime, ...)
    updated_at = Column(DateTime, ...)

# AFTER (using mixin)
class Customer(Base, TimestampMixin):
    """
    Customer model representing a lead or customer in the system.

    Inherits created_at and updated_at fields from TimestampMixin.
    """
    # Timestamps inherited from TimestampMixin:
    # - created_at
    # - updated_at
```

## Project Overview

**Domogo Calculator** is a Battery ROI (Return on Investment) calculator for home battery systems in the Dutch market. The project migrates a complex Excel-based financial model into a web application with PostgreSQL database, Python/FastAPI backend, and comprehensive calculation engine.

The calculator models 20-year ROI projections considering:
- Dutch net metering (saldering) phase-out policy
- Battery degradation using annuity-based curves
- Complex VAT scenarios (private vs. business, KOR exemptions)
- Dynamic energy pricing and inflation
- Multiple battery operating modes (active trading, self-consumption)

**Source**: The original Excel file `Domogo Rendementscalculator versie 67 - Niet beveiligd.xlsx` contains the complete calculation logic. Comprehensive analysis is in `excel_analysis.md`.

## Project Goals

The calculator's ultimate purpose is to **generate customer offers** based on gathered information and ROI calculations. This feature is evolving.

**Target Markets:**
- **Primary**: B2C (Business to Consumer) - residential customers
- **Future**: B2B (Business to Business) - commercial installations

**Customer Offers Include:**
- Customer personal information (name, address, contact details)
- Product specifications and pricing
- 20-year ROI calculations and financial projections
- Energy savings analysis and payback period
- Financing options and payment terms
- Installation details and timeline
- Warranty information
- Terms and conditions

**Important Considerations:**
- Personal data is collected and stored (GDPR compliance required)
- Different VAT treatment for B2C vs. B2B
- Offer generation logic will be built on top of calculation engine

## Quick Reference

For detailed commands and getting started, see `backend/README.md`.

**Most commonly used:**
```bash
# Start all services
podman-compose up -d

# Enter backend container
podman exec -it domogo-calculator-backend bash

# Run migrations
podman exec -it domogo-calculator-backend alembic upgrade head

# Run tests
podman exec -it domogo-calculator-backend python test_calculator.py
```

## Architecture Overview

See `backend/README.md` for complete architecture details.

**Key components:**
- **Backend**: Python/FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL with Alembic migrations
- **Calculators**: Pure Python calculation engine (no DB dependencies)
- **Models**: SQLAlchemy models for products, master data, customers, calculations

### Calculation Flow

The ROI calculator (`calculators/roi_calculator.py`) orchestrates:
1. **Degradation calculation** - Uses `CUMIPMT`-like annuity curve for realistic battery degradation
2. **VAT refund** - Complex Dutch rules with max refunds, per-kWh deductions
3. **Energy flows** - Yearly battery performance accounting for degradation
4. **Savings calculation** - Based on mode (active trading vs. self-consumption) and saldering %
5. **20-year projection** - Cumulative savings, payback period, ROI %

Each module in `calculators/` can be run standalone for testing.

## Key Business Logic

### Saldering (Net Metering) Phase-out
- **Critical to Dutch market**: Government is phasing out net metering
- Current schedule: 100% in 2025-2026, then 0% from 2027
- Stored in `master_data_yearly.saldering_percentage`
- Major driver of battery ROI (batteries become valuable when saldering ends)

### Battery Degradation Model
- Uses **annuity-based curve** (not linear) - front-loaded degradation
- Based on cumulative cycles vs. guaranteed cycles
- Formula mirrors Excel's `CUMIPMT` approach
- See `calculators/degradation.py` for implementation

### VAT Scenarios
Four scenarios for Dutch market:
1. **particulier** (private, no reclaim) - Simple purchase with VAT
2. **particulier_terugvraag** (private, reclaim) - Max €2494 minus deductions
3. **zakelijk** (business, no KOR) - Full VAT reclaim
4. **zakelijk_kor** (business, KOR exemption) - Similar to private

All calculations in `calculators/vat.py`

### Battery Operating Modes
- **Active trading**: Charge at night (low rate), discharge during day (high rate) - 1.5 cycles/day
- **Self-consumption**: Maximize direct solar use, minimize grid interaction - 1.0 cycles/day
- **Peak shaving**: Reduce peak loads - 0.8 cycles/day

Modes can switch mid-lifetime (e.g., start self-consumption, switch to trading when saldering ends)

## Database Schema Important Notes

See `backend/README.md` for model descriptions. Key patterns to remember:

**Master Data Yearly:**
- **Critical**: Must have data for all years in calculation range (installation year + 20)
- `saldering_percentage`: stored as decimal (1.0 = 100%, 0.0 = 0%)

**Products:**
- `capacity_kwh` is **usable capacity** (not nominal)
- `guaranteed_cycles` and `guaranteed_capacity_retention` define degradation curve

**Calculations:**
- Results stored separately for history tracking
- Status flow: 'draft' → 'calculated' → 'archived'

## Important Conventions

### Decimal Precision
- Use `Decimal` type for all financial calculations (avoid float rounding errors)
- Percentages stored as decimals: 0.21 = 21%, 0.95 = 95%
- Round final results for display: `round(value, 2)` for euros

### Year Handling
- `year_number`: Relative to installation (1, 2, 3...)
- `calendar_year`: Actual year (2025, 2026...)
- First year might be partial (if installation mid-year)

### Energy Units
- Always kWh (kilowatt-hours) for energy
- Always kW (kilowatts) for power
- Cycles always as daily cycles (not annual)

### Code Style
- Models use SQLAlchemy declarative base
- Calculators are pure Python functions (no database dependencies)
- Services layer (future) will bridge models and calculators
- Type hints on all function parameters

### Model Conventions

**Timestamp Fields:**
- All models that need timestamps should inherit from `TimestampMixin`
- This provides `created_at` and `updated_at` fields automatically
- Never manually define these fields - always use the mixin

Example:
```python
from models.mixins import TimestampMixin

class MyModel(Base, TimestampMixin):
    __tablename__ = "my_table"
    id = Column(Integer, primary_key=True)
    # ... other fields
    # created_at and updated_at inherited from TimestampMixin
```

**Soft Deletes:**
- Use `archived` boolean field for soft deletes (never hard delete data)
- Default to `False`, index the field for performance
- Filter archived records by default in list queries

### Frontend Patterns

**Component Architecture:**
- Use Web Components (Custom Elements) for page-level components
- Place page components in `frontend/src/pages/`
- Place reusable UI components in `frontend/src/components/`
- **Do NOT use Shadow DOM** for page components (breaks global styles and dc-table integration)
- Only use Shadow DOM for truly isolated design system primitives

**Form Change Tracking:**

All form components that edit existing data **must** use `FormChangeTracker` to prevent accidental saves.

**Import and instantiate:**
```javascript
import { FormChangeTracker } from '../../utils/form-change-tracker.js';

class MyFormPage extends HTMLElement {
  constructor() {
    super();
    this.changeTracker = new FormChangeTracker(this);
    // ... other properties
  }
}
```

**Usage pattern:**
```javascript
// 1. When loading data for edit mode
async loadData() {
  const data = await fetchData();
  this.changeTracker.setOriginalData(data);  // Sets baseline for comparison
}

// 2. In render method, after setting up form
render() {
  this.innerHTML = `<form id="myForm">...</form>`;
  this.changeTracker.setupListeners('#myForm');  // Auto-detects changes
}
```

**Behavior:**
- **Edit mode**: Save button starts disabled, enables only when fields change
- **Create mode**: Save button always enabled
- Compares trimmed values (ignores whitespace-only changes)
- Works with both `dc-input` components (uses `getValue()` method) and native HTML inputs (uses `.value` property)

**Available methods:**
- `setOriginalData(data, fieldNames?)` - Set baseline data for comparison
- `setupListeners(selector)` - Attach change listeners to form inputs
- `checkChanges(selector)` - Manually check for changes (returns boolean)
- `updateSaveButton()` - Manually update button enabled/disabled state
- `reset()` - Reset tracking after successful save

**Requirements:**
- Submit button must have `type="submit"` and be a `dc-button`
- Form must have an `id` or unique selector
- Call `setupListeners()` after rendering form HTML

### Logging Conventions

**Always use structured logging** with context fields for observability.

**Import and initialize:**
```python
from logging_config import get_logger

logger = get_logger(__name__)
```

**Usage examples:**
```python
# Good: Include context fields
logger.info("Customer created", customer_id=123, customer_name="Jan de Vries")
logger.warning("Invalid postal code", postal_code="1234", expected_format="1234AB")
logger.error("Database connection failed", db_host="localhost", retry_count=3)

# Bad: Don't use string formatting in message
logger.info(f"Customer {customer_id} created")  # ❌ Loses structure
```

**Log Levels:**
- `DEBUG`: Detailed diagnostic information (development only)
- `INFO`: General operational events (user actions, system events)
- `WARNING`: Unexpected but handled situations (validation errors, retries)
- `ERROR`: Errors that need attention (failed operations, exceptions)
- `CRITICAL`: System-critical failures (database down, service unavailable)

**Environment Modes:**
- **Development** (`ENVIRONMENT=development`): Pretty-printed colored console logs
- **Production** (`ENVIRONMENT=production`): JSON-structured logs for observability platforms

**What to log:**
- User actions (create, update, delete, archive)
- API requests with key parameters
- Validation failures
- External service calls
- Performance metrics (optional: duration, size)
- Errors and exceptions (always with context)

**What NOT to log:**
- Passwords, tokens, or sensitive data
- Full request/response bodies (unless debugging)
- PII without proper masking
- High-frequency events that create noise

### Seed Data

**Location:** `backend/seeds/`

**Running seeds:**
```bash
# Run all seeds
podman exec -it domogo-calculator-backend python seeds/run_all_seeds.py

# Run individual seed
podman exec -it domogo-calculator-backend python seeds/seed_customers.py
```

**Creating new seed files:**
1. Create `seed_<name>.py` in `backend/seeds/`
2. Implement a function that takes `db` session parameter
3. Add to `run_all_seeds.py`
4. Include sample data with realistic Dutch names/addresses
5. Check for existing data before inserting
6. Use transactions and commit explicitly

## Testing Strategy

When modifying calculators:
1. Run module standalone to verify formulas: `python -m calculators.degradation`
2. Compare results against Excel for known scenarios (see `excel_analysis.md`)
3. Validate edge cases (first year partial, mode switching, VAT scenarios)
4. Use `test_calculator.py` for regression testing

## Task Management

Project requirements tracked in `tickets/` directory. See `tickets/README.md` for workflow.

## Key Documentation

- **Backend setup & API**: `backend/README.md`
- **Excel formula reference**: `excel_analysis.md` (comprehensive formula documentation)
- **Tickets workflow**: `tickets/README.md`
- **Docker config**: `docker-compose.yml`
- **Database init**: `postgres/init.sql`
