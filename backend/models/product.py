from sqlalchemy import Column, Integer, String, Numeric, Boolean
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Product identification
    product_code = Column(String, unique=True, index=True, nullable=False)
    phase = Column(String, nullable=False)  # "1 fase" or "3 fase"
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    product_name = Column(String, nullable=False)  # Full display name

    # Battery specifications
    capacity_kwh = Column(Numeric(10, 2), nullable=False)  # Usable capacity in kWh
    capacity_per_module_kwh = Column(Numeric(10, 2))  # kWh per module
    modules_count = Column(Integer, default=1)  # Number of modules

    # Performance specs
    roundtrip_efficiency = Column(Numeric(5, 4), nullable=False)  # e.g., 0.9500 for 95%
    guaranteed_cycles = Column(Integer, nullable=False)  # e.g., 6000
    guaranteed_capacity_retention = Column(Numeric(5, 4), nullable=False)  # e.g., 0.8000 for 80%
    max_charge_power_kw = Column(Numeric(10, 2))  # Max charge power in kW
    max_discharge_power_kw = Column(Numeric(10, 2))  # Max discharge power in kW

    # Pricing
    price_excl_vat = Column(Numeric(10, 2), nullable=False)  # Price excluding VAT
    price_incl_vat = Column(Numeric(10, 2), nullable=False)  # Price including VAT
    price_per_kwh = Column(Numeric(10, 2))  # Price per kWh (calculated)

    # Additional info
    warranty_years = Column(Integer)  # Warranty period in years
    is_active = Column(Boolean, default=True)  # Is product available for selection
    notes = Column(String)  # Additional notes

    def __repr__(self):
        return f"<Product(id={self.id}, brand='{self.brand}', model='{self.model}', capacity={self.capacity_kwh}kWh)>"
