# Quick Deployment Code Changes Guide

## What You Need to Fix

Your frontend calls `http://localhost:3001` but that won't work when deployed. Here's what to change:

---

## Step 1: Create API Config File

Create `src/config/api.ts`:

```typescript
export const API_BASE_URL =
  process.env.VITE_API_URL || `http://localhost:${process.env.VITE_BACKEND_PORT || 3001}`;
```

---

## Step 2: Update Environment Variables

Add to your `.env` file:

```bash
# For local development
VITE_API_URL=http://localhost:3001

# For production (use your server IP/domain)
# VITE_API_URL=http://YOUR_SERVER_IP:3001
```

---

## Step 3: Replace localhost in All Frontend Files

In these files, replace `http://localhost:${backendPort}` with `${API_BASE_URL}`:

- `src/machines/authMachine.ts`
- `src/machines/usersMachine.ts`
- `src/machines/publicTransactionsMachine.ts`
- `src/machines/personalTransactionsMachine.ts`
- `src/machines/contactsTransactionsMachine.ts`
- `src/machines/transactionDetailMachine.ts`
- `src/machines/createTransactionMachine.ts`
- `src/machines/notificationsMachine.ts`
- `src/machines/bankAccountsMachine.ts`

Example change in `authMachine.ts`:

```typescript
// OLD
const resp = await httpClient.post(`http://localhost:${backendPort}/users`, payload);

// NEW
import { API_BASE_URL } from "../config/api";
const resp = await httpClient.post(`${API_BASE_URL}/users`, payload);
```

---

## Step 4: Update Backend CORS

In `backend/app.ts`, add your production domain to the CORS origins:

```typescript
const corsOption = {
  origin: [
    `http://localhost:${frontendPort}`,
    "https://trimetric-noncartelized-sherman.ngrok-free.dev",
    "http://YOUR_SERVER_IP", // Add your server IP/domain
    "http://YOUR_DOMAIN.com", // If you have a domain
  ],
  credentials: true,
};
```

---

## Step 5: Build for Production

```bash
# Set production environment
export VITE_API_URL=http://YOUR_SERVER_IP:3001

# Build frontend
yarn build

# Build output will be in /build folder
```

---

## Step 6: Deploy to Server

### Option A: Simple Node.js Server

1. Copy entire project to Ubuntu server
2. Install dependencies: `yarn install`
3. Start backend: `yarn start:api`
4. Serve frontend build folder with Nginx or a simple static server

### Option B: Docker (Recommended)

1. Create Dockerfile for frontend (serves build folder)
2. Create Dockerfile for backend
3. Use Docker Compose to run both
4. Use Nginx as reverse proxy

---

## Quick Checklist

- [ ] Created `src/config/api.ts` with API_BASE_URL
- [ ] Updated `.env` with VITE_API_URL
- [ ] Replaced all `http://localhost:${backendPort}` with `${API_BASE_URL}`
- [ ] Added server IP to backend CORS origins
- [ ] Built frontend with production API URL
- [ ] Copied files to server
- [ ] Started backend server
- [ ] Configured reverse proxy (Nginx)

---

## Common Issues

**CORS errors?**
→ Your backend CORS origin doesn't match your frontend URL. Add the exact URL to `corsOption.origin`.

**API calls still going to localhost?**
→ Check browser DevTools Network tab. Make sure you rebuilt the frontend after changing `.env`.

**Backend not reachable?**
→ Check firewall rules. Port 3001 needs to be open.

**Frontend shows blank page?**
→ Check if backend is running and accessible.

---

## Step 7: Automated CI/CD with GitHub Actions

### What is GitHub Actions?

It's GitHub's built-in automation tool. When you push code to your repository, it automatically runs scripts to test/build/deploy your app.

### Deployment Options Explained

**Option A: SSH Deployment (Easier for Beginners)**

- GitHub Actions SSH into your server
- Pulls latest code from GitHub
- Runs `yarn install` and `yarn build`
- Restarts the backend
- **Pros**: Simple, no Docker needed
- **Cons**: Requires Node.js on server, manual dependency management

**Option B: Docker Deployment (More Professional)**

- GitHub Actions builds Docker images
- Pushes images to your server
- Server runs containers
- **Pros**: Consistent environment, easy rollbacks, isolated
- **Cons**: Need to learn Docker, more complex setup

**Recommendation**: Start with SSH (Option A), move to Docker later

### GitHub Actions Setup (SSH Method)

#### 7.1 Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [main] # Deploys when you push to main branch

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Ubuntu Server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd ~/realworld-app
            git pull origin main
            yarn install
            export VITE_API_URL=http://${{ secrets.SERVER_HOST }}:3001
            yarn build
            # Restart backend (assuming you're using PM2 or similar)
            pkill -f "node backend/app" || true
            nohup yarn start:api > backend.log 2>&1 &
```

#### 7.2 Add GitHub Secrets

Go to GitHub → Your Repo → Settings → Secrets and variables → Actions → New repository secret:

1. **SERVER_HOST**: Your Ubuntu server's public IP (e.g., `192.168.1.100`)
2. **SERVER_USER**: Your Ubuntu username (e.g., `ubuntu`)
3. **SERVER_SSH_KEY**: Your private SSH key content
   - Get it from your local machine: `cat ~/.ssh/id_rsa`
   - Paste the ENTIRE content including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

#### 7.3 Prepare Your Server

SSH into your server and setup the project:

```bash
# Clone your repository
ssh ubuntu@YOUR_SERVER_IP
cd ~
git clone https://github.com/YOUR_USERNAME/realworld-app.git

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn

# Install PM2 (process manager to keep backend running)
sudo npm install -g pm2

# Initial setup
cd realworld-app
yarn install
yarn build

# Start backend with PM2
pm2 start "yarn start:api" --name backend

# Save PM2 config
pm2 save
pm2 startup
```

#### 7.4 How It Works

Now when you:

1. Make code changes locally
2. Push to GitHub: `git push origin main`
3. GitHub Actions automatically:
   - SSH into your server
   - Pulls latest code
   - Installs dependencies
   - Builds frontend
   - Restarts backend
4. Your website updates automatically!

#### 7.5 Deployment Workflow

```bash
# Local development
git add .
git commit -m "Your changes"
git push origin main

# That's it! GitHub Actions handles the rest
```

### Alternative: Deploy Specific Branch

If you want to deploy only when pushing to a `production` branch:

1. Change workflow file:

```yaml
on:
  push:
    branches: [production] # Only deploy on production branch
```

2. Deployment workflow:

```bash
# Work on main branch
git checkout main
# Make changes
git add .
git commit -m "Changes"
git push origin main

# When ready to deploy
git checkout production
git merge main
git push origin production  # This triggers deployment
```

---

## Summary: From Local to Live

1. **Fix API URLs** (Steps 1-4 above)
2. **Setup Server** (Install Node.js, PM2, clone repo)
3. **Create GitHub Actions workflow** (.github/workflows/deploy.yml)
4. **Add GitHub Secrets** (Server IP, user, SSH key)
5. **Push code** → Auto-deploys!

Now every time you push to GitHub, your server updates automatically!
