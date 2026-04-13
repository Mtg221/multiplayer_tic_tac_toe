#!/bin/bash

echo "🚀 Tic-Tac-Toe Multiplayer Deployment Script"
echo "============================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

echo ""
echo "📦 Step 1: Push to GitHub"
echo "-------------------------------------------"
read -p "Enter your GitHub repository URL: " REPO_URL

git remote add origin "$REPO_URL" 2>/dev/null || echo "Remote already exists"
git push -u origin main

echo ""
echo "🌐 Step 2: Deploy Backend to Render"
echo "-------------------------------------------"
echo "1. Go to: https://render.com"
echo "2. Sign in with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Select your repository"
echo "5. Configure:"
echo "   - Root Directory: server"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""
read -p "Press Enter after deploying backend..."

echo ""
echo "🎨 Step 3: Deploy Frontend to Vercel"
echo "-------------------------------------------"
echo "Installing Vercel CLI..."
npm install -g vercel

cd client
echo "Updating environment variables..."
echo "VITE_BACKEND_URL=https://YOUR-BACKEND-URL.onrender.com" > .env.production

echo ""
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update the backend URL in client/.env.production"
echo "2. Test the game with two browser windows"
echo "3. Share the Vercel URL with friends!"
