# ColorRush – Game Server

Node.js + Socket.io realtime game server for ColorRush.

## Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select `drekko13/game-color-rush`
4. In **Root Directory** settings, set it to: `server`
5. Railway will auto-detect `package.json` and run `npm start`
6. After deploy, copy the public URL (e.g. `https://colorrush-server.up.railway.app`)

## After Railway deploy

In your **Vercel dashboard**:
1. Go to your frontend project → Settings → Environment Variables
2. Add: `VITE_SERVER_URL` = `https://your-railway-url.up.railway.app`
3. Redeploy the Vercel project

## Local development

```bash
# From project root:
npm run dev
# Runs both Vite (port 5173) and Node server (port 3001) concurrently
```
