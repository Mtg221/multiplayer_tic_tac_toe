# Deployment Guide

## Option 1: Deploy to Render (Recommended - Free & Easy)

### Backend (Render)

1. **Push your code to GitHub**
   ```bash
   cd /Users/guest777/Desktop/multi
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: tic-tac-toe-server
     - **Region**: Choose closest to you
     - **Branch**: main
     - **Root Directory**: `server`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

4. **Get your backend URL**
   - After deployment, copy the URL (e.g., `https://tic-tac-toe-server.onrender.com`)

### Frontend (Vercel - Free)

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Update socket connection** in `client/src/components/Game.jsx`:
   ```javascript
   // Change this line:
   socketRef.current = io('http://localhost:4000');
   
   // To:
   const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
   socketRef.current = io(BACKEND_URL);
   ```

3. **Create `.env` file** in client folder:
   ```
   VITE_BACKEND_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy to Vercel**
   ```bash
   cd client
   npm install -g vercel
   vercel login
   vercel --prod
   ```

---

## Option 2: Deploy to Railway (Alternative - Free Tier)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy Backend**
   ```bash
   cd server
   railway init
   railway up
   ```

3. **Deploy Frontend**
   ```bash
   cd ../client
   railway init
   railway up
   ```

---

## Option 3: Deploy to Heroku

### Backend

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Deploy**
   ```bash
   cd server
   heroku login
   heroku create tic-tac-toe-server
   git push heroku main
   ```

### Frontend

```bash
cd client
heroku create tic-tac-toe-client
heroku buildpacks:set heroku/nodejs
git push heroku main
```

---

## Option 4: Deploy to DigitalOcean App Platform

1. Create account at https://digitalocean.com
2. Go to Apps → Create App
3. Connect GitHub repository
4. Configure:
   - **Component Type**: Web Service
   - **Source**: GitHub repo
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npm start`

---

## Option 5: Deploy to VPS (Ubuntu Server)

### Install Node.js and PM2

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

### Deploy Backend

```bash
cd /var/www/tic-tac-toe/server
npm install
pm2 start index.js --name tic-tac-toe-server
pm2 save
pm2 startup
```

### Deploy Frontend

```bash
cd /var/www/tic-tac-toe/client
npm install
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/tic-tac-toe
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/tic-tac-toe/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tic-tac-toe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Quick Test Deployment (Local Network)

For testing on same network:

```bash
# In server directory
npm start

# In client directory  
npm run dev -- --host
```

Then access from other devices using your computer's IP:
- `http://YOUR_IP:5173`

---

## Environment Variables

Create `.env` file in client folder:

```env
# Development
VITE_BACKEND_URL=http://localhost:4000

# Production (update after deploying backend)
# VITE_BACKEND_URL=https://your-backend-url.com
```

Update `client/src/components/Game.jsx`:

```javascript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
socketRef.current = io(BACKEND_URL);
```

---

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend can connect to backend
- [ ] Socket.io connection works (check browser console)
- [ ] Two players can join same room
- [ ] Moves sync between players
- [ ] CORS is configured correctly

## Troubleshooting

### CORS Errors
Add to server `index.js`:
```javascript
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://your-frontend.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
  },
});
```

### Socket Connection Failed
- Check firewall settings
- Ensure port 4000 is open
- Verify backend URL in frontend

### Build Errors
```bash
# Clear cache and rebuild
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```
