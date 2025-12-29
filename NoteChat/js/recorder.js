// js/recorder.js - Voice Message Recording with WhatsApp-style Hold-to-Record

let recorder = null;
let audioChunks = [];
const micBtn = document.getElementById('micBtn');

micBtn.addEventListener('click', async () => {
    if (!recorder) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = (ev) => {
                    // Send voice message as Base64
                    sendMessage("🎤 Voice message", ev.target.result, "audio");
                };
                reader.readAsDataURL(blob);
                audioChunks = [];
            };
        } catch (err) {
            alert("Microphone access denied or not available");
            return;
        }
    }

    if (recorder.state === "inactive") {
        // Start recording
        audioChunks = [];
        recorder.start();
        micBtn.classList.add('recording');
        micBtn.textContent = "●"; // Red dot indicator
    } else {
        // Stop recording and send
        recorder.stop();
        recorder.stream.getTracks().forEach(track => track.stop()); // Stop mic
        micBtn.classList.remove('recording');
        micBtn.textContent = "🎙️";
    }
});

// Optional: Cancel recording on long swipe (mobile)
let touchStartX = 0;
micBtn.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

micBtn.addEventListener('touchmove', (e) => {
    if (recorder && recorder.state === "recording") {
        const diff = touchStartX - e.touches[0].clientX;
        if (diff > 100) { // Swipe left > 100px to cancel
            recorder.stop();
            recorder.stream.getTracks().forEach(track => track.stop());
            micBtn.classList.remove('recording');
            micBtn.textContent = "🎙️";
            audioChunks = [];
            alert("Recording cancelled");
        }
    }
});