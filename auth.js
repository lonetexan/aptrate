// auth.js
import { auth, db } from './firebaseConfig.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

let currentUser = null;
window.currentUser = currentUser; // make it accessible in global scope if needed

window.registerUser = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered:", userCredential.user);
    alert("User registered successfully!");
  } catch (error) {
    console.error("Registration error:", error.message);
    alert("Registration failed: " + error.message);
  }
};

window.loginUser = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
    alert("Logged in successfully!");
  } catch (error) {
    console.error("Login error:", error.message);
    alert("Login failed: " + error.message);
  }
};

window.logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
    alert("You have been logged out.");
  } catch (error) {
    console.error("Logout error:", error.message);
    alert("Logout failed: " + error.message);
  }
};

// Load user apartments from Firestore into the ratings table
async function loadUserApartments(uid) {
  const ratingsTableBody = document.querySelector('#ratingsTable tbody');
  ratingsTableBody.innerHTML = ''; // Clear existing rows

  const userApartmentsRef = collection(db, 'users', uid, 'apartments');
  const querySnapshot = await getDocs(userApartmentsRef);

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const tr = document.createElement('tr');

    // data: { name: string, distanceMiles: number, luxury: number, amenities: number, finalRating: number }
    const nameTd = document.createElement('td');
    nameTd.textContent = data.name;

    const luxuryTd = document.createElement('td');
    luxuryTd.textContent = data.luxury ?? 'N/A'; // Placeholder

    const amenitiesTd = document.createElement('td');
    amenitiesTd.textContent = data.amenities ?? 'N/A'; // Placeholder

    const distanceTd = document.createElement('td');
    distanceTd.textContent = data.distanceMiles?.toFixed(2) ?? 'N/A';

    const finalRatingTd = document.createElement('td');
    finalRatingTd.textContent = data.finalRating ?? 'N/A'; // Placeholder

    tr.appendChild(nameTd);
    tr.appendChild(luxuryTd);
    tr.appendChild(amenitiesTd);
    tr.appendChild(distanceTd);
    tr.appendChild(finalRatingTd);

    ratingsTableBody.appendChild(tr);
  });
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  window.currentUser = user; // store globally
  if (user) {
    console.log("User is logged in:", user.email);
    // Load their apartments
    loadUserApartments(user.uid);
  } else {
    console.log("No user is logged in.");
    // Clear ratings table
    const ratingsTableBody = document.querySelector('#ratingsTable tbody');
    ratingsTableBody.innerHTML = '';
  }
});