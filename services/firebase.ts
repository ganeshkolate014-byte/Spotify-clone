import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCQsAywd9YMgyZRJlW_gewcOZQKWM_N-7U",
  authDomain: "spotify-app-ec883.firebaseapp.com",
  projectId: "spotify-app-ec883",
  storageBucket: "spotify-app-ec883.firebasestorage.app",
  messagingSenderId: "316774609008",
  appId: "1:316774609008:web:13ed3c24a8795ad729c4b5",
  measurementId: "G-HVEDJVTFL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const analytics = getAnalytics(app);

export { app, auth, db, rtdb, analytics };