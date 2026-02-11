// ================================
// Event Listeners Module
// ================================

import { state } from '../modules/state.js';
import { throttle, debounce } from '../utils/ui.js';

// Initialize all event listeners
export const initializeEventListeners = () => {
    initializeLoadingEvents();
    initializeTimingEvents();
    initializeKeyboardEvents();
    initializeMouseEvents();
    initializeScrollEvents();
    initializeResizeEvents();
    initializeFocusEvents();
    initializeVisibilityEvents();
    initializeNetworkEvents();
    initializeCustomEvents();
    
    console.log('✅ All event listeners initialized successfully!');
};

// ================================
// 1. LOADING EVENTS
// ================================
const initializeLoadingEvents = () => {
    // DOM Content Loaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM Content Loaded');
        window.dispatchEvent(new CustomEvent('appInitialized', { 
            detail: { timestamp: Date.now() } 
        }));
    });
    
    // Page fully loaded (including images, stylesheets)
    window.addEventListener('load', () => {
        console.log('🎉 Page fully loaded');
        
        // Hide loading spinner if exists
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Calculate load time
        const loadTime = performance.now();
        window.dispatchEvent(new CustomEvent('pageLoadComplete', { 
            detail: { loadTime: Math.round(loadTime), timestamp: Date.now() } 
        }));
    });
    
    // Before page unload (cleanup)
    window.addEventListener('beforeunload', (event) => {
        console.log('⚠️ Page about to unload');
        
        // If interview in progress, warn user
        if (state.currentPage === 'interview' && state.answers.length > 0) {
            event.preventDefault();
            event.returnValue = 'You have an interview in progress. Are you sure you want to leave?';
            return event.returnValue;
        }
        
        // Cleanup speech recognition
        if (state.recognition) {
            state.recognition.stop();
        }
        if (state.synth.speaking) {
            state.synth.cancel();
        }
    });
    
    // Page unload (final cleanup)
    window.addEventListener('unload', () => {
        console.log('👋 Page unloaded');
        window.dispatchEvent(new CustomEvent('appClosed', { 
            detail: { timestamp: Date.now() } 
        }));
    });
};

// ================================
// 2. TIMING EVENTS
// ================================
const initializeTimingEvents = () => {
    let idleTimer;
    let idleTime = 0;
    
    // User activity detector (resets idle timer)
    const resetIdleTimer = () => {
        idleTime = 0;
        clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('userIdle', { 
                detail: { duration: 30000, timestamp: Date.now() } 
            }));
        }, 30000); // 30 seconds
    };
    
    // Reset on any activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetIdleTimer, true);
    });
    
    // Track time spent on page
    setInterval(() => {
        if (state.currentPage === 'interview') {
            const timeSpent = Date.now() - state.startTime;
            window.dispatchEvent(new CustomEvent('interviewTimeUpdate', { 
                detail: { timeSpent, timestamp: Date.now() } 
            }));
        }
    }, 60000); // Every minute
    
    // Performance timing
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const connectTime = perfData.responseEnd - perfData.requestStart;
            const renderTime = perfData.domComplete - perfData.domLoading;
            
            window.dispatchEvent(new CustomEvent('performanceMetrics', { 
                detail: { 
                    pageLoadTime, 
                    connectTime, 
                    renderTime,
                    timestamp: Date.now() 
                } 
            }));
        }, 0);
    });
};

// ================================
// 3. KEYBOARD EVENTS
// ================================
const initializeKeyboardEvents = () => {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        state.userInteractions.keystrokes++;
        
        // Escape key - close modals, cancel actions
        if (event.key === 'Escape') {
            window.dispatchEvent(new CustomEvent('escapePressed', { 
                detail: { currentPage: state.currentPage, timestamp: Date.now() } 
            }));
            
            // Close mobile menu if open
            const navMenu = document.getElementById('navMenu');
            if (navMenu?.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        }
        
        // Ctrl/Cmd + K - Quick search (future feature)
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            console.log('Quick search triggered');
        }
        
        // Ctrl/Cmd + / - Show keyboard shortcuts
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            showKeyboardShortcuts();
        }
        
        // Tab key tracking (accessibility)
        if (event.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });
    
    // Keyup events
    document.addEventListener('keyup', (event) => {
        window.dispatchEvent(new CustomEvent('keyReleased', { 
            detail: { key: event.key, timestamp: Date.now() } 
        }));
    });
    
    // Input events for text fields
    document.addEventListener('input', debounce((event) => {
        if (event.target.matches('input, textarea')) {
            window.dispatchEvent(new CustomEvent('inputChanged', { 
                detail: { 
                    field: event.target.id, 
                    length: event.target.value.length,
                    timestamp: Date.now() 
                } 
            }));
        }
    }, 300));
};

// ================================
// 4. MOUSE EVENTS
// ================================
const initializeMouseEvents = () => {
    // Click tracking
    document.addEventListener('click', (event) => {
        state.userInteractions.clicks++;
        
        // Remove keyboard navigation class on click
        document.body.classList.remove('keyboard-nav');
        
        window.dispatchEvent(new CustomEvent('userClick', { 
            detail: { 
                element: event.target.tagName,
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now() 
            } 
        }));
    });
    
    // Double click tracking
    document.addEventListener('dblclick', (event) => {
        window.dispatchEvent(new CustomEvent('userDoubleClick', { 
            detail: { element: event.target.tagName, timestamp: Date.now() } 
        }));
    });
    
    // Mouse movement (throttled)
    document.addEventListener('mousemove', throttle((event) => {
        state.userInteractions.mouseMovements++;
        
        if (state.userInteractions.mouseMovements % 100 === 0) {
            window.dispatchEvent(new CustomEvent('mouseMoveActive', { 
                detail: { 
                    totalMovements: state.userInteractions.mouseMovements,
                    timestamp: Date.now() 
                } 
            }));
        }
    }, 100));
    
    // Mouse enter/leave for interactive elements
    document.addEventListener('mouseenter', (event) => {
        if (event.target.matches('button, a, .interactive')) {
            event.target.classList.add('hovered');
        }
    }, true);
    
    document.addEventListener('mouseleave', (event) => {
        if (event.target.matches('button, a, .interactive')) {
            event.target.classList.remove('hovered');
        }
    }, true);
    
    // Right click (context menu)
    document.addEventListener('contextmenu', (event) => {
        window.dispatchEvent(new CustomEvent('contextMenuOpened', { 
            detail: { element: event.target.tagName, timestamp: Date.now() } 
        }));
    });
    
    // Mouse down/up for drag detection
    let mouseDownTime;
    document.addEventListener('mousedown', () => {
        mouseDownTime = Date.now();
    });
    
    document.addEventListener('mouseup', () => {
        const duration = Date.now() - mouseDownTime;
        if (duration > 200) {
            window.dispatchEvent(new CustomEvent('longPress', { 
                detail: { duration, timestamp: Date.now() } 
            }));
        }
    });
};

// ================================
// 5. SCROLL EVENTS
// ================================
const initializeScrollEvents = () => {
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', throttle(() => {
        state.userInteractions.scrolls++;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        lastScrollTop = scrollTop;
        
        window.dispatchEvent(new CustomEvent('pageScrolled', { 
            detail: { 
                scrollTop, 
                direction: scrollDirection,
                scrollPercentage: (scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
                timestamp: Date.now() 
            } 
        }));
        
        // Add/remove navbar shadow on scroll
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (scrollTop > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        
        // Parallax or reveal animations (if elements exist)
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8) {
                el.classList.add('revealed');
            }
        });
    }, 100));
    
    // Scroll end detection
    let scrollTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('scrollEnded', { 
                detail: { 
                    finalPosition: window.pageYOffset,
                    timestamp: Date.now() 
                } 
            }));
        }, 150);
    });
};

// ================================
// 6. RESIZE EVENTS
// ================================
const initializeResizeEvents = () => {
    let resizeTimer;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const orientation = width > height ? 'landscape' : 'portrait';
            
            window.dispatchEvent(new CustomEvent('windowResized', { 
                detail: { 
                    width, 
                    height, 
                    orientation,
                    isMobile: width < 768,
                    timestamp: Date.now() 
                } 
            }));
        }, 250);
    });
    
    // Orientation change (mobile/tablet)
    window.addEventListener('orientationchange', () => {
        window.dispatchEvent(new CustomEvent('orientationChanged', { 
            detail: { 
                orientation: screen.orientation?.type || 'unknown',
                timestamp: Date.now() 
            } 
        }));
    });
};

// ================================
// 7. FOCUS EVENTS
// ================================
const initializeFocusEvents = () => {
    // Window focus/blur
    window.addEventListener('focus', () => {
        window.dispatchEvent(new CustomEvent('windowFocused', { 
            detail: { timestamp: Date.now() } 
        }));
    });
    
    window.addEventListener('blur', () => {
        window.dispatchEvent(new CustomEvent('windowBlurred', { 
            detail: { timestamp: Date.now() } 
        }));
    });
    
    // Form field focus tracking
    document.addEventListener('focusin', (event) => {
        if (event.target.matches('input, textarea, select')) {
            window.dispatchEvent(new CustomEvent('fieldFocused', { 
                detail: { 
                    field: event.target.id || event.target.name,
                    timestamp: Date.now() 
                } 
            }));
        }
    });
    
    document.addEventListener('focusout', (event) => {
        if (event.target.matches('input, textarea, select')) {
            window.dispatchEvent(new CustomEvent('fieldBlurred', { 
                detail: { 
                    field: event.target.id || event.target.name,
                    value: event.target.value,
                    timestamp: Date.now() 
                } 
            }));
        }
    });
};

// ================================
// 8. VISIBILITY EVENTS
// ================================
const initializeVisibilityEvents = () => {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.dispatchEvent(new CustomEvent('pageHidden', { 
                detail: { timestamp: Date.now() } 
            }));
            
            // Pause any ongoing activities
            if (state.synth.speaking) {
                state.synth.pause();
            }
        } else {
            window.dispatchEvent(new CustomEvent('pageVisible', { 
                detail: { timestamp: Date.now() } 
            }));
            
            // Resume paused activities
            if (state.synth.paused) {
                state.synth.resume();
            }
        }
    });
};

// ================================
// 9. NETWORK EVENTS
// ================================
const initializeNetworkEvents = () => {
    // Online/Offline detection
    window.addEventListener('online', () => {
        window.dispatchEvent(new CustomEvent('connectionRestored', { 
            detail: { timestamp: Date.now() } 
        }));
        console.log('✅ Connection restored');
        
        // Show notification
        const toast = document.createElement('div');
        toast.textContent = 'Connection restored';
        toast.className = 'toast-success';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    });
    
    window.addEventListener('offline', () => {
        window.dispatchEvent(new CustomEvent('connectionLost', { 
            detail: { timestamp: Date.now() } 
        }));
        console.warn('⚠️ Connection lost');
        
        // Show notification
        const toast = document.createElement('div');
        toast.textContent = 'No internet connection';
        toast.className = 'toast-error';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    });
    
    // Network quality monitoring
    if ('connection' in navigator) {
        const connection = navigator.connection;
        connection.addEventListener('change', () => {
            window.dispatchEvent(new CustomEvent('networkQualityChanged', { 
                detail: { 
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    timestamp: Date.now() 
                } 
            }));
        });
    }
};

// ================================
// 10. CUSTOM APPLICATION EVENTS
// ================================
const initializeCustomEvents = () => {
    // Listen to all custom events for logging
    const customEvents = [
        'userLogin', 'userSignup', 'userLogout',
        'pageChange', 'interviewStarted', 'interviewFinished',
        'questionLoaded', 'answerSaved', 'recordingStarted', 'recordingStopped',
        'fileUploaded', 'fileRemoved', 'reportDownloadRequested'
    ];
    
    customEvents.forEach(eventName => {
        window.addEventListener(eventName, (event) => {
            console.log(`🎯 Custom Event: ${eventName}`, event.detail);
            
            // Track in analytics (future implementation)
            trackEvent(eventName, event.detail);
        });
    });
    
    // Application-wide error handling
    window.addEventListener('error', (event) => {
        console.error('❌ Global Error:', event.error);
        window.dispatchEvent(new CustomEvent('applicationError', { 
            detail: { 
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                timestamp: Date.now() 
            } 
        }));
    });
    
    // Promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Unhandled Promise Rejection:', event.reason);
        window.dispatchEvent(new CustomEvent('promiseRejection', { 
            detail: { 
                reason: event.reason,
                timestamp: Date.now() 
            } 
        }));
    });
};

// ================================
// HELPER FUNCTIONS
// ================================

const showKeyboardShortcuts = () => {
    const shortcuts = `
    Keyboard Shortcuts:
    - Ctrl/Cmd + K: Quick search
    - Ctrl/Cmd + /: Show shortcuts
    - Escape: Close menus/modals
    - Tab: Navigate with keyboard
    
    Interview Page:
    - Ctrl/Cmd + ←: Previous question
    - Ctrl/Cmd + →: Next question
    - Ctrl/Cmd + P: Play question
    `;
    
    alert(shortcuts);
};

const trackEvent = (eventName, data) => {
    // This would integrate with analytics services like Google Analytics, Mixpanel, etc.
    // For now, just log to console
    if (window.gtag) {
        window.gtag('event', eventName, data);
    }
};

// Export for use in main app
export { initializeCustomEvents, trackEvent };