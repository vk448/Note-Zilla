// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVVqQnmO1Q83AucOqA5b5qUC4eo49sq6E",
    authDomain: "chat-box-e01e5.firebaseapp.com",
    databaseURL: "https://chat-box-e01e5-default-rtdb.firebaseio.com",
    projectId: "chat-box-e01e5",
    storageBucket: "chat-box-e01e5.firebasestorage.app",
    messagingSenderId: "597491149800",
    appId: "1:597491149800:web:7bd908925f70b62018125d",
    measurementId: "G-FJ6PKK2FNQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Tab Switching
document.getElementById('loginTab').addEventListener('click', () => {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
});

document.getElementById('registerTab').addEventListener('click', () => {
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
});

// Redirect based on device
function redirectAfterLogin() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || window.innerWidth < 768;
    
    if (isMobile) {
        window.location.href = 'index-phone.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Email/Password Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Logged in:', userCredential.user);
            redirectAfterLogin();
        })
        .catch((error) => {
            alert('Login Error: ' + error.message);
        });
});

// Register with Email/Password
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update display name
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            console.log('Registered and profile updated');
            redirectAfterLogin();
        })
        .catch((error) => {
            alert('Registration Error: ' + error.message);
        });
});

// Google Sign-In
document.getElementById('googleSignIn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Google Sign-In Success:', result.user);
            redirectAfterLogin();
        })
        .catch((error) => {
            alert('Google Sign-In Error: ' + error.message);
        });
});

// Optional: Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.displayName || user.email);
        // redirectAfterLogin(); // Uncomment if you want auto-redirect on reload
    }
});