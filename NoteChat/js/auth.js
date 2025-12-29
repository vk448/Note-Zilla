// js/auth.js - Complete Authentication Logic (Email + Google + Toggle)

let isLogin = false;

// Toggle between Login and Register
document.getElementById('authScreen').addEventListener('click', (e) => {
    if (e.target.classList.contains('toggle-link')) {
        isLogin = !isLogin;

        document.getElementById('authTitle').textContent = isLogin ? "Welcome back" : "Create your account";
        document.getElementById('authBtn').textContent = isLogin ? "Login" : "Register";

        document.getElementById('toggleText').innerHTML = isLogin 
            ? 'New here? <span class="toggle-link">Register</span>'
            : 'Already have an account? <span class="toggle-link">Login</span>';

        // Show/Hide registration fields
        document.getElementById('displayName').style.display = isLogin ? 'none' : 'block';
        document.getElementById('genderInput').style.display = isLogin ? 'none' : 'block';
        document.getElementById('photoSection').style.display = isLogin ? 'none' : 'block';
    }
});

// Profile Photo Preview
document.getElementById('choosePhotoBtn').onclick = () => {
    document.getElementById('profilePhoto').click();
};

document.getElementById('profilePhoto').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('profilePreview').src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// Email/Password Authentication
document.getElementById('authBtn').onclick = () => {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    if (!email || password.length < 6) {
        alert("Please enter a valid email and password (6+ characters)");
        return;
    }

    if (isLogin) {
        // Login
        auth.signInWithEmailAndPassword(email, password)
            .then(cred => {
                loadUser(cred.user);
            })
            .catch(err => {
                alert("Login failed: " + err.message);
            });
    } else {
        // Register
        const fullName = document.getElementById('displayName').value.trim();
        const gender = document.getElementById('genderInput').value;
        const photo = document.getElementById('profilePreview').src;

        if (!fullName) {
            alert("Please enter your full name");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then(cred => {
                const user = cred.user;

                // Save user profile to database
                db.ref('users/' + user.uid).set({
                    email: email,
                    fullName: fullName,
                    gender: gender,
                    photo: photo,
                    online: true,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });

                loadUser(user);
            })
            .catch(err => {
                if (err.code === 'auth/email-already-in-use') {
                    alert("This email is already registered. Please login instead.");
                } else {
                    alert("Registration failed: " + err.message);
                }
            });
    }
};

// Google Sign-In
document.getElementById('googleBtn').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;

            // Check if user exists in database, if not create profile
            db.ref('users/' + user.uid).once('value').then(snap => {
                if (!snap.exists()) {
                    db.ref('users/' + user.uid).set({
                        email: user.email,
                        fullName: user.displayName || "Google User",
                        gender: "Not specified",
                        photo: user.photoURL || "https://via.placeholder.com/120",
                        online: true,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    });
                } else {
                    db.ref('users/' + user.uid).update({ online: true });
                }
                loadUser(user);
            });
        })
        .catch(err => {
            alert("Google login failed: " + err.message);
        });
};

// Load User into Main App
function loadUser(user) {
    window.currentUser = user;

    // Hide auth, show app
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Load user data from database and update UI
    db.ref('users/' + user.uid).once('value').then(snap => {
        const data = snap.val() || {};
        const name = data.fullName || user.displayName || "User";
        const photo = data.photo || user.photoURL || "https://via.placeholder.com/120";

        document.getElementById('myName').textContent = name;
        document.getElementById('myAvatar').src = photo;
        document.getElementById('myAvatarRail').src = photo;
        document.getElementById('myStatusPhoto').src = photo;
    });

    // Start loading chats and status
    if (typeof loadChats === 'function') loadChats();
    if (typeof loadStatus === 'function') loadStatus();
}

// Auto-login if already signed in
auth.onAuthStateChanged(user => {
    if (user && !window.currentUser) {
        loadUser(user);
    }
});