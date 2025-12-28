"""
Test script for the calculation engine.
"""
from datetime import date
from calculators.roi_calculator import BatteryROICalculator

# Example master data for 2025-2045
master_data = {}
for year in range(2025, 2046):
    # Saldering phases out linearly from 100% (2025) to 0% (2031)
    saldering = max(0, 1.0 - ((year - 2025) / 6))
    master_data[year] = {
        'vat_rate_batteries': 0.21,
        'max_vat_refund': 2494,
        'vat_refund_per_kwh': 15,
        'energy_tax_incl_vat': 0.12,
        'saldering_percentage': saldering,
        'inflation_rate': 0.03
    }

print("=" * 80)
print("BATTERY ROI CALCULATOR TEST")
print("=" * 80)

# Create calculator with realistic parameters
calculator = BatteryROICalculator(
    # Product specs (e.g., 10kWh battery with 95% efficiency)
    battery_capacity_kwh=10.0,
    roundtrip_efficiency=0.95,
    guaranteed_cycles=6000,
    guaranteed_capacity=0.80,

    # Energy usage (typical household with solar)
    annual_consumption_kwh=3500,
    annual_generation_kwh=4000,

    # Battery mode (1 cycle per day)
    cycles_per_day_before=1.0,

    # Pricing
    supply_rate_per_kwh=0.30,    # €0.30/kWh electricity cost
    feed_in_rate_per_kwh=0.10,   # €0.10/kWh feed-in compensation
    installation_cost=10000,      # €10,000 battery system

    # Optional parameters
    additional_costs=500,          # €500 installation costs
    vat_scenario="particulier",    # Residential VAT scenario
    master_data_by_year=master_data,
    start_date=date(2025, 1, 1),
    calculation_years=20
)

# Run calculation
print("\nRunning calculation...")
result = calculator.calculate()

# Print results
print("\n" + "=" * 80)
print("SUMMARY RESULTS")
print("=" * 80)

summary = result['summary']
print(f"\n💰 Investment:")
print(f"  Total Investment:        €{summary['total_investment']:>10,.2f}")
print(f"  VAT Refund:            - €{summary['vat_refund']:>10,.2f}")
print(f"  Net Investment:          €{summary['net_investment']:>10,.2f}")

print(f"\n📈 Returns:")
print(f"  Total Savings (20y):     €{summary['total_savings_20_years']:>10,.2f}")
print(f"  Average Annual Savings:  €{summary['average_annual_savings']:>10,.2f}")
print(f"  Payback Period:          {summary['payback_period_years']:>10.1f} years")
print(f"  ROI:                     {summary['roi_percentage']:>10.1f}%")

print(f"\n🔋 Battery Performance:")
print(f"  Total Cycles (20y):      {summary['total_cycles_lifetime']:>10,}")
print(f"  Final Capacity:          {summary['final_capacity_percentage']*100:>10.1f}%")

print("\n" + "=" * 80)
print("YEARLY BREAKDOWN (First 10 Years)")
print("=" * 80)

print(f"\n{'Year':<6} {'Cal.Year':<10} {'Cycles':<10} {'Capacity':<12} {'Savings':<12} {'Cum.Savings':<15}")
print("-" * 80)

for y in result['yearly_details'][:10]:
    print(f"{y['year']:<6} "
          f"{y['calendar_year']:<10} "
          f"{y['cycles_this_year']:<10.0f} "
          f"{y['capacity_percentage']*100:<12.1f} "
          f"€{y['annual_savings']:<11.2f} "
          f"€{y['cumulative_savings']:<14.2f}")

print("\n" + "=" * 80)
print("VAT CALCULATION DETAILS")
print("=" * 80)

vat = result['vat_details']
print(f"  Total VAT Paid:          €{vat['total_vat_paid']:>10,.2f}")
print(f"  Capacity Deduction:    - €{vat['capacity_deduction']:>10,.2f}")
print(f"  Max Refund Applicable:   €{vat['max_refund_applicable']:>10,.2f}")
print(f"  Actual Refund:           €{vat['actual_refund']:>10,.2f}")
print(f"  Scenario:                {vat['scenario']}")

print("\n" + "=" * 80)
print("✅ CALCULATION ENGINE TEST PASSED")
print("=" * 80)
