
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCoKOzHW_tzgTtrH5Ain5wdF6jeaaytkxY",
    authDomain: "anime-app-6b87e.firebaseapp.com",
    projectId: "anime-app-6b87e",
    storageBucket: "anime-app-6b87e.firebasestorage.app",
    messagingSenderId: "683273629384",
    appId: "1:683273629384:web:5d7035687a3b92bba4bffd"
};

// Initialize Firebase
let app: any;
let auth: any;
let db: any;

try {
    if (firebaseConfig.apiKey) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase config missing, skipping initialization.");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { app, auth, db };
