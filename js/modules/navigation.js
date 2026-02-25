// ================================
// Navigation Module
// ================================

import { state } from './state.js';

// Show specific page
export const showPage = (pageName) => {
    // Dispatch page change event
    window.dispatchEvent(new CustomEvent('pageChange', { 
        detail: { from: state.currentPage, to: pageName, timestamp: Date.now() } 
    }));
    
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
        updateNavLinks(pageName);
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update document title
        updatePageTitle(pageName);
    }
};

// Update active navigation links
const updateNavLinks = (pageName) => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`a[href="#${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

// Update page title
const updatePageTitle = (pageName) => {
    const titles = {
        home: 'InterviewAI - Master Your Next Interview',
        about: 'About Us - InterviewAI',
        pricing: 'Pricing - InterviewAI',
        faq: 'FAQ - InterviewAI',
        login: 'Login - InterviewAI',
        signup: 'Sign Up - InterviewAI',
        setup: 'Setup Interview - InterviewAI',
        interview: 'Interview in Progress - InterviewAI',
        results: 'Interview Results - InterviewAI'
    };
    
    document.title = titles[pageName] || 'InterviewAI';
};

// Toggle mobile menu
export const toggleMobileMenu = () => {
    const navMenu = document.getElementById('navMenu');
    const isOpen = navMenu.classList.toggle('active');
    
    // Dispatch menu toggle event
    window.dispatchEvent(new CustomEvent('mobileMenuToggle', { 
        detail: { isOpen, timestamp: Date.now() } 
    }));
};

// Close mobile menu when clicking outside
export const closeMobileMenuOnOutsideClick = (event) => {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu.classList.contains('active') && 
        !navMenu.contains(event.target) && 
        !menuToggle.contains(event.target)) {
        navMenu.classList.remove('active');
    }
};

// Handle browser back/forward navigation
export const handlePopState = (event) => {
    const page = event.state?.page || 'home';
    showPage(page);
};