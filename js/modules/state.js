// ================================
// Global State Management Module
// ================================

export const state = {
    currentPage: 'home',
    currentQuestion: 0,
    totalQuestions: 5,
    answers: [],
    setupData: {},
    isRecording: false,
    recognition: null,
    synth: window.speechSynthesis,
    startTime: null,
    userInteractions: {
        clicks: 0,
        keystrokes: 0,
        scrolls: 0,
        mouseMovements: 0
    }
};

// State update helper
export const updateState = (updates) => {
    Object.assign(state, updates);
    console.log('State updated:', updates);
};

// Get current state
export const getState = () => ({ ...state });