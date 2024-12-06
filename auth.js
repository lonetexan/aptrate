// auth.js
import { auth, db } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

window.registerUser = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("User registered successfully!");
  } catch (error) {
    alert("Registration failed: " + error.message);
  }
};

window.loginUser = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
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

onAuthStateChanged(auth, (user) => {
  window.currentUser = user; 
  if (user) {
    loadUserApartments(user.uid);
  } else {
    const ratingsTableBody = document.querySelector('#ratingsTable tbody');
    if (ratingsTableBody) {
      ratingsTableBody.innerHTML = '';
    }
  }
});

async function loadUserApartments(uid) {
  const ratingsTableBody = document.querySelector('#ratingsTable tbody');
  if (!ratingsTableBody) return;
  ratingsTableBody.innerHTML = '';

  const userApartmentsRef = collection(db, 'users', uid, 'apartments');
  const querySnapshot = await getDocs(userApartmentsRef);

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement('tr');
    tr.setAttribute('data-place-id', docSnap.id);

    // Apartment name
    const nameTd = document.createElement('td');
    nameTd.textContent = data.name;
    tr.appendChild(nameTd);

    // Luxury
    tr.appendChild(createEditableTd(docSnap.id, 'luxury', data.luxury));

    // Amenities
    tr.appendChild(createEditableTd(docSnap.id, 'amenities', data.amenities));

    // Distance
    tr.appendChild(createEditableTd(docSnap.id, 'distanceMiles', data.distanceMiles));

    // Price
    tr.appendChild(createEditableTd(docSnap.id, 'price', data.price));

    // Sq Ft
    tr.appendChild(createEditableTd(docSnap.id, 'sq_ft', data.sq_ft));

    // Price / Sq Ft (computed)
    const pricePerSqFtTd = document.createElement('td');
    pricePerSqFtTd.textContent = data.price_per_sq_ft > 0 ? data.price_per_sq_ft.toFixed(2) : 'N/A';
    pricePerSqFtTd.setAttribute('data-field', 'price_per_sq_ft');
    tr.appendChild(pricePerSqFtTd);

    // Final Rating (computed)
    const finalRatingTd = document.createElement('td');
    finalRatingTd.textContent = data.finalRating?.toFixed(2) ?? 'N/A';
    finalRatingTd.setAttribute('data-field', 'finalRating');
    tr.appendChild(finalRatingTd);

    ratingsTableBody.appendChild(tr);
  });
}

function createEditableTd(placeId, fieldName, value) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'number';
  input.value = value ?? 0;
  input.addEventListener('change', () => {
    updateApartmentField(placeId, fieldName, input.value);
  });
  td.appendChild(input);
  return td;
}

async function updateApartmentField(placeId, field, value) {
  if (!window.currentUser) return;
  
  const aptRef = doc(db, 'users', currentUser.uid, 'apartments', placeId);
  const aptSnap = await getDoc(aptRef);
  if (!aptSnap.exists()) return;

  const aptData = aptSnap.data();
  aptData[field] = parseFloat(value) || 0;

  // Recalculate finalRating and price_per_sq_ft
  const luxury = parseFloat(aptData.luxury) || 0;
  const amenities = parseFloat(aptData.amenities) || 0;
  const price = parseFloat(aptData.price) || 0;
  const sq_ft = parseFloat(aptData.sq_ft) || 0;

  aptData.finalRating = (luxury + amenities) / 2;
  aptData.price_per_sq_ft = (sq_ft > 0) ? (price / sq_ft) : 0;

  await setDoc(aptRef, aptData);
  updateApartmentRow(placeId, aptData);
}

function updateApartmentRow(placeId, aptData) {
  const row = document.querySelector(`tr[data-place-id="${placeId}"]`);
  if (!row) return;

  const finalRatingTd = row.querySelector('[data-field="finalRating"]');
  if (finalRatingTd) {
    finalRatingTd.textContent = aptData.finalRating?.toFixed(2) ?? 'N/A';
  }

  const pricePerSqFtTd = row.querySelector('[data-field="price_per_sq_ft"]');
  if (pricePerSqFtTd) {
    pricePerSqFtTd.textContent = (aptData.price_per_sq_ft > 0) ? aptData.price_per_sq_ft.toFixed(2) : 'N/A';
  }
}

window.loadUserApartments = loadUserApartments;
