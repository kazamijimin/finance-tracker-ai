// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDD5EGlmvjv627Cz74mQXGgdDN4B3LSSC4",
  authDomain: "finance-tracker-70121.firebaseapp.com",
  projectId: "finance-tracker-70121",
  storageBucket: "finance-tracker-70121.appspot.com", // fixed typo: .app to .appspot.com
  messagingSenderId: "63203897675",
  appId: "1:63203897675:web:8b85d27707a1cae5a2b8ce",
  measurementId: "G-5BS1BZMTQH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, analytics, db };