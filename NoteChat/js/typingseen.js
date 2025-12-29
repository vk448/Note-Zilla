let typingTimer;

msgInput.addEventListener("input", () => {
  if (!currentChatId) return;
  db.ref(`typing/${currentChatId}/${currentUser.uid}`).set(true);

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    db.ref(`typing/${currentChatId}/${currentUser.uid}`).remove();
  }, 1200);
});

function listenTyping() {
  db.ref(`typing/${currentChatId}`).on("value", snap => {
    const data = snap.val() || {};
    const others = Object.keys(data).filter(u => u !== currentUser.uid);
    typing.innerText = others.length ? "typing..." : "";
  });
}
