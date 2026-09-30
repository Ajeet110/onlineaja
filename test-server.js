// Quick server test script
const http = require('http');
const io = require('socket.io-client');

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

console.log('='.repeat(50));
console.log('SECRET CHAT SERVER CONNECTION TEST');
console.log('='.repeat(50));
console.log();

// Test 1: HTTP Health Check
console.log('Test 1: Testing HTTP health endpoint...');
http.get(`${SERVER_URL}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✓ Health endpoint OK');
            console.log('  Response:', data);
            console.log();
            
            // Test 2: API Status
            testApiStatus();
        } else {
            console.log('✗ Health endpoint failed');
            console.log('  Status code:', res.statusCode);
            process.exit(1);
        }
    });
}).on('error', (err) => {
    console.log('✗ Cannot connect to server');
    console.log('  Error:', err.message);
    console.log();
    console.log('Make sure the server is running:');
    console.log('  npm start');
    process.exit(1);
});

function testApiStatus() {
    console.log('Test 2: Testing API status endpoint...');
    http.get(`${SERVER_URL}/api/status`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✓ API status OK');
                console.log('  Response:', data);
                console.log();
                
                // Test 3: Socket.IO Connection
                testSocketIO();
            } else {
                console.log('✗ API status failed');
                process.exit(1);
            }
        });
    }).on('error', (err) => {
        console.log('✗ API status error:', err.message);
        process.exit(1);
    });
}

function testSocketIO() {
    console.log('Test 3: Testing Socket.IO connection...');
    
    const socket = io(SERVER_URL, {
        reconnection: false,
        timeout: 5000,
        transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
        console.log('✓ Socket.IO connected');
        console.log('  Socket ID:', socket.id);
        console.log();
        
        // Test 4: Connection Confirmation
        socket.on('connection-confirmed', (data) => {
            console.log('✓ Connection confirmed by server');
            console.log('  Data:', JSON.stringify(data));
            console.log();
            
            // Test 5: Create Room
            testCreateRoom(socket);
        });
    });
    
    socket.on('connect_error', (error) => {
        console.log('✗ Socket.IO connection error:', error.message);
        process.exit(1);
    });
    
    socket.on('connect_timeout', () => {
        console.log('✗ Socket.IO connection timeout');
        process.exit(1);
    });
}

function testCreateRoom(socket) {
    console.log('Test 4: Testing room creation...');
    
    const testData = {
        room: '12345',
        userId: 'test-user-001',
        userName: 'Test User'
    };
    
    socket.on('room-created', (data) => {
        console.log('✓ Room created successfully');
        console.log('  Room:', data.room);
        console.log('  User:', data.userName);
        console.log();
        
        // Cleanup
        socket.emit('leave-room', testData);
        
        setTimeout(() => {
            socket.disconnect();
            console.log('='.repeat(50));
            console.log('ALL TESTS PASSED ✓');
            console.log('='.repeat(50));
            console.log();
            console.log('Server is ready for connections!');
            console.log(`Main app: ${SERVER_URL}`);
            console.log(`Admin panel: ${SERVER_URL}/admin.html`);
            console.log();
            process.exit(0);
        }, 1000);
    });
    
    socket.on('error', (error) => {
        console.log('✗ Room creation error:', error.message);
        socket.disconnect();
        process.exit(1);
    });
    
    socket.emit('create-room', testData);
}
