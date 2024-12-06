// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Replace these with your actual Firebase configuration values from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyCb28g5WhTEaOigffWmm19-nJ6UoWgrVNs",
  authDomain: "aptrate-6ffd2.firebaseapp.com",
  projectId: "aptrate-6ffd2",
  storageBucket: "aptrate-6ffd2.firebasestorage.app",
  messagingSenderId: "699740497613",
  appId: "1:699740497613:web:29a0392bb5ad50c2c8ab84"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export them so other files can use them
export { auth, db };