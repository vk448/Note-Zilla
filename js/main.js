let myId = "";
let myName = "";
let myPhoto = "";
let currentChat = null;
let isWorldGroup = false;
let unreadCounts = {};
let userInteracted = false;

const incoming = document.getElementById('incoming');
const outgoing = document.getElementById('outgoing');
const typingSound = document.getElementById('typingSound');

function playSound(sound) {
    if (userInteracted) sound.play().catch(() => {});
}

document.body.addEventListener('click', () => userInteracted = true, { once: true });
document.body.addEventListener('keydown', () => userInteracted = true, { once: true });

document.getElementById('joinBtn').onclick = () => {
    userInteracted = true;
    myName = document.getElementById('nameInput').value.trim();
    if (!myName) return alert("Enter name!");

    const file = document.getElementById('profilePhoto').files[0];
    const reader = new FileReader();
    reader.onload = e => {
        myPhoto = e.target.result;
        startApp();
    };
    if (file) reader.readAsDataURL(file);
    else {
        myPhoto = `https://via.placeholder.com/120/00a884/ffffff?text=${encodeURIComponent(myName[0])}`;
        startApp();
    }
};

function startApp() {
    myId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    document.getElementById('nameScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('myName').textContent = myName;
    document.getElementById('myAvatar').src = myPhoto;

    db.ref('users/' + myId).set({
        name: myName,
        photo: myPhoto,
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });

    db.ref('users/' + myId).onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });

    loadUsers();
    document.getElementById('worldGroupBtn').onclick = openWorldGroup;
    handleResize();
}

function loadUsers() {
    db.ref('users').on('value', snap => {
        const users = snap.val() || {};
        const list = document.getElementById('chatList');
        list.innerHTML = '';

        Object.entries(users).forEach(([id, u]) => {
            if (id === myId) return;
            const el = document.createElement('div');
            el.className = 'chat-item';
            el.onclick = () => openChat(id, u);
            const unread = unreadCounts[id] || 0;
            el.innerHTML = `
                <img src="${u.photo}">
                <div class="chat-info">
                    <h4>${u.name}</h4>
                    <p>${u.online ? '<span style="color:#00d95f">Online</span>' : 'Last seen recently'}</p>
                </div>
                ${u.online ? '<div class="online-dot"></div>' : ''}
                ${unread > 0 ? '<div class="unread-count">' + (unread > 99 ? '99+' : unread) + '</div>' : ''}
            `;
            list.appendChild(el);
        });
    });
}

function openWorldGroup() {
    isWorldGroup = true;
    currentChat = 'world_group';
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    document.getElementById('partnerName').textContent = 'World Group Chat';
    document.getElementById('partnerAvatar').src = 'images/worldchat.png';
    document.getElementById('partnerStatus').textContent = 'Public group - Everyone';
    document.getElementById('messages').innerHTML = '';

    const ref = db.ref('chats/world_group');
    ref.off();
    ref.on('child_added', snap => {
        const msg = snap.val();
        if (msg.sender !== myId) playSound(incoming);
        displayMessage(msg, true);
    });

    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.add('hidden');
        document.getElementById('backBtn').style.display = 'block';
    }
}

function openChat(uid, user) {
    isWorldGroup = false;
    currentChat = [myId, uid].sort().join('_');
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    event.currentTarget.classList.add('active');

    document.getElementById('partnerName').textContent = user.name;
    document.getElementById('partnerAvatar').src = user.photo;
    document.getElementById('messages').innerHTML = '';

    unreadCounts[uid] = 0;
    loadUsers();

    const ref = db.ref('chats/' + currentChat);
    ref.off();
    ref.on('child_added', snap => {
        const msg = snap.val();
        if (msg.sender !== myId) playSound(incoming);
        displayMessage(msg);
    });

    db.ref('typing/' + uid + '_' + myId).on('value', s => {
        document.getElementById('partnerStatus').innerHTML = s.val() 
            ? '<em style="color:#00d95f">typing...</em>' 
            : (user.online ? '<span style="color:#00d95f">Online</span>' : 'Last seen recently');
        if (s.val()) playSound(typingSound);
    });

    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.add('hidden');
        document.getElementById('backBtn').style.display = 'block';
    }
}

function displayMessage(msg, group = false) {
    const sent = msg.sender === myId;
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sent ? 'sent' : 'received'}`;
    bubble.dataset.msgId = msg.msgId;

    let content = group && !sent ? `<div class="group-sender">${msg.senderName || 'User'}</div>` : '';
    if (msg.text) content += `<div class="msg-text">${msg.text}</div>`;
    if (msg.photo) content += `<img src="${msg.photo}" class="msg-media" onclick="openImageModal('${msg.photo}')">`;
    if (msg.video) content += `<video controls class="msg-media"><source src="${msg.video}"></source></video>`;
    if (msg.audio) content += `<audio controls class="msg-audio"><source src="${msg.audio}"></source></audio>`;

    content += `<div class="msg-time">${new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>`;

    if (sent) {
        content += `<div class="msg-menu" onclick="deleteMessage('${msg.msgId}')">🗑️</div>`;
    }

    bubble.innerHTML = content;

    // Right click context menu
    if (sent) {
        bubble.addEventListener('contextmenu', e => {
            e.preventDefault();
            showContextMenu(e.pageX, e.pageY, msg.msgId);
        });
    }

    document.getElementById('messages').appendChild(bubble);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

let contextMenu = null;

function showContextMenu(x, y, msgId) {
    if (contextMenu) contextMenu.remove();

    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `<div class="context-menu-item" onclick="deleteMessage('${msgId}')">Delete Message</div>`;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.style.display = 'block';
    document.body.appendChild(contextMenu);

    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.remove();
    }, { once: true });
}

function deleteMessage(msgId) {
    if (confirm('Delete this message?')) {
        const path = isWorldGroup ? 'chats/world_group' : 'chats/' + currentChat;
        db.ref(path + '/' + msgId).remove();
    }
}

function openImageModal(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').style.display = 'flex';
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

document.getElementById('imageModal').onclick = e => {
    if (e.target === document.getElementById('imageModal')) closeImageModal();
};

// ... rest of sendMessage, paste, responsive code same as previous

// (Keep the rest from previous main.js: sendMessage, paste, handleResize, backBtn, etc.)

// Final responsive code (add at end)
function handleResize() {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('hidden');
        document.getElementById('backBtn').style.display = 'none';
    } else {
        if (currentChat) {
            document.querySelector('.sidebar').classList.add('hidden');
            document.getElementById('backBtn').style.display = 'block';
        } else {
            document.querySelector('.sidebar').classList.remove('hidden');
            document.getElementById('backBtn').style.display = 'none';
        }
    }
}

window.addEventListener('resize', handleResize);

document.getElementById('backBtn').onclick = () => {
    document.querySelector('.sidebar').classList.remove('hidden');
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('partnerName').textContent = 'Select a chat';
    document.getElementById('partnerStatus').textContent = 'Click a user or group';
    document.getElementById('messages').innerHTML = '';
    currentChat = null;
    isWorldGroup = false;
};

handleResize();