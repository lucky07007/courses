// js/auth.js

import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// --- AUTH FUNCTIONS ---

export function handleSignUp(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Signed up and created user
            const user = userCredential.user;
            console.log('User signed up:', user.uid);
            // Create a user document in Firestore for progress tracking
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                enrolledCourses: {} // { courseId: { completedLessons: [], totalLessons: 5, progress: 0 } }
            });
            window.location.href = '/'; // Redirect to dashboard
        })
        .catch((error) => {
            alert("Signup Error: " + error.message);
        });
}

export function handleSignIn(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            console.log('User signed in:', userCredential.user.uid);
            window.location.href = '/'; // Redirect to dashboard/home
        })
        .catch((error) => {
            alert("Login Error: " + error.message);
        });
}

export function handleSignOut() {
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log('User signed out.');
        window.location.href = '/'; // Redirect to the main page (which will show login)
    }).catch((error) => {
        alert("Signout Error: " + error.message);
    });
}

// --- AUTH STATE LISTENER (Crucial for page access) ---

export function observeAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}
