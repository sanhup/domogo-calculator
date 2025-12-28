# Domogo Calculator Backend

Python backend for the Domogo Battery ROI Calculator with PostgreSQL database, SQLAlchemy ORM, and FastAPI.

## Architecture

- **FastAPI** - Modern web framework for building APIs
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration tool
- **PostgreSQL** - Database
- **Docker** - Containerization

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files (auto-generated)
│   └── env.py           # Alembic environment config
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── product.py       # Product catalog
│   ├── master_data.py   # Yearly master data
│   ├── customer.py      # Customer information
│   ├── calculation.py   # Calculations and results
│   └── battery_mode.py  # Battery operating modes
├── seeds/               # Data seeding scripts
├── api/                 # API route handlers
├── database.py          # Database configuration
├── main.py             # FastAPI application
├── alembic.ini         # Alembic configuration
├── Dockerfile          # Docker container definition
└── requirements.txt    # Python dependencies
```

## Database Models

### Product
Product catalog with battery specifications, pricing, and performance data.

### MasterDataYearly
Yearly parameters: VAT rates, inflation, energy prices, saldering percentage.

### Customer
Customer information for calculations.

### BatteryMode
Operating modes: cycles per day, self-consumption settings.

### Calculation
User inputs for ROI calculations.

### CalculationResult
Summary results: ROI, payback period, total savings.

### CalculationYearlyDetail
Year-by-year breakdown of performance and savings.

## Calculation Engine

The `calculators/` directory contains pure Python calculation modules (no database dependencies):

### degradation.py
Battery degradation using annuity-based curves (mirrors Excel CUMIPMT logic). Front-loaded degradation based on guaranteed cycles and residual capacity.

### vat.py
Dutch VAT refund calculations for four scenarios:
- **particulier**: Private user, no reclaim
- **particulier_terugvraag**: Private user with reclaim (max €2494 minus deductions)
- **zakelijk**: Business user, full reclaim
- **zakelijk_kor**: Business with KOR exemption

### energy.py
Energy flow calculations and annual savings based on:
- Battery operating mode (active trading, self-consumption, peak shaving)
- Saldering percentage (net metering phase-out)
- Energy prices and taxes

### roi_calculator.py
Main ROI orchestrator that combines all calculation modules to produce 20-year projections, payback period, and ROI metrics.

Each calculator module can be run standalone for testing and formula verification.

## Getting Started

### 1. Start Services

```bash
# Start all services (postgres, postgrest, backend)
podman-compose up -d

# Or just the backend
podman-compose up -d domogo_calculator_backend
```

### 2. Create Initial Migration

```bash
# Enter the backend container
podman exec -it domogo-calculator-backend bash

# Generate initial migration from models
alembic revision --autogenerate -m "initial schema"

# Apply migration
alembic upgrade head
```

### 3. Seed Data

```bash
# Run seed scripts (when created)
python seeds/seed_master_data.py
python seeds/seed_products.py
python seeds/seed_battery_modes.py
```

### 4. Access API

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgREST: http://localhost:3001

## Alembic Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

## Testing

Run all calculator tests:
```bash
podman exec -it domogo-calculator-backend python test_calculator.py
```

Run specific calculator module tests:
```bash
podman exec -it domogo-calculator-backend python -m calculators.degradation
podman exec -it domogo-calculator-backend python -m calculators.vat
podman exec -it domogo-calculator-backend python -m calculators.energy
podman exec -it domogo-calculator-backend python -m calculators.roi_calculator
```

## Viewing Logs

View backend logs:
```bash
podman-compose logs -f domogo_calculator_backend
```

View all service logs:
```bash
podman-compose logs -f
```

## Development Workflow

### 1. Modify Models

Edit files in `models/` directory:
```python
# models/product.py
class Product(Base):
    __tablename__ = "products"
    # Add/modify columns here
```

### 2. Generate Migration

```bash
podman exec -it domogo-calculator-backend alembic revision --autogenerate -m "add new column"
```

### 3. Review Migration

Check the generated file in `alembic/versions/` and make any manual adjustments.

### 4. Apply Migration

```bash
podman exec -it domogo-calculator-backend alembic upgrade head
```

## API Endpoints (Planned)

### Products
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)

### Master Data
- `GET /api/master-data/{year}` - Get master data for year
- `POST /api/master-data` - Create/update master data (admin)

### Calculations
- `POST /api/calculations` - Create new calculation
- `GET /api/calculations/{id}` - Get calculation results
- `GET /api/calculations` - List user calculations

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Get customer details

## Environment Variables

See `.env.example` for configuration options:

- `DATABASE_URL` - PostgreSQL connection string
- `PYTHONUNBUFFERED` - Python output buffering

## Next Steps

1. ✅ Database schema with SQLAlchemy models
2. ✅ Alembic migration setup
3. 🔲 Seed scripts for initial data
4. 🔲 Calculation engine (port Excel formulas to Python)
5. 🔲 FastAPI endpoints for calculations
6. 🔲 Data import from Excel file
