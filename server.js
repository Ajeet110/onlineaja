// Socket.IO Server for Secret Chat
// Deploy this on platforms like Render, Heroku, or Railway

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for GitHub Pages
const io = socketIO(server, {
    cors: {
        origin: "*", // Allow all origins (restrict this in production)
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Serve static files from root directory
app.use(express.static(__dirname));

// Store room information with creation timestamps
const rooms = new Map(); // Map<roomCode, Set<socketId>>
const roomMetadata = new Map(); // Map<roomCode, { createdAt: timestamp }>
const messageLogs = []; // Store message logs for admin
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Can be changed via admin panel
const serverStartTime = new Date();

// Cleanup rooms daily at midnight
function scheduleRoomCleanup() {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // Next day
        0, 0, 0 // Midnight
    );
    const msToMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
        cleanupAllRooms();
        // Schedule next cleanup in 24 hours
        setInterval(cleanupAllRooms, 24 * 60 * 60 * 1000);
    }, msToMidnight);
    
    console.log(`Room cleanup scheduled for midnight (in ${Math.round(msToMidnight / 1000 / 60)} minutes)`);
}

function cleanupAllRooms() {
    console.log('Running daily room cleanup...');
    const roomCount = rooms.size;
    
    // Notify all users in all rooms
    rooms.forEach((users, room) => {
        io.to(room).emit('room-terminated', { 
            message: 'This room has been automatically terminated at midnight.' 
        });
    });
    
    // Clear all rooms
    rooms.clear();
    roomMetadata.clear();
    
    console.log(`Cleaned up ${roomCount} rooms at midnight`);
}

// Start the cleanup scheduler
scheduleRoomCleanup();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'running', 
        activeRooms: rooms.size,
        timestamp: new Date().toISOString()
    });
});

// API status endpoint for connection testing
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok',
        server: 'Secret Chat Server',
        version: '1.0.0',
        activeRooms: rooms.size,
        timestamp: new Date().toISOString()
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    console.log('Client address:', socket.handshake.address);
    console.log('Client headers:', socket.handshake.headers.origin || 'No origin');
    
    // Send connection confirmation
    socket.emit('connection-confirmed', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
    });
    
    // Create new room
    socket.on('create-room', ({ room, userId, userName }) => {
        // Validate room code is numeric
        if (!/^\d+$/.test(room)) {
            socket.emit('error', { message: 'Room code must be numeric' });
            return;
        }
        
        socket.join(room);
        
        // Store user info with socket
        socket.userName = userName;
        socket.currentRoom = room;
        
        // Initialize room
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
            roomMetadata.set(room, {
                createdAt: new Date(),
                createdBy: userId
            });
        }
        
        // Add user to room
        rooms.get(room).add(socket.id);
        
        // Confirm room creation
        socket.emit('room-created', { room, userId, userName });
        
        // Broadcast room user count
        const userCount = rooms.get(room).size;
        io.to(room).emit('room-users', userCount);
        
        console.log(`User ${userName} (${userId}) created room ${room}. Total users: ${userCount}`);
    });
    
    // Join existing room
    socket.on('join-room', ({ room, userId, userName }) => {
        // Validate room code is numeric
        if (!/^\d+$/.test(room)) {
            socket.emit('error', { message: 'Room code must be numeric' });
            return;
        }
        
        // Check if room exists
        if (!rooms.has(room) || rooms.get(room).size === 0) {
            socket.emit('room-not-found', { room });
            console.log(`User ${userName} tried to join non-existent room ${room}`);
            return;
        }
        
        socket.join(room);
        
        // Store user info with socket
        socket.userName = userName;
        socket.currentRoom = room;
        
        // Add user to room
        rooms.get(room).add(socket.id);
        
        // Confirm room joined
        socket.emit('room-joined', { room, userId, userName });
        
        // Broadcast room user count
        const userCount = rooms.get(room).size;
        io.to(room).emit('room-users', userCount);
        
        // Notify others that a user joined
        socket.to(room).emit('user-joined', { userId, userName });
        
        console.log(`User ${userName} (${userId}) joined room ${room}. Total users: ${userCount}`);
    });
    
    // Leave room
    socket.on('leave-room', ({ room, userId, userName }) => {
        socket.leave(room);
        
        if (rooms.has(room)) {
            rooms.get(room).delete(socket.id);
            
            const userCount = rooms.get(room).size;
            
            // Clean up empty rooms
            if (userCount === 0) {
                rooms.delete(room);
                roomMetadata.delete(room);
                console.log(`Room ${room} deleted (empty)`);
            } else {
                io.to(room).emit('room-users', userCount);
            }
            
            // Notify others that a user left
            socket.to(room).emit('user-left', { userId, userName });
            
            console.log(`User ${userName} (${userId}) left room ${room}. Remaining users: ${userCount}`);
        }
    });
    
    // Handle text messages
    socket.on('message', (data) => {
        const { room, userId, userName, message, type, timestamp } = data;
        
        // Log message for admin
        messageLogs.push({
            room,
            userId,
            userName,
            message,
            type: type || 'text',
            timestamp
        });
        
        // Keep only last 1000 messages
        if (messageLogs.length > 1000) {
            messageLogs.shift();
        }
        
        // Broadcast message to all users in the room except sender
        socket.to(room).emit('message', {
            userId,
            userName,
            message,
            type: type || 'text',
            timestamp
        });
        
        // Send to admin if monitoring
        const adminSockets = Array.from(io.sockets.sockets.values()).filter(s => s.isAdmin);
        adminSockets.forEach(adminSocket => {
            adminSocket.emit('admin-message-log', {
                room,
                userId,
                userName,
                message,
                type: type || 'text',
                timestamp
            });
        });
        
        console.log(`Message in room ${room} from ${userName} (${userId})`);
    });
    
    // Handle media messages
    socket.on('media-message', (data) => {
        const { room, userId, userName, type, timestamp, fileName } = data;
        
        // Log media message (without actual data to save memory)
        messageLogs.push({
            room,
            userId,
            userName,
            type,
            fileName,
            timestamp,
            message: `[${type.toUpperCase()}] ${fileName || 'Media file'}`
        });
        
        // Broadcast media to all users in the room except sender
        socket.to(room).emit('media-message', data);
        
        // Send to admin if monitoring
        const adminSockets = Array.from(io.sockets.sockets.values()).filter(s => s.isAdmin);
        adminSockets.forEach(adminSocket => {
            adminSocket.emit('admin-message-log', {
                room,
                userId,
                userName,
                type,
                fileName,
                timestamp,
                message: `[${type.toUpperCase()}] ${fileName || 'Media file'}`
            });
        });
        
        console.log(`Media (${type}) shared in room ${room} from ${userName} (${userId})`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        const userName = socket.userName;
        const currentRoom = socket.currentRoom;
        
        // Remove user from all rooms
        rooms.forEach((users, room) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                
                const userCount = users.size;
                
                if (userCount === 0) {
                    rooms.delete(room);
                    roomMetadata.delete(room);
                    console.log(`Room ${room} deleted (empty)`);
                } else {
                    io.to(room).emit('room-users', userCount);
                    io.to(room).emit('user-left', { userId: socket.id, userName });
                }
            }
        });
    });
    
    // ========== ADMIN FUNCTIONS ==========
    
    // Admin authentication
    socket.on('admin-auth', (data) => {
        if (data.password === ADMIN_PASSWORD) {
            socket.isAdmin = true;
            socket.emit('admin-authenticated');
            console.log('Admin authenticated:', socket.id);
        } else {
            socket.emit('error', { message: 'Invalid admin password' });
        }
    });
    
    // Change admin password
    socket.on('admin-change-password', (data) => {
        if (!socket.isAdmin) return;
        
        const { oldPassword, newPassword } = data;
        
        if (oldPassword !== ADMIN_PASSWORD) {
            socket.emit('error', { message: 'Current password is incorrect' });
            return;
        }
        
        if (!newPassword || newPassword.length < 6) {
            socket.emit('error', { message: 'New password must be at least 6 characters' });
            return;
        }
        
        // Update password
        ADMIN_PASSWORD = newPassword;
        console.log(`Admin password changed by ${socket.id}`);
        socket.emit('password-changed', { success: true, message: 'Password updated successfully' });
    });
    
    // Get admin stats
    socket.on('admin-get-stats', () => {
        if (!socket.isAdmin) return;
        
        let totalUsers = 0;
        rooms.forEach(users => {
            totalUsers += users.size;
        });
        
        const uptime = Math.floor((new Date() - serverStartTime) / 1000);
        const uptimeStr = formatUptime(uptime);
        
        socket.emit('admin-stats', {
            totalRooms: rooms.size,
            totalUsers: totalUsers,
            serverOnline: true,
            serverInfo: {
                uptime: uptimeStr,
                port: PORT
            }
        });
    });
    
    // Get all rooms
    socket.on('admin-get-rooms', () => {
        if (!socket.isAdmin) return;
        
        const roomsData = [];
        rooms.forEach((users, roomCode) => {
            const metadata = roomMetadata.get(roomCode);
            roomsData.push({
                code: roomCode,
                users: users.size,
                createdAt: metadata ? metadata.createdAt : null,
                createdBy: metadata ? metadata.createdBy : null
            });
        });
        
        socket.emit('admin-rooms', { rooms: roomsData });
    });
    
    // Dismantle specific room
    socket.on('admin-dismantle-room', (data) => {
        if (!socket.isAdmin) return;
        
        const { room } = data;
        
        if (rooms.has(room)) {
            // Notify all users in the room
            io.to(room).emit('room-terminated', {
                message: 'This room has been dismantled by an administrator.'
            });
            
            // Remove all users from the room
            const users = rooms.get(room);
            users.forEach(socketId => {
                const userSocket = io.sockets.sockets.get(socketId);
                if (userSocket) {
                    userSocket.leave(room);
                }
            });
            
            // Delete the room
            rooms.delete(room);
            roomMetadata.delete(room);
            
            console.log(`Admin dismantled room ${room}`);
            socket.emit('room-dismantled', { room });
        }
    });
    
    // Dismantle all rooms
    socket.on('admin-dismantle-all', () => {
        if (!socket.isAdmin) return;
        
        console.log('Admin dismantling all rooms');
        
        // Notify all users
        rooms.forEach((users, room) => {
            io.to(room).emit('room-terminated', {
                message: 'All rooms have been dismantled by an administrator.'
            });
        });
        
        // Clear all rooms
        rooms.clear();
        roomMetadata.clear();
        
        console.log('All rooms dismantled by admin');
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

server.listen(PORT, HOST, () => {
    console.log(`Secret Chat Server running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access URLs:`);
    console.log(`  Local: http://localhost:${PORT}`);
    console.log(`  Network: http://0.0.0.0:${PORT}`);
    console.log(`Socket.IO path: /socket.io`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please choose a different port.`);
        process.exit(1);
    }
});
