// js/router.js - Updated to handle dedicated login page and enforce access

import { observeAuthState, handleSignOut, handleSignIn, handleSignUp } from './auth.js';
import { loadDashboard, loadCoursePage } from './app.js'; 

const mainContent = document.getElementById('main-content');
const appHeader = document.getElementById('app-header');

/**
 * Checks the current route and authentication status to determine which page to load.
 * Enforces login for accessing course pages or the dashboard.
 */
function checkRoute(user) {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    const intendedUrl = localStorage.getItem('intendedUrl');
    
    // 1. If user is logged in
    if (user) {
        // Clear any stored redirect URL
        localStorage.removeItem('intendedUrl'); 

        // Redirect from login.html to dashboard if logged in
        if (path.includes('login.html')) {
            window.location.replace('/');
            return;
        }

        // Check if a course is requested (e.g., /?id=course1)
        if (courseId) {
            // Load the full course content within index.html
            loadCoursePage(courseId, user.uid);
            
            // Set header for course view
            appHeader.innerHTML = `
                <a href="/" class="header-logo">Course Platform</a>
                <button id="logout-btn">Log Out</button>
            `;
            document.getElementById('logout-btn').addEventListener('click', handleSignOut);
            
        } else {
            // Load the dashboard (e.g., / or /index.html)
            loadDashboard(user);
            
            // Set header for dashboard view
            appHeader.innerHTML = `
                <a href="/" class="header-logo">Dashboard</a>
                <button id="logout-btn" class="primary-btn">Log Out</button>
            `;
            document.getElementById('logout-btn').addEventListener('click', handleSignOut);
        }

    // 2. If user is NOT logged in
    } else { 
        // If they are on the login page, do nothing (the login.html script handles the form)
        if (path.includes('login.html')) {
            // The logic is handled by the script tag inside login.html
            return; 
        }

        // If a course ID is present, save the URL and redirect to login
        if (courseId) {
            // Save the intended course URL for post-login redirect
            localStorage.setItem('intendedUrl', window.location.href);
            window.location.replace('/login.html');
            return;
        }
        
        // Default: If not logged in and not accessing a course, redirect to login page
        window.location.replace('/login.html');
    }
}

// Start the routing logic
observeAuthState((user) => {
    checkRoute(user);
});
