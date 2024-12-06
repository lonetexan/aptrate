// auth.js
import { auth, db } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

window.registerUser = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert("User registered successfully!");
  } catch (error) {
    alert("Registration failed: " + error.message);
  }
};

window.loginUser = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully!");
  } catch (error) {
    alert("Login failed: " + error.message);
  }
};

window.logoutUser = async () => {
  try {
    await signOut(auth);
    alert("You have been logged out.");
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
};

async function loadUserApartments(uid) {
  const ratingsTableBody = document.querySelector('#ratingsTable tbody');
  ratingsTableBody.innerHTML = '';

  const userApartmentsRef = collection(db, 'users', uid, 'apartments');
  const querySnapshot = await getDocs(userApartmentsRef);

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = data.name;

    const luxuryTd = document.createElement('td');
    luxuryTd.textContent = data.luxury ?? 'N/A';

    const amenitiesTd = document.createElement('td');
    amenitiesTd.textContent = data.amenities ?? 'N/A';

    const distanceTd = document.createElement('td');
    distanceTd.textContent = data.distanceMiles?.toFixed(2) ?? 'N/A';

    const finalRatingTd = document.createElement('td');
    finalRatingTd.textContent = data.finalRating ?? 'N/A';

    tr.appendChild(nameTd);
    tr.appendChild(luxuryTd);
    tr.appendChild(amenitiesTd);
    tr.appendChild(distanceTd);
    tr.appendChild(finalRatingTd);

    ratingsTableBody.appendChild(tr);
  });
}

onAuthStateChanged(auth, (user) => {
  window.currentUser = user; // Expose user globally
  if (user) {
    loadUserApartments(user.uid);
  } else {
    const ratingsTableBody = document.querySelector('#ratingsTable tbody');
    ratingsTableBody.innerHTML = '';
  }
});
