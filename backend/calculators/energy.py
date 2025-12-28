"""
Energy flow and savings calculations.

Based on Excel Opbrengsten and Kosten sheets.
"""
from typing import Dict, Tuple


def calculate_energy_flows(
    annual_consumption_kwh: float,
    annual_generation_kwh: float,
    battery_capacity_kwh: float,
    roundtrip_efficiency: float,
    cycles_per_day: float,
    self_consumption_only: bool = False
) -> Dict[str, float]:
    """
    Calculate energy flows for a battery system.

    Args:
        annual_consumption_kwh: Annual household electricity consumption
        annual_generation_kwh: Annual solar panel generation
        battery_capacity_kwh: Battery capacity in kWh
        roundtrip_efficiency: Battery roundtrip efficiency (0-1)
        cycles_per_day: Number of charge/discharge cycles per day
        self_consumption_only: If True, battery only for self-consumption

    Returns:
        Dictionary with energy flow calculations
    """
    # Daily averages
    daily_consumption = annual_consumption_kwh / 365
    daily_generation = annual_generation_kwh / 365

    # Excess generation (potential feed-in without battery)
    excess_generation = max(0, annual_generation_kwh - annual_consumption_kwh)

    # Battery throughput per year (accounting for efficiency)
    annual_battery_throughput = battery_capacity_kwh * cycles_per_day * 365 * roundtrip_efficiency

    # Self-consumption increase from battery
    # Battery stores excess solar during day, uses at night
    if self_consumption_only:
        # Conservative: battery only stores solar excess for own use
        self_consumption_increase = min(
            annual_battery_throughput,
            excess_generation,
            annual_consumption_kwh * 0.3  # Max ~30% of consumption can shift
        )
    else:
        # Optimal: battery can also do grid arbitrage
        self_consumption_increase = min(
            annual_battery_throughput,
            annual_consumption_kwh * 0.4  # Max ~40% with arbitrage
        )

    # Feed-in reduction (less solar sent to grid)
    feed_in_reduction = min(self_consumption_increase, excess_generation)

    # Grid import reduction (less electricity bought from grid)
    grid_import_reduction = self_consumption_increase

    return {
        'annual_consumption_kwh': round(annual_consumption_kwh, 2),
        'annual_generation_kwh': round(annual_generation_kwh, 2),
        'excess_generation_kwh': round(excess_generation, 2),
        'self_consumption_increase_kwh': round(self_consumption_increase, 2),
        'feed_in_reduction_kwh': round(feed_in_reduction, 2),
        'grid_import_reduction_kwh': round(grid_import_reduction, 2),
        'annual_battery_throughput_kwh': round(annual_battery_throughput, 2),
    }


def calculate_annual_savings(
    energy_flows: Dict[str, float],
    supply_rate_per_kwh: float,
    feed_in_rate_per_kwh: float,
    energy_tax_per_kwh: float,
    saldering_percentage: float
) -> Dict[str, float]:
    """
    Calculate annual energy cost savings from battery.

    Args:
        energy_flows: Output from calculate_energy_flows()
        supply_rate_per_kwh: Electricity supply rate (€/kWh)
        feed_in_rate_per_kwh: Feed-in compensation rate (€/kWh)
        energy_tax_per_kwh: Energy tax per kWh
        saldering_percentage: Net metering percentage (1.0 = 100%, 0.0 = 0%)

    Returns:
        Dictionary with savings calculations
    """
    grid_import_reduction = energy_flows['grid_import_reduction_kwh']
    feed_in_reduction = energy_flows['feed_in_reduction_kwh']

    # Savings from reduced grid import
    # User buys less electricity at supply rate + tax
    grid_import_savings = grid_import_reduction * (supply_rate_per_kwh + energy_tax_per_kwh)

    # Impact of reduced feed-in depends on saldering
    if saldering_percentage > 0:
        # With saldering: feed-in has value (offset against consumption)
        # Reducing feed-in means losing this offset value
        feed_in_value_loss = feed_in_reduction * supply_rate_per_kwh * saldering_percentage
    else:
        # No saldering: feed-in only gets low feed-in rate
        # Reducing feed-in means losing feed-in compensation
        feed_in_value_loss = feed_in_reduction * feed_in_rate_per_kwh

    # Net savings
    net_annual_savings = grid_import_savings - feed_in_value_loss

    return {
        'grid_import_savings': round(grid_import_savings, 2),
        'feed_in_value_loss': round(feed_in_value_loss, 2),
        'net_annual_savings': round(net_annual_savings, 2),
        'supply_rate_used': supply_rate_per_kwh,
        'saldering_percentage': saldering_percentage
    }


def calculate_payback_period(
    net_investment: float,
    annual_savings_list: list
) -> float:
    """
    Calculate payback period in years.

    Args:
        net_investment: Initial investment after VAT refund
        annual_savings_list: List of annual savings amounts

    Returns:
        Payback period in years (fractional)
    """
    cumulative_savings = 0
    for year, savings in enumerate(annual_savings_list, start=1):
        cumulative_savings += savings
        if cumulative_savings >= net_investment:
            # Interpolate for fractional year
            excess = cumulative_savings - net_investment
            fraction = excess / savings if savings > 0 else 0
            return year - fraction

    # If never paid back, return total years
    return len(annual_savings_list)


def calculate_roi(
    net_investment: float,
    total_savings: float
) -> float:
    """
    Calculate Return on Investment percentage.

    Args:
        net_investment: Initial investment after VAT refund
        total_savings: Total savings over lifetime

    Returns:
        ROI as percentage
    """
    if net_investment == 0:
        return 0

    return ((total_savings - net_investment) / net_investment) * 100


if __name__ == "__main__":
    # Test energy calculations
    print("Testing energy flow calculations...")
    print("=" * 80)

    # Example: 3500 kWh consumption, 4000 kWh solar generation, 10kWh battery
    flows = calculate_energy_flows(
        annual_consumption_kwh=3500,
        annual_generation_kwh=4000,
        battery_capacity_kwh=10.0,
        roundtrip_efficiency=0.95,
        cycles_per_day=1.0,
        self_consumption_only=False
    )

    print("\nEnergy Flows:")
    for key, value in flows.items():
        print(f"  {key}: {value}")

    # Calculate savings
    savings = calculate_annual_savings(
        energy_flows=flows,
        supply_rate_per_kwh=0.30,
        feed_in_rate_per_kwh=0.10,
        energy_tax_per_kwh=0.12,
        saldering_percentage=1.0
    )

    print("\nAnnual Savings:")
    for key, value in savings.items():
        print(f"  {key}: {value}")
