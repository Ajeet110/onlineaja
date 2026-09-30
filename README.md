# 🔐 Secret Chat - Real-Time Encrypted Communication

A hacker-style real-time chat application with Matrix-inspired design, built with Socket.IO for instant messaging and room-based communication.

## ✨ Features

- **Real-time messaging** using Socket.IO
- **Room-based chat** with custom secret codes
- **Matrix-style animated background** for a hacker aesthetic
- **Connection status** with live user count
- **Dark, cyberpunk interface** with glitch effects
- **Responsive design** for mobile and desktop
- **Two modes**: Create new chat or join existing chat

## 🚀 Quick Start

### Option 1: GitHub Pages Deployment (Frontend Only)

1. **Fork this repository**

2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select branch: `main`
   - Select folder: `/ (root)`
   - Click Save

3. **Access your site**:
   - Your site will be available at: `https://yourusername.github.io/repository-name/`

### Option 2: Full Deployment (Frontend + Backend)

#### Deploy Backend Server

**Using Render (Recommended - Free):**

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: secret-chat-server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Click "Create Web Service"
6. Copy your service URL (e.g., `https://secret-chat-server.onrender.com`)

**Alternative platforms:**
- **Railway**: [railway.app](https://railway.app)
- **Heroku**: [heroku.com](https://heroku.com)
- **Glitch**: [glitch.com](https://glitch.com)

#### Connect Frontend to Backend

1. Edit `script.js` line 37:
```javascript
const socketUrl = 'YOUR_BACKEND_URL_HERE';
```

2. Replace with your backend URL (e.g., `https://secret-chat-server.onrender.com`)

3. Commit and push changes:
```bash
git add script.js
git commit -m "Update backend URL"
git push origin main
```

## 🎮 How to Use

1. **Create New Chat**:
   - Click "New Chat"
   - Enter a secret code (3+ characters)
   - Share the code with others

2. **Join Existing Chat**:
   - Click "Join Chat"
   - Enter the shared secret code
   - Start chatting instantly

3. **Chat Features**:
   - See connection status (green = connected)
   - View number of users online
   - Send messages in real-time
   - Leave room anytime

## 🛠️ Local Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Running Backend Locally

```bash
# Install dependencies
npm install

# Start server
npm start

# Or use nodemon for development
npm run dev
```

Server will run on `http://localhost:3000`

### Running Frontend Locally

Simply open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Then open `http://localhost:8000` in your browser.

## 📁 Project Structure

```
secret-chat/
├── index.html          # Main HTML structure
├── style.css           # Matrix-style CSS with animations
├── script.js           # Frontend logic & Socket.IO client
├── server.js           # Backend Socket.IO server
├── package.json        # Node.js dependencies
└── README.md          # Documentation
```

## 🎨 Customization

### Change Color Scheme

Edit `style.css` CSS variables:

```css
:root {
    --primary-color: #00ff41;      /* Main green color */
    --secondary-color: #008f11;    /* Secondary green */
    --bg-dark: #0d0d0d;           /* Dark background */
    --bg-darker: #050505;         /* Darker background */
}
```

### Modify Matrix Effect

Edit `script.js` matrix settings:

```javascript
const fontSize = 14;               // Character size
const matrixChars = 'ABC...';     // Characters to display
```

## 🔐 Security Notes

- This is a demo application - messages are NOT encrypted
- For production use, implement proper encryption
- Add authentication and authorization
- Sanitize user inputs
- Use HTTPS for all connections
- Implement rate limiting

## 🛡️ Admin Panel

Access the admin panel at `admin.html` with full management capabilities.

### Admin Features:
- **Password Protection**: Secure login (default: `admin123`)
- **Real-time Dashboard**: Live statistics and monitoring
- **Active Rooms Monitoring**: See all rooms and user counts
- **Room Management**: Dismantle individual or all rooms
- **Message Logs**: View all messages sent across rooms
- **Export Logs**: Download message history as JSON
- **Auto-refresh**: Dashboard updates every 5 seconds
- **Settings Panel**: Configure admin preferences

### Admin Access:
1. Navigate to `admin.html` or click admin link
2. Enter password: `admin123` (change in `admin.js` and `server.js`)
3. Access full control panel

### Admin Capabilities:
- View active rooms with user counts
- Monitor real-time message traffic
- Manually dismantle problematic rooms
- Export message logs for review
- Change admin settings
- View server uptime and status

**⚠️ Important**: Change the default admin password in both `admin.js` (line 5) and `server.js` (line 8) before deployment!

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 📱 Mobile Support

Fully responsive design optimized for:
- Phones (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## 🐛 Troubleshooting

**"Not connected to server"**:
- Check backend server is running
- Verify backend URL in `script.js`
- Check browser console for errors

**Messages not appearing**:
- Ensure both users are in the same room
- Check internet connection
- Refresh the page

**Backend deployment issues**:
- Check server logs on hosting platform
- Verify environment variables
- Ensure PORT is correctly configured

## 📄 License

MIT License - feel free to use for any purpose

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 🔗 Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [GitHub Pages Guide](https://pages.github.com/)
- [Render Deployment Guide](https://render.com/docs)

---

**Made with 💚 and Matrix vibes**
