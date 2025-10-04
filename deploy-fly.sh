#!/bin/bash

# Deploy PaidIn Backend to Fly.io
echo "🚀 Deploying PaidIn Backend to Fly.io..."

# Check if Fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "📦 Installing Fly CLI..."
    curl -L https://fly.io/install.sh | sh
fi

# Check if logged in to Fly
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Please log in to Fly.io..."
    fly auth login
fi

# Create app if it doesn't exist
if ! fly apps list | grep -q "paidin-backend"; then
    echo "📱 Creating Fly.io app..."
    fly apps create paidin-backend
fi

# Set secrets
echo "🔐 Setting environment secrets..."
fly secrets set DATABASE_URL="$DATABASE_URL"
fly secrets set SESSION_SECRET="$SESSION_SECRET"
fly secrets set NODE_ENV="production"

# Deploy
echo "🚀 Deploying to Fly.io..."
fly deploy

echo "🎉 Backend deployed to Fly.io!"
echo "🌐 Your backend URL: https://paidin-app.fly.dev"
echo "📝 Update VITE_BACKEND_URL in Netlify with this URL" 