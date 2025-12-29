let audioChunks = [];

async function toggleRecording() {
    let mediaRecorder = window.mediaRecorderInstance;

    if (!mediaRecorder) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            window.mediaRecorderInstance = mediaRecorder;
        } catch (err) {
            alert("Mic access denied!");
            return;
        }
    }

    if (mediaRecorder.state === 'inactive') {
        audioChunks = [];
        mediaRecorder.start();
        document.getElementById('recordBtn').classList.add('recording');
        document.getElementById('sendBtn').style.display = 'none';
    } else {
        mediaRecorder.stop();
        document.getElementById('recordBtn').classList.remove('recording');
        document.getElementById('sendBtn').style.display = 'block';
    }
}

function resetRecording() {
    audioChunks = [];
    if (window.mediaRecorderInstance) {
        window.mediaRecorderInstance.stream.getTracks().forEach(t => t.stop());
    }
}

document.getElementById('recordBtn').onclick = toggleRecording;