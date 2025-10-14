
  (function() {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbw9Udgwil6iDkZrE9IulBz0tlZ5DVZtk0J9id1SJ5_HD5aK3oL6tRtdgmGuBASulnzT/exec';

    // 1) Get public IP from ipify
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        const ip = encodeURIComponent(data.ip || 'unknown');
        const ua = encodeURIComponent(navigator.userAgent || 'unknown');
        const ts = encodeURIComponent(new Date().toISOString());

        // 2) Send to your Apps Script (GET)
        const url = `${GAS_URL}?ip=${ip}&ua=${ua}&time=${ts}`;

        // Use fetch (fire-and-forget). If you prefer, switch to navigator.sendBeacon for reliability.
        fetch(url).catch(err => {
          // silently ignore errors in production; useful for debugging
          console.warn('Logging failed:', err);
        });
      })
      .catch(err => {
        // If ipify fails, still send UA and time (IP unknown)
        const ua = encodeURIComponent(navigator.userAgent || 'unknown');
        const ts = encodeURIComponent(new Date().toISOString());
        const url = `${GAS_URL}?ip=unknown&ua=${ua}&time=${ts}`;
        fetch(url).catch(() => {});
      });
  })();
