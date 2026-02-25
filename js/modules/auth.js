// ================================
// Authentication Module
// ================================

import { showPage } from './navigation.js';
import apiClient from '../utils/ajax.js';

// Handle user login
export const handleLogin = (event) => {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validate inputs
    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Simulate login with loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userLogin', { 
        detail: { email, timestamp: Date.now() } 
    }));
    
    setTimeout(() => {
        console.log('Login attempt:', email);
        alert('Login successful! (Demo mode)');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        // Store user session
        sessionStorage.setItem('user', JSON.stringify({ email, loggedIn: true }));
        
        showPage('home');
    }, 1000);
};

// Handle user signup
export const handleSignup = (event) => {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Validate inputs
    if (!firstName || !lastName || !email || !password) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Password strength validation
    if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }
    
    // Simulate signup with loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userSignup', { 
        detail: { firstName, lastName, email, timestamp: Date.now() } 
    }));
    
    setTimeout(() => {
        console.log('Signup attempt:', { firstName, lastName, email });
        alert('Account created successfully! (Demo mode)\nPlease check your email to verify your account.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        showPage('login');
    }, 1500);
};

// Check password strength
export const checkPasswordStrength = (password) => {
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
    
    // Dispatch password strength event
    window.dispatchEvent(new CustomEvent('passwordStrengthChange', { 
        detail: { strength } 
    }));
};

// Logout user
export const handleLogout = () => {
    sessionStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('userLogout', { 
        detail: { timestamp: Date.now() } 
    }));
    showPage('home');
};

// Check if user is logged in
export const isUserLoggedIn = () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user).loggedIn : false;
};