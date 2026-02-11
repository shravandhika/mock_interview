// ================================
// Interview Module
// ================================

import { state } from './state.js';
import { showPage } from './navigation.js';
import { finishInterview } from './results.js';

// Load current question
export const loadQuestion = () => {
    const questionIndex = state.currentQuestion;
    const question = state.questions[questionIndex];
    
    // Dispatch question load event
    window.dispatchEvent(new CustomEvent('questionLoaded', { 
        detail: { questionIndex, question, timestamp: Date.now() } 
    }));
    
    // Update progress
    document.getElementById('currentQuestion').textContent = questionIndex + 1;
    const percentage = ((questionIndex + 1) / state.totalQuestions * 100);
    document.getElementById('progressPercentage').textContent = Math.round(percentage) + '%';
    document.getElementById('progressFill').style.width = percentage + '%';
    
    // Update question text
    document.getElementById('questionText').textContent = question;
    
    // Clear previous answer
    document.getElementById('answerText').value = '';
    document.getElementById('transcriptText').textContent = '';
    document.getElementById('voiceTranscript').style.display = 'none';
    document.getElementById('charCount').textContent = '0';
    
    // Load saved answer if exists
    if (state.answers[questionIndex]) {
        document.getElementById('answerText').value = state.answers[questionIndex];
        updateCharCount();
    }
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = questionIndex === 0;
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = questionIndex === state.totalQuestions - 1 ? 'Finish' : 'Next';
    
    // Reset play button
    resetPlayButton();
};

// Previous question
export const previousQuestion = () => {
    if (state.currentQuestion > 0) {
        saveCurrentAnswer();
        state.currentQuestion--;
        loadQuestion();
        
        // Dispatch navigation event
        window.dispatchEvent(new CustomEvent('questionNavigated', { 
            detail: { direction: 'previous', questionIndex: state.currentQuestion } 
        }));
    }
};

// Next question
export const nextQuestion = () => {
    saveCurrentAnswer();
    
    if (state.currentQuestion < state.totalQuestions - 1) {
        state.currentQuestion++;
        loadQuestion();
        
        // Dispatch navigation event
        window.dispatchEvent(new CustomEvent('questionNavigated', { 
            detail: { direction: 'next', questionIndex: state.currentQuestion } 
        }));
    } else {
        // Finish interview
        finishInterview();
    }
};

// Save current answer
export const saveCurrentAnswer = () => {
    const isTextMode = document.getElementById('textMode').classList.contains('active');
    const answer = isTextMode 
        ? document.getElementById('answerText').value 
        : document.getElementById('transcriptText').textContent;
    
    state.answers[state.currentQuestion] = answer;
    
    // Dispatch answer saved event
    window.dispatchEvent(new CustomEvent('answerSaved', { 
        detail: { 
            questionIndex: state.currentQuestion, 
            answerLength: answer.length,
            mode: isTextMode ? 'text' : 'voice',
            timestamp: Date.now() 
        } 
    }));
};

// Switch answer mode
export const switchAnswerMode = (mode) => {
    // Update tabs
    document.querySelectorAll('.answer-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.answer-tab').classList.add('active');
    
    // Update modes
    document.querySelectorAll('.answer-mode').forEach(m => {
        m.classList.remove('active');
    });
    
    if (mode === 'text') {
        document.getElementById('textMode').classList.add('active');
    } else {
        document.getElementById('voiceMode').classList.add('active');
    }
    
    // Dispatch mode switch event
    window.dispatchEvent(new CustomEvent('answerModeChanged', { 
        detail: { mode, timestamp: Date.now() } 
    }));
};

// Update character count
export const updateCharCount = () => {
    const text = document.getElementById('answerText').value;
    document.getElementById('charCount').textContent = text.length;
    
    // Dispatch character count event (throttled)
    if (text.length % 50 === 0) {
        window.dispatchEvent(new CustomEvent('characterCountMilestone', { 
            detail: { count: text.length, timestamp: Date.now() } 
        }));
    }
};

// Reset play button icon
const resetPlayButton = () => {
    const playBtn = document.getElementById('playQuestionBtn');
    playBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
};

// Keyboard shortcuts for interview
export const handleInterviewKeyboard = (event) => {
    // Only work on interview page
    if (state.currentPage !== 'interview') return;
    
    // Ctrl/Cmd + Arrow keys for navigation
    if (event.ctrlKey || event.metaKey) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            previousQuestion();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextQuestion();
        }
    }
    
    // Ctrl/Cmd + P to play question
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        import('./voice.js').then(module => module.playQuestion());
    }
};