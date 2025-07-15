#!/bin/bash

# PaidIn App Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 Starting PaidIn deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure your environment variables."
    exit 1
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

# Start the application
echo "🚀 Starting application..."
npm start 