"""
Seed script to import master data from Excel file.
Reads from the 'Stamgegevens' sheet and populates master_data_yearly table.
"""
import sys
import os
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import openpyxl
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import MasterDataYearly

EXCEL_FILE = "/app/data/calculator.xlsx"


def import_master_data(db: Session, wb: openpyxl.Workbook):
    """Import master data from Stamgegevens sheet"""

    ws = wb['Stamgegevens']

    print("Importing master data from Stamgegevens sheet...")

    # Clear existing data
    db.query(MasterDataYearly).delete()
    db.commit()

    # Column mapping (1-indexed as in Excel)
    # A: Year (starting from row 8)
    # C: BTW-% batterijen (VAT rate)
    # D: maximale BTW teruggave (max VAT refund)
    # E: af te dragen BTW per kWh (VAT refund per kWh)
    # F: af te dragen BTW per 1000 Wp (VAT refund per 1000Wp)
    # H: jaarlijkse inflatie (annual inflation)
    # J: energie belasting incl BTW (energy tax incl VAT)

    # Saldering percentage - need to find this (might be in another sheet or calculated)
    # For now, we'll use a default progression

    count = 0
    for row in range(8, 38):  # Rows 8-37 contain years 2025-2053
        year_cell = ws.cell(row=row, column=1)  # Column A

        if not year_cell.value:
            continue

        year = int(year_cell.value)

        # Read values from columns
        vat_rate = ws.cell(row=row, column=3).value or 0  # Column C
        max_vat_refund = ws.cell(row=row, column=4).value or 0  # Column D
        vat_per_kwh = ws.cell(row=row, column=5).value or 0  # Column E
        vat_per_1000wp = ws.cell(row=row, column=6).value or 0  # Column F
        inflation = ws.cell(row=row, column=8).value or 0  # Column H
        energy_tax = ws.cell(row=row, column=10).value or 0  # Column J

        # Calculate saldering percentage (net metering phase-out)
        # 100% in 2025, decreasing to 0% by 2031
        if year <= 2025:
            saldering = 1.0
        elif year >= 2031:
            saldering = 0.0
        else:
            # Linear decrease from 2025 to 2031
            saldering = 1.0 - ((year - 2025) / (2031 - 2025))

        master_data = MasterDataYearly(
            year=year,
            vat_rate_batteries=Decimal(str(vat_rate)),
            max_vat_refund=Decimal(str(max_vat_refund)),
            vat_refund_per_kwh=Decimal(str(vat_per_kwh)),
            vat_refund_per_1000wp=Decimal(str(vat_per_1000wp)),
            energy_tax_incl_vat=Decimal(str(energy_tax)),
            saldering_percentage=Decimal(str(saldering)),
            inflation_rate=Decimal(str(inflation))
        )

        db.add(master_data)
        count += 1

    db.commit()
    print(f"✓ Imported {count} years of master data (2025-2053)")

    return count


def main():
    """Main function to run the seed script"""
    print("=" * 80)
    print("MASTER DATA SEED SCRIPT")
    print("=" * 80)

    if not os.path.exists(EXCEL_FILE):
        print(f"ERROR: Excel file not found at {EXCEL_FILE}")
        sys.exit(1)

    print(f"\nReading Excel file: {EXCEL_FILE}")
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)

    db = SessionLocal()
    try:
        count = import_master_data(db, wb)
        print(f"\n{'=' * 80}")
        print(f"SUCCESS: Imported {count} records")
        print(f"{'=' * 80}")
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
