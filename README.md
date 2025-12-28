# Domogo Battery ROI Calculator

A comprehensive Battery Return on Investment calculator for the Dutch home battery market. Calculates 20-year ROI projections accounting for battery degradation, Dutch net metering (saldering) phase-out, VAT scenarios, and energy market dynamics.

## Project Purpose

This calculator helps customers understand the financial benefits of installing a home battery system. The ultimate goal is to generate professional customer offers including:
- Product recommendations and specifications
- 20-year financial projections and ROI analysis
- Energy savings breakdown
- Financing options
- Installation details and warranty information

**Target Markets:**
- Primary: B2C (residential customers)
- Future: B2B (commercial installations)

## Key Features

- **Complex ROI Modeling**: 20-year projections with inflation, degradation, and market changes
- **Dutch Market Specific**:
  - Saldering (net metering) phase-out calculations
  - VAT refund scenarios (private vs. business, KOR exemptions)
  - Dutch energy tax structures
- **Battery Degradation**: Annuity-based curves (front-loaded, realistic degradation)
- **Operating Modes**: Active trading, self-consumption, peak shaving
- **Mode Switching**: Support for changing battery modes mid-lifetime

## Technology Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy
- **Database**: PostgreSQL 15
- **Migrations**: Alembic
- **API**: FastAPI + PostgREST
- **Containerization**: Docker/Podman

## Quick Start

```bash
# Start all services
podman-compose up -d

# Run database migrations
podman exec -it domogo-calculator-backend alembic upgrade head

# Seed initial data
podman exec -it domogo-calculator-backend python seeds/run_all_seeds.py

# Access API
open http://localhost:8000/docs
```

## Project Structure

```
.
├── backend/                  # Python/FastAPI backend
│   ├── models/              # Database models
│   ├── calculators/         # Calculation engine (pure Python)
│   ├── seeds/              # Data seeding scripts
│   └── alembic/            # Database migrations
├── postgres/               # Database initialization
├── bruno/                 # API testing (Bruno collections)
├── tickets/               # Project requirements and tasks
├── docker-compose.yml     # Service orchestration
└── excel_analysis.md      # Excel formula reference

```

## Documentation

- **Backend Setup & API**: [`backend/README.md`](backend/README.md)
- **Excel Formula Reference**: [`excel_analysis.md`](excel_analysis.md) - Comprehensive documentation of original Excel calculations
- **Task Management**: [`tickets/README.md`](tickets/README.md)
- **AI Context** (for Claude Code): [`CLAUDE.md`](CLAUDE.md)

## API Access

- **FastAPI**: http://localhost:8000
  - API Documentation: http://localhost:8000/docs
- **PostgREST**: http://localhost:3001

## Development

See [`backend/README.md`](backend/README.md) for:
- Complete setup instructions
- Development workflow
- Testing commands
- Database migration process

## Business Logic Highlights

### Saldering Phase-out
The Dutch government is phasing out net metering (saldering):
- 100% compensation in 2025-2026
- 0% from 2027 onwards
- Major driver of battery ROI

### Battery Degradation
Uses annuity-based degradation curves (not linear):
- Front-loaded degradation (more in early years)
- Based on guaranteed cycles and residual capacity
- Mirrors Excel CUMIPMT approach

### VAT Scenarios
Four scenarios supported:
1. Private user, no reclaim
2. Private user with reclaim (max €2494 with deductions)
3. Business user, full reclaim
4. Business with KOR exemption

## Source Material

Original calculation logic from Excel workbook:
- `Domogo Rendementscalculator versie 67 - Niet beveiligd.xlsx`
- Fully analyzed in `excel_analysis.md`

## License

[To be determined]

## Contact

[To be determined]
