// ================================
// Interview Module — Advanced JS
// async/await | callbacks | timers
// promises | generators | patterns
// ================================

import { state } from './state.js';
import { showPage } from './navigation.js';
import { finishInterview } from './results.js';

// ================================
// CONSTANTS & CONFIG
// ================================

const CONFIG = Object.freeze({
    AUTOSAVE_DELAY:     2000,
    QUESTION_DELAY:     400,
    TRANSITION_DELAY:   250,
    THINK_TIME:         5000,
    CHAR_MILESTONE:     50,
    IDLE_WARNING:       60000,
    MAX_ANSWER_LENGTH:  2000,
});

// ================================
// PROMISE-BASED DELAY UTILITY
// ================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================================
// CALLBACK REGISTRY
// (Observer / Pub-Sub pattern)
// ================================

const callbackRegistry = {
    _handlers: new Map(),

    on(event, cb) {
        if (!this._handlers.has(event)) this._handlers.set(event, []);
        this._handlers.get(event).push(cb);
        return () => this.off(event, cb); // returns unsubscribe fn
    },

    off(event, cb) {
        const handlers = this._handlers.get(event) || [];
        this._handlers.set(event, handlers.filter(h => h !== cb));
    },

    emit(event, data) {
        (this._handlers.get(event) || []).forEach(cb => {
            try { cb(data); }
            catch (err) { console.error(`Callback error [${event}]:`, err); }
        });
        // Also dispatch as DOM custom event
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
};

// Pre-register app-level callbacks
callbackRegistry.on('questionLoaded',    (d) => console.log(`📋 Q${d.questionIndex + 1} loaded`));
callbackRegistry.on('answerSaved',       (d) => console.log(`💾 Answer saved — ${d.answerLength} chars`));
callbackRegistry.on('questionNavigated', (d) => console.log(`➡️  Navigated ${d.direction}`));
callbackRegistry.on('answerModeChanged', (d) => console.log(`🎙️  Mode → ${d.mode}`));
callbackRegistry.on('interviewError',    (d) => console.error('❌ Interview Error:', d.message));

// ================================
// TIMER MANAGER
// (handles all timeouts/intervals)
// ================================

const timerManager = (() => {
    const timers    = new Map();
    const intervals = new Map();

    return {
        // Named timeout
        setTimeout(name, fn, ms) {
            this.clearTimeout(name);
            const id = setTimeout(() => {
                fn();
                timers.delete(name);
            }, ms);
            timers.set(name, id);
            return id;
        },

        clearTimeout(name) {
            if (timers.has(name)) {
                clearTimeout(timers.get(name));
                timers.delete(name);
            }
        },

        // Named interval
        setInterval(name, fn, ms) {
            this.clearInterval(name);
            const id = setInterval(fn, ms);
            intervals.set(name, id);
            return id;
        },

        clearInterval(name) {
            if (intervals.has(name)) {
                clearInterval(intervals.get(name));
                intervals.delete(name);
            }
        },

        clearAll() {
            timers.forEach((id) => clearTimeout(id));
            intervals.forEach((id) => clearInterval(id));
            timers.clear();
            intervals.clear();
            console.log('🧹 All timers cleared');
        }
    };
})();

// ================================
// QUESTION TIMER (ASYNC)
// ================================

let questionStartTime      = null;
let questionElapsedSeconds = 0;

const startQuestionTimer = () => {
    questionStartTime = Date.now();

    timerManager.setInterval('questionTimer', () => {
        questionElapsedSeconds = Math.floor((Date.now() - questionStartTime) / 1000);

        const el = document.getElementById('questionTimer');
        if (el) {
            const mins = String(Math.floor(questionElapsedSeconds / 60)).padStart(2, '0');
            const secs = String(questionElapsedSeconds % 60).padStart(2, '0');
            el.textContent = `⏱ ${mins}:${secs}`;
        }

        // Warn after idle threshold
        if (questionElapsedSeconds === CONFIG.IDLE_WARNING / 1000) {
            callbackRegistry.emit('idleWarning', { elapsed: questionElapsedSeconds });
            console.warn('⚠️ No activity for 60 seconds');
        }
    }, 1000);
};

const stopQuestionTimer = () => {
    timerManager.clearInterval('questionTimer');
    const elapsed = questionElapsedSeconds;
    questionElapsedSeconds = 0;
    return elapsed; // return elapsed seconds for analytics
};

// ================================
// ASYNC LOAD QUESTION
// ================================

export const loadQuestion = async (onComplete = null) => {
    const questionIndex = state.currentQuestion;
    const question      = state.questions?.[questionIndex];

    if (!question) {
        callbackRegistry.emit('interviewError', {
            message:   `Question at index ${questionIndex} not found`,
            timestamp: Date.now()
        });
        return;
    }

    try {
        // Stop previous timer
        stopQuestionTimer();

        // Step 1: Animate out old question
        await animateQuestionOut();

        // Step 2: Update DOM
        updateProgressUI(questionIndex);
        updateQuestionText(question);
        clearAnswerFields();
        restoreSavedAnswer(questionIndex);
        updateNavigationButtons(questionIndex);
        resetPlayButton();

        // Step 3: Animate in new question
        await animateQuestionIn();

        // Step 4: Start fresh timer
        startQuestionTimer();

        // Step 5: Auto-speak question with small delay
        await delay(CONFIG.QUESTION_DELAY);
        await autoSpeakQuestion(question);

        // Step 6: Fire callbacks
        callbackRegistry.emit('questionLoaded', {
            questionIndex,
            question,
            timestamp: Date.now()
        });

        // Step 7: Optional completion callback
        if (typeof onComplete === 'function') {
            onComplete({ questionIndex, question });
        }

    } catch (err) {
        callbackRegistry.emit('interviewError', {
            message:   err.message,
            stack:     err.stack,
            timestamp: Date.now()
        });
    }
};

// ================================
// ANIMATION HELPERS (ASYNC)
// ================================

const animateQuestionOut = () =>
    new Promise(resolve => {
        const container = document.querySelector('.question-container');
        if (!container) return resolve();

        container.style.transition = `opacity ${CONFIG.TRANSITION_DELAY}ms ease, transform ${CONFIG.TRANSITION_DELAY}ms ease`;
        container.style.opacity    = '0';
        container.style.transform  = 'translateY(-8px)';

        timerManager.setTimeout('animOut', resolve, CONFIG.TRANSITION_DELAY);
    });

const animateQuestionIn = () =>
    new Promise(resolve => {
        const container = document.querySelector('.question-container');
        if (!container) return resolve();

        container.style.opacity   = '0';
        container.style.transform = 'translateY(10px)';

        // Force reflow
        void container.offsetHeight;

        container.style.transition = `opacity ${CONFIG.TRANSITION_DELAY}ms ease, transform ${CONFIG.TRANSITION_DELAY}ms ease`;
        container.style.opacity    = '1';
        container.style.transform  = 'translateY(0)';

        timerManager.setTimeout('animIn', resolve, CONFIG.TRANSITION_DELAY);
    });

// ================================
// DOM UPDATE HELPERS
// ================================

const updateProgressUI = (questionIndex) => {
    const percentage = ((questionIndex + 1) / state.totalQuestions) * 100;

    const els = {
        current:    document.getElementById('currentQuestion'),
        percentage: document.getElementById('progressPercentage'),
        fill:       document.getElementById('progressFill'),
    };

    if (els.current)    els.current.textContent    = questionIndex + 1;
    if (els.percentage) els.percentage.textContent = `${Math.round(percentage)}%`;
    if (els.fill)       els.fill.style.width       = `${percentage}%`;
};

const updateQuestionText = (question) => {
    const el = document.getElementById('questionText');
    if (el) el.textContent = question;
};

const clearAnswerFields = () => {
    const fields = {
        answerText:      document.getElementById('answerText'),
        transcriptText:  document.getElementById('transcriptText'),
        voiceTranscript: document.getElementById('voiceTranscript'),
        charCount:       document.getElementById('charCount'),
    };

    if (fields.answerText)      fields.answerText.value              = '';
    if (fields.transcriptText)  fields.transcriptText.textContent    = '';
    if (fields.voiceTranscript) fields.voiceTranscript.style.display = 'none';
    if (fields.charCount)       fields.charCount.textContent         = '0';
};

const restoreSavedAnswer = (questionIndex) => {
    const saved = state.answers[questionIndex];
    if (!saved) return;

    const answerText = document.getElementById('answerText');
    if (answerText) {
        answerText.value = saved;
        updateCharCount();
    }
};

const updateNavigationButtons = (questionIndex) => {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.disabled = questionIndex === 0;

    if (nextBtn) {
        const isLast = questionIndex === state.totalQuestions - 1;
        nextBtn.textContent = isLast ? 'Finish' : 'Next';
        nextBtn.classList.toggle('btn-finish', isLast);
    }
};

const resetPlayButton = () => {
    const playBtn = document.getElementById('playQuestionBtn');
    if (!playBtn) return;

    playBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
};

// ================================
// AUTO-SPEAK QUESTION (ASYNC)
// ================================

const autoSpeakQuestion = async (question) => {
    if (!state.setupData?.autoSpeak) return;
    if (!window.speechSynthesis)     return;

    return new Promise((resolve) => {
        const utterance   = new SpeechSynthesisUtterance(question);
        utterance.rate    = 0.9;
        utterance.pitch   = 1;
        utterance.volume  = 1;
        utterance.onend   = resolve;
        utterance.onerror = resolve; // resolve even on error
        window.speechSynthesis.speak(utterance);
    });
};

// ================================
// THINK TIME FEATURE (ASYNC)
// ================================

export const startThinkTime = async (onComplete = null) => {
    const totalMs    = CONFIG.THINK_TIME;
    const intervalMs = 100;
    let elapsed      = 0;

    callbackRegistry.emit('thinkTimeStarted', { totalMs, timestamp: Date.now() });

    return new Promise((resolve) => {
        timerManager.setInterval('thinkTime', () => {
            elapsed += intervalMs;
            const remaining = Math.ceil((totalMs - elapsed) / 1000);

            const el = document.getElementById('thinkTimeDisplay');
            if (el) el.textContent = `Think time: ${remaining}s`;

            if (elapsed >= totalMs) {
                timerManager.clearInterval('thinkTime');
                callbackRegistry.emit('thinkTimeEnded', { timestamp: Date.now() });

                if (typeof onComplete === 'function') onComplete();
                resolve();
            }
        }, intervalMs);
    });
};

// ================================
// PREVIOUS QUESTION (ASYNC)
// ================================

export const previousQuestion = async () => {
    if (state.currentQuestion <= 0) return;

    await saveCurrentAnswer();
    state.currentQuestion--;

    await loadQuestion(() => {
        callbackRegistry.emit('questionNavigated', {
            direction:     'previous',
            questionIndex: state.currentQuestion,
            timestamp:     Date.now()
        });
    });
};

// ================================
// NEXT QUESTION (ASYNC)
// ================================

export const nextQuestion = async () => {
    await saveCurrentAnswer();

    if (state.currentQuestion < state.totalQuestions - 1) {
        state.currentQuestion++;

        await loadQuestion(() => {
            callbackRegistry.emit('questionNavigated', {
                direction:     'next',
                questionIndex: state.currentQuestion,
                timestamp:     Date.now()
            });
        });
    } else {
        await handleInterviewCompletion();
    }
};

// ================================
// INTERVIEW COMPLETION (ASYNC)
// ================================

const handleInterviewCompletion = async () => {
    await saveCurrentAnswer();

    stopQuestionTimer();

    // Show loading state on finish button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled    = true;
        nextBtn.innerHTML   = `<span class="btn-spinner"></span> Evaluating...`;
    }

    // Simulate AI evaluation delay
    await delay(1500);

    callbackRegistry.emit('interviewFinished', {
        totalQuestions:    state.totalQuestions,
        answeredQuestions: state.answers.filter(Boolean).length,
        timestamp:         Date.now()
    });

    finishInterview();
};

// ================================
// SAVE CURRENT ANSWER (ASYNC)
// ================================

export const saveCurrentAnswer = async () => {
    return new Promise((resolve) => {
        const isTextMode = document.getElementById('textMode')?.classList.contains('active');

        const answer = isTextMode
            ? (document.getElementById('answerText')?.value      || '')
            : (document.getElementById('transcriptText')?.textContent || '');

        // Trim and limit length
        const trimmed = answer.trim().slice(0, CONFIG.MAX_ANSWER_LENGTH);

        state.answers[state.currentQuestion] = trimmed;

        callbackRegistry.emit('answerSaved', {
            questionIndex: state.currentQuestion,
            answerLength:  trimmed.length,
            mode:          isTextMode ? 'text' : 'voice',
            timestamp:     Date.now()
        });

        // Debounced localStorage persist via named timeout
        timerManager.setTimeout('autosave', () => {
            persistProgressToStorage();
            resolve();
        }, CONFIG.AUTOSAVE_DELAY);
    });
};

// ================================
// PERSIST PROGRESS (CALLBACK)
// ================================

const persistProgressToStorage = (callback = null) => {
    try {
        const data = {
            answers:         state.answers,
            currentQuestion: state.currentQuestion,
            setupData:       state.setupData,
            questions:       state.questions,
            timestamp:       Date.now()
        };

        localStorage.setItem('interviewAI_progress', JSON.stringify(data));
        console.log('💾 Progress persisted to localStorage');

        if (typeof callback === 'function') callback(null, data);

    } catch (err) {
        console.error('Storage error:', err);
        if (typeof callback === 'function') callback(err);
    }
};

// ================================
// SWITCH ANSWER MODE (ASYNC)
// ================================

export const switchAnswerMode = async (mode, callbackFn = null) => {
    return new Promise((resolve) => {
        const currentAnswer = document.getElementById('answerText')?.value || '';

        // Update tab UI
        document.querySelectorAll('.answer-tab').forEach(tab =>
            tab.classList.remove('active'));
        event?.target?.closest('.answer-tab')?.classList.add('active');

        // Update mode panels
        document.querySelectorAll('.answer-mode').forEach(m =>
            m.classList.remove('active'));

        const targetMode = document.getElementById(
            mode === 'text' ? 'textMode' : 'voiceMode'
        );

        if (targetMode) {
            targetMode.style.opacity = '0';
            targetMode.classList.add('active');

            timerManager.setTimeout('modeSwitch', () => {
                targetMode.style.transition = `opacity ${CONFIG.TRANSITION_DELAY}ms ease`;
                targetMode.style.opacity    = '1';

                callbackRegistry.emit('answerModeChanged', {
                    mode,
                    previousAnswer: currentAnswer,
                    timestamp:      Date.now()
                });

                if (typeof callbackFn === 'function') callbackFn(mode);
                resolve(mode);
            }, CONFIG.TRANSITION_DELAY);
        } else {
            resolve(mode);
        }
    });
};

// ================================
// UPDATE CHAR COUNT (THROTTLED)
// ================================

let _charCountTimer = null;

export const updateCharCount = () => {
    const text = document.getElementById('answerText')?.value || '';
    const el   = document.getElementById('charCount');
    if (el) el.textContent = text.length;

    // Throttle milestone events
    if (_charCountTimer) return;
    _charCountTimer = setTimeout(() => {
        _charCountTimer = null;
        if (text.length > 0 && text.length % CONFIG.CHAR_MILESTONE === 0) {
            callbackRegistry.emit('characterCountMilestone', {
                count:     text.length,
                timestamp: Date.now()
            });
        }
    }, 200);

    // Character limit warning
    if (text.length >= CONFIG.MAX_ANSWER_LENGTH * 0.9) {
        const warning = document.getElementById('charWarning');
        if (warning) {
            warning.textContent   = `${CONFIG.MAX_ANSWER_LENGTH - text.length} chars remaining`;
            warning.style.display = 'block';
        }
    }
};

// ================================
// GENERATOR: QUESTION SEQUENCE
// Step-by-step iteration control
// ================================

export function* questionSequenceGenerator(questions) {
    let index = 0;

    while (index < questions.length) {
        const result = yield {
            index,
            question: questions[index],
            isFirst:  index === 0,
            isLast:   index === questions.length - 1,
            progress: Math.round(((index + 1) / questions.length) * 100)
        };

        // Allow external navigation via .next(direction)
        if (result === 'prev' && index > 0) {
            index--;
        } else {
            index++;
        }
    }

    return { done: true, total: questions.length };
}

// ================================
// ASYNC GENERATOR: STREAMING EVAL
// Simulates real-time evaluation
// ================================

export async function* streamAnswerEvaluation(answer, question) {
    const steps = [
        { stage: 'parsing',   message: 'Parsing your answer...',        progress: 20  },
        { stage: 'analyzing', message: 'Analyzing content depth...',    progress: 40  },
        { stage: 'scoring',   message: 'Calculating relevance score...', progress: 60 },
        { stage: 'feedback',  message: 'Generating feedback...',         progress: 80  },
        { stage: 'complete',  message: 'Evaluation complete!',           progress: 100 },
    ];

    for (const step of steps) {
        await delay(400);
        yield step;
    }
}

// ================================
// KEYBOARD SHORTCUTS (MAP-DRIVEN)
// ================================

const keyMap = new Map([
    ['ArrowLeft',  () => previousQuestion()],
    ['ArrowRight', () => nextQuestion()],
    ['p',          () => import('./voice.js').then(m => m.playQuestion())],
    ['s',          () => sa