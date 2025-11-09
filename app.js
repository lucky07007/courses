// js/app.js (Concept for Course Data and Progress)

import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// **Simulated Course Data (Replace with real Firestore collection fetching)**
const courses = {
    'course1': { title: 'Introduction to HTML', totalLessons: 10, content: ['...'], description: 'Learn the basics of web structure.' },
    'course2': { title: 'Mastering CSS', totalLessons: 8, content: ['...'], description: 'Design beautiful, responsive websites.' }
    // Add more courses
};

// --- PROGRESS TRACKING FUNCTIONS ---

export async function getUserProgress(userId) {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
        return userSnap.data().enrolledCourses || {};
    }
    return {};
}

export async function markLessonComplete(courseId, lessonIndex, userId) {
    const userProgress = await getUserProgress(userId);
    const courseProgress = userProgress[courseId] || { completedLessons: [], totalLessons: courses[courseId].totalLessons };
    
    // Simple check to prevent duplicates and ensure lesson exists
    if (!courseProgress.completedLessons.includes(lessonIndex) && lessonIndex < courseProgress.totalLessons) {
        courseProgress.completedLessons.push(lessonIndex);
        courseProgress.completedLessons.sort((a, b) => a - b); // Keep it sorted
        
        const progressPercentage = Math.round((courseProgress.completedLessons.length / courseProgress.totalLessons) * 100);
        
        const userDocRef = doc(db, "users", userId);
        
        // Update Firestore
        await updateDoc(userDocRef, {
            [`enrolledCourses.${courseId}`]: {
                completedLessons: courseProgress.completedLessons,
                totalLessons: courseProgress.totalLessons,
                progress: progressPercentage
            }
        });

        console.log(`Progress for ${courseId} updated to ${progressPercentage}%`);
        // You would typically re-render the UI here
    }
}

// --- DASHBOARD RENDERING ---

export async function loadDashboard(user) {
    const userId = user.uid;
    const progressData = await getUserProgress(userId);
    const courseListEl = document.getElementById('enrolled-courses-list');
    
    let html = '<h3>Your Enrolled Courses</h3>';
    
    // Display enrolled courses and progress
    for (const courseId in courses) {
        const course = courses[courseId];
        const progress = progressData[courseId] || { progress: 0 };
        
        html += `
            <div class="course-card">
                <h4>${course.title}</h4>
                <p>${course.description}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress.progress}%"></div>
                </div>
                <p>Progress: ${progress.progress || 0}%</p>
                <a href="/course.html?id=${courseId}">Continue Course</a>
            </div>
        `;
    }
    
    courseListEl.innerHTML = html;
    // You would add sidebar logic here too
}

// --- COURSE PAGE LOGIC ---

export function loadCoursePage(courseId, userId) {
    const course = courses[courseId];
    const mainContent = document.getElementById('main-content');

    if (!course) {
        mainContent.innerHTML = '<h1>Course Not Found</h1>';
        return;
    }

    // Render course content (simplified)
    mainContent.innerHTML = `
        <h1>${course.title}</h1>
        <p>${course.description}</p>
        <div id="lessons-list">
            ${course.content.map((lesson, index) => `
                <div class="lesson">
                    Lesson ${index + 1}: ${lesson} 
                    <button class="complete-btn" data-lesson-index="${index}">Mark Complete</button>
                </div>
            `).join('')}
        </div>
        <button id="back-to-dashboard">Back to Dashboard</button>
    `;

    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        window.history.pushState({}, '', '/');
        // Router will handle the render
        window.location.reload(); 
    });

    document.querySelectorAll('.complete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const lessonIndex = parseInt(e.target.dataset.lessonIndex);
            markLessonComplete(courseId, lessonIndex, userId);
            e.target.disabled = true; // Simple visual feedback
            e.target.textContent = 'Completed!';
        });
    });

    // Fetch and highlight already completed lessons here using getUserProgress
}
