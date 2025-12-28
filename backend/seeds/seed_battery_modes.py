"""
Seed script to create battery operating modes.
Creates predefined battery modes based on the calculator logic.
"""
import sys
import os
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import BatteryMode


def create_battery_modes(db: Session):
    """Create predefined battery operating modes"""

    print("Creating battery operating modes...")

    # Clear existing data
    db.query(BatteryMode).delete()
    db.commit()

    # Define battery modes based on Excel calculator logic
    modes = [
        {
            "mode_name": "alleen_zelfconsumptie",
            "display_name": "Alleen Zelfconsumptie",
            "description": "Battery only for self-consumption, no grid feed-in optimization",
            "cycles_per_day": Decimal("1.00"),
            "self_consumption_only": True,
            "dynamic_pricing": False,
            "sort_order": 1
        },
        {
            "mode_name": "optimaal_1_cyclus",
            "display_name": "Optimaal (1 cyclus per dag)",
            "description": "Optimal usage with 1 full cycle per day, includes grid arbitrage",
            "cycles_per_day": Decimal("1.00"),
            "self_consumption_only": False,
            "dynamic_pricing": False,
            "sort_order": 2
        },
        {
            "mode_name": "optimaal_1_5_cyclus",
            "display_name": "Optimaal (1.5 cyclus per dag)",
            "description": "Intensive usage with 1.5 cycles per day for dynamic pricing",
            "cycles_per_day": Decimal("1.50"),
            "self_consumption_only": False,
            "dynamic_pricing": True,
            "sort_order": 3
        },
        {
            "mode_name": "dynamisch_1_cyclus",
            "display_name": "Dynamisch (1 cyclus per dag)",
            "description": "Dynamic pricing optimization with 1 cycle per day",
            "cycles_per_day": Decimal("1.00"),
            "self_consumption_only": False,
            "dynamic_pricing": True,
            "sort_order": 4
        },
        {
            "mode_name": "dynamisch_1_5_cyclus",
            "display_name": "Dynamisch (1.5 cyclus per dag)",
            "description": "Aggressive dynamic pricing optimization with 1.5 cycles per day",
            "cycles_per_day": Decimal("1.50"),
            "self_consumption_only": False,
            "dynamic_pricing": True,
            "sort_order": 5
        }
    ]

    count = 0
    for mode_data in modes:
        mode = BatteryMode(**mode_data)
        db.add(mode)
        count += 1

    db.commit()
    print(f"✓ Created {count} battery operating modes")

    return count


def main():
    """Main function to run the seed script"""
    print("=" * 80)
    print("BATTERY MODES SEED SCRIPT")
    print("=" * 80)

    db = SessionLocal()
    try:
        count = create_battery_modes(db)
        print(f"\n{'=' * 80}")
        print(f"SUCCESS: Created {count} battery modes")
        print(f"{'=' * 80}")

        # Show created modes
        print("\nBattery modes:")
        modes = db.query(BatteryMode).order_by(BatteryMode.sort_order).all()
        for m in modes:
            print(f"  {m.sort_order}. {m.display_name} ({m.cycles_per_day} cycles/day)")

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
