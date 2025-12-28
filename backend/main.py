from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, engine
import models

# Create FastAPI app
app = FastAPI(
    title="Domogo Calculator API",
    description="Battery ROI Calculator API",
    version="1.0.0"
)

# Configure CORS
# Allow frontend development server and production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Vite dev server
        "http://127.0.0.1:3000",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
def read_root():
    return {
        "message": "Domogo Calculator API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint - verifies database connection"""
    try:
        # Try to execute a simple query
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    """Get all products"""
    products = db.query(models.Product).filter(models.Product.is_active == True).all()
    return {"products": products, "count": len(products)}


@app.get("/api/master-data/{year}")
def get_master_data(year: int, db: Session = Depends(get_db)):
    """Get master data for a specific year"""
    master_data = db.query(models.MasterDataYearly).filter(
        models.MasterDataYearly.year == year
    ).first()
    if not master_data:
        return {"error": f"No master data found for year {year}"}
    return master_data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
