"""
VAT refund calculations for Dutch battery installations.

Based on Excel BTW sheet - handles complex Dutch VAT scenarios.
"""
from decimal import Decimal
from typing import Dict, List


def calculate_vat_refund(
    installation_cost: float,
    battery_capacity_kwh: float,
    vat_rate: float,
    max_vat_refund: float,
    vat_refund_per_kwh: float,
    scenario: str = "particulier"
) -> Dict[str, float]:
    """
    Calculate VAT refund for battery installation.

    Dutch VAT system has complex rules with maximum refunds and per-kWh deductions.

    Args:
        installation_cost: Total installation cost (excl. VAT)
        battery_capacity_kwh: Battery capacity in kWh
        vat_rate: VAT rate (e.g., 0.21 for 21%)
        max_vat_refund: Maximum VAT refund (from master data)
        vat_refund_per_kwh: Deduction per kWh capacity (from master data)
        scenario: "particulier", "zakelijk_geen_KOR", "zakelijk_met_KOR", "particulier_alles"

    Returns:
        Dictionary with VAT calculation details
    """
    # Calculate total VAT paid
    total_vat = installation_cost * vat_rate

    # Calculate deduction based on capacity
    capacity_deduction = vat_refund_per_kwh * battery_capacity_kwh

    # Calculate maximum refund for this scenario
    if scenario == "particulier":
        # Standard residential: max refund minus capacity deduction
        max_refund_applicable = max(0, max_vat_refund - capacity_deduction)
    elif scenario == "particulier_alles":
        # Residential all: full VAT minus capacity deduction
        max_refund_applicable = max(0, total_vat - capacity_deduction)
    elif scenario == "zakelijk_geen_KOR":
        # Business without KOR: similar to residential
        max_refund_applicable = max(0, max_vat_refund - capacity_deduction)
    elif scenario == "zakelijk_met_KOR":
        # Business with KOR: full VAT refund possible
        max_refund_applicable = total_vat
    else:
        max_refund_applicable = 0

    # Actual refund is the minimum of what was paid and what can be refunded
    actual_refund = min(total_vat, max_refund_applicable)

    return {
        'total_vat_paid': round(total_vat, 2),
        'capacity_deduction': round(capacity_deduction, 2),
        'max_refund_applicable': round(max_refund_applicable, 2),
        'actual_refund': round(actual_refund, 2),
        'net_vat_cost': round(total_vat - actual_refund, 2),
        'scenario': scenario
    }


def calculate_multi_year_vat_refund(
    installation_cost: float,
    battery_capacity_kwh: float,
    vat_rate: float,
    max_vat_refund: float,
    vat_refund_per_kwh: float,
    scenario: str,
    refund_years: int = 1
) -> List[Dict[str, float]]:
    """
    Calculate VAT refund spread over multiple years.

    Some scenarios allow for VAT refund to be spread over multiple years.

    Args:
        installation_cost: Total installation cost (excl. VAT)
        battery_capacity_kwh: Battery capacity in kWh
        vat_rate: VAT rate
        max_vat_refund: Maximum VAT refund per year
        vat_refund_per_kwh: Deduction per kWh
        scenario: VAT scenario
        refund_years: Number of years to spread refund over

    Returns:
        List of yearly VAT refund amounts
    """
    # First calculate total refund
    total_refund_calc = calculate_vat_refund(
        installation_cost, battery_capacity_kwh, vat_rate,
        max_vat_refund, vat_refund_per_kwh, scenario
    )

    total_refund = total_refund_calc['actual_refund']

    # Spread over years
    yearly_refunds = []
    remaining_refund = total_refund

    for year in range(1, refund_years + 1):
        if year < refund_years:
            # Equal distribution for non-final years
            year_refund = round(total_refund / refund_years, 2)
        else:
            # Final year gets remainder
            year_refund = remaining_refund

        yearly_refunds.append({
            'year': year,
            'refund_amount': year_refund,
            'scenario': scenario
        })

        remaining_refund -= year_refund

    return yearly_refunds


if __name__ == "__main__":
    # Test VAT calculations
    print("Testing VAT refund calculations...")
    print("=" * 80)

    # Example: 10kWh battery, €10,000 installation
    scenarios = ["particulier", "zakelijk_geen_KOR", "particulier_alles"]

    for scenario in scenarios:
        result = calculate_vat_refund(
            installation_cost=10000,
            battery_capacity_kwh=10.0,
            vat_rate=0.21,
            max_vat_refund=2494,
            vat_refund_per_kwh=15,
            scenario=scenario
        )

        print(f"\nScenario: {scenario}")
        print(f"  Total VAT paid: €{result['total_vat_paid']}")
        print(f"  Capacity deduction: €{result['capacity_deduction']}")
        print(f"  Max refund: €{result['max_refund_applicable']}")
        print(f"  Actual refund: €{result['actual_refund']}")
        print(f"  Net VAT cost: €{result['net_vat_cost']}")
