# WebSocket Connection Test & Deployment Guide

## Summary of Fixes Applied

### 1. WebSocket Connection URL Fixes
- **script.js**: Updated to use dynamic URL resolution:
  ```javascript
  const socketUrl = window.SERVER_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);
  ```
- **admin.js**: Updated to use same dynamic URL resolution as script.js

### 2. Admin Password Logic Fixes
- **server.js**: Modified password storage to be updatable:
  ```javascript
  let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  ```
- **server.js**: Added password change endpoint:
  ```javascript
  socket.on('admin-change-password', (data) => { ... });
  ```
- **admin.js**: Updated password change function to use server endpoint

### 3. Connection Status Updates
- Both client files now properly update connection status in UI
- Added WebSocket error handling and reconnection logic
- Admin control center now shows accurate server online/offline status

## How to Test WebSocket Connection

### Local Testing:
1. Start the server:
   ```bash
   npm start
   # OR for development with auto-restart
   npm run dev
   ```

2. Open in browser:
   - Main chat: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html
   - Connection test: http://localhost:3000/test-websocket.html

### Deployment Testing:
1. Deploy to hosting platform (Render, Heroku, Railway, etc.)
2. Update environment variables:
   - `PORT`: Server port (default: 3000)
   - `ADMIN_PASSWORD`: Custom admin password (default: admin123)

3. For GitHub Pages or static hosting:
   - Set `window.SERVER_URL` variable before loading script:
   ```html
   <script>
     window.SERVER_URL = 'https://your-server-url.herokuapp.com';
   </script>
   <script src="script.js"></script>
   ```

## Admin Password Management
- **Default password**: admin123
- **To change password**:
  1. Login to admin panel
  2. Click "Change Password" in settings
  3. Enter current password and new password
  4. All admin sessions will be disconnected and need to re-authenticate

## Connection Issues Troubleshooting

### 1. WebSocket Connection Fails
**Possible causes:**
- Server not running
- Wrong URL configuration
- CORS issues

**Solutions:**
- Check server logs for errors
- Verify server is accessible via browser
- Test with test-websocket.html page

### 2. Admin Authentication Fails
**Possible causes:**
- Password mismatch
- Socket connection not established
- Admin session not authenticated

**Solutions:**
- Check admin panel connection status
- Verify password in server.js matches admin.js
- Clear browser session storage and retry

### 3. Admin Control Center Shows Offline
**Possible causes:**
- WebSocket not connected
- Server health endpoint unreachable
- Admin socket not authenticated

**Solutions:**
- Check admin socket connection
- Verify admin-auth event is firing
- Test with test-websocket.html page

## Server Health Check
Access the server health endpoint:
```
GET /
```
Response:
```json
{
  "status": "running",
  "activeRooms": 0,
  "timestamp": "2026-09-30T10:30:00.000Z"
}
```

## Important Notes
1. **For production**: Restrict CORS origin in server.js
2. **Security**: Change default admin password before deployment
3. **Deployment**: Update `window.SERVER_URL` for static hosting
4. **Backup**: Export message logs regularly via admin panel

## File Changes Summary
- `server.js`: Updated admin password handling, added password change endpoint
- `script.js`: Fixed WebSocket URL resolution for deployment
- `admin.js`: Fixed connection URL, implemented proper password change logic
- `test-websocket.html`: Added test page for connection verification

All changes have been committed and pushed to the GitHub repository.