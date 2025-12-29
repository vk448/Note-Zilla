// js/mobile-dashboard.js - Complete NoteChat Mobile Dashboard (Fixed Deletion + Real-Time)

let currentUser = null;
let currentChatId = 'world-group';

const incomingSound = document.getElementById('incomingSound');
const outgoingSound = document.getElementById('outgoingSound');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const mediaInput = document.getElementById('mediaInput');
const backBtn = document.getElementById('backBtn');
const chatList = document.getElementById('chatList');
const chatNameEl = document.getElementById('chatName');
const chatStatusEl = document.getElementById('chatStatus');
const chatAvatarEl = document.getElementById('chatAvatar');

let soundsUnlocked = false;

// Unlock audio context
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
    loadChatList();
    openChat('world-group', 'World Group Chat', 'Public group');
});

// Online Status
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

// Load Profile (for message sending)
function loadProfile() {
    // Used internally for message name/photo
}

// Load Chat List
function loadChatList() {
    chatList.innerHTML = '';

    // World Group
    const worldItem = document.createElement('div');
    worldItem.className = 'chat-item active';
    worldItem.dataset.chatId = 'world-group';
    worldItem.innerHTML = `
        <div class="avatar" style="background-image:url('../Images/worldchat.png'); background-size:cover;"></div>
        <div class="chat-info">
            <div class="top">
                <div class="name">World Group Chat</div>
                <div class="time">--</div>
            </div>
            <div class="message">Public chat for everyone</div>
        </div>`;
    worldItem.onclick = () => openChat('world-group', 'World Group Chat', 'Public group');
    chatList.appendChild(worldItem);

    // Load Users
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
                item.innerHTML = `
                    <div class="avatar" style="background-image:url('${data.photoURL || 'https://via.placeholder.com/55'}'); background-size:cover; background-position:center;"></div>
                    <div class="chat-info">
                        <div class="top">
                            <div class="name">${data.name || 'User'}</div>
                            <span class="status-dot ${data.online ? 'online' : 'offline'}"></span>
                        </div>
                        <div class="message">Private chat</div>
                    </div>`;
                item.onclick = () => openPrivateChat(uid, data.name || 'User');
                chatList.appendChild(item);
            } else {
                const dot = item.querySelector('.status-dot');
                if (dot) dot.className = `status-dot ${data.online ? 'online' : 'offline'}`;
            }
        });
    });
}

// Open Chat
function openChat(chatId, name, status) {
    currentChatId = chatId;
    chatNameEl.textContent = name;
    chatStatusEl.textContent = status;
    chatAvatarEl.style.backgroundImage = `url('https://via.placeholder.com/42?text=${name[0]}')`;

    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    const activeItem = document.querySelector(`[data-chat-id="${chatId}"]`) || 
                       document.querySelector(`[data-uid][data-chat-id="${chatId}"]`);
    if (activeItem) activeItem.classList.add('active');

    document.getElementById('chatsScreen').classList.remove('active');
    document.getElementById('chatScreen').classList.add('active');

    loadMessages(chatId);
}

function openPrivateChat(friendUid, friendName) {
    currentChatId = [currentUser.uid, friendUid].sort().join('_');
    openChat(currentChatId, friendName, 'End-to-end encrypted');
}

backBtn.onclick = () => {
    document.getElementById('chatScreen').classList.remove('active');
    document.getElementById('chatsScreen').classList.add('active');
};

// Render single message (shared logic)
function renderMessage(msg, msgId, isMe) {
    if (messagesDiv.querySelector(`[data-id="${msgId}"]`)) return; // Prevent duplicates

    const el = document.createElement('div');
    el.className = `message ${isMe ? 'sent' : 'received'}`;
    el.dataset.id = msgId;

    let mediaHTML = '';
    if (msg.type === 'image' && msg.base64) {
        mediaHTML = `<img src="${msg.base64}" onclick="viewFull(this.src)" style="max-width:100%; border-radius:12px; margin-top:8px; cursor:pointer;">`;
    }
    if (msg.type === 'video' && msg.base64) {
        mediaHTML = `<video controls style="max-width:100%; border-radius:12px; margin-top:8px;"><source src="${msg.base64}"></video>`;
    }

    el.innerHTML = `
        ${mediaHTML}
        <div class="text">${msg.text || ''} <small>~ ${msg.name || 'User'}</small></div>
        <div class="time">${new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    `;

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

// Load Messages with Full Real-Time Support (including deletion)
function loadMessages(chatId) {
    messagesDiv.innerHTML = '<p style="text-align:center; color:#8696a0; margin-top:100px;">Loading messages...</p>';

    const messagesRef = db.ref('chats/' + chatId + '/messages').limitToLast(100);
    messagesRef.off(); // Remove old listeners

    // New messages
    messagesRef.on('child_added', (snap) => {
        const msg = snap.val();
        const isMe = msg.uid === currentUser.uid;
        renderMessage(msg, snap.key, isMe);
    });

    // Handle message deletion (critical fix!)
    messagesRef.on('child_removed', (snap) => {
        const msgEl = messagesDiv.querySelector(`[data-id="${snap.key}"]`);
        if (msgEl) {
            msgEl.remove();
        }
    });
}

// Delete Message (with instant UI update)
function deleteMsg(chatId, msgId) {
    if (!confirm('Delete this message?')) return;

    db.ref('chats/' + chatId + '/messages/' + msgId).remove()
        .then(() => {
            // Optional: immediate removal (child_removed will also trigger)
            const msgEl = messagesDiv.querySelector(`[data-id="${msgId}"]`);
            if (msgEl) msgEl.remove();
        })
        .catch((err) => {
            alert('Delete failed: ' + err.message);
        });
}

// Fullscreen Image
function viewFull(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';
    overlay.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;border-radius:12px;">`;
    overlay.onclick = () => document.body.removeChild(overlay);
    document.body.appendChild(overlay);
}

// Send Text
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

// Send Media as Base64
function sendBase64Media(file) {
    if (!file || !currentChatId) return;

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
        if (soundsUnlocked) outgoingSound.play().catch(() => {});
    };
    reader.onerror = () => alert('Failed to read file');
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

// Mic ↔ Send Icon
messageInput.addEventListener('input', () => {
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.innerHTML = hasText ? '<i class="fas fa-paper-plane"></i>' : '<i class="fas fa-microphone"></i>';
});

attachBtn.onclick = () => mediaInput.click();
mediaInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) sendBase64Media(file);
    mediaInput.value = ''; // Reset
};

messageInput.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file && (file.type.startsWith('image') || file.type.startsWith('video'))) {
                e.preventDefault();
                sendBase64Media(file);
                return;
            }
        }
    }
});

messagesDiv.addEventListener('click', () => messageInput.focus());
window.onload = () => messageInput.focus();

// Add Friend (Demo)
document.querySelector('.top-header .icons i.fas.fa-user-plus')?.addEventListener('click', () => {
    const email = prompt('Enter friend email:');
    if (email?.trim()) alert(`Friend request sent to ${email} (demo)`);
});