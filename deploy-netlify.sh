#!/bin/bash

# Deploy PaidIn Frontend to Netlify
echo "🚀 Deploying PaidIn Frontend to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Build failed! Check the build output above."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=dist/public

echo "🎉 Frontend deployed to Netlify!"
echo "📝 Don't forget to set VITE_BACKEND_URL in Netlify environment variables" 