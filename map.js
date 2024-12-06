// map.js
import { db, auth } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  collection,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

let map;
let placesService;
let markers = [];
let currentUser = null;

const austinLocation = { lat: 30.2672, lng: -97.7431 };
const radiusInMeters = 16000; // about 10 miles

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

window.initMap = function() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: austinLocation,
    zoom: 13,
  });
  
  placesService = new google.maps.places.PlacesService(map);

  // Perform an immediate search for apartments
  const request = {
    location: austinLocation,
    radius: radiusInMeters,
    keyword: 'apartment OR condo'
  };

  placesService.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
      displayApartments(results);
    } else {
      alert("No apartments found in this area.");
      clearApartmentsList();
    }
  });
};

function displayApartments(apartments) {
  clearApartmentsList();
  clearMarkers();

  const apartmentsList = document.getElementById('apartmentsList');
  apartments.forEach((apartment) => {
    // Create marker
    const marker = new google.maps.Marker({
      position: apartment.geometry.location,
      map,
      title: apartment.name
    });
    markers.push(marker);

    // Calculate distance from Austin center in miles
    const distanceMiles = distanceBetweenLocations(
      austinLocation.lat, austinLocation.lng,
      apartment.geometry.location.lat(), apartment.geometry.location.lng()
    );

    // Add to list
    const li = document.createElement('li');
    li.textContent = `${apartment.name} - ${distanceMiles.toFixed(2)} miles away`;
    apartmentsList.appendChild(li);
  });

  // Save to Firestore if user is logged in
  if (currentUser) {
    saveApartmentsToUser(apartments);
  }
}

function clearApartmentsList() {
  const apartmentsList = document.getElementById('apartmentsList');
  apartmentsList.innerHTML = '';
}

function clearMarkers() {
  for (const marker of markers) {
    marker.setMap(null);
  }
  markers = [];
}

async function saveApartmentsToUser(apartments) {
  const userId = currentUser.uid;
  const userApartmentsRef = collection(db, 'users', userId, 'apartments');

  for (const apartment of apartments) {
    const distanceMiles = distanceBetweenLocations(
      austinLocation.lat, austinLocation.lng,
      apartment.geometry.location.lat(), apartment.geometry.location.lng()
    );

    const docRef = doc(userApartmentsRef, apartment.place_id);
    await setDoc(docRef, {
      name: apartment.name,
      distanceMiles: distanceMiles,
      luxury: 'N/A',
      amenities: 'N/A',
      finalRating: 'N/A'
    });
  }
}

function distanceBetweenLocations(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) *
            Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(value) {
  return value * Math.PI / 180;
}
