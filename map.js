import { supabase } from './supabaseClient.js'; // Make sure this import is at the top

// Remove or comment out local storage functions if not needed
// If you want to keep them as a fallback, just don't call them.

// Instead of localStorage, we use Supabase:
async function fetchSavedApartmentsFromSupabase() {
  if (!window.currentUser) return [];
  const { data, error } = await supabase
    .from('saved_apartments')
    .select('*')
    .eq('user_id', window.currentUser.id);

  if (error) {
    console.error("Error fetching saved apartments:", error);
    return [];
  }
  return data;
}

async function saveApartmentToSupabase(apartment) {
  if (!window.currentUser) {
    alert("You must be logged in to save apartments.");
    return;
  }

  const { data, error } = await supabase
    .from('saved_apartments')
    .upsert({
      user_id: window.currentUser.id,
      place_id: apartment.place_id,
      name: apartment.name,
      vicinity: apartment.vicinity,
      website: apartment.website,
      photo_url: apartment.photo,
      rating: apartment.rating || 0
    }, { onConflict: 'user_id,place_id' });

  if (error) {
    console.error("Error saving apartment:", error);
    alert("Error saving apartment: " + error.message);
  } else {
    alert('Apartment saved!');
  }
}

async function unsaveApartmentFromSupabase(place_id) {
  if (!window.currentUser) {
    alert("You must be logged in to remove saved apartments.");
    return;
  }

  const { error } = await supabase
    .from('saved_apartments')
    .delete()
    .eq('user_id', window.currentUser.id)
    .eq('place_id', place_id);

  if (error) {
    console.error("Error removing apartment:", error);
    alert("Error removing apartment: " + error.message);
  }

  displaySavedApartments(); // Refresh the list
}

async function updateApartmentRatingInSupabase(place_id, rating) {
  if (!window.currentUser) {
    alert("You must be logged in to rate apartments.");
    return;
  }

  const { error } = await supabase
    .from('saved_apartments')
    .update({ rating })
    .eq('user_id', window.currentUser.id)
    .eq('place_id', place_id);

  if (error) {
    console.error("Error updating rating:", error);
  }
}

// Modify addApartmentToList to use saveApartmentToSupabase instead of local save
function addApartmentToList(details) {
  const li = document.createElement('li');
  li.className = 'apartment-item';

  let photoHtml = '';
  let photoUrl = '';
  if (details.photos && details.photos.length > 0) {
    photoUrl = details.photos[0].getUrl({ maxWidth: 200 });
    photoHtml = `<img src="${photoUrl}" alt="${details.name}" />`;
  }

  let websiteHtml = '';
  if (details.website) {
    websiteHtml = `<a href="${details.website}" target="_blank">Visit Website</a><br>`;
  }

  li.innerHTML = `
    <strong>${details.name}</strong><br>
    ${details.vicinity || 'Address not available'}<br>
    ${photoHtml}
    ${websiteHtml}
  `;

  // Only show save button if user is logged in
  if (window.currentUser) {
    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Save';
    saveBtn.addEventListener('click', () => {
      const apartmentData = {
        place_id: details.place_id,
        name: details.name,
        vicinity: details.vicinity,
        website: details.website || '',
        photo: photoUrl,
        rating: 0
      };
      saveApartmentToSupabase(apartmentData);
    });
    li.appendChild(saveBtn);
  } else {
    // If not logged in, show a prompt to log in
    const loginPrompt = document.createElement('p');
    loginPrompt.textContent = 'Log in to save this apartment.';
    li.appendChild(loginPrompt);
  }

  apartmentsList.appendChild(li);
}

// Override displaySavedApartments to load from Supabase
window.displaySavedApartments = async function() {
  const savedList = document.getElementById('savedApartmentsList');
  savedList.innerHTML = '';

  if (!window.currentUser) {
    savedList.innerHTML = '<p>Please log in to see your saved apartments.</p>';
    return;
  }

  const savedApartments = await fetchSavedApartmentsFromSupabase();
  if (savedApartments.length === 0) {
    savedList.innerHTML = '<p>No saved apartments yet.</p>';
    return;
  }

  savedApartments.forEach(apartment => {
    const li = document.createElement('li');
    li.className = 'saved-apartment-item';

    let photoHtml = '';
    if (apartment.photo_url) {
      photoHtml = `<img src="${apartment.photo_url}" alt="${apartment.name}" />`;
    }

    let websiteHtml = '';
    if (apartment.website) {
      websiteHtml = `<a href="${apartment.website}" target="_blank">Visit Website</a><br>`;
    }

    li.innerHTML = `
      <strong>${apartment.name}</strong><br>
      ${apartment.vicinity || 'Address not available'}<br>
      ${photoHtml}
      ${websiteHtml}
    `;

    // Rating stars
    const ratingContainer = document.createElement('div');
    ratingContainer.style.margin = '10px 0';

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.innerText = '★';
      star.style.cursor = 'pointer';
      star.style.fontSize = '20px';
      star.style.marginRight = '5px';
      star.style.color = i <= (apartment.rating || 0) ? 'gold' : '#ccc';

      star.addEventListener('mouseover', () => {
        highlightStars(ratingContainer, i);
      });
      star.addEventListener('mouseout', () => {
        highlightStars(ratingContainer, apartment.rating || 0);
      });
      star.addEventListener('click', () => {
        updateApartmentRatingInSupabase(apartment.place_id, i);
        apartment.rating = i;
        highlightStars(ratingContainer, i);
      });

      ratingContainer.appendChild(star);
    }

    li.appendChild(ratingContainer);

    const unsaveBtn = document.createElement('button');
    unsaveBtn.innerText = 'Unsave';
    unsaveBtn.addEventListener('click', () => unsaveApartmentFromSupabase(apartment.place_id));
    li.appendChild(unsaveBtn);

    savedList.appendChild(li);
  });
};
