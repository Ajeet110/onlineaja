// Matrix Background Effect
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 35);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Socket.IO Connection
let socket;
let currentRoom = null;
let userId = 'User_' + Math.random().toString(36).substr(2, 9);
let userName = null;

// Initialize Socket.IO connection
function initSocket() {
    // Connect to local server (change to deployed URL for production)
    const socketUrl = 'http://localhost:3000';
    
    try {
        socket = io(socketUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
        
        socket.on('connect', () => {
            console.log('Connected to server');
            updateConnectionStatus(true);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            updateConnectionStatus(false);
        });
        
        socket.on('room-created', (data) => {
            console.log('Room created successfully:', data.room);
            currentRoom = data.room;
            document.getElementById('current-room').textContent = data.room;
            showScreen('chat-screen');
            addSystemMessage('Room created successfully');
            clearInputFields();
        });
        
        socket.on('room-joined', (data) => {
            console.log('Joined room successfully:', data.room);
            currentRoom = data.room;
            document.getElementById('current-room').textContent = data.room;
            showScreen('chat-screen');
            clearInputFields();
        });
        
        socket.on('room-not-found', (data) => {
            console.log('Room not found:', data.room);
            showAccessDenied(data.room);
        });
        
        socket.on('room-users', (count) => {
            document.getElementById('user-count').textContent = count;
        });
        
        socket.on('user-joined', (data) => {
            const displayName = data.userName || 'A user';
            addSystemMessage(`${displayName} joined the room`);
        });
        
        socket.on('user-left', (data) => {
            const displayName = data.userName || 'A user';
            addSystemMessage(`${displayName} left the room`);
        });
        
        socket.on('message', (data) => {
            if (data.type === 'text') {
                addMessage(data.userName || data.userId, data.message, data.timestamp, false, 'text');
            }
        });
        
        socket.on('media-message', (data) => {
            addMediaMessage(data.userName || data.userId, data, false);
        });
        
        socket.on('room-terminated', (data) => {
            console.log('Room terminated:', data.message);
            addSystemMessage(data.message);
            setTimeout(() => {
                leaveRoom();
            }, 3000);
        });
        
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            showError('Connection error. Please try again.');
        });
    } catch (error) {
        console.error('Failed to initialize socket:', error);
        // Fallback to local simulation mode
        initLocalMode();
    }
}

// Local Mode (for testing without server)
let localMode = false;
let localUsers = new Set();

function initLocalMode() {
    localMode = true;
    console.log('Running in local mode (no server connection)');
    updateConnectionStatus(true);
}

function simulateLocalBroadcast(room, event, data) {
    if (!localMode) return;
    
    // Simulate room occupancy
    if (event === 'join-room') {
        localUsers.add(userId);
        setTimeout(() => {
            document.getElementById('user-count').textContent = localUsers.size;
        }, 100);
    }
}

// Initialize on page load
initSocket();

// Ensure only welcome screen is visible on page load
document.addEventListener('DOMContentLoaded', () => {
    // Force hide all screens except welcome
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
    });
    
    // Show only welcome screen
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'block';
        welcomeScreen.classList.add('active');
    }
});

// Screen Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Show only the requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.display = 'block';
    }
}

function showWelcome() {
    showScreen('welcome-screen');
}

function showNewChat() {
    showScreen('new-chat-screen');
    document.getElementById('new-user-name').focus();
}

function showJoinChat() {
    showScreen('join-chat-screen');
    document.getElementById('join-user-name').focus();
}

// Room Management
function createRoom() {
    const name = document.getElementById('new-user-name').value.trim();
    const roomCode = document.getElementById('new-room-code').value.trim();
    
    if (!name) {
        showError('Please enter your name');
        return;
    }
    
    if (name.length < 2) {
        showError('Name must be at least 2 characters');
        return;
    }
    
    if (!roomCode) {
        showError('Please enter a room code');
        return;
    }
    
    // Validate that room code is numeric only
    if (!/^\d+$/.test(roomCode)) {
        showError('Room code must contain numbers only');
        return;
    }
    
    if (roomCode.length < 3) {
        showError('Room code must be at least 3 digits');
        return;
    }
    
    userName = name;
    createRoomWithCode(roomCode);
}

function joinRoom() {
    const name = document.getElementById('join-user-name').value.trim();
    const roomCode = document.getElementById('join-room-code').value.trim();
    
    if (!name) {
        showError('Please enter your name');
        return;
    }
    
    if (name.length < 2) {
        showError('Name must be at least 2 characters');
        return;
    }
    
    if (!roomCode) {
        showError('Please enter a room code');
        return;
    }
    
    // Validate that room code is numeric only
    if (!/^\d+$/.test(roomCode)) {
        showError('Room code must contain numbers only');
        return;
    }
    
    userName = name;
    joinExistingRoom(roomCode);
}

// Create new room
function createRoomWithCode(roomCode) {
    if (localMode) {
        // In local mode, always allow room creation
        currentRoom = roomCode;
        document.getElementById('current-room').textContent = roomCode;
        simulateLocalBroadcast(roomCode, 'create-room', { userId, userName });
        showScreen('chat-screen');
        addSystemMessage('Room created (Local Mode)');
        clearInputFields();
    } else if (socket && socket.connected) {
        // Request room creation from server
        socket.emit('create-room', { room: roomCode, userId, userName });
    } else {
        showError('Not connected to server. Retrying...');
        setTimeout(() => initSocket(), 1000);
    }
}

// Join existing room
function joinExistingRoom(roomCode) {
    if (localMode) {
        // In local mode, always allow joining
        currentRoom = roomCode;
        document.getElementById('current-room').textContent = roomCode;
        simulateLocalBroadcast(roomCode, 'join-room', { userId, userName });
        showScreen('chat-screen');
        addSystemMessage('Connected to room (Local Mode)');
        clearInputFields();
    } else if (socket && socket.connected) {
        // Request to join room from server (will validate existence)
        socket.emit('join-room', { room: roomCode, userId, userName });
    } else {
        showError('Not connected to server. Retrying...');
        setTimeout(() => initSocket(), 1000);
    }
}

// Helper to clear input fields
function clearInputFields() {
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-room-code').value = '';
    document.getElementById('join-user-name').value = '';
    document.getElementById('join-room-code').value = '';
    
    // Focus on message input
    setTimeout(() => {
        document.getElementById('message-input').focus();
    }, 100);
}

// Show access denied screen
function showAccessDenied(roomCode) {
    document.getElementById('denied-room-code').textContent = roomCode;
    showScreen('access-denied-screen');
}

function leaveRoom() {
    if (currentRoom) {
        if (localMode) {
            localUsers.delete(userId);
        } else if (socket) {
            socket.emit('leave-room', { room: currentRoom, userId, userName });
        }
        currentRoom = null;
    }
    
    // Clear messages and reset state
    document.getElementById('messages-container').innerHTML = '';
    document.getElementById('user-count').textContent = '0';
    document.getElementById('message-input').value = '';
    userName = null;
    
    // Hide chat screen and show welcome screen
    showWelcome();
}

// Message Handling
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message || !currentRoom) return;
    
    const messageData = {
        room: currentRoom,
        userId: userId,
        userName: userName,
        message: message,
        type: 'text',
        timestamp: new Date().toISOString()
    };
    
    if (localMode) {
        // In local mode, just display the message
        addMessage(userName, message, messageData.timestamp, true, 'text');
    } else if (socket) {
        socket.emit('message', messageData);
        addMessage(userName, message, messageData.timestamp, true, 'text');
    }
    
    input.value = '';
    input.focus();
}

// Media sharing functions
function toggleMediaMenu() {
    const mediaMenu = document.getElementById('media-menu');
    mediaMenu.classList.toggle('active');
}

function selectFromGallery(type) {
    const inputId = type === 'image' ? 'image-input' : 'video-input';
    document.getElementById(inputId).click();
    toggleMediaMenu();
}

function selectFile() {
    document.getElementById('file-input').click();
    toggleMediaMenu();
}

function handleFileSelect(input, type) {
    const file = input.files[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('File size must be less than 10MB');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const fileData = {
            room: currentRoom,
            userId: userId,
            userName: userName,
            type: type,
            data: e.target.result,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            timestamp: new Date().toISOString()
        };
        
        if (localMode) {
            addMediaMessage(userName, fileData, true);
        } else if (socket) {
            // Show loading indicator
            addLoadingMessage('Sending ' + type + '...');
            socket.emit('media-message', fileData);
            // Remove loading and add actual message
            setTimeout(() => {
                removeLoadingMessage();
                addMediaMessage(userName, fileData, true);
            }, 500);
        }
    };
    
    reader.readAsDataURL(file);
    input.value = '';
}

async function capturePhoto(facingMode) {
    currentCameraMode = 'photo';
    currentFacingMode = facingMode;
    toggleMediaMenu();
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
        });
        
        currentStream = stream;
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-preview');
        
        video.srcObject = stream;
        modal.classList.add('active');
        
        document.getElementById('camera-title').textContent = 
            facingMode === 'user' ? 'Front Camera - Photo' : 'Back Camera - Photo';
        document.getElementById('capture-btn').style.display = 'block';
        document.getElementById('stop-recording-btn').style.display = 'none';
        document.getElementById('recording-indicator').style.display = 'none';
    } catch (error) {
        console.error('Camera access error:', error);
        showError('Could not access camera. Please check permissions.');
    }
}

async function captureVideo(facingMode) {
    currentCameraMode = 'video';
    currentFacingMode = facingMode;
    toggleMediaMenu();
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: true
        });
        
        currentStream = stream;
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-preview');
        
        video.srcObject = stream;
        modal.classList.add('active');
        
        document.getElementById('camera-title').textContent = 
            facingMode === 'user' ? 'Front Camera - Video' : 'Back Camera - Video';
        document.getElementById('capture-btn').style.display = 'block';
        document.getElementById('stop-recording-btn').style.display = 'none';
        document.getElementById('recording-indicator').style.display = 'none';
    } catch (error) {
        console.error('Camera access error:', error);
        showError('Could not access camera. Please check permissions.');
    }
}

function captureMedia() {
    if (currentCameraMode === 'photo') {
        capturePhotoFromStream();
    } else {
        startVideoRecording();
    }
}

function capturePhotoFromStream() {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                room: currentRoom,
                userId: userId,
                userName: userName,
                type: 'image',
                data: e.target.result,
                fileName: `photo_${Date.now()}.jpg`,
                mimeType: 'image/jpeg',
                timestamp: new Date().toISOString()
            };
            
            if (localMode) {
                addMediaMessage(userName, fileData, true);
            } else if (socket) {
                socket.emit('media-message', fileData);
                addMediaMessage(userName, fileData, true);
            }
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
    
    closeCameraModal();
}

function startVideoRecording() {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(currentStream, {
        mimeType: 'video/webm'
    });
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        
        // Check size (max 10MB)
        if (blob.size > 10 * 1024 * 1024) {
            showError('Video size must be less than 10MB');
            closeCameraModal();
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                room: currentRoom,
                userId: userId,
                userName: userName,
                type: 'video',
                data: e.target.result,
                fileName: `video_${Date.now()}.webm`,
                mimeType: 'video/webm',
                timestamp: new Date().toISOString()
            };
            
            if (localMode) {
                addMediaMessage(userName, fileData, true);
            } else if (socket) {
                socket.emit('media-message', fileData);
                addMediaMessage(userName, fileData, true);
            }
        };
        reader.readAsDataURL(blob);
        
        closeCameraModal();
    };
    
    mediaRecorder.start();
    
    // Update UI
    document.getElementById('capture-btn').style.display = 'none';
    document.getElementById('stop-recording-btn').style.display = 'block';
    document.getElementById('recording-indicator').style.display = 'flex';
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

function closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    modal.classList.remove('active');
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    if (mediaRecorder) {
        mediaRecorder = null;
    }
}

function addLoadingMessage(text) {
    const container = document.getElementById('messages-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'media-loading';
    loadingDiv.id = 'loading-message';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <span>${text}</span>
    `;
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;
}

function removeLoadingMessage() {
    const loading = document.getElementById('loading-message');
    if (loading) {
        loading.remove();
    }
}

function addMediaMessage(senderName, fileData, isOwn) {
    const container = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (isOwn ? ' own' : '');
    
    const time = new Date(fileData.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const displayName = isOwn ? 'You' : escapeHtml(senderName);
    
    let mediaContent = '';
    
    if (fileData.type === 'image') {
        mediaContent = `<div class="message-media">
            <img src="${fileData.data}" alt="Shared image" onclick="window.open(this.src, '_blank')">
        </div>`;
    } else if (fileData.type === 'video') {
        mediaContent = `<div class="message-media">
            <video controls src="${fileData.data}"></video>
        </div>`;
    } else if (fileData.type === 'file') {
        const fileSizeKB = (fileData.fileSize / 1024).toFixed(2);
        mediaContent = `<div class="file-attachment">
            <span class="file-icon">📄</span>
            <div class="file-info">
                <div class="file-name">${escapeHtml(fileData.fileName)}</div>
                <div class="file-size">${fileSizeKB} KB</div>
            </div>
            <a href="${fileData.data}" download="${fileData.fileName}" class="file-download">Download</a>
        </div>`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${displayName}</span>
            <span class="message-time">${time}</span>
        </div>
        ${mediaContent}
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Media handling variables
let currentStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let currentCameraMode = 'photo';
let currentFacingMode = 'user';

// Listen for Enter key in message input
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Close media menu when clicking outside
    document.addEventListener('click', (e) => {
        const mediaMenu = document.getElementById('media-menu');
        const mediaButton = document.querySelector('.btn-media');
        
        if (mediaMenu && !mediaMenu.contains(e.target) && !mediaButton.contains(e.target)) {
            mediaMenu.classList.remove('active');
        }
    });
    
    // Listen for Enter key in room code inputs
    document.getElementById('new-user-name')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('new-room-code').focus();
    });
    
    document.getElementById('new-room-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createRoom();
    });
    
    document.getElementById('join-user-name')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('join-room-code').focus();
    });
    
    document.getElementById('join-room-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom();
    });
});

function addMessage(senderName, message, timestamp, isOwn, type = 'text') {
    const container = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (isOwn ? ' own' : '');
    
    const time = new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const displayName = isOwn ? 'You' : escapeHtml(senderName);
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${displayName}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(message)}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function addSystemMessage(message) {
    const container = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (connected) {
        indicator.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const activeScreen = document.querySelector('.screen.active');
    
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
        errorDiv.remove();
    }, 3000);
}
