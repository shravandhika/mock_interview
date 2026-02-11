// ================================
// Main Application Entry Point
// ================================

// Import modules
import { state } from './modules/state.js';
import { showPage, toggleMobileMenu, closeMobileMenuOnOutsideClick } from './modules/navigation.js';
import { handleLogin, handleSignup, checkPasswordStrength } from './modules/auth.js';
import { 
    handleFileUpload, 
    removeFile, 
    selectQuestionCount, 
    startInterview,
    handleDragOver,
    handleDragLeave,
    handleDrop 
} from './modules/setup.js';
import { 
    loadQuestion, 
    previousQuestion, 
    nextQuestion, 
    switchAnswerMode, 
    updateCharCount,
    handleInterviewKeyboard 
} from './modules/interview.js';
import { playQuestion, toggleRecording, cleanupVoiceRecognition } from './modules/voice.js';
import { downloadReport } from './modules/results.js';
import { toggleFAQ, scrollBlogs, lazyLoadImages } from './utils/ui.js';
import { initializeEventListeners } from './events/listeners.js';

// ================================
// Make functions globally accessible
// ================================

window.showPage = showPage;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.checkPasswordStrength = checkPasswordStrength;
window.toggleFAQ = toggleFAQ;
window.scrollBlogs = scrollBlogs;
window.handleFileUpload = handleFileUpload;
window.removeFile = removeFile;
window.selectQuestionCount = selectQuestionCount;
window.startInterview = startInterview;
window.loadQuestion = loadQuestion;
window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.playQuestion = playQuestion;
window.toggleRecording = toggleRecording;
window.switchAnswerMode = switchAnswerMode;
window.updateCharCount = updateCharCount;
window.downloadReport = downloadReport;

// ================================
// Application Initialization
// ================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🚀 InterviewAI Application Starting...', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    
    // Initialize all event listeners
    initializeEventListeners();
    
    // Show home page by default
    showPage('home');
    
    // Initialize smooth scroll for anchor links
    initializeSmoothScroll();
    
    // Initialize drag and drop for file upload
    initializeDragDrop();
    
    // Initialize lazy loading for images
    lazyLoadImages();
    
    // Initialize keyboard shortcuts
    document.addEventListener('keydown', handleInterviewKeyboard);
    
    // Initialize click outside handler for mobile menu
    document.addEventListener('click', closeMobileMenuOnOutsideClick);
    
    // Restore saved interview progress
    restoreSavedProgress();
    
    // Initialize text area character count
    const answerText = document.getElementById('answerText');
    if (answerText) {
        answerText.addEventListener('input', updateCharCount);
    }
    
    // Show welcome message for first-time users
    showWelcomeMessage();
    
    console.log('%c✅ InterviewAI Application Ready!', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%c💡 Tip: Press Ctrl/Cmd + / to see keyboard shortcuts', 'color: #f59e0b; font-size: 12px;');
});

// ================================
// Initialization Helpers
// ================================

const initializeSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                const page = href.substring(1);
                if (document.getElementById(page + 'Page')) {
                    e.preventDefault();
                    showPage(page);
                }
            }
        });
    });
};

const initializeDragDrop = () => {
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        fileUpload.addEventListener('dragover', handleDragOver);
        fileUpload.addEventListener('dragleave', handleDragLeave);
        fileUpload.addEventListener('drop', handleDrop);
    }
};

const restoreSavedProgress = () => {
    const saved = localStorage.getItem('interviewAI_progress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Check if saved data is less than 24 hours old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                const resume = confirm('You have an interview in progress. Would you like to continue where you left off?');
                if (resume) {
                    state.answers = data.answers;
                    state.currentQuestion = data.currentQuestion;
                    state.setupData = data.setupData;
                    state.questions = data.questions;
                    state.totalQuestions = data.questions.length;
                    showPage('interview');
                    loadQuestion();
                } else {
                    localStorage.removeItem('interviewAI_progress');
                }
            } else {
                // Remove expired progress
                localStorage.removeItem('interviewAI_progress');
            }
        } catch (e) {
            console.error('Error loading saved progress:', e);
            localStorage.removeItem('interviewAI_progress');
        }
    }
};

const showWelcomeMessage = () => {
    const hasVisited = localStorage.getItem('interviewAI_visited');
    if (!hasVisited) {
        setTimeout(() => {
            console.log('%c👋 Welcome to InterviewAI!', 'color: #3b82f6; font-size: 14px;');
            console.log('Start your interview preparation journey today.');
            localStorage.setItem('interviewAI_visited', 'true');
        }, 1000);
    }
};

// ================================
// Auto-save Functionality
// ================================

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const autoSaveAnswers = debounce(() => {
    if (state.answers.length > 0 && state.currentPage === 'interview') {
        localStorage.setItem('interviewAI_progress', JSON.stringify({
            answers: state.answers,
            currentQuestion: state.currentQuestion,
            setupData: state.setupData,
            questions: state.questions,
            timestamp: Date.now()
        }));
        
        console.log('💾 Progress auto-saved');
    }
}, 2000);

// Attach auto-save to answer changes
document.addEventListener('input', (event) => {
    if (event.target.id === 'answerText' && state.currentPage === 'interview') {
        autoSaveAnswers();
    }
});

// ================================
// Cleanup on Page Unload
// ================================

window.addEventListener('beforeunload', () => {
    cleanupVoiceRecognition();
});

// ================================
// Export state for debugging (dev only)
// ================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.interviewAI = {
        state,
        version: '1.0.0',
        debug: true
    };
    console.log('%c🔧 Debug mode enabled. Access state via window.interviewAI', 'color: #f59e0b;');
}