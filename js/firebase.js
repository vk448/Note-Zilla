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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();