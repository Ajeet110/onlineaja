# 🚀 Deployment Guide

## GitHub Repository Setup

### 1. Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click **"+"** → **"New repository"**
3. Repository name: `secret-chat` (or your preferred name)
4. Description: `Real-time secret chat with admin panel`
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README (we already have one)
7. Click **"Create repository"**

### 2. Push to GitHub
After creating the repository, run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/secret-chat.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Deployment Options

### Option 1: Render (Recommended - Free)

#### Deploy Backend Server
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `secret-chat-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Add Environment Variables (optional):
   - `PORT`: `3000`
7. Click **"Create Web Service"**
8. Wait for deployment (5-10 minutes)
9. Copy your service URL: `https://secret-chat-server.onrender.com`

#### Update Frontend Configuration
1. Edit `script.js` line 47:
```javascript
const socketUrl = 'https://your-server.onrender.com';
```

2. Edit `admin.js` line 66:
```javascript
const socketUrl = 'https://your-server.onrender.com';
```

3. Commit and push changes:
```bash
git add script.js admin.js
git commit -m "Update server URL for production"
git push origin main
```

#### Deploy Frontend on GitHub Pages
1. Go to your GitHub repository
2. Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: `main`
5. Folder: `/ (root)`
6. Click **Save**
7. Your site will be at: `https://YOUR_USERNAME.github.io/secret-chat/`

### Option 2: Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect Node.js
6. Environment variables:
   - `PORT`: `3000`
7. Copy your deployment URL
8. Update `script.js` and `admin.js` with Railway URL

### Option 3: Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app: `heroku create secret-chat-app`
4. Deploy:
```bash
git push heroku main
```
5. Open: `heroku open`
6. Update frontend URLs with Heroku URL

### Option 4: Vercel (Frontend) + Render (Backend)

#### Backend on Render
- Follow Render backend steps above

#### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - Framework: None (Static)
   - Build Command: (leave empty)
   - Output Directory: `.`
4. Deploy
5. Update socket URLs to point to Render backend

## Important Configuration

### 1. Change Admin Password
Before deployment, update admin password:

**In `admin.js` (line 5):**
```javascript
const ADMIN_PASSWORD = 'your-secure-password-here';
```

**In `server.js` (line 8):**
```javascript
const ADMIN_PASSWORD = 'your-secure-password-here';
```

### 2. Enable CORS for Production
If frontend and backend are on different domains, update `server.js`:

```javascript
const io = socketIO(server, {
    cors: {
        origin: "https://your-frontend-domain.com",
        methods: ["GET", "POST"]
    }
});
```

### 3. Environment Variables
Create a `.env` file (don't commit this):
```
PORT=3000
ADMIN_PASSWORD=your-secure-password
NODE_ENV=production
```

Update `server.js` to use environment variables:
```javascript
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PORT = process.env.PORT || 3000;
```

## Testing Deployment

### Test Backend
```bash
curl https://your-backend-url.com
```

Should return: `{"status":"running","activeRooms":0,"timestamp":"..."}`

### Test Frontend
1. Open your GitHub Pages URL
2. Create a room
3. Check browser console for connection status
4. Should show: "Connected to server"

### Test Admin Panel
1. Open `https://YOUR_USERNAME.github.io/secret-chat/admin.html`
2. Login with admin password
3. Verify dashboard loads with stats

## Troubleshooting

### Backend Not Connecting
- Check server logs on Render/Railway
- Verify PORT is set correctly
- Check if service is running

### CORS Errors
- Update CORS settings in `server.js`
- Allow your GitHub Pages domain

### Admin Panel Not Loading
- Check browser console for errors
- Verify socket URL is correct
- Check admin password matches

### Messages Not Sending
- Verify socket connection status
- Check backend logs
- Test with 2 browser windows

## Custom Domain (Optional)

### For Backend (Render)
1. Go to Render dashboard
2. Settings → Custom Domain
3. Add your domain
4. Update DNS records

### For Frontend (GitHub Pages)
1. Repository Settings → Pages
2. Custom domain: `yourdomain.com`
3. Update DNS:
   - Type: `CNAME`
   - Name: `www` or `@`
   - Value: `YOUR_USERNAME.github.io`

## Monitoring

### Backend Health Check
Add to `server.js`:
```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date()
    });
});
```

### View Logs
- **Render**: Dashboard → Logs
- **Railway**: Project → Deployments → Logs
- **Heroku**: `heroku logs --tail`

## Security Checklist

- [ ] Changed admin password
- [ ] Using environment variables
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] Regular backups configured

## Support

For issues, check:
1. Browser console (F12)
2. Server logs on hosting platform
3. Network tab for failed requests
4. GitHub Issues in your repository

---

**Your app is now live! 🎉**
- Frontend: `https://YOUR_USERNAME.github.io/secret-chat/`
- Admin: `https://YOUR_USERNAME.github.io/secret-chat/admin.html`
- Backend: `https://your-server.onrender.com`
