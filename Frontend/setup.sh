#!/bin/bash

# Pharmacy Stock & Expiry Tracker - Setup Script

echo "🏥 Pharmacy Stock & Expiry Tracker Setup"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Start the JSON Server (backend):"
echo "   npm run server"
echo ""
echo "2. In a new terminal, start the React app:"
echo "   npm run dev"
echo ""
echo "3. Open your browser to http://localhost:3000"
echo ""
echo "Happy coding! 💊✨"
