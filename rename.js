const fs = require('fs');

// Wait 5 seconds
setTimeout(() => {
  fs.rename('index1.html', 'index.html', (err) => {
    if (err) {
      console.error('Error renaming file:', err);
    } else {
      console.log('✅ File renamed from index1.html → index.html');
    }
  });
}, 5000);
