from sqlalchemy import Column, Integer, String, Numeric, Boolean
from database import Base


class BatteryMode(Base):
    __tablename__ = "battery_modes"

    id = Column(Integer, primary_key=True, index=True)

    # Mode identification
    mode_name = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=False)
    description = Column(String)

    # Mode configuration
    cycles_per_day = Column(Numeric(5, 2), nullable=False)  # e.g., 1.00, 0.50
    self_consumption_only = Column(Boolean, default=False)  # True if no grid feed-in
    dynamic_pricing = Column(Boolean, default=False)  # True if using dynamic pricing

    # Metadata
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    def __repr__(self):
        return f"<BatteryMode(id={self.id}, name='{self.mode_name}', cycles={self.cycles_per_day})>"
