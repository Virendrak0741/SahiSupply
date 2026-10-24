#!/usr/bin/env python3
"""
SahiSupply AI — Command Line Intelligence & Solver Interface
"""
import sys
import json
import argparse
from pathlib import Path
from optimizer import solve_distribution_optimization

DATA_FILE = Path(__file__).parent.parent / "backend" / "data" / "sahisupply_db.json"

def load_data():
    if not DATA_FILE.exists():
        print(f"Error: Database file not found at {DATA_FILE}. Run the backend first to generate data.")
        sys.exit(1)
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def main():
    parser = argparse.ArgumentParser(description="SahiSupply AI — Distribution Optimization CLI")
    parser.add_argument("--optimize", action="store_true", help="Run full distribution optimization solver")
    parser.add_argument("--horizon", type=int, default=7, help="Planning horizon in days (default: 7)")
    parser.add_argument("--category", type=str, default="", help="Filter by category")
    parser.add_argument("--summary", action="store_true", help="Print summary of network inventory")

    args = parser.parse_args()
    db = load_data()

    if args.summary:
        print("\n=======================================================")
        print("📊 SahiSupply AI — Distribution Network Summary")
        print("=======================================================")
        print(f"Total Products:     {len(db['products'])}")
        print(f"Warehouses:         {len(db['warehouses'])}")
        print(f"Destinations:       {len(db['destinations'])}")
        print(f"Inventory Batches:  {len(db['inventoryBatches'])}")
        print(f"Active Shipments:   {len(db['shipments'])}")
        print("=======================================================\n")
        return

    if args.optimize:
        print("\n🚀 Executing SahiSupply AI Multi-Objective Optimization Solver...")
        categories = [args.category] if args.category else []
        res = solve_distribution_optimization(
            products=db['products'],
            warehouses=db['warehouses'],
            destinations=db['destinations'],
            batches=db['inventoryBatches'],
            routes=db['routes'],
            demand_history=db['demandHistory'],
            horizon_days=args.horizon,
            selected_categories=categories
        )
        print("\nOptimization Complete!")
        print(f"Status:             {res['status']}")
        print(f"Allocated Units:    {res['metrics']['total_units_allocated']:,}")
        print(f"Total Demand:       {res['metrics']['total_demand_requested']:,}")
        print(f"Fulfillment Rate:   {res['metrics']['fulfillment_rate_percent']}%")
        print(f"Unmet Demand:       {res['metrics']['unmet_demand_units']:,}")
        print(f"Est. Freight Cost:  ₹{res['metrics']['total_transportation_cost_inr']:,}")
        print(f"Recommendations:    {res['metrics']['recommendation_count']}")
        print("\nTop 5 Recommendations:")
        for r in res['recommendations'][:5]:
            cold = " [COLD-CHAIN 2-8°C]" if r['is_cold_chain'] else ""
            pharma = " [PHARMA GDP]" if r['is_pharma'] else ""
            print(f" - {r['product_name']}: {r['quantity']} units from {r['source_warehouse']} -> {r['destination']} (₹{r['total_cost_inr']:,}){cold}{pharma}")
        print("\n")

if __name__ == "__main__":
    main()
