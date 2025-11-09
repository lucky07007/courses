// js/router.js

import { observeAuthState, handleSignOut } from './auth.js';
import { loadDashboard } from './app.js'; // Assumed function in app.js
import { loadCoursePage } from './app.js'; // Assumed function in app.js

const mainContent = document.getElementById('main-content');
const appHeader = document.getElementById('app-header');

function renderLoginPage() {
    // A simple way to switch content (you'd use templates/innerHTML for the full design)
    mainContent.innerHTML = `
        <div class="auth-container">
            <h2>Login / Signup</h2>
            <input type="email" id="auth-email" placeholder="Email">
            <input type="password" id="auth-password" placeholder="Password">
            <button id="login-btn">Log In</button>
            <button id="signup-btn">Sign Up</button>
        </div>
    `;

    // Attach event listeners after rendering
    document.getElementById('login-btn').addEventListener('click', () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        handleSignIn(email, password);
    });
    document.getElementById('signup-btn').addEventListener('click', () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        handleSignUp(email, password);
    });

    appHeader.innerHTML = '<h1>Course Platform</h1>';
}

function renderDashboardPage(user) {
    mainContent.innerHTML = `
        <div class="dashboard-layout">
            <aside id="sidebar" class="sidebar">
                </aside>
            <section id="dashboard-main" class="dashboard-main">
                <h2>Welcome, ${user.email}!</h2>
                <div id="enrolled-courses-list">Loading courses...</div>
                </section>
        </div>
    `;
    // Load dynamic dashboard content
    loadDashboard(user); 

    appHeader.innerHTML = `
        <h1>Dashboard</h1>
        <button id="logout-btn">Log Out</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', handleSignOut);
}

function checkRoute(user) {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');

    if (courseId) {
        // Course Page
        if (user) {
            loadCoursePage(courseId, user.uid);
        } else {
            alert('Please log in to access this course.');
            // Redirect to login/home
            window.history.pushState({}, '', '/');
            renderLoginPage();
        }
    } else if (path === '/' || path === '/index.html') {
        // Dashboard/Home Page
        if (user) {
            renderDashboardPage(user);
        } else {
            renderLoginPage();
        }
    } else {
        // 404 or unknown page
        mainContent.innerHTML = '<h1>404 Page Not Found</h1>';
    }
}

// Start the routing logic
observeAuthState((user) => {
    checkRoute(user);
});
