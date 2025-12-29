// dashboard.js - NoteChat Dashboard with Base64 Media Send (Fixed Deletion + Real-Time Updates)

let currentUser = null;
let currentChatId = null;

const incomingSound = document.getElementById('incomingSound');
const outgoingSound = document.getElementById('outgoingSound');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const mediaInput = document.getElementById('mediaInput');

let soundsUnlocked = false;

// Unlock audio context on first user interaction
function unlockSounds() {
    if (soundsUnlocked) return;
    soundsUnlocked = true;
    outgoingSound.play().catch(() => {});
    incomingSound.play().catch(() => {});
    outgoingSound.pause(); outgoingSound.currentTime = 0;
    incomingSound.pause(); incomingSound.currentTime = 0;
}
document.body.addEventListener('click', unlockSounds, { once: true });
document.body.addEventListener('keydown', unlockSounds, { once: true });

// Firebase Auth Check
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login-notechat.html';
        return;
    }
    currentUser = user;
    setupOnlineStatus();
    loadProfile();
    loadUsersAndChats();

    // Auto-open World Group after a short delay
    setTimeout(() => {
        const world = document.querySelector('[data-chat-id="world-group"]');
        if (world) world.click();
    }, 1000);
});

// Set Online Status in Realtime Database
function setupOnlineStatus() {
    const statusRef = db.ref('status/' + currentUser.uid);
    const userData = {
        name: currentUser.displayName || currentUser.email.split('@')[0],
        photoURL: currentUser.photoURL || '',
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    };
    statusRef.set(userData);
    statusRef.onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
}

// Load Current User Profile (Top Left)
function loadProfile() {
    const name = currentUser.displayName || currentUser.email.split('@')[0];
    const photo = currentUser.photoURL || `https://via.placeholder.com/40?text=${name[0].toUpperCase()}`;
    const profilePic = document.getElementById('profilePic');
    profilePic.src = photo;
    profilePic.onclick = () => document.getElementById('profileModal').style.display = 'flex';
}

// Load Users List + World Group Chat
function loadUsersAndChats() {
    const list = document.getElementById('userList');
    list.innerHTML = '';

    // World Group Chat Item
    const worldItem = document.createElement('div');
    worldItem.className = 'chat-item active';
    worldItem.dataset.chatId = 'world-group';
    worldItem.innerHTML = `
        <div class="avatar" style="background-image:url('../Images/worldchat.png'); background-size:cover;"></div>
        <div class="chat-info">
            <div class="top">
                <div class="name">World Group Chat</div>
                <span class="status-dot online"></span>
            </div>
            <div class="message">Public chat for everyone</div>
        </div>`;
    worldItem.onclick = () => openChat('world-group', 'World Group Chat', 'Public group');
    list.appendChild(worldItem);

    // Listen for other users' status
    db.ref('status').on('value', (snapshot) => {
        snapshot.forEach((child) => {
            const data = child.val();
            const uid = child.key;
            if (uid === currentUser.uid) return;

            let item = document.querySelector(`[data-uid="${uid}"]`);
            if (!item) {
                item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.uid = uid;
                item.dataset.chatId = [currentUser.uid, uid].sort().join('_');
                const photoBg = data.photoURL ? `url('${data.photoURL}')` : 'https://via.placeholder.com/50?text=U';
                item.innerHTML = `
                    <div class="avatar" style="background-image:${photoBg}; background-size:cover; background-position:center;"></div>
                    <div class="chat-info">
                        <div class="top">
                            <div class="name">${data.name || 'User'}</div>
                            <span class="status-dot ${data.online ? 'online' : 'offline'}"></span>
                        </div>
                        <div class="message">Private chat</div>
                    </div>`;
                item.onclick = () => openPrivateChat(uid, data.name || 'User');
                list.appendChild(item);
            } else {
                item.querySelector('.status-dot').className = `status-dot ${data.online ? 'online' : 'offline'}`;
            }
        });
    });
}

// Open Public/Group Chat
function openChat(chatId, name, status) {
    currentChatId = chatId;
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');
    document.getElementById('chatName').textContent = name;
    document.getElementById('chatStatus').textContent = status;
    document.getElementById('chatAvatar').style.backgroundImage = `url('https://via.placeholder.com/40?text=${name[0]}')`;
    loadMessages(chatId);
}

// Open Private Chat
function openPrivateChat(friendUid, friendName) {
    currentChatId = [currentUser.uid, friendUid].sort().join('_');
    openChat(currentChatId, friendName, 'End-to-end encrypted');
}

// Render a single message (used by child_added and to avoid duplicates)
function renderMessage(msg, msgId, isMe) {
    if (messagesDiv.querySelector(`[data-id="${msgId}"]`)) return; // Prevent duplicates

    const el = document.createElement('div');
    el.className = `message ${isMe ? 'sent' : 'received'}`;
    el.dataset.id = msgId;

    let mediaHTML = '';
    if (msg.type === 'image' && msg.base64) {
        mediaHTML = `<img src="${msg.base64}" onclick="viewFull(this.src)" style="max-width:320px; border-radius:12px; margin-top:8px; cursor:pointer;">`;
    }
    if (msg.type === 'video' && msg.base64) {
        mediaHTML = `<video controls style="max-width:320px; border-radius:12px; margin-top:8px;"><source src="${msg.base64}" type="video/mp4"></video>`;
    }

    el.innerHTML = `
        ${mediaHTML}
        <div class="text">${msg.text || ''} <small>~ ${msg.name || 'User'}</small></div>
        <div class="time">${new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    `;

    // Add delete button only for own messages
    if (isMe) {
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteMsg(currentChatId, msgId);
        el.appendChild(deleteBtn);
    }

    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (soundsUnlocked) {
        (isMe ? outgoingSound : incomingSound).play().catch(() => {});
    }
}

// Load Messages with Real-Time Listeners (including deletion support)
function loadMessages(chatId) {
    messagesDiv.innerHTML = '<p style="text-align:center; color:#8696a0; margin-top:100px;">Loading messages...</p>';

    const messagesRef = db.ref('chats/' + chatId + '/messages').limitToLast(100);
    messagesRef.off(); // Remove previous listeners

    // New messages
    messagesRef.on('child_added', (snap) => {
        const msg = snap.val();
        const isMe = msg.uid === currentUser.uid;
        renderMessage(msg, snap.key, isMe);
    });

    // Deleted messages - remove from DOM instantly
    messagesRef.on('child_removed', (snap) => {
        const msgEl = messagesDiv.querySelector(`[data-id="${snap.key}"]`);
        if (msgEl) {
            msgEl.remove();
        }
    });
}

// Delete Message (with confirmation and error handling)
function deleteMsg(chatId, msgId) {
    if (!confirm('Delete this message?')) return;

    db.ref('chats/' + chatId + '/messages/' + msgId).remove()
        .then(() => {
            // Optional: immediate local removal (child_removed will also trigger)
            const msgEl = messagesDiv.querySelector(`[data-id="${msgId}"]`);
            if (msgEl) msgEl.remove();
        })
        .catch((err) => {
            alert('Failed to delete message: ' + err.message);
        });
}

// Fullscreen Image Viewer
function viewFull(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';
    overlay.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;border-radius:12px;">`;
    overlay.onclick = () => document.body.removeChild(overlay);
    document.body.appendChild(overlay);
}

// Send Text Message
function sendText() {
    const text = messageInput.value.trim();
    if (!text || !currentChatId) return;

    const msg = {
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.email.split('@')[0],
        text: text,
        type: 'text',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('chats/' + currentChatId + '/messages').push(msg);
    messageInput.value = '';
    messageInput.focus();
    if (soundsUnlocked) outgoingSound.play().catch(() => {});
}

// Send Media as Base64 (Image/Video)
function sendBase64Media(file) {
    if (!file || !currentChatId) return;

    // Temporary "sending..." placeholder
    const tempEl = document.createElement('div');
    tempEl.className = 'message sent';
    tempEl.innerHTML = `<div class="text">Sending ${file.type.startsWith('video') ? 'video' : 'image'}...</div>`;
    messagesDiv.appendChild(tempEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;

        const msg = {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email.split('@')[0],
            text: '',
            type: file.type.startsWith('image') ? 'image' : 'video',
            base64: base64,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        db.ref('chats/' + currentChatId + '/messages').push(msg);
        tempEl.remove();
        if (soundsUnlocked) outgoingSound.play().catch(() => {});
    };
    reader.onerror = () => {
        tempEl.innerHTML = '<div class="text" style="color:red;">Failed to read file</div>';
    };
    reader.readAsDataURL(file);
}

// Event Listeners
sendBtn.onclick = sendText;

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendText();
    }
});

attachBtn.onclick = () => mediaInput.click();
mediaInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) sendBase64Media(file);
    mediaInput.value = ''; // Reset input
};

// Paste image/video support
messageInput.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file && (file.type.startsWith('image') || file.type.startsWith('video'))) {
                e.preventDefault();
                sendBase64Media(file);
                return;
            }
        }
    }
});

// Keep input focused
messagesDiv.addEventListener('click', () => messageInput.focus());
window.onload = () => messageInput.focus();

// Profile Modal Functions
document.getElementById('addFriendBtn').onclick = () => document.getElementById('addFriendModal').style.display = 'flex';

function addFriend() {
    const email = document.getElementById('friendEmail').value.trim();
    alert(email ? `Friend request sent to ${email} (demo)` : 'Enter email');
    document.getElementById('addFriendModal').style.display = 'none';
    document.getElementById('friendEmail').value = '';
}

function saveProfile() {
    const newName = document.getElementById('profileNameEdit').value.trim();
    const file = document.getElementById('profilePicInput').files[0];

    let updates = {};
    if (newName) updates.displayName = newName;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            updates.photoURL = e.target.result;
            applyProfileUpdates(updates);
        };
        reader.readAsDataURL(file);
        return;
    }

    if (Object.keys(updates).length > 0) {
        applyProfileUpdates(updates);
    } else {
        document.getElementById('profileModal').style.display = 'none';
    }
}

function applyProfileUpdates(updates) {
    currentUser.updateProfile(updates)
        .then(() => {
            return db.ref('status/' + currentUser.uid).update({
                name: updates.displayName || currentUser.displayName,
                photoURL: updates.photoURL || currentUser.photoURL
            });
        })
        .then(() => {
            loadProfile();
            alert('Profile updated successfully!');
            document.getElementById('profileModal').style.display = 'none';
        })
        .catch(err => alert('Error updating profile: ' + err.message));
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}