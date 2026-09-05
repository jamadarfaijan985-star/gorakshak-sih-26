#!/bin/bash
# Quick start script for Windows/Linux/Mac
# Sets up and runs the Bovine Mastitis Backend

set -e  # Exit on error

echo "=========================================="
echo "Bovine Mastitis Backend - Quick Start"
echo "=========================================="
echo

# Check Python
echo "[1/5] Checking Python installation..."
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "  Python version: $python_version"

# Create venv
echo
echo "[2/5] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "  ✓ Virtual environment created"
else
    echo "  ✓ Virtual environment already exists"
fi

# Activate venv (bash/zsh)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
    echo "  ✓ Virtual environment activated (Windows)"
else
    source venv/bin/activate
    echo "  ✓ Virtual environment activated"
fi

# Install dependencies
echo
echo "[3/5] Installing dependencies..."
pip install --upgrade pip setuptools wheel -q
pip install -r requirements.txt -q
echo "  ✓ Dependencies installed"

# Setup .env
echo
echo "[4/5] Setting up configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  ✓ Created .env (edit with your database URL)"
    echo "  ℹ  Make sure PostgreSQL is running and .env DATABASE_URL is correct"
else
    echo "  ✓ .env already exists"
fi

# Import Farm 01
echo
echo "[5/5] Initializing database..."
python scripts/import_farm01.py
echo "  ✓ Database initialized with Farm 01 data"

echo
echo "=========================================="
echo "✓ Setup complete!"
echo ""
echo "To start the server:"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Then open:"
echo "  - Swagger: http://localhost:8000/docs"
echo "  - ReDoc:   http://localhost:8000/redoc"
echo ""
echo "To simulate sensor data:"
echo "  python scripts/simulate_sensor_feed.py"
echo "=========================================="
