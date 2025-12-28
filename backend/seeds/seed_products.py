"""
Seed script to import products from Excel file.
Reads from the 'Producten' sheet and populates products table.
"""
import sys
import os
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import openpyxl
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Product

EXCEL_FILE = "/app/data/calculator.xlsx"


def import_products(db: Session, wb: openpyxl.Workbook):
    """Import products from Producten sheet"""

    ws = wb['Producten']

    print("Importing products from Producten sheet...")

    # Clear existing data
    db.query(Product).delete()
    db.commit()

    # Column mapping (based on analysis):
    # A-G: Numbers (1-7 for categorization)
    # H: Product name (full display name)
    # I: Merk (Brand)
    # J: Model
    # K: Capaciteit per module (Capacity per module kWh)
    # L: Aantal modules (Number of modules)
    # M: Totale capaciteit (Total capacity kWh)
    # N: (Additional capacity info)
    # O: Roundtrip Efficiency
    # P: Gegarandeerde cycli (Guaranteed cycles)
    # Q: Restcapaciteit na garantie (Remaining capacity after guarantee)
    # U: Prijs excl. BTW (Price excl. VAT)
    # V: (calculated)
    # W-Z: (other price related)
    # AB: Prijs per kWh (Price per kWh)

    count = 0
    product_counter = {}  # Track duplicates
    for row in range(8, 60):  # Start from row 8 (header at row 7)
        # Check if this is a valid product row
        product_name_cell = ws.cell(row=row, column=8)  # Column H

        if not product_name_cell.value or product_name_cell.value == "Product":
            continue

        # Read phase from column A (1 = 1-fase, others might be 3-fase)
        phase_num = ws.cell(row=row, column=1).value
        phase = "1 fase" if phase_num == 1 else "3 fase"

        # Read product details
        product_name = str(product_name_cell.value).strip()
        brand = ws.cell(row=row, column=9).value or ""  # Column I
        model = ws.cell(row=row, column=10).value or ""  # Column J

        # Capacity
        capacity_per_module = ws.cell(row=row, column=11).value or 0  # Column K
        modules_count = ws.cell(row=row, column=12).value or 1  # Column L
        total_capacity = ws.cell(row=row, column=13).value or 0  # Column M

        # Performance specs
        roundtrip_eff = ws.cell(row=row, column=15).value
        try:
            if roundtrip_eff is None or roundtrip_eff == '' or roundtrip_eff == 0:
                roundtrip_eff = 0.95
            else:
                roundtrip_eff = float(roundtrip_eff)
        except (ValueError, TypeError):
            roundtrip_eff = 0.95

        guaranteed_cycles = ws.cell(row=row, column=16).value
        try:
            if guaranteed_cycles is None or guaranteed_cycles == '' or guaranteed_cycles == 0:
                guaranteed_cycles = 6000
            else:
                guaranteed_cycles = int(float(guaranteed_cycles))
        except (ValueError, TypeError):
            guaranteed_cycles = 6000

        capacity_retention = ws.cell(row=row, column=17).value
        # Handle various edge cases for capacity retention
        try:
            if capacity_retention is None or capacity_retention == '' or capacity_retention == 0:
                capacity_retention = 0.80
            else:
                # Try to convert to float first, then check if it's valid
                capacity_retention = float(capacity_retention)
                if capacity_retention <= 0 or capacity_retention > 1:
                    capacity_retention = 0.80
        except (ValueError, TypeError):
            capacity_retention = 0.80

        # Pricing
        price_excl_vat = ws.cell(row=row, column=21).value
        if not price_excl_vat or price_excl_vat == 0:
            price_excl_vat = 0

        price_per_kwh = ws.cell(row=row, column=28).value
        if not price_per_kwh or price_per_kwh == 0:
            price_per_kwh = None

        # Calculate price incl VAT (assuming 21% VAT)
        price_incl_vat = float(price_excl_vat) * 1.21 if price_excl_vat else 0

        # Generate unique product code (including capacity and phase to ensure uniqueness)
        brand_clean = brand.replace(' ', '_').replace('-', '_').upper()
        model_clean = model.replace(' ', '_').replace(',', '_').replace('.', '_').upper()
        capacity_str = str(total_capacity).replace('.', '_')
        base_code = f"{brand_clean}_{model_clean}_{capacity_str}KWH"

        # Handle duplicates by adding a counter
        if base_code in product_counter:
            product_counter[base_code] += 1
            product_code = f"{base_code}_{product_counter[base_code]}"
        else:
            product_counter[base_code] = 0
            product_code = base_code

        # Skip if essential data is missing
        if not brand or not model or total_capacity == 0:
            continue

        product = Product(
            product_code=product_code,
            phase=phase,
            brand=str(brand).strip(),
            model=str(model).strip(),
            product_name=product_name,
            capacity_kwh=Decimal(str(total_capacity)),
            capacity_per_module_kwh=Decimal(str(capacity_per_module)) if capacity_per_module else None,
            modules_count=int(modules_count) if modules_count else 1,
            roundtrip_efficiency=Decimal(str(roundtrip_eff)),
            guaranteed_cycles=int(guaranteed_cycles) if guaranteed_cycles else 6000,
            guaranteed_capacity_retention=Decimal(str(capacity_retention)),
            price_excl_vat=Decimal(str(price_excl_vat)),
            price_incl_vat=Decimal(str(price_incl_vat)),
            price_per_kwh=Decimal(str(price_per_kwh)) if price_per_kwh else None,
            is_active=True,
            warranty_years=10  # Default warranty
        )

        db.add(product)
        count += 1

    db.commit()
    print(f"✓ Imported {count} products")

    return count


def main():
    """Main function to run the seed script"""
    print("=" * 80)
    print("PRODUCTS SEED SCRIPT")
    print("=" * 80)

    if not os.path.exists(EXCEL_FILE):
        print(f"ERROR: Excel file not found at {EXCEL_FILE}")
        sys.exit(1)

    print(f"\nReading Excel file: {EXCEL_FILE}")
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)

    db = SessionLocal()
    try:
        count = import_products(db, wb)
        print(f"\n{'=' * 80}")
        print(f"SUCCESS: Imported {count} products")
        print(f"{'=' * 80}")

        # Show sample of imported products
        print("\nSample products:")
        products = db.query(Product).limit(5).all()
        for p in products:
            print(f"  - {p.brand} {p.model} ({p.capacity_kwh}kWh) - €{p.price_excl_vat}")

    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
