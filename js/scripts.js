// js/scripts.js

document.addEventListener('DOMContentLoaded', () => {
  const homeEventsContainer = document.getElementById('home-events-container');
  const fullEventsContainer = document.getElementById('full-events-container');
  const eventsContainer = document.getElementById('events-container');

  // Home Page: fetch and display top 3
  if (homeEventsContainer) fetchEvents(homeEventsContainer, 3);

  // Events Page: fetch and display up to 12
  if (fullEventsContainer) fetchEvents(fullEventsContainer, 12);
  if (eventsContainer) fetchEvents(eventsContainer, 12);
});

/**
 * Helper to parse month and day from date strings
 */
function parseDateBadge(dateStr) {
  if (!dateStr) return { month: 'JUL', day: '23' };

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      month: parsed.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: parsed.getDate().toString()
    };
  }

  const dayMatch = dateStr.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/i);
  const monthMatch = dateStr.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i);

  const month = monthMatch ? monthMatch[1].substring(0, 3).toUpperCase() : 'EVENT';
  const day = dayMatch ? dayMatch[1] : '-';

  return { month, day };
}


/**
 * Dynamically updates wing card images by matching generated slugs to element IDs
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if we are on the wings page
  const wingContainer = document.getElementById('wings-container');
  if (wingContainer) {
    loadWingImages();
  }
});

async function loadWingImages() {
  try {
    const response = await fetch('/api/get-wings');
    const data = await response.json();

    if (!data.wings || data.wings.length === 0) {
      console.warn('[WINGS] No wing images returned from API.');
      return;
    }

    console.log('[WINGS] Received wings from API:', data.wings);

    data.wings.forEach(wing => {
      // Clean slug: removes file extension and cleans whitespace/underscores
      const cleanSlug = wing.slug
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .trim()
        .toLowerCase();

      const imgElement = document.getElementById(`wing-img-${cleanSlug}`);

      if (imgElement) {
        imgElement.src = wing.imageUrl;
        console.log(`[WINGS SUCCESS] Loaded image for #wing-img-${cleanSlug}`);
      } else {
        console.warn(`[WINGS MISMATCH] Element #wing-img-${cleanSlug} not found in DOM.`);
      }
    });

  } catch (err) {
    console.error('[WINGS ERROR] Failed loading wing images:', err);
  }
}

/**
 * Fetch events from API and render card layout
 */
async function fetchEvents(container, limit) {
  try {
    const response = await fetch(`/api/get-events?type=events&limit=${limit}`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: #6b7280;">
          <h5>No Upcoming Events Listed</h5>
          <p>Check back soon for updates.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.items.map(event => {
      const { month, day } = parseDateBadge(event.date);

      return `
        <a href="event-details.html?id=${event.id}" class="event-card">
          <img 
            src="${event.imageUrl}" 
            alt="${event.title || 'Event Flyer'}" 
            class="event-card-img" 
            loading="lazy"
          />
          <div class="event-card-body">
            <div class="event-date-badge">
              <span class="event-date-month">${month}</span>
              <span class="event-date-day">${day}</span>
            </div>
            <div class="event-info">
              <div class="event-location">${event.location || 'KNUST Campus'}</div>
              <h3 class="event-title">${event.title || 'Special Gathering'}</h3>
              <p class="event-desc">${event.description || ''}</p>
            </div>
          </div>
        </a>
      `;
    }).join('');

  } catch (error) {
    console.error("Error loading events:", error);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #dc3545; padding: 2rem 0;">
        <p>Unable to load events at this time.</p>
      </div>
    `;
  }
}