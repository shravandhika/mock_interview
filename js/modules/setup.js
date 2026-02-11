// ================================
// Interview Setup Module
// ================================

import { state } from './state.js';
import { showPage } from './navigation.js';
import { questionBank } from '../utils/questions.js';

// Handle file upload
export const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
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
    
    // Dispatch file upload event
    window.dispatchEvent(new CustomEvent('fileUploaded', { 
        detail: { fileName: file.name, fileSize: file.size, timestamp: Date.now() } 
    }));
    
    // Show preview
    displayFilePreview(file);
};

// Display file preview
const displayFilePreview = (file) => {
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const filePreview = document.getElementById('filePreview');
    const fileUploadContent = document.querySelector('.file-upload-content');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    filePreview.style.display = 'flex';
    fileUploadContent.style.display = 'none';
};

// Remove uploaded file
export const removeFile = () => {
    const fileInput = document.getElementById('resume');
    const filePreview = document.getElementById('filePreview');
    const fileUploadContent = document.querySelector('.file-upload-content');
    
    fileInput.value = '';
    filePreview.style.display = 'none';
    fileUploadContent.style.display = 'block';
    
    // Dispatch file remove event
    window.dispatchEvent(new CustomEvent('fileRemoved', { 
        detail: { timestamp: Date.now() } 
    }));
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Select question count
export const selectQuestionCount = (count) => {
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.getElementById('questionCount').value = count;
    state.totalQuestions = count;
    
    // Dispatch question count change event
    window.dispatchEvent(new CustomEvent('questionCountChanged', { 
        detail: { count, timestamp: Date.now() } 
    }));
};

// Start interview
export const startInterview = (event) => {
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
    
    // Validate required fields
    if (!state.setupData.resume) {
        alert('Please upload your resume.');
        return;
    }
    
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
    
    // Dispatch interview start event
    window.dispatchEvent(new CustomEvent('interviewStarted', { 
        detail: { 
            questionCount: state.totalQuestions, 
            interviewType: type,
            timestamp: Date.now() 
        } 
    }));
    
    // Initialize interview page
    document.getElementById('totalQuestions').textContent = state.totalQuestions;
    
    // Load first question (imported from interview.js)
    import('./interview.js').then(module => {
        module.loadQuestion();
    });
    
    // Show interview page
    showPage('interview');
};

// Handle drag and drop
export const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
};

export const handleDragLeave = (event) => {
    event.currentTarget.classList.remove('drag-over');
};

export const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('resume');
        fileInput.files = files;
        handleFileUpload({ target: fileInput });
    }
};