#!/bin/bash

# PaidIn App Development Setup Script
# This script helps set up the development environment

set -e

echo "🔧 Setting up PaidIn development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18+ is required!"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing!"
    echo "   Required variables:"
    echo "   - DATABASE_URL"
    echo "   - SESSION_SECRET"
    echo "   - LNBITS_BASE_URL (optional for Bitcoin features)"
    echo "   - LNBITS_API_KEY (optional for Bitcoin features)"
    echo "   - LNBITS_ADMIN_KEY (optional for Bitcoin features)"
    echo ""
    echo "Press Enter when you've configured .env..."
    read
fi

# Check if PostgreSQL is running (basic check)
echo "🗄️ Checking database connection..."
if ! npm run db:push &> /dev/null; then
    echo "⚠️  Warning: Database connection failed!"
    echo "   Please ensure PostgreSQL is running and DATABASE_URL is correct in .env"
    echo "   You can start PostgreSQL with: brew services start postgresql (macOS)"
    echo "   Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres"
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
echo "🌐 The app will be available at: http://localhost:5000"
echo ""
echo "📚 For more information, see README.md" 