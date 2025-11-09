// js/app.js - CORE APPLICATION LOGIC

import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// --- SIMULATED/MOCKED COURSE DATA STRUCTURE ---
// In a real app, this would be fetched from a 'courses' Firestore collection
const MOCKED_COURSES = {
    'intro-html': { 
        id: 'intro-html', 
        title: 'Introduction to HTML5', 
        description: 'Build the structure of the web.',
        rating: 4.8, 
        enrollments: 1200, // For "Trending"
        image: 'html-logo.png',
        totalLessons: 5,
        content: [
            { title: "L1: HTML Document Structure", videoId: "youtube-id-1", notes: "Basic tags: html, head, body." },
            { title: "L2: Text and Lists", videoId: "youtube-id-2", notes: "Headings, paragraphs, ordered/unordered lists." },
            { title: "L3: Links and Images", videoId: "youtube-id-3", notes: "The <a> and <img> tags, relative vs absolute paths." },
            { title: "L4: Tables and Forms", videoId: "youtube-id-4", notes: "Creating basic data tables and user input forms." },
            { title: "L5: Semantic HTML", videoId: "youtube-id-5", notes: "Using header, footer, article, section." }
        ]
    },
    'css-master': { 
        id: 'css-master', 
        title: 'CSS Mastery & Flexbox', 
        description: 'Style beautiful, responsive websites.',
        rating: 4.5, 
        enrollments: 800, 
        image: 'css-logo.png',
        totalLessons: 8,
        content: [
            { title: "L1: CSS Selectors & Box Model", videoId: "youtube-id-6", notes: "ID, Class, Element selectors. Margin, padding, border." },
            { title: "L2: Layout with Flexbox", videoId: "youtube-id-7", notes: "Justify-content, align-items, flex-direction." },
            // ... more lessons
        ]
    }
};

// --- FIRESTORE DATA FUNCTIONS (for dynamic dashboard & progress) ---

/**
 * Gets the user's progress map from Firestore.
 * @param {string} userId - The unique ID of the current user.
 * @returns {Promise<Object>} A map of course IDs to their progress objects.
 */
async function getUserProgress(userId) {
    if (!userId) return {};
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
        // Returns the 'enrolledCourses' field
        return userSnap.data().enrolledCourses || {};
    }
    // Automatically enroll user if document doesn't exist (e.g., first login)
    await updateDoc(userDocRef, { enrolledCourses: {} }, { merge: true });
    return {};
}

/**
 * Updates the user's progress for a specific lesson.
 */
export async function markLessonComplete(courseId, lessonIndex, userId) {
    const course = MOCKED_COURSES[courseId];
    if (!course) return;

    const userDocRef = doc(db, "users", userId);
    const userProgress = await getUserProgress(userId);

    // Get current progress or initialize it
    const courseProgress = userProgress[courseId] || { 
        completedLessons: [], 
        totalLessons: course.totalLessons, 
        progress: 0 
    };
    
    // Convert lessonIndex to string for consistent Firestore array storage
    const lessonKey = String(lessonIndex);

    if (!courseProgress.completedLessons.includes(lessonKey)) {
        courseProgress.completedLessons.push(lessonKey);
        
        const progressPercentage = Math.round((courseProgress.completedLessons.length / courseProgress.totalLessons) * 100);
        
        // Update Firestore
        await updateDoc(userDocRef, {
            [`enrolledCourses.${courseId}`]: {
                completedLessons: courseProgress.completedLessons,
                totalLessons: courseProgress.totalLessons,
                progress: progressPercentage
            }
        });

        console.log(`Progress for ${courseId} updated to ${progressPercentage}%`);
        return progressPercentage;
    }
    return courseProgress.progress;
}

// --- DASHBOARD RENDERING ---

/**
 * Loads the main dashboard content and sidebar.
 */
export async function loadDashboard(user) {
    const userId = user.uid;
    const progressData = await getUserProgress(userId);
    const courseListEl = document.getElementById('enrolled-courses-list');
    const sidebarEl = document.getElementById('sidebar');

    // 1. Render Enrolled Courses
    let enrolledHtml = '<h3>Your Enrolled Courses</h3>';
    let enrolledFound = false;
    
    for (const courseId in MOCKED_COURSES) {
        const course = MOCKED_COURSES[courseId];
        const progress = progressData[courseId] || { progress: 0 }; // Assume enrolled if it's in MOCKED_COURSES for demo
        
        enrolledFound = true;
        enrolledHtml += `
            <div class="course-card">
                <h4>${course.title}</h4>
                <p class="progress-text">Progress: ${progress.progress || 0}%</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress.progress || 0}%"></div>
                </div>
                <a href="/?id=${courseId}" class="course-link">Continue Course</a>
            </div>
        `;
    }
    
    courseListEl.innerHTML = enrolledFound ? enrolledHtml : '<p>No courses enrolled yet. Check out the sidebar!</p>';
    
    // 2. Render Sidebar (Trending/Top-Rated)
    const sortedCourses = Object.values(MOCKED_COURSES)
        .sort((a, b) => b.rating - a.rating); // Sort by rating
    
    let sidebarHtml = `
        <h3><i class="fas fa-chart-line"></i> Trending Courses</h3>
        <ul class="sidebar-list">
            ${sortedCourses.slice(0, 3).map(c => 
                `<li><a href="/?id=${c.id}">${c.title} (${c.enrollments} enrolled)</a></li>`
            ).join('')}
        </ul>
        <h3><i class="fas fa-star"></i> Top Rated Courses</h3>
        <ul class="sidebar-list">
            ${sortedCourses.slice(0, 3).map(c => 
                `<li><a href="/?id=${c.id}">${c.title} (${c.rating} <span class="star">★</span>)</a></li>`
            ).join('')}
        </ul>
        <button id="profile-btn" class="sidebar-btn">Edit Profile</button>
    `;

    sidebarEl.innerHTML = sidebarHtml;
}

// --- COURSE PAGE LOGIC ---

/**
 * Renders the specific course page.
 */
export async function loadCoursePage(courseId, userId) {
    const course = MOCKED_COURSES[courseId];
    const mainContent = document.getElementById('main-content');

    if (!course) {
        mainContent.innerHTML = '<h1>404 Course Not Found</h1>';
        return;
    }
    
    // Fetch current user progress
    const progressData = await getUserProgress(userId);
    const courseProgress = progressData[courseId] || { completedLessons: [], progress: 0 };
    
    // Get the first incomplete lesson or the first lesson
    const currentLessonIndex = courseProgress.completedLessons.length > 0 
        ? Math.min(courseProgress.completedLessons.length, course.totalLessons - 1)
        : 0;

    const currentLesson = course.content[currentLessonIndex];
    
    // Render the main course structure
    mainContent.innerHTML = `
        <div class="course-viewer-layout">
            <aside id="course-sidebar" class="course-sidebar">
                <h2>${course.title}</h2>
                <p>Progress: ${courseProgress.progress}%</p>
                <div class="progress-bar-container large-bar">
                    <div class="progress-bar" style="width: ${courseProgress.progress}%"></div>
                </div>
                <ul id="lesson-list" class="lesson-list">
                    ${course.content.map((lesson, index) => {
                        const isCompleted = courseProgress.completedLessons.includes(String(index));
                        const statusClass = isCompleted ? 'completed' : (index === currentLessonIndex ? 'current' : '');
                        return `
                            <li class="lesson-item ${statusClass}" data-lesson-index="${index}">
                                <i class="fas fa-check-circle lesson-icon"></i>
                                <span>${lesson.title}</span>
                            </li>
                        `;
                    }).join('')}
                </ul>
                <button id="back-to-dashboard" class="sidebar-btn full-width-btn">Back to Dashboard</button>
            </aside>

            <section id="course-main-content" class="course-main-content">
                </section>
        </div>
    `;

    // Function to update video/notes area
    const renderLessonContent = (lesson, lessonIndex) => {
        document.getElementById('course-main-content').innerHTML = `
            <div class="video-container">
                <iframe 
                    width="100%" 
                    height="400" 
                    src="https://www.youtube.com/embed/${lesson.videoId}" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            </div>

            <div class="notes-section">
                <h3>Lesson ${lessonIndex + 1}: ${lesson.title}</h3>
                <p>${lesson.notes}</p>
                <button id="mark-complete-btn" 
                        data-lesson-index="${lessonIndex}"
                        class="primary-btn"
                        ${courseProgress.completedLessons.includes(String(lessonIndex)) ? 'disabled' : ''}>
                    ${courseProgress.completedLessons.includes(String(lessonIndex)) ? 'Completed!' : 'Mark as Complete'}
                </button>
            </div>
        `;
        
        // Add event listener for "Mark as Complete"
        const completeBtn = document.getElementById('mark-complete-btn');
        if (completeBtn && !completeBtn.disabled) {
            completeBtn.addEventListener('click', async (e) => {
                const index = parseInt(e.target.dataset.lessonIndex);
                const newProgress = await markLessonComplete(courseId, index, userId);
                
                // Update UI without full page reload
                e.target.textContent = 'Completed!';
                e.target.disabled = true;
                
                // Update progress bar and sidebar status
                document.querySelector('.large-bar .progress-bar').style.width = `${newProgress}%`;
                document.querySelector('.course-sidebar p').textContent = `Progress: ${newProgress}%`;
                document.querySelector(`.lesson-item[data-lesson-index="${index}"]`).classList.add('completed');
                document.querySelector(`.lesson-item[data-lesson-index="${index}"]`).classList.remove('current');
                
                // Automatically go to the next lesson if available
                if (index < course.totalLessons - 1) {
                    const nextLessonIndex = index + 1;
                    const nextLesson = course.content[nextLessonIndex];
                    renderLessonContent(nextLesson, nextLessonIndex);
                    document.querySelector(`.lesson-item[data-lesson-index="${nextLessonIndex}"]`).classList.add('current');
                }
            });
        }
    };
    
    // Initial render of the current lesson
    renderLessonContent(currentLesson, currentLessonIndex);
    
    // Add click listeners to sidebar lessons for navigation
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.lessonIndex);
            document.querySelectorAll('.lesson-item').forEach(li => li.classList.remove('current'));
            item.classList.add('current');
            renderLessonContent(course.content[index], index);
        });
    });

    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        window.location.href = '/'; 
    });
}
