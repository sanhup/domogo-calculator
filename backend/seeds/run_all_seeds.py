"""
Run all seed scripts in order.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from seed_battery_modes import create_battery_modes
from seed_master_data import import_master_data
from seed_products import import_products
from database import SessionLocal
import openpyxl

EXCEL_FILE = "/app/data/calculator.xlsx"


def main():
    """Run all seed scripts"""
    print("=" * 80)
    print("RUNNING ALL SEED SCRIPTS")
    print("=" * 80)

    if not os.path.exists(EXCEL_FILE):
        print(f"ERROR: Excel file not found at {EXCEL_FILE}")
        sys.exit(1)

    print(f"\nReading Excel file: {EXCEL_FILE}")
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)

    db = SessionLocal()
    try:
        print("\n" + "=" * 80)
        print("1. BATTERY MODES")
        print("=" * 80)
        mode_count = create_battery_modes(db)

        print("\n" + "=" * 80)
        print("2. MASTER DATA")
        print("=" * 80)
        master_count = import_master_data(db, wb)

        print("\n" + "=" * 80)
        print("3. PRODUCTS")
        print("=" * 80)
        product_count = import_products(db, wb)

        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"✓ Battery modes: {mode_count}")
        print(f"✓ Master data years: {master_count}")
        print(f"✓ Products: {product_count}")
        print("\n" + "=" * 80)
        print("SUCCESS: All data imported!")
        print("=" * 80)

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
