// Admin Panel JavaScript

// Admin credentials (in production, use server-side authentication)
const ADMIN_PASSWORD = 'admin123'; // Change this to a secure password
let adminSocket = null;
let isAdminAuthenticated = false;
let autoRefreshInterval = null;
let messageLogs = [];
let confirmCallback = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin panel loaded');
    
    // Ensure login screen is shown first
    showScreen('admin-login-screen');
    
    // Do NOT auto-login from session - always show login screen
    sessionStorage.removeItem('adminAuth');
    
    // Listen for Enter key in password field
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
        // Focus on password field
        passwordInput.focus();
    }
});

// Admin Login
function adminLogin() {
    const passwordInput = document.getElementById('admin-password');
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    const password = passwordInput.value.trim();
    
    if (!password) {
        showAdminError('Please enter the admin password');
        return;
    }
    
    if (password !== ADMIN_PASSWORD) {
        showAdminError('Invalid password. Access denied.');
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    console.log('Password validated, logging in...');
    
    // Authenticate
    isAdminAuthenticated = true;
    sessionStorage.setItem('adminAuth', 'authenticated');
    
    // Clear password field
    passwordInput.value = '';
    
    // Connect to server with admin privileges
    connectAdminSocket();
    
    // Show dashboard
    showDashboard();
}

// Admin Logout
function adminLogout() {
    showConfirmDialog(
        'Confirm Logout',
        'Are you sure you want to logout from the admin panel?',
        () => {
            isAdminAuthenticated = false;
            sessionStorage.removeItem('adminAuth');
            
            if (adminSocket) {
                adminSocket.disconnect();
                adminSocket = null;
            }
            
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
            
            showScreen('admin-login-screen');
            document.getElementById('admin-password').value = '';
        }
    );
}

// Connect to server as admin
function connectAdminSocket() {
    if (adminSocket && adminSocket.connected) {
        console.log('Admin socket already connected');
        return;
    }
    
    const socketUrl = window.SERVER_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);
    
    console.log('Connecting to server as admin:', socketUrl);
    
    adminSocket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
    });
    
    adminSocket.on('connect', () => {
        console.log('✓ Admin connected to server');
        console.log('Admin socket ID:', adminSocket.id);
        // Register as admin
        adminSocket.emit('admin-auth', { password: ADMIN_PASSWORD });
    });
    
    adminSocket.on('connection-confirmed', (data) => {
        console.log('✓ Admin connection confirmed:', data);
    });
    
    adminSocket.on('connect_error', (error) => {
        console.error('✗ Admin connection error:', error.message);
        updateStats({ totalRooms: 0, totalUsers: 0, serverOnline: false });
        showAdminError('Connection error: ' + error.message);
    });
    
    adminSocket.on('connect_timeout', () => {
        console.error('✗ Admin connection timeout');
        updateStats({ totalRooms: 0, totalUsers: 0, serverOnline: false });
        showAdminError('Connection timeout');
    });
    
    adminSocket.on('admin-authenticated', () => {
        console.log('Admin authentication successful');
        loadDashboardData();
    });
    
    adminSocket.on('admin-stats', (data) => {
        console.log('Received admin stats:', data);
        updateStats(data);
    });
    
    adminSocket.on('admin-rooms', (data) => {
        console.log('Received admin rooms:', data);
        updateRoomsList(data.rooms);
    });
    
    adminSocket.on('admin-message-log', (data) => {
        console.log('Received message log:', data);
        addMessageLog(data);
    });
    
    adminSocket.on('room-dismantled', (data) => {
        console.log('Room dismantled:', data.room);
        loadDashboardData();
    });
    
    adminSocket.on('disconnect', () => {
        console.log('Admin disconnected from server');
        updateStats({ totalRooms: 0, totalUsers: 0, serverOnline: false });
    });
    
    adminSocket.on('error', (error) => {
        console.error('Admin socket error:', error);
    });
}

// Show Dashboard
function showDashboard() {
    console.log('Showing dashboard...');
    
    // Verify all required elements exist before showing dashboard
    const requiredElements = [
        'admin-dashboard-screen',
        'total-rooms',
        'total-users',
        'total-messages',
        'server-status',
        'rooms-list',
        'messages-log'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        showAdminError('Dashboard elements not loaded. Please refresh the page.');
        return;
    }
    
    showScreen('admin-dashboard-screen');
    
    if (adminSocket && adminSocket.connected) {
        loadDashboardData();
    } else {
        console.log('Waiting for socket connection...');
        // Wait for socket to connect before loading data
        setTimeout(() => {
            if (adminSocket && adminSocket.connected) {
                loadDashboardData();
            }
        }, 1000);
    }
    
    // Start auto-refresh if enabled
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    if (autoRefreshCheckbox && autoRefreshCheckbox.checked) {
        startAutoRefresh();
    }
}

// Load Dashboard Data
function loadDashboardData() {
    if (!adminSocket || !adminSocket.connected) {
        console.error('Admin socket not connected');
        // Set default stats
        updateStats({ totalRooms: 0, totalUsers: 0, serverOnline: false });
        return;
    }
    
    console.log('Loading dashboard data...');
    adminSocket.emit('admin-get-stats');
    adminSocket.emit('admin-get-rooms');
}

// Update Stats
function updateStats(stats) {
    console.log('Updating stats with:', stats);
    
    const totalRoomsEl = document.getElementById('total-rooms');
    const totalUsersEl = document.getElementById('total-users');
    const totalMessagesEl = document.getElementById('total-messages');
    const serverStatusEl = document.getElementById('server-status');
    
    if (totalRoomsEl) {
        totalRoomsEl.textContent = stats.totalRooms || 0;
    }
    
    if (totalUsersEl) {
        totalUsersEl.textContent = stats.totalUsers || 0;
    }
    
    if (totalMessagesEl) {
        totalMessagesEl.textContent = messageLogs.length;
    }
    
    if (serverStatusEl) {
        if (stats.serverOnline) {
            serverStatusEl.innerHTML = '<span class="status-badge status-online">Online</span>';
        } else {
            serverStatusEl.innerHTML = '<span class="status-badge status-offline">Offline</span>';
        }
    }
    
    // Update server info
    const serverInfo = document.getElementById('server-info');
    if (serverInfo && stats.serverInfo) {
        serverInfo.textContent = `Uptime: ${stats.serverInfo.uptime || 'N/A'} | Port: ${stats.serverInfo.port || '3000'}`;
    }
}

// Update Rooms List
function updateRoomsList(rooms) {
    const roomsList = document.getElementById('rooms-list');
    const roomFilter = document.getElementById('room-filter');
    
    if (!rooms || rooms.length === 0) {
        roomsList.innerHTML = '<div class="empty-state">No active rooms</div>';
        roomFilter.innerHTML = '<option value="all">All Rooms</option>';
        return;
    }
    
    // Update filter dropdown
    roomFilter.innerHTML = '<option value="all">All Rooms</option>';
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.code;
        option.textContent = `Room ${room.code}`;
        roomFilter.appendChild(option);
    });
    
    // Update rooms list
    roomsList.innerHTML = '';
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        
        const createdTime = room.createdAt ? new Date(room.createdAt).toLocaleString() : 'Unknown';
        
        roomCard.innerHTML = `
            <div class="room-info-section">
                <div class="room-code-display">🏠 Room ${room.code}</div>
                <div class="room-meta">
                    <div class="room-meta-item">
                        <span>👥 ${room.users} ${room.users === 1 ? 'user' : 'users'}</span>
                    </div>
                    <div class="room-meta-item">
                        <span>📅 Created: ${createdTime}</span>
                    </div>
                </div>
            </div>
            <div class="room-actions">
                <button class="btn btn-small" onclick="viewRoomDetails('${room.code}')">
                    👁️ View
                </button>
                <button class="btn btn-small" onclick="dismantleRoom('${room.code}')">
                    🗑️ Dismantle
                </button>
            </div>
        `;
        
        roomsList.appendChild(roomCard);
    });
}

// Add Message Log
function addMessageLog(data) {
    if (!document.getElementById('log-messages').checked) {
        return;
    }
    
    messageLogs.unshift(data);
    
    // Keep only last 500 messages
    if (messageLogs.length > 500) {
        messageLogs = messageLogs.slice(0, 500);
    }
    
    updateMessagesLog();
    
    // Update message count
    document.getElementById('total-messages').textContent = messageLogs.length;
}

// Update Messages Log Display
function updateMessagesLog() {
    const messagesLog = document.getElementById('messages-log');
    const roomFilter = document.getElementById('room-filter').value;
    
    let filteredLogs = messageLogs;
    if (roomFilter !== 'all') {
        filteredLogs = messageLogs.filter(log => log.room === roomFilter);
    }
    
    if (filteredLogs.length === 0) {
        messagesLog.innerHTML = '<div class="empty-state">No messages logged</div>';
        return;
    }
    
    messagesLog.innerHTML = '';
    filteredLogs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        let content = '';
        if (log.type === 'text') {
            content = `<div class="log-content">${escapeHtml(log.message)}</div>`;
        } else {
            content = `<div class="log-media">[${log.type.toUpperCase()}] ${log.fileName || 'Media file'}</div>`;
        }
        
        logEntry.innerHTML = `
            <div class="log-header">
                <span class="log-room">Room ${log.room}</span>
                <span class="log-user">${escapeHtml(log.userName)}</span>
                <span>${timestamp}</span>
            </div>
            ${content}
        `;
        
        messagesLog.appendChild(logEntry);
    });
}

// Filter Messages
function filterMessages() {
    updateMessagesLog();
}

// Dismantle Room
function dismantleRoom(roomCode) {
    showConfirmDialog(
        'Dismantle Room',
        `Are you sure you want to dismantle room ${roomCode}? All users will be disconnected.`,
        () => {
            if (adminSocket && adminSocket.connected) {
                adminSocket.emit('admin-dismantle-room', { room: roomCode });
                setTimeout(() => loadDashboardData(), 500);
            }
        }
    );
}

// Dismantle All Rooms
function dismantleAllRooms() {
    showConfirmDialog(
        'Dismantle All Rooms',
        'Are you sure you want to dismantle ALL active rooms? All users will be disconnected.',
        () => {
            if (adminSocket && adminSocket.connected) {
                adminSocket.emit('admin-dismantle-all');
                setTimeout(() => loadDashboardData(), 500);
            }
        }
    );
}

// View Room Details
function viewRoomDetails(roomCode) {
    const logs = messageLogs.filter(log => log.room === roomCode);
    
    document.getElementById('room-filter').value = roomCode;
    switchTab('messages');
    filterMessages();
}

// Clear Message Logs
function clearMessageLogs() {
    showConfirmDialog(
        'Clear Message Logs',
        'Are you sure you want to clear all message logs? This action cannot be undone.',
        () => {
            messageLogs = [];
            updateMessagesLog();
            document.getElementById('total-messages').textContent = '0';
        }
    );
}

// Export Logs
function exportLogs() {
    if (messageLogs.length === 0) {
        showAdminError('No logs to export');
        return;
    }
    
    const dataStr = JSON.stringify(messageLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `secret-chat-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Change Admin Password
function changeAdminPassword() {
    const oldPassword = prompt('Enter current admin password:');
    if (!oldPassword) return;
    
    const newPassword = prompt('Enter new admin password:');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        showAdminError('Password must be at least 6 characters');
        return;
    }
    
    if (!adminSocket || !adminSocket.connected) {
        showAdminError('Not connected to server');
        return;
    }
    
    // Ask for confirmation
    if (!confirm('Change admin password? This will disconnect all admin sessions.')) {
        return;
    }
    
    // Request password change from server
    adminSocket.emit('admin-change-password', {
        oldPassword: oldPassword,
        newPassword: newPassword
    });
    
    // Listen for response
    const onPasswordChanged = (data) => {
        if (data.success) {
            showAdminError('Password updated successfully. Reconnecting...');
            // Update client-side password and reconnect
            ADMIN_PASSWORD = newPassword;
            setTimeout(() => {
                adminLogout();
                document.getElementById('admin-password').value = '';
                document.getElementById('admin-password').focus();
            }, 2000);
        } else {
            showAdminError(data.message || 'Password change failed');
        }
        adminSocket.off('password-changed', onPasswordChanged);
        adminSocket.off('error', onPasswordChangeError);
    };
    
    const onPasswordChangeError = (error) => {
        showAdminError(error.message || 'Password change error');
        adminSocket.off('password-changed', onPasswordChanged);
        adminSocket.off('error', onPasswordChangeError);
    };
    
    adminSocket.on('password-changed', onPasswordChanged);
    adminSocket.on('error', onPasswordChangeError);
}

// Refresh Dashboard
function refreshDashboard() {
    loadDashboardData();
}

// Auto Refresh
function toggleAutoRefresh() {
    const autoRefresh = document.getElementById('auto-refresh');
    
    if (autoRefresh.checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        loadDashboardData();
    }, 5000); // Refresh every 5 seconds
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Switch Tab
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active to clicked button
    const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
        return btn.textContent.toLowerCase().includes(tabName);
    });
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load data for specific tab
    if (tabName === 'messages') {
        updateMessagesLog();
    }
}

// Confirm Dialog
function showConfirmDialog(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-dialog').classList.add('active');
    confirmCallback = callback;
}

function closeConfirmDialog() {
    document.getElementById('confirm-dialog').classList.remove('active');
    confirmCallback = null;
}

function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
    }
    closeConfirmDialog();
}

// Utility Functions
function showAdminError(message) {
    console.error('Admin Error:', message);
    
    const activeScreen = document.querySelector('.screen.active');
    
    if (!activeScreen) {
        console.error('No active screen found for error display');
        alert(message); // Fallback to alert
        return;
    }
    
    // Remove existing error messages
    const existingError = activeScreen.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    activeScreen.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    
    const targetScreen = document.getElementById(screenId);
    
    if (!targetScreen) {
        console.error('Screen not found:', screenId);
        return;
    }
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Show target screen
    targetScreen.classList.add('active');
    targetScreen.style.display = 'block';
}
