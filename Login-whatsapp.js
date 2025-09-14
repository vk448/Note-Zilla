 function login() {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const error = document.getElementById('error');

            if(user === 'student' && pass === '1234') {
                // Redirect to Instagram link
                window.location.href = 'https://chat.whatsapp.com/Du8lV5WBCBL01pZsEm3Kki';
            } else {
                error.textContent = 'Invalid username or password!';
            }
        }