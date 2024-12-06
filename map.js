// map.js
// Uses window.currentUser, window.db from firebaseConfig and auth
// Saves apartments with default values for ratings, price, sq_ft, etc.

let map;
let placesService;
let markers = [];

const austinLocation = { lat: 30.2672, lng: -97.7431 };
const radiusInMeters = 16000; // about 10 miles

window.initMap = function() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: austinLocation,
    zoom: 13,
  });

  placesService = new google.maps.places.PlacesService(map);

  const request = {
    location: austinLocation,
    radius: radiusInMeters,
    keyword: 'apartment OR condo'
  };

  placesService.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
      displayApartments(results);
    } else {
      console.log("No apartments found in this area.");
      clearApartmentsList();
    }
  });
};

function displayApartments(apartments) {
  clearApartmentsList();
  clearMarkers();

  const apartmentsList = document.getElementById('apartmentsList');
  apartments.forEach((apartment) => {
    const marker = new google.maps.Marker({
      position: apartment.geometry.location,
      map: map,
      title: apartment.name
    });
    markers.push(marker);

    const distanceMiles = distanceBetweenLocations(
      austinLocation.lat, austinLocation.lng,
      apartment.geometry.location.lat(), apartment.geometry.location.lng()
    );

    const li = document.createElement('li');
    li.textContent = `${apartment.name} - ${distanceMiles.toFixed(2)} miles away`;
    apartmentsList.appendChild(li);
  });

  // Save to Firestore if user is logged in
  if (window.currentUser && window.db) {
    saveApartmentsToUser(apartments);
  }
}

function clearApartmentsList() {
  const apartmentsList = document.getElementById('apartmentsList');
  if (apartmentsList) {
    apartmentsList.innerHTML = '';
  }
}

function clearMarkers() {
  for (const marker of markers) {
    marker.setMap(null);
  }
  markers = [];
}

async function saveApartmentsToUser(apartments) {
  const userId = window.currentUser.uid;
  const userApartmentsRef = window.db.collection('users').doc(userId).collection('apartments');

  for (const apartment of apartments) {
    const distanceMiles = distanceBetweenLocations(
      austinLocation.lat, austinLocation.lng,
      apartment.geometry.location.lat(), apartment.geometry.location.lng()
    );

    // Default values for new fields
    const defaultData = {
      name: apartment.name,
      distanceMiles: distanceMiles,
      luxury: 0,
      amenities: 0,
      price: 0,
      sq_ft: 0,
      finalRating: 0,
      price_per_sq_ft: 0
    };

    await userApartmentsRef.doc(apartment.place_id).set(defaultData);
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

// If you have a searchCity function for the search box, you can keep it or remove it
window.searchCity = function() {
  // Implement if needed; currently not required by the request
};
