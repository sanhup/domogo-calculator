"""
Seed customers for development and testing.

This script creates sample customer data with realistic Dutch names,
addresses, and contact information.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.customer import Customer
from database import SessionLocal


SAMPLE_CUSTOMERS = [
    {
        "full_name": "Jan de Vries",
        "street_address": "Hoofdstraat 123",
        "postal_code": "1234AB",
        "city": "Amsterdam",
        "email": "jan.devries@example.nl",
        "phone": "06-12345678",
        "archived": False
    },
    {
        "full_name": "Maria Jansen",
        "street_address": "Kerkstraat 45",
        "postal_code": "3011BD",
        "city": "Rotterdam",
        "email": "maria.jansen@example.nl",
        "phone": "06-23456789",
        "archived": False
    },
    {
        "full_name": "Pieter van den Berg",
        "street_address": "Oudegracht 78",
        "postal_code": "3511AW",
        "city": "Utrecht",
        "email": "p.vandenberg@example.nl",
        "phone": "06-34567890",
        "archived": False
    },
    {
        "full_name": "Sophie Bakker",
        "street_address": "Lange Voorhout 12",
        "postal_code": "2514ED",
        "city": "Den Haag",
        "email": "sophie.bakker@example.nl",
        "phone": "06-45678901",
        "archived": False
    },
    {
        "full_name": "Thomas Mulder",
        "street_address": "Stationsweg 56",
        "postal_code": "6711PB",
        "city": "Ede",
        "email": "t.mulder@example.nl",
        "phone": "06-56789012",
        "archived": False
    },
    {
        "full_name": "Emma Visser",
        "street_address": "Marktplein 8",
        "postal_code": "8011LW",
        "city": "Zwolle",
        "email": "emma.visser@example.nl",
        "phone": "06-67890123",
        "archived": False
    },
    {
        "full_name": "Luuk Hendriks",
        "street_address": "Wilhelminastraat 34",
        "postal_code": "5611HE",
        "city": "Eindhoven",
        "email": "luuk.hendriks@example.nl",
        "phone": "06-78901234",
        "archived": False
    },
    {
        "full_name": "Lisa de Jong",
        "street_address": "Herestraat 90",
        "postal_code": "9711LM",
        "city": "Groningen",
        "email": "lisa.dejong@example.nl",
        "phone": "06-89012345",
        "archived": False
    },
    {
        "full_name": "Daan Peters",
        "street_address": "Korte Nieuwstraat 5",
        "postal_code": "6511PP",
        "city": "Nijmegen",
        "email": "daan.peters@example.nl",
        "phone": "06-90123456",
        "archived": False
    },
    {
        "full_name": "Fleur van Dijk",
        "street_address": "Langestraat 67",
        "postal_code": "4611BM",
        "city": "Bergen op Zoom",
        "email": "fleur.vandijk@example.nl",
        "phone": "06-01234567",
        "archived": False
    },
    # Archived customer for testing
    {
        "full_name": "Oud Klant B.V.",
        "street_address": "Industrieweg 123",
        "postal_code": "1234XY",
        "city": "Amsterdam",
        "email": "info@oudklant.nl",
        "phone": "020-1234567",
        "archived": True
    }
]


def create_customers(db):
    """
    Create sample customers in the database.

    Args:
        db: SQLAlchemy database session

    Returns:
        int: Number of customers created
    """
    print("Creating sample customers...")

    # Clear existing customers (consistent with other seed scripts)
    existing_count = db.query(Customer).count()
    if existing_count > 0:
        print(f"  Clearing {existing_count} existing customer(s)...")
        db.query(Customer).delete()
        db.commit()

    # Create customers
    created_count = 0
    for customer_data in SAMPLE_CUSTOMERS:
        customer = Customer(**customer_data)
        db.add(customer)
        created_count += 1
        status = "ARCHIVED" if customer_data["archived"] else "ACTIVE"
        print(f"  + {customer_data['full_name']} ({customer_data['city']}) [{status}]")

    db.commit()
    print(f"\n✓ Created {created_count} customers")
    print(f"  - Active: {created_count - 1}")
    print(f"  - Archived: 1")

    return created_count


def main():
    """Run customer seeding standalone"""
    print("=" * 80)
    print("CUSTOMER SEED SCRIPT")
    print("=" * 80)

    db = SessionLocal()
    try:
        customer_count = create_customers(db)
        print("\n" + "=" * 80)
        print(f"SUCCESS: Created {customer_count} customers")
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
