# Quick Test Guide - Call Features

## ✅ ALL ISSUES FIXED

### What Was Fixed:
1. ✅ Call buttons now functional (WebRTC listeners moved inside initSocket)
2. ✅ Call buttons styled like WhatsApp (in chat header, right side)
3. ✅ Incoming call modal only shows when receiving call
4. ✅ Socket connection validated before emitting call events
5. ✅ Cache-busting updated to v3

## How to Test (After Deployment)

### Setup:
1. Open two browser windows/tabs
2. Both navigate to: `https://ajeetup82.blitz.cloud`

### Test Steps:

#### Window 1 (Alice):
```
1. Click "New Chat"
2. Name: Alice
3. Room Code: 12345
4. Click "Create Room"
5. Wait for "Connected" status
```

#### Window 2 (Bob):
```
1. Click "Join Chat"
2. Name: Bob
3. Room Code: 12345
4. Click "Join Room"
5. Wait for "Connected" status
```

### Test Voice Call:

**In Window 1 (Alice):**
1. Click the 📞 (phone) button in chat header
2. Should see call modal with "Calling..."
3. Browser asks for microphone permission → Allow

**In Window 2 (Bob):**
1. Should see incoming call modal
2. Shows "Alice is calling"
3. Shows "Voice Call"
4. Click "✓ Answer"
5. Browser asks for microphone permission → Allow

**Both Windows:**
- Should show call timer counting up (00:00, 00:01, 00:02...)
- Test mute button 🎤
- Test end call button 📞

### Test Video Call:

**In Window 2 (Bob):**
1. After ending previous call, click 📹 (video) button
2. Should see call modal with "Calling..."
3. Browser asks for camera+microphone → Allow
4. Should see your own video in small box

**In Window 1 (Alice):**
1. Should see incoming call modal
2. Shows "Bob is calling"
3. Shows "Video Call"
4. Click "✓ Answer"
5. Browser asks for camera+microphone → Allow

**Both Windows:**
- Should see other person's video in large view
- Should see own video in small bottom-right box
- Test mute 🎤
- Test video off 📹
- Test end call 📞

### Test Reject:

**In Window 1 (Alice):**
1. Click 📞 to call

**In Window 2 (Bob):**
1. Click "✕ Reject" on incoming call modal
2. Modal should disappear
3. No call should be established

## Expected Results

✅ **Call Buttons:**
- Visible in chat header (not on home screen)
- Only visible when in a chat room
- 📞 button for voice (green on hover)
- 📹 button for video (blue on hover)

✅ **Incoming Call:**
- Modal ONLY appears when someone calls
- Shows caller's name
- Shows call type (Voice/Video)
- Accept and Reject buttons work
- Ringtone plays (if configured)

✅ **During Call:**
- Timer counts up: 00:00, 00:01, 00:02...
- Mute button toggles (🎤 ↔ 🎤⛔)
- Video button toggles for video calls (📹 ↔ 📹⛔)
- End call button terminates call

✅ **Console Logs:**
```
Script Version: 2024-09-30-v3
✓ Connected to server
Incoming call: { ... }
Received WebRTC offer
✓ WebRTC call functionality initialized
```

## If Something Doesn't Work

### Call buttons don't respond:
- Check browser console for errors
- Verify socket connection (status should show "Connected")
- Make sure you're in a chat room
- Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)

### No incoming call modal:
- Check if other user is in the same room
- Check browser console for `call-incoming` event
- Verify socket connection on both sides

### No audio/video:
- Check browser permissions (camera/microphone)
- Check browser console for getUserMedia errors
- Try allowing permissions and calling again

### "Not connected to server" error:
- Wait for connection status to show "Connected"
- Check server is running
- Check network connection

## Browser Console Commands for Debugging

```javascript
// Check socket status
socket.connected

// Check current room
currentRoom

// Check if in call
currentCallId

// Check local stream
localStream

// Check peer connection
peerConnection
```

---

**Ready to Test!** 🚀
