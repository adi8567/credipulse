# CreditPulse Quick Start Script for Windows PowerShell
# Usage: .\start.ps1 [backend|frontend|both]

param(
    [string]$Component = "both"
)

$ErrorActionPreference = "Stop"

function Start-Backend {
    Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
    Write-Host "📍 Backend running on: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location backend
    & npm run dev
    Pop-Location
}

function Start-Frontend {
    Write-Host "🚀 Starting Frontend Development Server..." -ForegroundColor Green
    Write-Host "📍 Frontend running on: http://localhost:5173" -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location frontend
    & npm run dev
    Pop-Location
}

# Main Script
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║    🎯 CreditPulse - Getting Started    ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

switch ($Component.ToLower()) {
    "backend" {
        Start-Backend
    }
    "frontend" {
        Start-Frontend
    }
    "both" {
        Write-Host "💡 Running both backend and frontend..." -ForegroundColor Cyan
        Write-Host "💡 For best experience, open two terminals:" -ForegroundColor Cyan
        Write-Host "   Terminal 1: npm run dev --prefix backend" -ForegroundColor Gray
        Write-Host "   Terminal 2: npm run dev --prefix frontend" -ForegroundColor Gray
        Write-Host ""
        Start-Backend
    }
    default {
        Write-Host "❌ Unknown component: $Component" -ForegroundColor Red
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\start.ps1 backend   - Start only backend" -ForegroundColor Gray
        Write-Host "  .\start.ps1 frontend  - Start only frontend" -ForegroundColor Gray
        Write-Host "  .\start.ps1 both      - Start both (backend & frontend)" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "ℹ️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
