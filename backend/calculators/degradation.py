"""
Battery degradation calculations.

Based on Excel Degradatie sheet - uses financial annuity method (RATE function)
to create a front-loaded degradation curve.
"""
from decimal import Decimal
from typing import List, Tuple
import numpy as np


def calculate_degradation_rate(
    total_cycles: int,
    guaranteed_cycles: int,
    guaranteed_capacity: float,
    lifetime_years: int = 20
) -> float:
    """
    Calculate the degradation rate using financial annuity method.

    This replicates Excel's RATE function to create a front-loaded degradation curve.

    Args:
        total_cycles: Total cycles over lifetime
        guaranteed_cycles: Guaranteed cycles from manufacturer
        guaranteed_capacity: Remaining capacity after guarantee (e.g., 0.80 for 80%)
        lifetime_years: Expected lifetime in years

    Returns:
        Annual degradation rate (as percentage, e.g., 2.5 for 2.5%)
    """
    # Calculate total degradation percentage
    degradation_pct = ((total_cycles / guaranteed_cycles) * (1 - guaranteed_capacity)) * 100

    # Use numpy's rate function (equivalent to Excel's RATE)
    # RATE(nper, pmt, pv, fv)
    # We want: degradation_pct paid over lifetime_years, starting from degradation_pct, ending at 0
    try:
        rate = np.rate(
            nper=lifetime_years,
            pmt=-degradation_pct / 10,  # Payment per period
            pv=degradation_pct,  # Present value
            fv=0  # Future value
        )
        return float(rate)
    except:
        # Fallback to simple linear degradation
        return degradation_pct / lifetime_years / 100


def calculate_degradation_curve(
    cycles_per_day: float,
    guaranteed_cycles: int,
    guaranteed_capacity: float,
    roundtrip_efficiency: float,
    lifetime_years: int = 20,
    year_fraction_first: float = 1.0
) -> List[dict]:
    """
    Calculate battery degradation curve over lifetime.

    Args:
        cycles_per_day: Number of charge/discharge cycles per day
        guaranteed_cycles: Guaranteed cycles from manufacturer
        guaranteed_capacity: Remaining capacity after guarantee (e.g., 0.80)
        roundtrip_efficiency: Battery roundtrip efficiency (e.g., 0.95)
        lifetime_years: Projection period in years
        year_fraction_first: Fraction of first year (for partial year installations)

    Returns:
        List of yearly degradation data
    """
    # Calculate total cycles over lifetime
    total_cycles = cycles_per_day * 365 * lifetime_years

    # Get degradation rate
    deg_rate = calculate_degradation_rate(
        total_cycles, guaranteed_cycles, guaranteed_capacity, lifetime_years
    )

    degradation_data = []
    cumulative_degradation = 0
    cumulative_cycles = 0

    for year in range(1, lifetime_years + 1):
        # Cycles this year
        year_frac = year_fraction_first if year == 1 else 1.0
        cycles_this_year = cycles_per_day * 365 * year_frac
        cumulative_cycles += cycles_this_year

        # Degradation this year (front-loaded using annuity rate)
        if year == 1:
            annual_degradation = deg_rate * year_frac
        else:
            # Compound degradation
            annual_degradation = deg_rate * (1 - cumulative_degradation)

        cumulative_degradation += annual_degradation

        # Capacity remaining (average for the year)
        capacity_pct = (1 + (1 - cumulative_degradation)) / 2

        degradation_data.append({
            'year': year,
            'cycles_per_day': cycles_per_day,
            'cycles_this_year': round(cycles_this_year, 2),
            'cumulative_cycles': int(cumulative_cycles),
            'annual_degradation': round(annual_degradation, 6),
            'cumulative_degradation': round(cumulative_degradation, 6),
            'capacity_percentage': round(capacity_pct, 6),
            'roundtrip_efficiency': roundtrip_efficiency
        })

    return degradation_data


def calculate_yearly_capacity(
    year: int,
    cycles_per_day: float,
    guaranteed_cycles: int,
    guaranteed_capacity: float,
    lifetime_years: int = 20
) -> Tuple[float, int]:
    """
    Calculate battery capacity and cumulative cycles for a specific year.

    Args:
        year: Year number (1-based)
        cycles_per_day: Cycles per day
        guaranteed_cycles: Guaranteed cycles from manufacturer
        guaranteed_capacity: Remaining capacity after guarantee
        lifetime_years: Total lifetime in years

    Returns:
        Tuple of (capacity_percentage, cumulative_cycles)
    """
    degradation_curve = calculate_degradation_curve(
        cycles_per_day=cycles_per_day,
        guaranteed_cycles=guaranteed_cycles,
        guaranteed_capacity=guaranteed_capacity,
        roundtrip_efficiency=0.95,  # Not used for this calculation
        lifetime_years=lifetime_years
    )

    if year > len(degradation_curve):
        return 0.0, 0

    year_data = degradation_curve[year - 1]
    return year_data['capacity_percentage'], year_data['cumulative_cycles']


if __name__ == "__main__":
    # Test the degradation calculation
    print("Testing battery degradation calculation...")
    print("=" * 80)

    # Example: 1 cycle/day, 6000 guaranteed cycles, 80% capacity retention
    curve = calculate_degradation_curve(
        cycles_per_day=1.0,
        guaranteed_cycles=6000,
        guaranteed_capacity=0.80,
        roundtrip_efficiency=0.95,
        lifetime_years=20
    )

    print(f"{'Year':<6} {'Cycles':<10} {'Cum.Cycles':<12} {'Degradation':<12} {'Capacity %':<12}")
    print("-" * 80)
    for data in curve[:10]:  # Show first 10 years
        print(f"{data['year']:<6} "
              f"{data['cycles_this_year']:<10.1f} "
              f"{data['cumulative_cycles']:<12} "
              f"{data['cumulative_degradation']*100:<12.2f} "
              f"{data['capacity_percentage']*100:<12.2f}")
