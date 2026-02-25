// ================================
// Global State Management
// ================================

const state = {
    currentPage: 'home',
    currentQuestion: 0,
    totalQuestions: 5,
    answers: [],
    setupData: {},
    isRecording: false,
    recognition: null,
    synth: window.speechSynthesis,
    startTime: null
};

// ================================
// Sample Interview Questions
// ================================

const questionBank = {
    technical: [
        "Explain the difference between var, let, and const in JavaScript.",
        "How would you optimize a slow database query?",
        "Describe your experience with RESTful API design.",
        "What is your approach to debugging complex issues?",
        "Explain the concept of closures in JavaScript with an example.",
        "How do you ensure code quality in your projects?",
        "Describe a challenging technical problem you solved recently.",
        "What are the principles of object-oriented programming?",
        "How do you stay updated with new technologies?",
        "Explain the difference between SQL and NoSQL databases."
    ],
    hr: [
        "Tell me about yourself and your background.",
        "Why are you interested in this position?",
        "Describe a time when you faced a difficult challenge at work.",
        "How do you handle conflicts with team members?",
        "What are your greatest strengths and weaknesses?",
        "Where do you see yourself in five years?",
        "Tell me about a time you demonstrated leadership.",
        "How do you prioritize tasks when managing multiple projects?",
        "Describe a situation where you had to learn something quickly.",
        "Why should we hire you for this role?"
    ],
    mixed: [
        "Tell me about yourself and your background.",
        "Describe a challenging technical project you worked on.",
        "How do you handle feedback and criticism?",
        "Explain a complex technical concept to a non-technical person.",
        "Tell me about a time you demonstrated leadership.",
        "How would you approach learning a new technology?",
        "Describe your ideal work environment.",
        "What's your experience with agile methodologies?",
        "How do you balance technical debt with feature development?",
        "Tell me about a time you failed and what you learned."
    ]
};

// ================================
// Page Navigation
// ================================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageName;
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`a[href="#${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// ================================
// Authentication
// ================================

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simulate login
    console.log('Login attempt:', email);
    alert('Login successful! (Demo mode)');
    showPage('home');
}

function handleSignup(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Simulate signup
    console.log('Signup attempt:', { firstName, lastName, email });
    alert('Account created successfully! (Demo mode)\nPlease check your email to verify your account.');
    showPage('login');
}

function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('#passwordStrength .strength-bar');
    if (!strengthBar) return;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    
    strengthBar.style.width = strength + '%';
    
    if (strength <= 25) {
        strengthBar.style.background = '#ef4444';
    } else if (strength <= 50) {
        strengthBar.style.background = '#f59e0b';
    } else if (strength <= 75) {
        strengthBar.style.background = '#3b82f6';
    } else {
        strengthBar.style.background = '#10b981';
    }
}

// ================================
// FAQ Toggle
// ================================

function toggleFAQ(button) {
    const faqItem = button.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// ================================
// Blog Scrolling
// ================================

function scrollBlogs(direction) {
    const container = document.getElementById('blogContainer');
    const scrollAmount = 370; // card width + gap
    
    if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// ================================
// Setup Page - File Upload
// ================================

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file.');
        event.target.value = '';
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        event.target.value = '';
        return;
    }
    
    // Show preview
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const filePreview = document.getElementById('filePreview');
    const fileUploadContent = document.querySelector('.file-upload-content');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    filePreview.style.display = 'flex';
    fileUploadContent.style.display = 'none';
}

function removeFile() {
    const fileInput = document.getElementById('resume');
    const filePreview = document.getElementById('filePreview');
    const fileUploadContent = document.querySelector('.file-upload-content');
    
    fileInput.value = '';
    filePreview.style.display = 'none';
    fileUploadContent.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function selectQuestionCount(count) {
    // Update active button
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update hidden input
    document.getElementById('questionCount').value = count;
    state.totalQuestions = count;
}

// ================================
// Start Interview
// ================================

function startInterview(event) {
    event.preventDefault();
    
    // Collect setup data
    state.setupData = {
        resume: document.getElementById('resume').files[0],
        linkedin: document.getElementById('linkedin').value,
        interviewType: document.getElementById('interviewType').value,
        experienceLevel: document.getElementById('experienceLevel').value,
        jobRole: document.getElementById('jobRole').value,
        company: document.getElementById('company').value,
        questionCount: parseInt(document.getElementById('questionCount').value)
    };
    
    // Generate questions based on interview type
    const type = state.setupData.interviewType;
    const allQuestions = questionBank[type] || questionBank.mixed;
    const selectedQuestions = allQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, state.setupData.questionCount);
    
    state.totalQuestions = selectedQuestions.length;
    state.questions = selectedQuestions;
    state.currentQuestion = 0;
    state.answers = [];
    state.startTime = Date.now();
    
    // Initialize interview page
    document.getElementById('totalQuestions').textContent = state.totalQuestions;
    loadQuestion();
    
    // Show interview page
    showPage('interview');
}

// ================================
// Interview Page - Questions
// ================================

function loadQuestion() {
    const questionIndex = state.currentQuestion;
    const question = state.questions[questionIndex];
    
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
    document.getElementById('nextBtn').textContent = questionIndex === state.totalQuestions - 1 ? 'Finish' : 'Next';
    
    // Reset play button
    const playBtn = document.getElementById('playQuestionBtn');
    playBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}

function previousQuestion() {
    if (state.currentQuestion > 0) {
        saveCurrentAnswer();
        state.currentQuestion--;
        loadQuestion();
    }
}

function nextQuestion() {
    saveCurrentAnswer();
    
    if (state.currentQuestion < state.totalQuestions - 1) {
        state.currentQuestion++;
        loadQuestion();
    } else {
        // Finish interview
        finishInterview();
    }
}

function saveCurrentAnswer() {
    const isTextMode = document.getElementById('textMode').classList.contains('active');
    const answer = isTextMode 
        ? document.getElementById('answerText').value 
        : document.getElementById('transcriptText').textContent;
    
    state.answers[state.currentQuestion] = answer;
}

// ================================
// Answer Mode Switching
// ================================

function switchAnswerMode(mode) {
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
}

function updateCharCount() {
    const text = document.getElementById('answerText').value;
    document.getElementById('charCount').textContent = text.length;
}

// ================================
// Voice Features
// ================================

// ================================
// Play Question (Modern Async)
// ================================
const playQuestion = async () => {
    const { questions, currentQuestion, synth } = state;
    const question = questions[currentQuestion];
    const playBtn = document.getElementById("playQuestionBtn");

    // Stop if already speaking
    if (synth.speaking) {
        synth.cancel();
        playBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        return;
    }

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Change icon while speaking
    playBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="6" y="4" width="4" height="16" stroke-width="2"/>
            <rect x="14" y="4" width="4" height="16" stroke-width="2"/>
        </svg>`;

    await new Promise(resolve => {
        utterance.onend = resolve;
        synth.speak(utterance);
    });

    // Restore icon
    playBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" stroke-width="2"/>
        </svg>`;
};



// ================================
// Toggle Recording (Modern)
// ================================
const toggleRecording = () =>
    state.isRecording ? stopRecording() : startRecording();



// ================================
// Start Recording (Async Modern)
// ================================
const startRecording = async () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Speech recognition not supported. Use Chrome or Edge.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();

    Object.assign(state.recognition, {
        continuous: true,
        interimResults: true
    });

    let finalTranscript = "";

    state.recognition.onresult = ({ resultIndex, results }) => {
        let interimTranscript = "";

        for (let i = resultIndex; i < results.length; i++) {
            const transcript = results[i][0].transcript;
            results[i].isFinal
                ? (finalTranscript += transcript + " ")
                : (interimTranscript += transcript);
        }

        const transcriptText = document.getElementById("transcriptText");
        const voiceTranscript = document.getElementById("voiceTranscript");

        transcriptText.textContent = finalTranscript + interimTranscript;
        voiceTranscript.style.display = "block";
    };

    state.recognition.onerror = ({ error }) => {
        console.error("Speech error:", error);
        stopRecording();
        if (error === "not-allowed")
            alert("Please allow microphone access.");
    };

    state.recognition.onend = () => {
        if (state.isRecording) state.recognition.start();
    };

    state.recognition.start();
    state.isRecording = true;

    updateRecordingUI(true);
};



// ================================
// Stop Recording
// ================================
const stopRecording = () => {
    state.recognition?.stop();
    state.isRecording = false;
    updateRecordingUI(false);
};



// ================================
// UI Helper (Modern DRY)
// ================================
const updateRecordingUI = (recording) => {
    const recordBtn = document.getElementById("recordBtn");
    const voiceRecorder = document.querySelector(".voice-recorder");
    const voiceHint = document.getElementById("voiceHint");
    const recordText = document.getElementById("recordText");

    recordBtn.classList.toggle("recording", recording);
    voiceRecorder.classList.toggle("recording", recording);

    recordBtn.querySelector("svg").innerHTML = recording
        ? `<rect x="9" y="9" width="6" height="6"/>`
        : `<circle cx="12" cy="12" r="8"/>`;

    recordText.textContent = recording ? "Stop Recording" : "Start Recording";
    voiceHint.textContent = recording
        ? "Recording... Click to stop"
        : "Click to start recording your answer";
};
function finishInterview() {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - state.startTime) / 1000 / 60); // minutes
    
    // Generate results
    const results = generateResults(timeTaken);
    
    // Display results
    displayResults(results, timeTaken);
    
    // Show results page
    showPage('results');
}

function generateResults(timeTaken) {
    const scores = [];
    let totalScore = 0;
    
    // Generate score for each question
    state.answers.forEach((answer, index) => {
        const score = generateScore(answer, state.questions[index]);
        scores.push(score);
        totalScore += score.points;
    });
    
    const avgScore = Math.round(totalScore / state.answers.length);
    const grade = getGrade(avgScore);
    
    // Generate feedback
    const strengths = generateStrengths(scores);
    const weaknesses = generateWeaknesses(scores);
    const takeaways = generateTakeaways(scores);
    
    return {
        scores,
        avgScore,
        grade,
        strengths,
        weaknesses,
        takeaways,
        timeTaken
    };
}

function generateScore(answer, question) {
    // Simulate AI scoring
    const wordCount = answer.split(' ').length;
    let points = 0;
    
    // Base score on answer length
    if (wordCount < 20) {
        points = 60 + Math.random() * 15;
    } else if (wordCount < 50) {
        points = 70 + Math.random() * 15;
    } else if (wordCount < 100) {
        points = 80 + Math.random() * 15;
    } else {
        points = 85 + Math.random() * 10;
    }
    
    points = Math.round(points);
    
    // Generate feedback
    const positive = [];
    const negative = [];
    
    if (wordCount >= 50) {
        positive.push('Provided detailed and comprehensive answer');
    }
    if (answer.includes('example') || answer.includes('instance')) {
        positive.push('Used specific examples to illustrate points');
    }
    if (points >= 80) {
        positive.push('Demonstrated strong understanding of the topic');
    }
    
    if (wordCount < 30) {
        negative.push('Answer could be more detailed');
    }
    if (!answer.includes('example') && !answer.includes('instance')) {
        negative.push('Consider adding specific examples');
    }
    if (points < 75) {
        negative.push('Could demonstrate deeper knowledge');
    }
    
    return {
        question,
        answer,
        points,
        positive: positive.length > 0 ? positive : ['Solid foundation in response'],
        negative: negative.length > 0 ? negative : ['Minor improvements possible']
    };
}

function getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'C-';
}

function generateStrengths(scores) {
    const strengths = [
        'Clear and structured communication',
        'Strong technical knowledge demonstration',
        'Good use of specific examples',
        'Confident delivery',
        'Relevant industry experience'
    ];
    
    const avgScore = scores.reduce((sum, s) => sum + s.points, 0) / scores.length;
    
    if (avgScore >= 85) {
        return strengths.slice(0, 3);
    } else if (avgScore >= 75) {
        return strengths.slice(1, 4);
    } else {
        return strengths.slice(2, 5);
    }
}

function generateWeaknesses(scores) {
    const weaknesses = [
        'Could provide more quantifiable results',
        'Some answers could be more concise',
        'Include more industry-specific terminology',
        'Expand on leadership examples',
        'Discuss challenges and lessons learned'
    ];
    
    const avgScore = scores.reduce((sum, s) => sum + s.points, 0) / scores.length;
    
    if (avgScore < 75) {
        return weaknesses.slice(0, 3);
    } else {
        return weaknesses.slice(2, 5);
    }
}

function generateTakeaways(scores) {
    return [
        'Practice the STAR method for behavioral questions',
        'Research company-specific challenges beforehand',
        'Prepare 2-3 quantifiable achievements to reference',
        'Work on articulating technical concepts clearly',
        'Practice answering under time pressure'
    ].slice(0, 3);
}

function displayResults(results, timeTaken) {
    // Update overall score
    document.getElementById('scoreNumber').textContent = results.avgScore;
    document.getElementById('gradeValue').textContent = results.grade;
    document.getElementById('questionsAnswered').textContent = `${state.answers.length}/${state.totalQuestions}`;
    document.getElementById('avgScore').textContent = results.avgScore + '%';
    document.getElementById('timeTaken').textContent = timeTaken + ' min';
    
    // Update score circle
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (results.avgScore / 100) * circumference;
    document.getElementById('scoreCircle').style.strokeDashoffset = offset;
    
    // Update summary lists
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = results.strengths.map(s => `<li>${s}</li>`).join('');
    
    const weaknessesList = document.getElementById('weaknessesList');
    weaknessesList.innerHTML = results.weaknesses.map(w => `<li>${w}</li>`).join('');
    
    const takeawaysList = document.getElementById('takeawaysList');
    takeawaysList.innerHTML = results.takeaways.map(t => `<li>${t}</li>`).join('');
    
    // Update question breakdown
    const breakdownContainer = document.getElementById('questionBreakdown');
    breakdownContainer.innerHTML = results.scores.map((score, index) => `
        <div class="breakdown-item">
            <div class="breakdown-header">
                <p class="breakdown-question">Q${index + 1}: ${score.question}</p>
                <div class="breakdown-score">${score.points}%</div>
            </div>
            <div class="breakdown-answer">
                <strong>Your Answer:</strong> ${score.answer || 'No answer provided'}
            </div>
            <div class="breakdown-feedback">
                ${score.positive.map(p => `<div class="feedback-item positive">✓ ${p}</div>`).join('')}
                ${score.negative.map(n => `<div class="feedback-item negative">⚠ ${n}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function downloadReport() {
    alert('Download feature coming soon!\n\nYour report will be available as a PDF with detailed analysis, charts, and personalized recommendations.');
}

// ================================
// Initialize on Load
// ================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('InterviewAI loaded successfully!');
    
    // Show home page by default
    showPage('home');
    
    // Add smooth scroll for anchor links
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
    
    // Initialize text area character count
    const answerText = document.getElementById('answerText');
    if (answerText) {
        answerText.addEventListener('input', updateCharCount);
    }
});

// ================================
// Utility Functions
// ================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save answers to localStorage
const autoSaveAnswers = debounce(() => {
    if (state.answers.length > 0) {
        localStorage.setItem('interviewAI_progress', JSON.stringify({
            answers: state.answers,
            currentQuestion: state.currentQuestion,
            setupData: state.setupData,
            questions: state.questions,
            timestamp: Date.now()
        }));
    }
}, 2000);

// Load saved progress on page load
window.addEventListener('load', () => {
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
                }
            }
        } catch (e) {
            console.error('Error loading saved progress:', e);
        }
    }
});

// Save progress when answer changes
if (document.getElementById('answerText')) {
    document.getElementById('answerText').addEventListener('input', autoSaveAnswers);
}