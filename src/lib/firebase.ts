
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAIEqYmkYSY2PiXSffjAYA9ZShtu5fDfGw",
    authDomain: "anime-app-4721e.firebaseapp.com",
    projectId: "anime-app-4721e",
    storageBucket: "anime-app-4721e.firebasestorage.app",
    messagingSenderId: "200196301786",
    appId: "1:200196301786:web:5a3db94c3d052e5cdd56e3"
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
