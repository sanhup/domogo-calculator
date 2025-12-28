"""
Main Battery ROI Calculator.

Orchestrates all calculation modules to produce complete ROI analysis.
"""
from typing import Dict, List
from datetime import date, datetime
from dateutil.relativedelta import relativedelta

from .degradation import calculate_degradation_curve
from .vat import calculate_vat_refund
from .energy import (
    calculate_energy_flows,
    calculate_annual_savings,
    calculate_payback_period,
    calculate_roi
)


class BatteryROICalculator:
    """
    Main calculator for battery ROI analysis.

    Combines degradation, VAT, energy, and financial calculations.
    """

    def __init__(
        self,
        # Product specs
        battery_capacity_kwh: float,
        roundtrip_efficiency: float,
        guaranteed_cycles: int,
        guaranteed_capacity: float,

        # Energy usage
        annual_consumption_kwh: float,
        annual_generation_kwh: float,

        # Battery mode
        cycles_per_day_before: float,

        # Pricing
        supply_rate_per_kwh: float,
        feed_in_rate_per_kwh: float,
        installation_cost: float,

        # Optional parameters with defaults
        cycles_per_day_after: float = None,
        mode_switch_year: int = None,
        additional_costs: float = 0,
        vat_scenario: str = "particulier",
        master_data_by_year: Dict[int, Dict] = None,
        start_date: date = None,
        calculation_years: int = 20
    ):
        """
        Initialize calculator with all parameters.

        Args:
            battery_capacity_kwh: Battery capacity in kWh
            roundtrip_efficiency: Efficiency (e.g., 0.95 for 95%)
            guaranteed_cycles: Guaranteed cycles from manufacturer
            guaranteed_capacity: Remaining capacity after guarantee (e.g., 0.80)
            annual_consumption_kwh: Annual household consumption
            annual_generation_kwh: Annual solar generation
            cycles_per_day_before: Initial cycles per day
            cycles_per_day_after: Cycles per day after mode switch (optional)
            mode_switch_year: Year to switch battery mode (optional)
            supply_rate_per_kwh: Electricity supply rate (€/kWh)
            feed_in_rate_per_kwh: Feed-in compensation (€/kWh)
            installation_cost: Total installation cost excl. VAT
            additional_costs: Additional costs (installation, wiring, etc.)
            vat_scenario: VAT refund scenario
            master_data_by_year: Master data indexed by year
            start_date: Installation start date
            calculation_years: Number of years to project
        """
        self.battery_capacity_kwh = battery_capacity_kwh
        self.roundtrip_efficiency = roundtrip_efficiency
        self.guaranteed_cycles = guaranteed_cycles
        self.guaranteed_capacity = guaranteed_capacity

        self.annual_consumption_kwh = annual_consumption_kwh
        self.annual_generation_kwh = annual_generation_kwh

        self.cycles_per_day_before = cycles_per_day_before
        self.cycles_per_day_after = cycles_per_day_after or cycles_per_day_before
        self.mode_switch_year = mode_switch_year

        self.supply_rate_per_kwh = supply_rate_per_kwh
        self.feed_in_rate_per_kwh = feed_in_rate_per_kwh
        self.installation_cost = installation_cost
        self.additional_costs = additional_costs

        self.vat_scenario = vat_scenario
        self.master_data_by_year = master_data_by_year or {}

        self.start_date = start_date or date.today()
        self.calculation_years = calculation_years

    def calculate(self) -> Dict:
        """
        Run complete ROI calculation.

        Returns:
            Dictionary with summary results and yearly details
        """
        # Calculate total investment
        total_investment = self.installation_cost + self.additional_costs

        # Get first year master data for VAT calculation
        start_year = self.start_date.year
        first_year_data = self.master_data_by_year.get(start_year, {})

        # Calculate VAT refund
        vat_result = calculate_vat_refund(
            installation_cost=total_investment,
            battery_capacity_kwh=self.battery_capacity_kwh,
            vat_rate=first_year_data.get('vat_rate_batteries', 0.21),
            max_vat_refund=first_year_data.get('max_vat_refund', 2494),
            vat_refund_per_kwh=first_year_data.get('vat_refund_per_kwh', 15),
            scenario=self.vat_scenario
        )

        vat_refund = vat_result['actual_refund']
        net_investment = total_investment - vat_refund

        # Calculate degradation curve for both modes
        degradation_before = calculate_degradation_curve(
            cycles_per_day=self.cycles_per_day_before,
            guaranteed_cycles=self.guaranteed_cycles,
            guaranteed_capacity=self.guaranteed_capacity,
            roundtrip_efficiency=self.roundtrip_efficiency,
            lifetime_years=self.calculation_years
        )

        if self.mode_switch_year:
            degradation_after = calculate_degradation_curve(
                cycles_per_day=self.cycles_per_day_after,
                guaranteed_cycles=self.guaranteed_cycles,
                guaranteed_capacity=self.guaranteed_capacity,
                roundtrip_efficiency=self.roundtrip_efficiency,
                lifetime_years=self.calculation_years
            )
        else:
            degradation_after = None

        # Calculate yearly details
        yearly_details = []
        cumulative_savings = 0

        for year in range(1, self.calculation_years + 1):
            calendar_year = start_year + year - 1
            year_data = self.master_data_by_year.get(calendar_year, first_year_data)

            # Get degradation for this year
            if self.mode_switch_year and year >= self.mode_switch_year:
                deg_data = degradation_after[year - 1]
                cycles_per_day = self.cycles_per_day_after
            else:
                deg_data = degradation_before[year - 1]
                cycles_per_day = self.cycles_per_day_before

            # Calculate energy flows
            energy_flows = calculate_energy_flows(
                annual_consumption_kwh=self.annual_consumption_kwh,
                annual_generation_kwh=self.annual_generation_kwh,
                battery_capacity_kwh=self.battery_capacity_kwh * deg_data['capacity_percentage'],
                roundtrip_efficiency=self.roundtrip_efficiency,
                cycles_per_day=cycles_per_day,
                self_consumption_only=False
            )

            # Calculate savings
            savings = calculate_annual_savings(
                energy_flows=energy_flows,
                supply_rate_per_kwh=self.supply_rate_per_kwh,
                feed_in_rate_per_kwh=self.feed_in_rate_per_kwh,
                energy_tax_per_kwh=year_data.get('energy_tax_incl_vat', 0.12),
                saldering_percentage=year_data.get('saldering_percentage', 0)
            )

            annual_savings = savings['net_annual_savings']
            cumulative_savings += annual_savings

            yearly_details.append({
                'year': year,
                'calendar_year': calendar_year,
                'cycles_per_day': cycles_per_day,
                'cycles_this_year': deg_data['cycles_this_year'],
                'cumulative_cycles': deg_data['cumulative_cycles'],
                'capacity_percentage': deg_data['capacity_percentage'],
                'degradation_percentage': deg_data['cumulative_degradation'],
                'annual_savings': round(annual_savings, 2),
                'cumulative_savings': round(cumulative_savings, 2),
                'saldering_percentage': year_data.get('saldering_percentage', 0),
                'inflation_rate': year_data.get('inflation_rate', 0)
            })

        # Calculate summary metrics
        total_savings = cumulative_savings
        payback_years = calculate_payback_period(
            net_investment,
            [y['annual_savings'] for y in yearly_details]
        )
        roi_percentage = calculate_roi(net_investment, total_savings)

        # Final battery metrics
        final_year = yearly_details[-1]
        total_cycles = final_year['cumulative_cycles']
        final_capacity = final_year['capacity_percentage']

        return {
            'summary': {
                'total_investment': round(total_investment, 2),
                'vat_refund': round(vat_refund, 2),
                'net_investment': round(net_investment, 2),
                'total_savings_20_years': round(total_savings, 2),
                'average_annual_savings': round(total_savings / self.calculation_years, 2),
                'payback_period_years': round(payback_years, 2),
                'roi_percentage': round(roi_percentage, 2),
                'total_cycles_lifetime': total_cycles,
                'final_capacity_percentage': round(final_capacity, 4),
            },
            'yearly_details': yearly_details,
            'vat_details': vat_result
        }


if __name__ == "__main__":
    # Test the complete calculator
    print("Testing Battery ROI Calculator...")
    print("=" * 80)

    # Example master data for 2025-2030
    master_data = {}
    for year in range(2025, 2046):
        saldering = max(0, 1.0 - ((year - 2025) / 6))  # Phase out over 6 years
        master_data[year] = {
            'vat_rate_batteries': 0.21,
            'max_vat_refund': 2494,
            'vat_refund_per_kwh': 15,
            'energy_tax_incl_vat': 0.12,
            'saldering_percentage': saldering,
            'inflation_rate': 0.03
        }

    calculator = BatteryROICalculator(
        battery_capacity_kwh=10.0,
        roundtrip_efficiency=0.95,
        guaranteed_cycles=6000,
        guaranteed_capacity=0.80,
        annual_consumption_kwh=3500,
        annual_generation_kwh=4000,
        cycles_per_day_before=1.0,
        supply_rate_per_kwh=0.30,
        feed_in_rate_per_kwh=0.10,
        installation_cost=10000,
        additional_costs=500,
        vat_scenario="particulier",
        master_data_by_year=master_data,
        start_date=date(2025, 1, 1),
        calculation_years=20
    )

    result = calculator.calculate()

    print("\nSummary Results:")
    print(f"  Total Investment: €{result['summary']['total_investment']}")
    print(f"  VAT Refund: €{result['summary']['vat_refund']}")
    print(f"  Net Investment: €{result['summary']['net_investment']}")
    print(f"  Total Savings (20 years): €{result['summary']['total_savings_20_years']}")
    print(f"  Payback Period: {result['summary']['payback_period_years']} years")
    print(f"  ROI: {result['summary']['roi_percentage']}%")
    print(f"  Total Cycles: {result['summary']['total_cycles_lifetime']}")
    print(f"  Final Capacity: {result['summary']['final_capacity_percentage']*100}%")

    print("\nFirst 5 Years:")
    print(f"{'Year':<6} {'Savings':<12} {'Cum. Savings':<15} {'Capacity %':<12}")
    print("-" * 60)
    for y in result['yearly_details'][:5]:
        print(f"{y['year']:<6} €{y['annual_savings']:<11.2f} €{y['cumulative_savings']:<14.2f} {y['capacity_percentage']*100:<11.2f}%")
