from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Date, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    battery_mode_before_id = Column(Integer, ForeignKey("battery_modes.id"))
    battery_mode_after_id = Column(Integer, ForeignKey("battery_modes.id"))

    # Energy inputs
    annual_consumption_kwh = Column(Numeric(10, 2), nullable=False)
    annual_generation_kwh = Column(Numeric(10, 2), nullable=False)
    annual_feed_in_kwh = Column(Numeric(10, 2), nullable=False)

    # Solar panel info
    solar_panel_wp = Column(Integer)  # Total Wp of solar panels

    # Energy pricing
    contract_type = Column(String, nullable=False)  # "Vast", "Dynamisch"
    supply_rate_per_kwh = Column(Numeric(10, 5), nullable=False)  # Electricity supply rate
    feed_in_rate_per_kwh = Column(Numeric(10, 5))  # Feed-in compensation rate

    # Gas phase-out (optional)
    gas_phase_out_date = Column(Date)  # Date when switching from gas

    # Installation costs
    installation_cost = Column(Numeric(10, 2), nullable=False)
    additional_costs = Column(Numeric(10, 2), default=0)  # Installation, wiring, etc.

    # Financing (optional)
    financing_years = Column(Integer)
    financing_interest_rate = Column(Numeric(5, 4))  # e.g., 0.0350 for 3.5%

    # Calculation date
    start_date = Column(Date, nullable=False)  # Installation date
    calculation_years = Column(Integer, default=20)  # Projection period

    # VAT scenario
    vat_scenario = Column(String)  # "particulier", "zakelijk_geen_KOR", etc.

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)

    # Relationships
    customer = relationship("Customer", backref="calculations")
    product = relationship("Product")
    battery_mode_before = relationship("BatteryMode", foreign_keys=[battery_mode_before_id])
    battery_mode_after = relationship("BatteryMode", foreign_keys=[battery_mode_after_id])
    result = relationship("CalculationResult", back_populates="calculation", uselist=False)
    yearly_details = relationship("CalculationYearlyDetail", back_populates="calculation", order_by="CalculationYearlyDetail.year")

    def __repr__(self):
        return f"<Calculation(id={self.id}, customer_id={self.customer_id}, product_id={self.product_id})>"


class CalculationResult(Base):
    __tablename__ = "calculation_results"

    id = Column(Integer, primary_key=True, index=True)
    calculation_id = Column(Integer, ForeignKey("calculations.id"), unique=True, nullable=False)

    # Summary metrics
    total_investment = Column(Numeric(10, 2), nullable=False)  # Total initial cost
    vat_refund = Column(Numeric(10, 2))  # Total VAT refund
    net_investment = Column(Numeric(10, 2), nullable=False)  # After VAT refund

    # Savings
    total_savings_20_years = Column(Numeric(10, 2), nullable=False)
    average_annual_savings = Column(Numeric(10, 2))

    # ROI metrics
    payback_period_years = Column(Numeric(5, 2))  # Years to break even
    roi_percentage = Column(Numeric(10, 2))  # Return on investment %
    npv = Column(Numeric(10, 2))  # Net Present Value

    # Battery performance
    total_cycles_lifetime = Column(Integer)
    final_capacity_percentage = Column(Numeric(5, 4))  # Final capacity %

    # Calculation metadata
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    calculation = relationship("Calculation", back_populates="result")

    def __repr__(self):
        return f"<CalculationResult(id={self.id}, calculation_id={self.calculation_id}, roi={self.roi_percentage}%)>"


class CalculationYearlyDetail(Base):
    __tablename__ = "calculation_yearly_details"

    id = Column(Integer, primary_key=True, index=True)
    calculation_id = Column(Integer, ForeignKey("calculations.id"), nullable=False)

    # Year information
    year = Column(Integer, nullable=False)  # Sequential year (1, 2, 3, ...)
    calendar_year = Column(Integer, nullable=False)  # Actual calendar year

    # Battery state
    cycles_this_year = Column(Numeric(10, 2))
    cumulative_cycles = Column(Integer)
    capacity_percentage = Column(Numeric(5, 4))  # Remaining capacity %
    degradation_percentage = Column(Numeric(5, 4))  # Cumulative degradation %

    # Energy flows
    consumption_kwh = Column(Numeric(10, 2))
    generation_kwh = Column(Numeric(10, 2))
    feed_in_kwh = Column(Numeric(10, 2))
    grid_import_kwh = Column(Numeric(10, 2))

    # Costs and savings
    electricity_cost = Column(Numeric(10, 2))  # Cost without battery
    electricity_cost_with_battery = Column(Numeric(10, 2))  # Cost with battery
    annual_savings = Column(Numeric(10, 2))  # Savings this year
    cumulative_savings = Column(Numeric(10, 2))  # Total savings to date

    # Financing
    financing_payment = Column(Numeric(10, 2))  # Annual financing payment
    financing_interest = Column(Numeric(10, 2))  # Interest portion
    financing_principal = Column(Numeric(10, 2))  # Principal portion

    # VAT
    vat_refund_this_year = Column(Numeric(10, 2))

    # Inflation-adjusted values
    inflation_rate = Column(Numeric(5, 4))

    # Relationship
    calculation = relationship("Calculation", back_populates="yearly_details")

    def __repr__(self):
        return f"<CalculationYearlyDetail(id={self.id}, calculation_id={self.calculation_id}, year={self.year})>"
