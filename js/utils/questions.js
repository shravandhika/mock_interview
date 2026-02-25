// ================================
// Interview Questions Bank
// ================================

export const questionBank = {
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
        "Explain the difference between SQL and NoSQL databases.",
        "What is your experience with version control systems like Git?",
        "How do you approach testing in your development process?",
        "Explain the concept of microservices architecture.",
        "What security best practices do you follow?",
        "Describe your experience with cloud platforms like AWS or Azure."
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
        "Why should we hire you for this role?",
        "Tell me about a time you made a mistake and how you handled it.",
        "How do you handle stress and pressure?",
        "Describe your ideal work environment.",
        "What motivates you in your career?",
        "Tell me about a time you went above and beyond."
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
        "Tell me about a time you failed and what you learned.",
        "How do you stay productive when working remotely?",
        "Describe your approach to mentoring junior developers.",
        "What's your process for making technical decisions?",
        "How do you ensure code maintainability?",
        "Tell me about a successful collaboration experience."
    ]
};

// Get random questions
export const getRandomQuestions = (type, count) => {
    const questions = questionBank[type] || questionBank.mixed;
    return questions
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
};

// Get question difficulty
export const getQuestionDifficulty = (question) => {
    const technicalKeywords = ['optimize', 'algorithm', 'architecture', 'design pattern', 'performance'];
    const advancedKeywords = ['scale', 'distributed', 'microservices', 'security'];
    
    const lowerQuestion = question.toLowerCase();
    
    if (advancedKeywords.some(keyword => lowerQuestion.includes(keyword))) {
        return 'advanced';
    } else if (technicalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
        return 'intermediate';
    } else {
        return 'basic';
    }
};