// js/main.js - Main Chat Logic + Status/Story Feature

let currentUser = null;
let currentChatId = "";
let currentChatType = "private"; // "private", "group", "world"

// Sounds
const incoming = document.getElementById('incomingSound');
const outgoing = document.getElementById('outgoingSound');

function playSound(type) {
    const sound = type === "in" ? incoming : outgoing;
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

// Load User Data and Start App
function loadUser(user) {
    currentUser = user;
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Load user profile from database
    db.ref('users/' + user.uid).once('value').then(snap => {
        const data = snap.val() || {};
        const name = data.fullName || user.displayName || "User";
        const photo = data.photo || user.photoURL || "https://via.placeholder.com/120";

        document.getElementById('myName').textContent = name;
        document.getElementById('myAvatar').src = document.getElementById('myAvatarRail').src = photo;
        document.getElementById('myStatusPhoto').src = photo;
    });

    loadChats();
    loadStatus();
}

// Load All Chats (Private + Groups + World Group at top)
function loadChats() {
    const list = document.getElementById('chatList');
    list.innerHTML = '';

    // World Group - Always at top
    const worldItem = document.createElement('div');
    worldItem.className = 'chat-item group-chat';
    worldItem.innerHTML = `
        <img src="https://via.placeholder.com/49/00a884/ffffff?text=🌍" alt="">
        <div class="info">
            <h4>World Group Chat</h4>
            <p>Public group - Everyone</p>
        </div>
    `;
    worldItem.onclick = () => openChat("world_group", "World Group Chat", "https://via.placeholder.com/49/00a884/ffffff?text=🌍", "Public group");
    list.appendChild(worldItem);

    // Private chats
    db.ref('users').on('value', snap => {
        Object.entries(snap.val() || {}).forEach(([uid, u]) => {
            if (uid === currentUser.uid) return;
            const item = document.createElement('div');
            item.className = 'chat-item';
            item.innerHTML = `
                <img src="${u.photo}" alt="">
                <div class="info">
                    <h4>${u.fullName || u.displayName}</h4>
                    <p style="color:${u.online ? '#00ff85' : '#8696a0'}">${u.online ? 'Online' : 'Last seen recently'}</p>
                </div>
            `;
            item.onclick = () => openPrivateChat(uid, u);
            list.appendChild(item);
        });
    });
}

function openPrivateChat(uid, user) {
    currentChatId = [currentUser.uid, uid].sort().join('_');
    currentChatType = "private";
    openChatWindow(user.fullName || user.displayName, user.photo, user.online ? '<span style="color:#00ff85">Online</span>' : 'Last seen recently');
    loadMessages(`chats/${currentChatId}`);
}

function openChat(id, title, photo, status) {
    currentChatId = id;
    document.getElementById('chatTitle').innerHTML = title;
    document.getElementById('chatAvatar').src = photo;
    document.getElementById('chatStatus').innerHTML = status;
    document.getElementById('messages').innerHTML = '';
    document.getElementById('chatArea').classList.add('active');
    const path = id === "world_group" ? 'worldGroup' : 'chats/' + id;
    loadMessages(path);
}

function openChatWindow(title, photo, status) {
    document.getElementById('chatTitle').innerHTML = title;
    document.getElementById('chatAvatar').src = photo;
    document.getElementById('chatStatus').innerHTML = status;
    document.getElementById('messages').innerHTML = '';
    document.getElementById('chatArea').classList.add('active');
}

// Load Messages
function loadMessages(path) {
    db.ref(path).on('child_added', snap => {
        const msg = snap.val();
        if (msg.sender !== currentUser.uid) playSound('in');
        renderMessage(msg, snap.key);
    });

    db.ref(path).on('child_removed', snap => {
        const el = document.querySelector(`[data-id="${snap.key}"]`);
        if (el) el.remove();
    });
}

function renderMessage(msg, msgId) {
    const isSent = msg.sender === currentUser.uid;
    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    div.dataset.id = msgId;

    let content = msg.text || '';
    if (msg.image) content = `<img src="${msg.image}" class="msg-media" onclick="openModal('${msg.image}', 'image')">`;
    if (msg.video) content = `<video controls class="msg-media" onclick="openModal('${msg.video}', 'video')"><source src="${msg.video}"></source></video>`;
    if (msg.audio) content = `<audio controls><source src="${msg.audio}"></source></audio><br>🎤 Voice message`;

    div.innerHTML = `
        <div class="text">${content}</div>
        <div class="meta">
            ${new Date(msg.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            ${isSent ? '✓✓' : ''}
            ${isSent ? `<span class="delete-btn" onclick="deleteMessage('${msgId}')">🗑️</span>` : ''}
        </div>
    `;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function deleteMessage(msgId) {
    if (confirm("Delete this message?")) {
        const path = currentChatId === "world_group" ? 'worldGroup' : 'chats/' + currentChatId;
        db.ref(path + '/' + msgId).remove();
    }
}

// Send Message
function sendMessage(text = "", media = "", type = "text") {
    if (!currentChatId || (!text && !media)) return;

    const msg = {
        sender: currentUser.uid,
        text: text,
        time: firebase.database.ServerValue.TIMESTAMP
    };
    if (media) msg[type] = media;

    const path = currentChatId === "world_group" ? 'worldGroup' : 'chats/' + currentChatId;
    db.ref(path).push(msg).then(() => {
        playSound('out');
        document.getElementById('msgInput').value = '';
    });
}

document.getElementById('msgInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(document.getElementById('msgInput').value.trim());
    }
});

document.getElementById('backBtn').onclick = () => {
    document.getElementById('chatArea').classList.remove('active');
};

// Logout
document.getElementById('logoutBtn').onclick = () => {
    if (confirm("Are you sure you want to logout?")) {
        db.ref('users/' + currentUser.uid).update({ online: false });
        auth.signOut().then(() => {
            document.getElementById('app').classList.add('hidden');
            document.getElementById('authScreen').classList.remove('hidden');
            currentUser = null;
        });
    }
};

// Status Feature
document.getElementById('addStatusBtn').onclick = () => {
    document.getElementById('statusModal').style.display = 'flex';
};

function uploadStatus() {
    const file = document.getElementById('statusFile').files[0];
    const caption = document.getElementById('statusCaption').value.trim();

    if (!file) return alert("Select an image or video for status");

    const reader = new FileReader();
    reader.onload = (ev) => {
        const statusData = {
            uid: currentUser.uid,
            media: ev.target.result,
            type: file.type.startsWith('video') ? 'video' : 'image',
            caption: caption,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        db.ref('status').push(statusData).then(() => {
            alert("Status uploaded successfully!");
            document.getElementById('statusModal').style.display = 'none';
            document.getElementById('statusFile').value = '';
            document.getElementById('statusCaption').value = '';
        });
    };
    reader.readAsDataURL(file);
}

function loadStatus() {
    const list = document.getElementById('statusList');
    list.innerHTML = '';

    db.ref('status').orderByChild('timestamp').limitToLast(20).on('child_added', snap => {
        const status = snap.val();
        if (status.uid === currentUser.uid) return; // Skip own for "recent"

        db.ref('users/' + status.uid).once('value').then(userSnap => {
            const user = userSnap.val();
            const item = document.createElement('div');
            item.className = 'status-item';
            item.innerHTML = `
                <img src="${user.photo}" alt="">
                <p>${user.fullName || user.displayName}</p>
            `;
            item.onclick = () => viewStatus(status);
            list.appendChild(item);
        });
    });
}

function viewStatus(status) {
    if (status.type === 'image') {
        openModal(status.media, 'image');
    } else {
        openModal(status.media, 'video');
    }
}

// Modal
function openModal(src, type) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    const video = document.getElementById('modalVideo');

    if (type === 'image') {
        img.src = src;
        img.style.display = 'block';
        video.style.display = 'none';
    } else {
        video.src = src;
        video.style.display = 'block';
        img.style.display = 'none';
    }
    modal.style.display = 'flex';
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        document.getElementById('imageModal').style.display = 'none';
        document.getElementById('statusModal').style.display = 'none';
    };
});