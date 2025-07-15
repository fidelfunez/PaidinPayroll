#!/bin/bash

# PaidIn MVP Deployment Script
# This script helps deploy the MVP version without Bitcoin features

set -e

echo "🚀 Deploying PaidIn MVP..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration:"
    echo "   - DATABASE_URL (required)"
    echo "   - SESSION_SECRET (required)"
    echo "   - NODE_ENV=production"
    echo ""
    echo "Press Enter when you've configured .env..."
    read
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed! Check the build output above."
    exit 1
fi

echo "✅ Build successful!"

# Start the application
echo "🚀 Starting PaidIn MVP..."
echo "🌐 The app should be available at: http://localhost:5000"
echo ""
echo "📋 MVP Features Available:"
echo "   ✅ User Authentication"
echo "   ✅ Admin Dashboard"
echo "   ✅ Employee Management"
echo "   ✅ Payroll (USD only)"
echo "   ✅ Expense Reimbursements"
echo "   ✅ Messaging System"
echo "   ✅ Profile Management"
echo ""
echo "🎉 MVP is ready for demo!"

npm start 