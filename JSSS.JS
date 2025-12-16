/**
 * analysis.js - Complete Web Activity Logging System (Firebase Client-Side)
 * * INSTRUCTIONS: 
 * 1. Save this entire block as 'analysis.js'.
 * 2. UPDATE THE FIREBASE_CONFIG BELOW WITH YOUR ACTUAL DETAILS.
 * 3. Ensure the Firebase SDKs are loaded in your HTML *before* this script:
 * <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
 * <script src="path/to/analysis.js"></script>
 */

// =========================================================================
// 0. CONFIGURATION AND INITIALIZATION VARIABLES
// =========================================================================

const FIREBASE_CONFIG = {
    // IMPORTANT: REPLACE THESE WITH YOUR ACTUAL CONFIGURATION DETAILS
    apiKey: "AIzaSyCVVqQnmO1Q83AucOqA5b5qUC4eo49sq6E",
    authDomain: "chat-box-e01e5.firebaseapp.com",
    databaseURL: "https://chat-box-e01e5-default-rtdb.firebaseio.com",
    projectId: "chat-box-e01e5",
    storageBucket: "chat-box-e01e5.firebasestorage.app",
    messagingSenderId: "597491149800",
    appId: "1:597491149800:web:7bd908925f70b62018125d",
    measurementId: "G-FJ6PKK2FNQ"
};

const LOG_NODE_NAME = 'activity_logs';
const SESSION_ID_KEY = 'activity_session_id';
const PREVIOUS_PAGE_KEY = 'activity_prev_page';
const OPEN_COUNT_KEY = 'activity_open_count'; // Uses localStorage for long-term counting
const SCROLL_PROGRESS_KEY = 'scroll_progress';

let logRef = null;

// =========================================================================
// 1. UTILITY AND CORE FUNCTION DEFINITIONS (DEFINED FIRST TO AVOID ERRORS)
// =========================================================================

function getSessionId() {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
}

function getClientAgentHash() {
    const agent = navigator.userAgent;
    let hash = 0;
    for (let i = 0; i < agent.length; i++) {
        const char = agent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function getBrowserDetails() {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    let device = "Desktop";

    if (ua.match(/Windows/i)) { os = "Windows"; } 
    else if (ua.match(/Macintosh|Mac OS X/i)) { os = "macOS"; } 
    else if (ua.match(/Linux/i)) { os = "Linux"; } 
    else if (ua.match(/Android/i)) { os = "Android"; device = "Mobile"; } 
    else if (ua.match(/iPhone|iPad|iPod/i)) { 
        os = "iOS"; 
        device = ua.match(/iPad/i) ? "Tablet" : "Mobile"; 
    }

    if (ua.match(/Chrome/i) && !ua.match(/Edg/i)) { browser = "Chrome"; } 
    else if (ua.match(/Firefox/i)) { browser = "Firefox"; } 
    else if (ua.match(/Safari/i) && !ua.match(/Chrome/i)) { browser = "Safari"; } 
    else if (ua.match(/Edg/i)) { browser = "Edge"; }

    return { browser, os, device };
}

function updateOpenCount() {
    let count = parseInt(localStorage.getItem(OPEN_COUNT_KEY) || '0', 10);
    count++;
    localStorage.setItem(OPEN_COUNT_KEY, count.toString());
    return count;
}

function calculateScrollDepth() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight <= clientHeight) {
        return 100;
    }
    const depth = Math.floor((scrollTop / (scrollHeight - clientHeight)) * 100);
    return Math.min(depth, 100);
}


/**
 * CORE FUNCTION: Sends a structured log entry to the Firebase Realtime Database.
 */
function sendActivityLog(eventType, extraData = {}) {
    if (!logRef) return; // Exit if Firebase failed to initialize

    const previousPageUrl = sessionStorage.getItem(PREVIOUS_PAGE_KEY) || 'N/A (First Page)';
    const currentPageUrl = window.location.href;

    // Data gathered from initial execution (stored in the global helper object)
    const { browser, os, device } = window._analysisData.details;
    const currentOpenCount = window._analysisData.openCount;
    
    const logData = {
        timestamp: new Date().toISOString(),
        session_id: getSessionId(),
        event_type: eventType,
        
        // Sequence Tracking
        current_page_url: currentPageUrl,
        previous_page_url: previousPageUrl,
        
        // Device/Browser/OS Tracking
        browser: browser,
        os: os,
        device: device,
        
        // Visit Count
        visit_count_total: currentOpenCount, 
        
        // Environment Details
        client_agent_hash: getClientAgentHash(),
        screen_size: `${window.screen.width}x${window.screen.height}`,
        
        ...extraData
    };

    // Update the previous page URL for the NEXT page load
    sessionStorage.setItem(PREVIOUS_PAGE_KEY, currentPageUrl);

    // Push the data to Firebase
    logRef.push(logData)
        .catch((error) => {
            console.error(`[LOG FAILURE] Could not log event ${eventType}:`, error);
        });
}


function trackTimeSpent() {
    const timeSpentMs = Date.now() - window._analysisData.pageLoadTimestamp;
    
    if (timeSpentMs > 1000) {
        sendActivityLog('TIME_SPENT', {
            duration_seconds: Math.floor(timeSpentMs / 1000),
            page_duration_ms: timeSpentMs
        });
    }
}

function trackScrollDepth() {
    const currentDepth = calculateScrollDepth();
    
    let maxDepth = parseInt(sessionStorage.getItem(SCROLL_PROGRESS_KEY) || '0', 10);
    
    // Milestones to track (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];

    milestones.forEach(milestone => {
        if (currentDepth >= milestone && maxDepth < milestone) {
            sendActivityLog('SCROLL_MILESTONE_REACHED', {
                scroll_depth_percent: milestone
            });
            sessionStorage.setItem(SCROLL_PROGRESS_KEY, milestone.toString());
        }
    });
    
    if (currentDepth > maxDepth) {
        sessionStorage.setItem(SCROLL_PROGRESS_KEY, currentDepth.toString());
    }
}


// =========================================================================
// 2. INITIALIZATION AND VARIABLE SETUP (Runs immediately)
// =========================================================================

// Firebase Initialization
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(FIREBASE_CONFIG);
        const database = firebase.database();
        logRef = database.ref(LOG_NODE_NAME);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    // This is the error message you saw, correctly logged if SDKs are missing
    console.error("Firebase SDK not found. Check your HTML script tags.");
}

// Create a global object to hold data across the script's execution
window._analysisData = {
    details: getBrowserDetails(),
    openCount: updateOpenCount(),
    pageLoadTimestamp: Date.now(),
    activeTimeMs: 0,
    focusStartTime: Date.now()
};

// =========================================================================
// 3. AUTOMATED EVENT TRACKING AND LISTENERS (Registers events)
// =========================================================================

// A. Track Page View (Runs immediately upon script load)
sendActivityLog('PAGE_VIEW', { 
    user_total_visits: window._analysisData.openCount 
});

// B. Track Page Load Performance (on window load)
window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTimeMs = timing.loadEventEnd - timing.navigationStart;
        
        if (loadTimeMs > 0) {
             sendActivityLog('PAGE_LOAD_TIME', {
                load_time_ms: loadTimeMs
            });
        }
    }
    // Also run scroll tracking after load to catch short pages
    trackScrollDepth();
});


// C. Generic Button Click Tracker
document.addEventListener('click', (event) => {
    let targetElement = event.target;
    while (targetElement && targetElement !== document.body) {
        if (targetElement.classList && targetElement.classList.contains('js-track-click')) {
            const actionName = targetElement.getAttribute('data-action') || 'CUSTOM_CLICK';
            
            sendActivityLog(actionName, {
                element_tag: targetElement.tagName,
                element_id: targetElement.id || 'N/A',
                element_text: targetElement.textContent.trim().substring(0, 50) 
            });
            break; 
        }
        targetElement = targetElement.parentElement;
    }
});


// D. Track Time Spent and Active Time when the user leaves the page.
window.addEventListener('beforeunload', () => {
    // 1. Log simple duration
    trackTimeSpent(); 
    
    // 2. Log total ACTIVE time
    sendActivityLog('ACTIVE_TIME_TOTAL', {
        active_time_seconds: Math.floor(window._analysisData.activeTimeMs / 1000)
    });
});

// E. Track Active Time (Only when the window is focused)
window.addEventListener('focus', () => {
    window._analysisData.focusStartTime = Date.now();
});

window.addEventListener('blur', () => {
    const timeElapsed = Date.now() - window._analysisData.focusStartTime;
    if (window._analysisData.focusStartTime > 0) {
        window._analysisData.activeTimeMs += timeElapsed;
    }
});

// F. Track Scroll Depth
window.addEventListener('scroll', trackScrollDepth);