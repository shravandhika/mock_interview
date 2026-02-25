// ================================
// Results Module
// ================================

import { state } from './state.js';
import { showPage } from './navigation.js';

// Finish interview and generate results
export const finishInterview = () => {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - state.startTime) / 1000 / 60); // minutes
    
    // Dispatch interview finished event
    window.dispatchEvent(new CustomEvent('interviewFinished', { 
        detail: { 
            timeTaken, 
            questionsAnswered: state.answers.length,
            timestamp: Date.now() 
        } 
    }));
    
    // Generate results
    const results = generateResults(timeTaken);
    
    // Display results
    displayResults(results, timeTaken);
    
    // Clear saved progress
    localStorage.removeItem('interviewAI_progress');
    
    // Show results page
    showPage('results');
};

// Generate interview results
const generateResults = (timeTaken) => {
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
};

// Generate score for individual answer
const generateScore = (answer, question) => {
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
    if (answer.toLowerCase().includes('example') || answer.toLowerCase().includes('instance')) {
        positive.push('Used specific examples to illustrate points');
    }
    if (points >= 80) {
        positive.push('Demonstrated strong understanding of the topic');
    }
    
    if (wordCount < 30) {
        negative.push('Answer could be more detailed');
    }
    if (!answer.toLowerCase().includes('example') && !answer.toLowerCase().includes('instance')) {
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
};

// Get letter grade from score
const getGrade = (score) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'C-';
};

// Generate strengths
const generateStrengths = (scores) => {
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
};

// Generate weaknesses
const generateWeaknesses = (scores) => {
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
};

// Generate key takeaways
const generateTakeaways = (scores) => {
    return [
        'Practice the STAR method for behavioral questions',
        'Research company-specific challenges beforehand',
        'Prepare 2-3 quantifiable achievements to reference',
        'Work on articulating technical concepts clearly',
        'Practice answering under time pressure'
    ].slice(0, 3);
};

// Display results on page
const displayResults = (results, timeTaken) => {
    // Update overall score with animation
    animateScore(results.avgScore);
    
    document.getElementById('gradeValue').textContent = results.grade;
    document.getElementById('questionsAnswered').textContent = `${state.answers.length}/${state.totalQuestions}`;
    document.getElementById('avgScore').textContent = results.avgScore + '%';
    document.getElementById('timeTaken').textContent = timeTaken + ' min';
    
    // Update score circle with animation
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (results.avgScore / 100) * circumference;
    const scoreCircle = document.getElementById('scoreCircle');
    scoreCircle.style.strokeDashoffset = circumference; // Start from 0
    
    setTimeout(() => {
        scoreCircle.style.transition = 'stroke-dashoffset 2s ease-out';
        scoreCircle.style.strokeDashoffset = offset;
    }, 100);
    
    // Update summary lists
    document.getElementById('strengthsList').innerHTML = 
        results.strengths.map(s => `<li>${s}</li>`).join('');
    
    document.getElementById('weaknessesList').innerHTML = 
        results.weaknesses.map(w => `<li>${w}</li>`).join('');
    
    document.getElementById('takeawaysList').innerHTML = 
        results.takeaways.map(t => `<li>${t}</li>`).join('');
    
    // Update question breakdown
    document.getElementById('questionBreakdown').innerHTML = 
        results.scores.map((score, index) => `
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
};

// Animate score counting up
const animateScore = (targetScore) => {
    const scoreElement = document.getElementById('scoreNumber');
    let currentScore = 0;
    const increment = targetScore / 60; // 60 frames for smooth animation
    
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= targetScore) {
            scoreElement.textContent = targetScore;
            clearInterval(timer);
        } else {
            scoreElement.textContent = Math.round(currentScore);
        }
    }, 30);
};

// Download report
export const downloadReport = () => {
    // Dispatch download event
    window.dispatchEvent(new CustomEvent('reportDownloadRequested', { 
        detail: { timestamp: Date.now() } 
    }));
    
    alert('Download feature coming soon!\n\nYour report will be available as a PDF with detailed analysis, charts, and personalized recommendations.');
};