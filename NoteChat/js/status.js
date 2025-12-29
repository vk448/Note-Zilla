// js/status.js - Complete Status/Story Feature for NoteZilla

// Open Status Upload Modal
document.getElementById('addStatusBtn').onclick = () => {
    document.getElementById('statusModal').style.display = 'flex';
};

// Close Status Modal
function closeStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
    document.getElementById('statusFile').value = '';
    document.getElementById('statusCaption').value = '';
}

// Upload Status (Image or Video)
function uploadStatus() {
    const fileInput = document.getElementById('statusFile');
    const file = fileInput.files[0];
    const caption = document.getElementById('statusCaption').value.trim();

    if (!file) {
        alert("Please select an image or video for your status");
        return;
    }

    // Check file size (limit to ~10MB for smooth upload)
    if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Please choose a file under 10MB");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const mediaBase64 = e.target.result;
        const mediaType = file.type.startsWith('video') ? 'video' : 'image';

        const statusData = {
            uid: currentUser.uid,
            media: mediaBase64,
            type: mediaType,
            caption: caption || "",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Save to Firebase
        db.ref('status').push(statusData)
            .then(() => {
                alert("Status uploaded successfully!");
                closeStatusModal();
                loadStatus(); // Refresh status list
            })
            .catch(err => {
                alert("Failed to upload status: " + err.message);
            });
    };

    reader.readAsDataURL(file);
}

// Load Status Stories (Recent Updates)
function loadStatus() {
    const statusList = document.getElementById('statusList');
    statusList.innerHTML = '';

    // Load latest 20 status updates
    db.ref('status')
        .orderByChild('timestamp')
        .limitToLast(20)
        .on('child_added', (snap) => {
            const status = snap.val();
            const statusId = snap.key;

            // Skip own status (already shown in "My status")
            if (status.uid === currentUser.uid) return;

            db.ref('users/' + status.uid).once('value').then(userSnap => {
                const user = userSnap.val();
                if (!user) return;

                const statusItem = document.createElement('div');
                statusItem.className = 'status-item';
                statusItem.innerHTML = `
                    <img src="${user.photo}" alt="${user.fullName}">
                    <p>${user.fullName}</p>
                `;

                // Click to view status
                statusItem.onclick = () => viewStatus(status, user.fullName || "User");
                statusList.appendChild(statusItem);
            });
        });
}

// View Someone's Status
function viewStatus(status, userName) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    const video = document.getElementById('modalVideo');

    document.querySelector('.image-modal .close-modal').style.display = 'block';

    if (status.type === 'image') {
        img.src = status.media;
        img.style.display = 'block';
        video.style.display = 'none';
    } else {
        video.src = status.media;
        video.style.display = 'block';
        img.style.display = 'none';
        video.play();
    }

    // Optional: Show caption and name
    alert(`Status by ${userName}\n${status.caption ? 'Caption: ' + status.caption : ''}`);

    modal.style.display = 'flex';
}

// Auto-load status when user logs in
if (typeof loadUser === 'function') {
    const originalLoadUser = loadUser;
    loadUser = function(user) {
        originalLoadUser(user);
        loadStatus();
    };
}