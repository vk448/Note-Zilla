 function login() {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const error = document.getElementById('error');

            if(user === 'student' && pass === '1234') {
                // Redirect to Instagram link
                window.location.href = 'https://www.instagram.com/j/AbYCf0W1WuZy8ZkS/';
            } else {
                error.textContent = 'Invalid username or password!';
            }
        }