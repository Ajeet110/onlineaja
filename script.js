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
    // Connect to server - use explicit URL for production or window.location.origin
    const socketUrl = window.SERVER_URL || 'https://ajeetup82.blitz.cloud';
    
    console.log('═══════════════════════════════════════════');
    console.log('🔌 WebSocket Connection Configuration');
    console.log('═══════════════════════════════════════════');
    console.log('Script Version: 2024-09-30-v2');
    console.log('Socket URL:', socketUrl);
    console.log('Current location:', window.location.href);
    console.log('window.SERVER_URL:', window.SERVER_URL || 'not set');
    console.log('═══════════════════════════════════════════');
    
    try {
        socket = io(socketUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 10000,
            transports: ['websocket', 'polling']  // Try WebSocket first, fallback to polling
        });
        
        socket.on('connect', () => {
            console.log('✓ Connected to server');
            console.log('Socket ID:', socket.id);
            updateConnectionStatus(true);
        });
        
        socket.on('connection-confirmed', (data) => {
            console.log('✓ Connection confirmed by server:', data);
        });
        
        socket.on('connect_error', (error) => {
            console.error('✗ Connection error:', error.message);
            console.error('Error details:', error);
            updateConnectionStatus(false);
            showError('Connection error: ' + error.message);
        });
        
        socket.on('connect_timeout', () => {
            console.error('✗ Connection timeout');
            updateConnectionStatus(false);
            showError('Connection timeout. Server may be unreachable.');
        });
        
        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}...`);
        });
        
        socket.on('reconnect_failed', () => {
            console.error('✗ Reconnection failed after all attempts');
            updateConnectionStatus(false);
            showError('Failed to reconnect to server.');
        });
        
        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server. Reason:', reason);
            updateConnectionStatus(false);
            
            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                socket.connect();
            }
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


// ==================== WEBRTC VOICE/VIDEO CALL FUNCTIONALITY ====================

let localStream = null;
let peerConnection = null;
let currentCallId = null;
let currentCallType = null;
let callTimer = null;
let callStartTime = null;
let isMuted = false;
let isVideoEnabled = true;
let incomingCallData = null;

// WebRTC Configuration
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Start Voice Call
async function startVoiceCall() {
    if (!currentRoom) {
        showError('Join a room first');
        return;
    }
    
    currentCallType = 'voice';
    currentCallId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        // Get audio stream
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: false 
        });
        
        // Notify server
        socket.emit('call-initiate', {
            room: currentRoom,
            callType: 'voice',
            callId: currentCallId
        });
        
        // Show call UI
        showCallModal('voice');
        updateCallStatus('Calling...');
        
    } catch (error) {
        console.error('Error starting voice call:', error);
        showError('Could not access microphone: ' + error.message);
    }
}

// Start Video Call
async function startVideoCall() {
    if (!currentRoom) {
        showError('Join a room first');
        return;
    }
    
    currentCallType = 'video';
    currentCallId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        // Get audio and video stream
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: { width: 1280, height: 720 } 
        });
        
        // Notify server
        socket.emit('call-initiate', {
            room: currentRoom,
            callType: 'video',
            callId: currentCallId
        });
        
        // Show call UI
        showCallModal('video');
        updateCallStatus('Calling...');
        
        // Show local video
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
    } catch (error) {
        console.error('Error starting video call:', error);
        showError('Could not access camera/microphone: ' + error.message);
    }
}

// Show Call Modal
function showCallModal(type) {
    const modal = document.getElementById('call-modal');
    const title = document.getElementById('call-title');
    const videoContainer = document.getElementById('video-container');
    const videoToggle = document.getElementById('video-toggle-btn');
    
    if (type === 'video') {
        title.textContent = 'Video Call';
        videoContainer.style.display = 'block';
        videoToggle.style.display = 'block';
    } else {
        title.textContent = 'Voice Call';
        videoContainer.style.display = 'none';
        videoToggle.style.display = 'none';
    }
    
    modal.classList.add('active');
    startCallTimer();
}

// Handle Incoming Call
socket.on('call-incoming', (data) => {
    console.log('Incoming call:', data);
    incomingCallData = data;
    
    // Show incoming call UI
    const modal = document.getElementById('incoming-call-modal');
    const fromName = document.getElementById('incoming-call-from');
    const callType = document.getElementById('incoming-call-type');
    
    fromName.textContent = `${data.fromName || 'Someone'} is calling`;
    callType.textContent = data.callType === 'video' ? 'Video Call' : 'Voice Call';
    
    modal.classList.add('active');
    
    // Play ringtone (optional)
    playRingtone();
});

// Answer Call
async function answerCall() {
    if (!incomingCallData) return;
    
    const modal = document.getElementById('incoming-call-modal');
    modal.classList.remove('active');
    stopRingtone();
    
    currentCallId = incomingCallData.callId;
    currentCallType = incomingCallData.callType;
    
    try {
        // Get media stream
        const constraints = {
            audio: true,
            video: currentCallType === 'video'
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Notify server
        socket.emit('call-answer', { callId: currentCallId });
        
        // Show call UI
        showCallModal(currentCallType);
        updateCallStatus('Connected');
        
        if (currentCallType === 'video') {
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = localStream;
            }
        }
        
        // Setup WebRTC connection
        await setupPeerConnection(incomingCallData.from);
        
    } catch (error) {
        console.error('Error answering call:', error);
        showError('Could not answer call: ' + error.message);
    }
}

// Reject Call
function rejectCall() {
    if (!incomingCallData) return;
    
    const modal = document.getElementById('incoming-call-modal');
    modal.classList.remove('active');
    stopRingtone();
    
    // Notify server (optional)
    socket.emit('call-end', { callId: incomingCallData.callId });
    
    incomingCallData = null;
}

// Setup Peer Connection
async function setupPeerConnection(remotePeerId) {
    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Handle incoming stream
    peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo && event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
        }
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
                to: remotePeerId,
                candidate: event.candidate,
                callId: currentCallId
            });
        }
    };
    
    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit('webrtc-offer', {
        to: remotePeerId,
        offer: offer,
        callId: currentCallId
    });
}

// Handle WebRTC Signaling
socket.on('webrtc-offer', async (data) => {
    console.log('Received WebRTC offer');
    
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(rtcConfiguration);
        
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remote-video');
            if (remoteVideo && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
        
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', {
                    to: data.from,
                    candidate: event.candidate,
                    callId: data.callId
                });
            }
        };
    }
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('webrtc-answer', {
        to: data.from,
        answer: answer,
        callId: data.callId
    });
});

socket.on('webrtc-answer', async (data) => {
    console.log('Received WebRTC answer');
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    updateCallStatus('Connected');
});

socket.on('webrtc-ice-candidate', async (data) => {
    if (peerConnection && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// End Call
function endCall() {
    // Stop media streams
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Notify server
    if (currentCallId) {
        socket.emit('call-end', { callId: currentCallId });
    }
    
    // Hide call UI
    const modal = document.getElementById('call-modal');
    modal.classList.remove('active');
    
    // Reset call state
    stopCallTimer();
    currentCallId = null;
    currentCallType = null;
    isMuted = false;
    isVideoEnabled = true;
}

// Handle Call Ended by Others
socket.on('call-ended', (data) => {
    console.log('Call ended:', data);
    endCall();
    
    if (data.reason) {
        showError('Call ended: ' + data.reason.replace('-', ' '));
    } else {
        addSystemMessage('Call ended');
    }
});

// Call Answered by Someone
socket.on('call-answered', (data) => {
    console.log('Call answered by:', data.byName);
    updateCallStatus('Connected');
    addSystemMessage(`${data.byName} joined the call`);
});

// Toggle Mute
function toggleMute() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMuted = !audioTrack.enabled;
        
        const muteBtn = document.getElementById('mute-btn');
        if (isMuted) {
            muteBtn.classList.add('muted');
            muteBtn.querySelector('span').textContent = '🎤⛔';
        } else {
            muteBtn.classList.remove('muted');
            muteBtn.querySelector('span').textContent = '🎤';
        }
    }
}

// Toggle Video
function toggleVideo() {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isVideoEnabled = videoTrack.enabled;
        
        const videoBtn = document.getElementById('video-toggle-btn');
        if (!isVideoEnabled) {
            videoBtn.classList.add('video-off');
            videoBtn.querySelector('span').textContent = '📹⛔';
        } else {
            videoBtn.classList.remove('video-off');
            videoBtn.querySelector('span').textContent = '📹';
        }
    }
}

// Call Timer
function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(updateCallTimer, 1000);
}

function updateCallTimer() {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    const timerElement = document.getElementById('call-timer');
    if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds}`;
    }
}

function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    callStartTime = null;
}

// Update Call Status
function updateCallStatus(status) {
    const statusElement = document.getElementById('call-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// Ringtone Functions
let ringtoneAudio = null;

function playRingtone() {
    // Create audio element for ringtone (you can add an actual audio file)
    ringtoneAudio = new Audio();
    ringtoneAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGG06+mjUBELTqTj7bllHAU2jdXyy3knBSp+y/DbkUALF1+z6OyrVBILSKDh7r9sIAU';
    ringtoneAudio.loop = true;
    ringtoneAudio.play().catch(e => console.log('Could not play ringtone:', e));
}

function stopRingtone() {
    if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio = null;
    }
}

// Handle Call Recording Started (for transparency)
socket.on('call-recording-started', (data) => {
    addSystemMessage('⚠️ This call is being recorded by admin');
    const statusElement = document.getElementById('call-status');
    if (statusElement) {
        statusElement.innerHTML = 'Connected <span style="color: #ff5252;">● REC</span>';
    }
});

console.log('✓ WebRTC call functionality initialized');
