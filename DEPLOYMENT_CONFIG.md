# Deployment Configuration Guide

## Environment Variables

### Required Variables
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `ADMIN_PASSWORD` - Admin panel password (default: admin123)

### Optional Variables
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins

## Deployment Scenarios

### 1. Local Development

**Start server:**
```bash
npm start
```

**Access:**
- Main app: http://localhost:3000
- Admin panel: http://localhost:3000/admin.html
- Health check: http://localhost:3000/health
- API status: http://localhost:3000/api/status

**No configuration needed** - default settings work automatically.

---

### 2. Render.com Deployment

**Environment Variables:**
```
PORT=10000 (set automatically by Render)
ADMIN_PASSWORD=your-secure-password
NODE_ENV=production
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Important Notes:**
- Render automatically sets PORT - don't override it
- WebSocket URL auto-configures to Render domain
- Uses `window.location.origin` for client connection

---

### 3. Heroku Deployment

**Environment Variables:**
```
ADMIN_PASSWORD=your-secure-password
NODE_ENV=production
```

**Procfile:**
```
web: npm start
```

**Commands:**
```bash
heroku create your-app-name
heroku config:set ADMIN_PASSWORD=your-secure-password
git push heroku main
```

**Important Notes:**
- Heroku automatically sets PORT via $PORT
- Enable WebSockets in Heroku settings
- SSL/TLS handled automatically

---

### 4. Railway.app Deployment

**Environment Variables:**
```
ADMIN_PASSWORD=your-secure-password
NODE_ENV=production
```

**Commands:**
```bash
railway login
railway init
railway up
```

**Important Notes:**
- Railway auto-sets PORT
- WebSocket support enabled by default
- Domain provided automatically

---

### 5. GitHub Pages + Separate Server

**Server (Render/Heroku/Railway):**
Deploy server normally as above.

**GitHub Pages (Static Files Only):**

1. Create `config.js` in your repo:
```javascript
// Set this to your deployed server URL
window.SERVER_URL = 'https://your-server-url.onrender.com';
```

2. Update `index.html` to load config:
```html
<script src="config.js"></script>
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script src="script.js"></script>
```

3. Deploy to GitHub Pages:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

4. Enable GitHub Pages in repository settings

**Important Notes:**
- Static files on GitHub Pages
- WebSocket server on separate platform
- CORS must allow GitHub Pages domain

---

### 6. VPS/Cloud Server (DigitalOcean, AWS, etc.)

**Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Clone and Setup:**
```bash
git clone <your-repo>
cd <your-repo>
npm install
```

**Create .env file:**
```bash
cp .env.example .env
nano .env
```

**Run with PM2:**
```bash
npm install -g pm2
pm2 start server.js --name secret-chat
pm2 startup
pm2 save
```

**Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Connection Troubleshooting

### Check 1: Server is Running
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{"status":"running","activeRooms":0,"timestamp":"..."}
```

### Check 2: Socket.IO Endpoint
```bash
curl http://localhost:3000/socket.io/
```
Expected: Should return a Socket.IO response

### Check 3: Client Connection
Open browser console and check for:
```
✓ Connected to server
Socket ID: <socket-id>
✓ Connection confirmed by server
```

### Common Errors and Solutions

#### Error: "Connection error: xhr poll error"
**Cause:** Server not running or wrong URL
**Solution:** 
- Verify server is running
- Check console for correct Socket URL
- Try http://localhost:3000/health

#### Error: "Connection timeout"
**Cause:** Firewall or network issue
**Solution:**
- Check firewall settings
- Ensure PORT is open
- Verify CORS configuration

#### Error: "Not connected to server"
**Cause:** WebSocket connection failed
**Solution:**
- Open browser DevTools → Network tab
- Look for WebSocket connection
- Check for 101 Switching Protocols response
- Verify Socket.IO library loaded

#### Error: "Transport unknown"
**Cause:** Socket.IO client/server mismatch
**Solution:**
- Verify Socket.IO version matches (4.7.2)
- Clear browser cache
- Check CDN availability

---

## Security Recommendations

### Production Checklist
- [ ] Change ADMIN_PASSWORD from default
- [ ] Set NODE_ENV=production
- [ ] Restrict CORS origins (don't use "*")
- [ ] Enable HTTPS/SSL
- [ ] Use environment variables (don't commit .env)
- [ ] Enable rate limiting
- [ ] Add authentication for rooms
- [ ] Implement IP filtering if needed
- [ ] Monitor server logs
- [ ] Set up backups

### CORS Configuration
For production, update server.js:
```javascript
const io = socketIO(server, {
    cors: {
        origin: [
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
```

---

## Testing Deployment

### 1. Local Test
```bash
npm start
# Open http://localhost:3000
# Check browser console for connection messages
```

### 2. Production Test
```bash
# After deployment, test endpoints:
curl https://your-domain.com/health
curl https://your-domain.com/api/status

# Test WebSocket:
# Open https://your-domain.com in browser
# Check console for connection confirmation
```

### 3. Load Test (Optional)
```bash
npm install -g artillery
artillery quick --count 10 -n 20 https://your-domain.com/health
```

---

## Monitoring

### Server Logs
```bash
# PM2
pm2 logs secret-chat

# Heroku
heroku logs --tail --app your-app-name

# Render
# Check dashboard logs

# Railway
railway logs
```

### Health Monitoring
Set up monitoring for:
- `/health` endpoint (should return 200)
- `/api/status` endpoint (should return JSON)
- Server uptime
- Active connections
- Memory usage

---

## Support

If you encounter issues:
1. Check server logs
2. Test with test-websocket.html
3. Verify environment variables
4. Review WEBSOCKET_TEST.md
5. Check browser console for errors
