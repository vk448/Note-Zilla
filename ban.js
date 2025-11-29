(function () {

  const msgInput = document.getElementById("msgInput");
  const sendBtn  = document.getElementById("sendBtn");

  if (!msgInput || !sendBtn) return console.error("msgInput/sendBtn missing");

  const db = firebase.database();
  const CHAT_REF = db.ref("megaChatChannel");

  let userIP = "unknown";
  let ABUSE_WORDS = [];
  let isLocked = false;
  let banRef = null;

  // --------------------------------------------------------
  // LOAD ABUSE WORDS
  // --------------------------------------------------------
  db.ref("abuseWords").on("value", snap => {
    const val = snap.val() || {};
    ABUSE_WORDS = Object.keys(val);
    console.log("🔥 LIVE ABUSE WORDS:", ABUSE_WORDS);
  });

  function containsAbuse(text) {
    if (!text) return false;
    text = text.toLowerCase();
    return ABUSE_WORDS.some(w => text.includes(w));
  }

  // --------------------------------------------------------
  // UI BLOCK
  // --------------------------------------------------------
  function blockUI(msg) {
    isLocked = true;
    msgInput.disabled = true;
    sendBtn.disabled = true;
    msgInput.placeholder = msg;
  }

  function unblockUI() {
    isLocked = false;
    msgInput.disabled = false;
    sendBtn.disabled = false;
    msgInput.placeholder = "Type message…";
  }

  function showToast(msg, error=false) {
    if (window.showToast) window.showToast(msg, error);
    else console.log("[TOAST]", msg);
  }

  // --------------------------------------------------------
  // APPLY BAN SAFELY
  // --------------------------------------------------------
  function applyBan() {
    const ref = db.ref("bannedUsers/" + userIP);

    ref.transaction(current => {
      if (!current || typeof current !== "object") {
        return { banCount: 1, permanent: false };
      }

      const banCount = (current.banCount || 0) + 1;
      return {
        banCount,
        permanent: banCount >= 3 ? true : false
      };
    });
  }

  // --------------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------------
  function sendMessage(text) {
    CHAT_REF.push({
      uid: localStorage.getItem("mega_chat_anonId") || ("u"+Math.random()),
      name: window.anonName || "Unknown",
      message: text,
      time: Date.now()
    });
  }

  // --------------------------------------------------------
  // SEND + ENTER KEY
  // --------------------------------------------------------
  function setupSendHandler() {

    function trySend() {
      const text = msgInput.value.trim();
      msgInput.value = "";

      if (!text) return;

      if (isLocked) return showToast("You are banned.", true);

      if (containsAbuse(text)) {
        showToast("Abusive word blocked!", true);
        applyBan();
        return;
      }

      sendMessage(text);
    }

    sendBtn.addEventListener("click", e => {
      e.preventDefault();
      trySend();
    });

    msgInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        trySend();
      }
    });
  }

  // --------------------------------------------------------
  // INIT + IP + BAN LISTENER
  // --------------------------------------------------------
  async function getIP() {
    try {
      return (await fetch("https://api64.ipify.org?format=json")).json().then(j => j.ip);
    } catch {
      return "unknown";
    }
  }

  async function init() {
    userIP = await getIP();
    console.log("Your IP:", userIP);

    window.userIP = userIP;
    banRef = db.ref("bannedUsers/" + userIP);

    banRef.on("value", snap => {
      const data = snap.val();

      if (!data || typeof data !== "object") {
        unblockUI();
        return;
      }

      if (data.permanent) {
        blockUI("PERMANENT BAN");
      } else {
        blockUI("BANNED (Awaiting unban)");
      }
    });

    setupSendHandler();
  }

  init();

  window.adminUnban = ip => db.ref("bannedUsers/"+ip).remove();

})();
