# Simple Deployment Guide (Beginner Version)

## Goal

Get your app running on the internet so others can see it. We'll use ngrok to expose your laptop to the web.

---

## Step 1: Fix Your Code

Your frontend currently calls `localhost:3001`. We need to make it use your ngrok URL instead.

**1.1 Create one config file:**

Create `src/config/api.ts`:

```typescript
export const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:3001";
```

**1.2 Replace all localhost URLs in these files:**

- `src/machines/authMachine.ts`
- `src/machines/usersMachine.ts`
- `src/machines/publicTransactionsMachine.ts`
- `src/machines/personalTransactionsMachine.ts`
- `src/machines/contactsTransactionsMachine.ts`
- `src/machines/transactionDetailMachine.ts`
- `src/machines/createTransactionMachine.ts`
- `src/machines/notificationsMachine.ts`
- `src/machines/bankAccountsMachine.ts`

**Change from:**

```typescript
const resp = await httpClient.post(`http://localhost:${backendPort}/users`, payload);
```

**To:**

```typescript
import { API_BASE_URL } from "../config/api";
const resp = await httpClient.post(`${API_BASE_URL}/users`, payload);
```

---

## Step 2: Update Backend CORS

In `backend/app.ts`, add your **frontend's** ngrok URL to CORS:

```typescript
const corsOption = {
  origin: [
    `http://localhost:${frontendPort}`,
    "https://FRONTEND_NGROK_URL.ngrok-free.app", // ADD YOUR FRONTEND URL
  ],
  credentials: true,
};
```

**Note:** You'll update this URL each time you restart ngrok (free version changes URLs).

---

## Step 3: Build Frontend

```bash
# Set the API URL to your BACKEND ngrok URL
export VITE_API_URL=https://BACKEND_NGROK_URL.ngrok-free.app

# Build
yarn build
```

---

## Step 4: Start Everything

Open 4 terminal windows:

**Terminal 1 - Backend:**

```bash
yarn start:api
```

**Terminal 2 - Backend ngrok:**

```bash
# Start backend tunnel (gets BACKEND_URL)
ngrok http 3001
```

**Terminal 3 - Frontend ngrok:**

```bash
# Start frontend tunnel (gets FRONTEND_URL)
ngrok http 3000
```

**Terminal 4 - Serve frontend:**

```bash
cd build
python3 -m http.server 3000
```

---

## Step 5: Access Your Site

You'll have **two** ngrok URLs:

- **Backend URL** (port 3001): `https://abc123.ngrok-free.app` - for API calls
- **Frontend URL** (port 3000): `https://xyz789.ngrok-free.app` - for users to visit

**Share the Frontend URL** with others!

**Setup checklist:**

1. Add Frontend URL to `backend/app.ts` CORS
2. Rebuild frontend with Backend URL as VITE_API_URL
3. Restart backend
4. Visit Frontend URL in browser

---

## Step 6: When ngrok Restarts (URL Changes)

Free ngrok URLs change every time you restart. When this happens:

1. Get your new **Frontend URL** from ngrok (port 3000)
2. Update `backend/app.ts` CORS with new Frontend URL
3. Get your new **Backend URL** from ngrok (port 3001)
4. Rebuild: `VITE_API_URL=https://NEW_BACKEND_URL.ngrok-free.app yarn build`
5. Restart backend: `yarn start:api`
6. Visit new Frontend URL

---

## Quick Checklist

- [ ] Created `src/config/api.ts`
- [ ] Replaced localhost URLs in 9 machine files
- [ ] Added **Frontend** ngrok URL to backend CORS
- [ ] Built frontend with **Backend** ngrok URL
- [ ] Started backend
- [ ] Started both ngrok tunnels (ports 3000 and 3001)
- [ ] Site loads in browser

---

## Common Issues

**"CORS error" in browser console?**
→ Your backend CORS doesn't match your ngrok URL. Update it in `backend/app.ts`.

**API calls fail?**
→ Check that `VITE_API_URL` was set when you built. Rebuild if needed.

**Blank page?**
→ Backend might not be running. Check Terminal 1.

---

## Optional: Keep Backend Running (PM2)

Install PM2 so backend restarts if it crashes:

```bash
# Install
sudo npm install -g pm2

# Start backend with PM2
pm2 start "yarn start:api" --name backend

# Save config
pm2 save
pm2 startup

# Commands:
pm2 restart backend  # Restart
pm2 stop backend     # Stop
pm2 logs backend     # View logs
```

---

## Summary

1. Fix code to use `API_BASE_URL` instead of localhost
2. Add **Frontend** ngrok URL to CORS
3. Build with **Backend** ngrok URL
4. Start backend + both ngrok tunnels (2 URLs)
5. Share the **Frontend** ngrok URL!

---

## Step 7: Auto-Deploy with GitHub Actions (CI/CD)

Once your app works manually, set up auto-deployment. Push code to GitHub → automatically deploys to your laptop.

### 7.1 Prepare Your Laptop

**Install Node.js and PM2:**

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn and PM2
npm install -g yarn pm2

# Clone your repo
cd ~
git clone https://github.com/YOUR_USERNAME/realworld-app.git
cd realworld-app

# Install dependencies
yarn install
```

**Generate SSH key for GitHub Actions:**

```bash
# On your laptop
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Copy public key to authorized_keys so GitHub can SSH in
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Get your laptop's IP address
hostname -I
# Save this IP (e.g., 192.168.1.100)
```

### 7.2 Add GitHub Secrets

Go to GitHub → Your Repo → Settings → Secrets and variables → Actions:

1. **SERVER_HOST**: Your laptop's IP address (e.g., `192.168.1.100`)
2. **SERVER_USER**: Your Ubuntu username (e.g., `ubuntu`)
3. **SERVER_SSH_KEY**: Copy your private key:
   ```bash
   cat ~/.ssh/github_actions
   # Copy everything including BEGIN/END lines
   ```

### 7.3 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Laptop

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd ~/realworld-app
            git pull origin main
            yarn install
            yarn build
            pm2 restart backend || pm2 start "yarn start:api" --name backend
```

Commit and push this file.

### 7.4 How It Works

Now when you:

```bash
git add .
git commit -m "My changes"
git push origin main
```

GitHub automatically:

1. SSH into your laptop
2. Pulls latest code
3. Installs dependencies
4. Builds the app
5. Restarts the backend

**Done!** Your site updates automatically.
