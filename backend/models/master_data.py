from sqlalchemy import Column, Integer, Numeric, UniqueConstraint
from database import Base


class MasterDataYearly(Base):
    __tablename__ = "master_data_yearly"
    __table_args__ = (
        UniqueConstraint('year', name='uq_master_data_year'),
    )

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, unique=True, index=True)

    # VAT and Tax
    vat_rate_batteries = Column(Numeric(5, 4), nullable=False)  # e.g., 0.2100 for 21%
    max_vat_refund = Column(Numeric(10, 2), nullable=False)  # Maximum VAT refund (euros)
    vat_refund_per_kwh = Column(Numeric(10, 2), nullable=False)  # VAT refund deduction per kWh
    vat_refund_per_1000wp = Column(Numeric(10, 2), nullable=False)  # VAT refund per 1000Wp solar

    # Energy prices (all including VAT)
    energy_tax_incl_vat = Column(Numeric(10, 5), nullable=False)  # Energy tax per kWh

    # Saldering (net metering)
    saldering_percentage = Column(Numeric(5, 4), nullable=False)  # e.g., 1.0000 for 100%, 0.0000 for 0%

    # Inflation
    inflation_rate = Column(Numeric(5, 4), nullable=False)  # e.g., 0.0320 for 3.2%

    # Dynamic pricing (optional, for future use)
    avg_dynamic_price_per_kwh = Column(Numeric(10, 5))  # Average dynamic electricity price

    def __repr__(self):
        return f"<MasterDataYearly(year={self.year}, vat_rate={self.vat_rate_batteries}, inflation={self.inflation_rate})>"
