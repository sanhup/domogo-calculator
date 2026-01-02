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
│   ├── user.py          # User authentication
│   ├── role.py          # User roles
│   ├── user_role.py     # User-role association
│   ├── product.py       # Product catalog
│   ├── master_data.py   # Yearly master data
│   ├── customer.py      # Customer information
│   ├── calculation.py   # Calculations and results
│   └── battery_mode.py  # Battery operating modes
├── auth/                # Authentication utilities
│   ├── password.py      # Password hashing (bcrypt)
│   ├── jwt.py           # JWT token generation
│   └── dependencies.py  # FastAPI auth dependencies
├── schemas/             # Pydantic request/response schemas
│   ├── auth.py          # Authentication schemas
│   ├── user.py          # User management schemas
│   └── role.py          # Role management schemas
├── routes/              # API route handlers
│   ├── auth.py          # Authentication endpoints
│   ├── users.py         # User management endpoints
│   ├── roles.py         # Role management endpoints
│   └── customers.py     # Customer endpoints
├── seeds/               # Data seeding scripts
│   ├── seed_roles.py    # Default roles
│   ├── seed_users.py    # Initial admin user
│   └── run_all_seeds.py # Run all seeds
├── database.py          # Database configuration
├── main.py             # FastAPI application
├── alembic.ini         # Alembic configuration
├── Dockerfile          # Docker container definition
└── requirements.txt    # Python dependencies
```

## Database Models

### User
User authentication and authorization. Stores username, email, hashed password (bcrypt), and active status. Uses soft delete pattern with `archived` field.

### Role
User roles for access control (admin, sales, user). Supports many-to-many relationship with users.

### UserRole
Association table linking users to roles. Tracks when roles were assigned.

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

## Authentication & Authorization

The application uses JWT-based authentication with role-based access control.

### Authentication Flow

1. **Login**: User provides username/password → receives JWT access token (30 min) and refresh token (7 days)
2. **Protected Routes**: Include `Authorization: Bearer <access_token>` header
3. **Token Refresh**: Use refresh token to get new access token without re-login
4. **Logout**: Client discards tokens (JWT tokens are stateless)

### Default Roles

- **admin**: Full system access (user management, role management, all data)
- **sales**: Access to customers, calculations, and offers
- **user**: Basic access (future use)

### Default Credentials

After running seeds, an admin user is created:
- Username: `admin`
- Password: `admin123`
- **IMPORTANT**: Change this password immediately in production!

### Password Security

- Passwords are hashed using bcrypt (12 rounds)
- Plain text passwords are never stored or logged
- Minimum password length: 8 characters

### JWT Configuration

Tokens are signed using HS256 algorithm. Configure via environment variables:
- `JWT_SECRET_KEY`: Secret key for signing tokens (change in production!)
- `JWT_ALGORITHM`: Signing algorithm (default: HS256)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: Access token lifetime (default: 30)
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS`: Refresh token lifetime (default: 7)

### Protecting Routes

```python
from auth import get_current_user, get_current_active_user, require_admin

# Require any authenticated user
@app.get("/protected")
async def protected_route(user: User = Depends(get_current_active_user)):
    return {"message": f"Hello {user.username}"}

# Require admin role
@app.get("/admin-only")
async def admin_route(user: User = Depends(require_admin)):
    return {"message": "Admin access granted"}

# Require specific roles
from auth import RoleChecker
require_sales = RoleChecker(["admin", "sales"])

@app.get("/sales-only")
async def sales_route(user: User = Depends(require_sales)):
    return {"message": "Sales access granted"}
```

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
# Run all seeds (recommended)
podman exec -it domogo-calculator-backend python seeds/run_all_seeds.py

# Or run individual seeds
podman exec -it domogo-calculator-backend python seeds/seed_roles.py
podman exec -it domogo-calculator-backend python seeds/seed_users.py
podman exec -it domogo-calculator-backend python seeds/seed_battery_modes.py
podman exec -it domogo-calculator-backend python seeds/seed_master_data.py
podman exec -it domogo-calculator-backend python seeds/seed_products.py
podman exec -it domogo-calculator-backend python seeds/seed_customers.py
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

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (client-side token removal)
- `GET /api/auth/me` - Get current user info (requires auth)

### Users (`/api/users`) - Admin only
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get user details (admin or self)
- `PUT /api/users/{id}` - Update user (admin or self)
- `PUT /api/users/{id}/password` - Update password (self only)
- `PUT /api/users/{id}/roles` - Update user roles (admin only)
- `DELETE /api/users/{id}` - Archive user (admin only)

### Roles (`/api/roles`) - Admin only
- `GET /api/roles` - List all roles
- `GET /api/roles/{id}` - Get role details
- `POST /api/roles` - Create new role
- `PUT /api/roles/{id}` - Update role
- `DELETE /api/roles/{id}` - Archive role

### Customers (`/api/customers`)
- `GET /api/customers` - List all customers
- `GET /api/customers/{id}` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Archive customer

### Products (Planned)
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)

### Master Data (Planned)
- `GET /api/master-data/{year}` - Get master data for year
- `POST /api/master-data` - Create/update master data (admin)

### Calculations (Planned)
- `POST /api/calculations` - Create new calculation
- `GET /api/calculations/{id}` - Get calculation results
- `GET /api/calculations` - List user calculations

## Environment Variables

See `.env.example` for configuration options:

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `PYTHONUNBUFFERED` - Python output buffering

### Authentication (JWT)
- `JWT_SECRET_KEY` - Secret key for signing JWT tokens (required in production!)
- `JWT_ALGORITHM` - Signing algorithm (default: HS256)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - Access token lifetime in minutes (default: 30)
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS` - Refresh token lifetime in days (default: 7)

### Logging
- `ENVIRONMENT` - Environment mode: `development` (pretty logs) or `production` (JSON logs)

## Next Steps

1. ✅ Database schema with SQLAlchemy models
2. ✅ Alembic migration setup
3. 🔲 Seed scripts for initial data
4. 🔲 Calculation engine (port Excel formulas to Python)
5. 🔲 FastAPI endpoints for calculations
6. 🔲 Data import from Excel file
