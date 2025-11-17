/*
async function loadEvents() {
  const response = await fetch('/api/events');
  const events = await response.json();
  const container = document.getElementById('eventContainer');
  container.innerHTML = '';

  events.forEach(event => {
    const card = document.createElement('div');
    card.classList.add('event-card');
    card.innerHTML = `
      <h3>${event.EventName}</h3>
      <p>${event.Description}</p>
      <p><strong>Date:</strong> ${new Date(event.EventDate).toLocaleDateString()}</p>
      <button onclick="signUp(${event.EventID})">Sign Up</button>
    `;
    container.appendChild(card);
  });
}

async function signUp(eventId) {
  // Replace userId with logged-in user ID from JWT or profile API
  const userId = 1;

  const response = await fetch('/api/events/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, userId })
  });

  const result = await response.json();
  alert(result.message);
}

loadEvents();
*/

// ---------- SAMPLE EVENT DATA ----------
const events = [
  {
    id: 1,
    title: "Beach Cleanup at East Coast Park",
    date: "2025-12-05",
    location: "East Coast Park, Singapore",
    description: "Join us to help clean up the beach and protect marine life!",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=60"
  },
  {
    id: 2,
    title: "Food Distribution for the Elderly",
    date: "2025-12-12",
    location: "Hougang Community Centre",
    description: "Distribute warm meals to elderly residents in need.",
    image: "https://images.unsplash.com/photo-1603575448878-868a20723f3d?auto=format&fit=crop&w=800&q=60"
  },
  {
    id: 3,
    title: "Tree Planting Day",
    date: "2026-01-10",
    location: "Bukit Timah Nature Reserve",
    description: "Contribute to reforestation efforts by planting trees!",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=60"
  }
];

// ---------- LOAD EVENTS INTO PAGE ----------
const eventList = document.getElementById('eventList');
events.forEach(event => {
  const card = document.createElement('div');
  card.classList.add('event-card');
  card.innerHTML = `
    <img src="${event.image}" class="event-img" alt="${event.title}">
    <div class="event-details">
      <h3>${event.title}</h3>
      <p><strong>Date:</strong> ${event.date}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p>${event.description}</p>
      <button class="signup-btn" onclick="signUp('${event.title}')">Sign Up</button>
    </div>
  `;
  eventList.appendChild(card);
});

// ---------- SIGN-UP BUTTON FUNCTION ----------
function signUp(eventTitle) {
  alert(`🎉 You have successfully signed up for "${eventTitle}"!`);
}

