// ================================
// AJAX & API Module (jQuery)
// ================================

// Load jQuery if not already loaded
if (typeof jQuery === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
    script.integrity = 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
}

// Wait for jQuery to load
const waitForJQuery = () => new Promise((resolve) => {
    const checkJQuery = setInterval(() => {
        if (typeof jQuery !== 'undefined') {
            clearInterval(checkJQuery);
            console.log('✅ jQuery loaded');
            resolve(jQuery);
        }
    }, 50);
});

// ================================
// API CONFIGURATION
// ================================

const API_CONFIG = Object.freeze({
    BASE_URL: 'https://api.interviewai.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    ENDPOINTS: {
        LOGIN:          '/auth/login',
        SIGNUP:         '/auth/signup',
        UPLOAD_RESUME:  '/upload/resume',
        SUBMIT_RESULTS: '/interview/results',
        GET_QUESTIONS:  '/interview/questions',
        TRACK_EVENT:    '/analytics/event',
        GET_LEADERBOARD: '/leaderboard',
        SAVE_PROGRESS:  '/interview/progress',
    }
});

// ================================
// AJAX WRAPPER CLASS
// ================================

class AjaxClient {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    // Get auth token from localStorage
    getAuthToken() {
        const user = localStorage.getItem('user');
        if (user) {
            const parsed = JSON.parse(user);
            return parsed.token || null;
        }
        return null;
    }

    // Build headers with auth
    buildHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // Generic AJAX request with jQuery
    async request(method, endpoint, data = null, options = {}) {
        await waitForJQuery();

        const config = {
            url: this.baseUrl + endpoint,
            method: method.toUpperCase(),
            headers: this.buildHeaders(options.headers),
            timeout: options.timeout || this.timeout,
            dataType: options.dataType || 'json',
        };

        if (data) {
            if (method.toUpperCase() === 'GET') {
                config.data = data; // query params
            } else {
                config.data = JSON.stringify(data);
                config.contentType = 'application/json';
            }
        }

        // Add progress callbacks if provided
        if (options.onProgress) {
            config.xhr = function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        options.onProgress(percent);
                    }
                }, false);
                return xhr;
            };
        }

        return new Promise((resolve, reject) => {
            $.ajax(config)
                .done((response) => {
                    console.log(`✅ ${method} ${endpoint} — Success`);
                    resolve(response);
                })
                .fail((jqXHR, textStatus, errorThrown) => {
                    console.error(`❌ ${method} ${endpoint} — Failed:`, textStatus);
                    reject({
                        status: jqXHR.status,
                        statusText: textStatus,
                        error: errorThrown,
                        response: jqXHR.responseJSON || jqXHR.responseText
                    });
                });
        });
    }

    // Convenience methods
    async get(endpoint, params = null, options = {}) {
        return this.request('GET', endpoint, params, options);
    }

    async post(endpoint, data = null, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data = null, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async delete(endpoint, data = null, options = {}) {
        return this.request('DELETE', endpoint, data, options);
    }

    // Upload file with progress
    async uploadFile(endpoint, file, additionalData = {}, onProgress = null) {
        await waitForJQuery();

        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional fields
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.baseUrl + endpoint,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: this.buildHeaders({ 'Content-Type': undefined }),
                timeout: this.timeout,
                xhr: function() {
                    const xhr = new window.XMLHttpRequest();
                    if (onProgress) {
                        xhr.upload.addEventListener('progress', (e) => {
                            if (e.lengthComputable) {
                                const percent = Math.round((e.loaded / e.total) * 100);
                                onProgress(percent);
                            }
                        }, false);
                    }
                    return xhr;
                }
            })
            .done(resolve)
            .fail((jqXHR, textStatus, errorThrown) => {
                reject({
                    status: jqXHR.status,
                    error: errorThrown,
                    response: jqXHR.responseJSON || jqXHR.responseText
                });
            });
        });
    }

    // Retry wrapper for failed requests
    async requestWithRetry(method, endpoint, data = null, options = {}) {
        const maxRetries = options.retries || API_CONFIG.RETRY_ATTEMPTS;
        const retryDelay = options.retryDelay || API_CONFIG.RETRY_DELAY;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.request(method, endpoint, data, options);
            } catch (error) {
                console.warn(`Retry attempt ${attempt}/${maxRetries}`);
                
                if (attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff
                await new Promise(resolve => 
                    setTimeout(resolve, retryDelay * attempt)
                );
            }
        }
    }

    // Batch requests (parallel)
    async batchRequests(requests) {
        await waitForJQuery();

        const promises = requests.map(req => 
            this.request(req.method, req.endpoint, req.data, req.options)
                .catch(err => ({ error: true, ...err }))
        );

        return Promise.all(promises);
    }

    // Poll endpoint until condition met
    async pollUntil(endpoint, condition, options = {}) {
        const interval = options.interval || 2000;
        const maxAttempts = options.maxAttempts || 30;
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const poll = async () => {
                attempts++;

                try {
                    const response = await this.get(endpoint);
                    
                    if (condition(response)) {
                        resolve(response);
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        reject(new Error('Polling timeout'));
                        return;
                    }

                    setTimeout(poll, interval);
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    }
}

// ================================
// MOCK API RESPONSES
// (for demo/testing without backend)
// ================================

const MOCK_ENABLED = true; // Toggle this

const mockResponses = {
    '/auth/login': (data) => ({
        success: true,
        token: 'mock_jwt_token_' + Date.now(),
        user: { id: 1, email: data.email, name: 'John Doe' }
    }),

    '/auth/signup': (data) => ({
        success: true,
        message: 'Account created successfully',
        user: { id: 2, email: data.email, name: data.firstName + ' ' + data.lastName }
    }),

    '/upload/resume': () => ({
        success: true,
        fileId: 'resume_' + Date.now(),
        url: 'https://storage.example.com/resume.pdf',
        analysis: {
            skills: ['JavaScript', 'Python', 'React'],
            experience: '3-5 years',
            educationLevel: 'Bachelor\'s'
        }
    }),

    '/interview/results': (data) => ({
        success: true,
        resultId: 'result_' + Date.now(),
        score: data.score,
        rank: Math.floor(Math.random() * 100) + 1,
        message: 'Results saved successfully'
    }),

    '/interview/questions': (params) => ({
        success: true,
        questions: [
            'Tell me about your experience with ' + (params.role || 'software development'),
            'Describe a challenging project you worked on',
            'How do you handle tight deadlines?',
            'What are your strengths and weaknesses?',
            'Where do you see yourself in 5 years?'
        ]
    }),

    '/analytics/event': () => ({
        success: true,
        tracked: true
    }),

    '/leaderboard': () => ({
        success: true,
        leaderboard: [
            { rank: 1, name: 'Alice', score: 95 },
            { rank: 2, name: 'Bob', score: 92 },
            { rank: 3, name: 'Charlie', score: 89 },
            { rank: 4, name: 'You', score: 85 },
            { rank: 5, name: 'Dave', score: 82 }
        ]
    })
};

// Mock AJAX wrapper
class MockAjaxClient extends AjaxClient {
    async request(method, endpoint, data = null, options = {}) {
        console.log(`🔶 MOCK ${method} ${endpoint}`, data);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Simulate upload progress
        if (options.onProgress) {
            for (let i = 0; i <= 100; i += 20) {
                await new Promise(resolve => setTimeout(resolve, 200));
                options.onProgress(i);
            }
        }

        // Check if mock response exists
        const mockFn = mockResponses[endpoint];
        if (mockFn) {
            return mockFn(data);
        }

        // Default mock response
        return { success: true, mock: true, endpoint };
    }
}

// ================================
// EXPORT API CLIENT
// ================================

const apiClient = MOCK_ENABLED ? new MockAjaxClient() : new AjaxClient();

export default apiClient;
export { AjaxClient, MockAjaxClient, API_CONFIG, waitForJQuery };