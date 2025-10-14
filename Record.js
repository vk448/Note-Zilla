
(function(){
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwXtiEjnBcxXwj9K4oLFUiLLQ-6qZRm2kxk6e5t9zRduOXr3_dAdXnAOe9zqsM_OCXU/exec';

  // Detect device type
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  // Detect OS
  function getOS() {
    const ua = navigator.userAgent;
    if (/windows/i.test(ua)) return 'Windows';
    if (/android/i.test(ua)) return 'Android';
    if (/linux/i.test(ua)) return 'Linux';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/mac os/i.test(ua)) return 'MacOS';
    return 'Unknown';
  }

  // Detect Browser
  function getBrowser() {
    const ua = navigator.userAgent;
    if (/chrome|crios|crmo/i.test(ua)) return 'Chrome';
    if (/firefox|fxios/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    if (/edg/i.test(ua)) return 'Edge';
    if (/opr|opera/i.test(ua)) return 'Opera';
    return 'Unknown';
  }

  function sendPayload(obj) {
    const payload = new URLSearchParams(obj).toString();
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/x-www-form-urlencoded' });
      navigator.sendBeacon(GAS_URL, blob);
    } else {
      fetch(GAS_URL + '?' + payload, { mode: 'no-cors' }).catch(()=>{});
    }
  }

  const pageTitle = document.title || 'unknown';
  const pageURL = location.href || 'unknown';
  const deviceType = getDeviceType();
  const os = getOS();
  const browser = getBrowser();
  const ua = navigator.userAgent || 'unknown';

  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(data => {
      sendPayload({
        ip: data.ip || 'unknown',
        time: new Date().toISOString(),
        pageTitle,
        pageURL,
        deviceType,
        os,
        browser,
        ua
      });
    })
    .catch(() => {
      sendPayload({
        ip: 'unknown',
        time: new Date().toISOString(),
        pageTitle,
        pageURL,
        deviceType,
        os,
        browser,
        ua
      });
    });
})();