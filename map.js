// map.js

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
  const infoWindow = new google.maps.InfoWindow();

  apartments.forEach((apartment) => {
    const distanceMiles = distanceBetweenLocations(
      austinLocation.lat, austinLocation.lng,
      apartment.geometry.location.lat(), apartment.geometry.location.lng()
    );

    // Add the listing to the sidebar
    const li = document.createElement('li');
    li.textContent = `${apartment.name} - ${distanceMiles.toFixed(2)} miles away`;
    apartmentsList.appendChild(li);

    // Get more details using place_id
    const detailsRequest = {
      placeId: apartment.place_id,
      fields: [
        'name', 'formatted_phone_number', 'international_phone_number',
        'website', 'opening_hours', 'photos', 'vicinity', 'geometry'
      ]
    };

    placesService.getDetails(detailsRequest, (details, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && details) {
        addApartmentMarker(details, distanceMiles, infoWindow);
      } else {
        // If we can't get details, fallback to basic info from apartment
        // This will show less info: no phone number, hours, etc.
        addApartmentMarker(apartment, distanceMiles, infoWindow);
      }
    });
  });

  // If user is logged in and db is available, save apartments
  if (window.currentUser && window.db) {
    saveApartmentsToUser(apartments);
  }
}

function addApartmentMarker(placeDetails, distanceMiles, infoWindow) {
  const marker = new google.maps.Marker({
    position: placeDetails.geometry.location,
    map: map,
    title: placeDetails.name
  });
  markers.push(marker);

  marker.addListener('click', () => {
    let contentString = `
      <div style="color:#000;">
        <h2>${placeDetails.name}</h2>
        <p>${distanceMiles.toFixed(2)} miles away</p>
        <p><strong>Address:</strong> ${placeDetails.vicinity || 'N/A'}</p>
    `;

    // Add phone number if available
    if (placeDetails.formatted_phone_number) {
      contentString += `<p><strong>Phone:</strong> ${placeDetails.formatted_phone_number}</p>`;
    }

    // Add website link if available
    if (placeDetails.website) {
      contentString += `<p><a href="${placeDetails.website}" target="_blank" rel="noopener">Visit Website</a></p>`;
    }

    // Add hours of operation if available
    if (placeDetails.opening_hours && placeDetails.opening_hours.weekday_text) {
      contentString += `<p><strong>Hours:</strong><br>${placeDetails.opening_hours.weekday_text.join('<br>')}</p>`;
    }

    // Add a photo if available
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      const photoUrl = placeDetails.photos[0].getUrl({ maxWidth: 400 });
      contentString += `
        <div style="margin-top: 10px;">
          <img src="${photoUrl}" alt="Apartment Photo" style="max-width:100%; height:auto; border-radius:5px;">
        </div>
      `;
    }

    contentString += `</div>`; // close content div

    infoWindow.setContent(contentString);
    infoWindow.open(map, marker);
  });

  return marker;
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

    await userApartmentsRef.doc(apartment.place_id).set({
      name: apartment.name,
      distanceMiles: distanceMiles,
      luxury: 'N/A',
      amenities: 'N/A',
      finalRating: 'N/A'
    });
  }
}

function distanceBetweenLocations(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
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