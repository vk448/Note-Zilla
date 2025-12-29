function loadUsers() {
  db.ref("users").on("value", snap => {
    userList.innerHTML = "";
    snap.forEach(u => {
      if (u.key === currentUser.uid) return;
      const div = document.createElement("div");
      div.textContent = u.val().name || u.val().email;
      div.onclick = () => openChat(u.key);
      userList.appendChild(div);
    });
  });
}

function openChat(uid) {
  otherUserId = uid;
  currentChatId = [currentUser.uid, uid].sort().join("_");
  messages.innerHTML = "";
  chatTitle.innerText = "Chat";

  listenTyping();

  db.ref("chats/" + currentChatId).on("child_added", snap => {
    const msg = snap.val();

    if (msg.sender !== currentUser.uid) {
      db.ref(`chats/${currentChatId}/${snap.key}/seen/${currentUser.uid}`).set(true);
    }

    renderMessage(msg);
  });
}

function sendMessage() {
  if (!msgInput.value) return;

  db.ref("chats/" + currentChatId).push({
    sender: currentUser.uid,
    text: msgInput.value,
    time: Date.now()
  });

  msgInput.value = "";
}

function renderMessage(msg) {
  const div = document.createElement("div");
  const sent = msg.sender === currentUser.uid;
  const seen = msg.seen && Object.keys(msg.seen).length > 1;

  div.className = "msg " + (sent ? "sent" : "recv");
  div.innerHTML = msg.text + (sent ? (seen ? " ✔✔" : " ✔") : "");
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
