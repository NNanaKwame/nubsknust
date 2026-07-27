// js/scripts.js

let currentEventPageToken = null;
let isFetchingEvents = false;
let allLoadedEvents = []; 
let currentActiveFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const homeEventsContainer = document.getElementById('home-events-container');
  const fullEventsContainer = document.getElementById('full-events-container');
  const observerTarget = document.getElementById('events-observer-target');
  const wingContainer = document.getElementById('wings-container');
  const filterGroup = document.getElementById('event-filters');

  // Home Page: fetch and display optimized selection
  if (homeEventsContainer) {
    fetchEvents(homeEventsContainer, 6);
  }

  // Events Page: Initial load and Infinite Scroll setup
  if (fullEventsContainer && observerTarget) {
    fetchEvents(fullEventsContainer, 12, observerTarget);

    const observerOptions = { root: null, rootMargin: '200px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !isFetchingEvents && currentEventPageToken && currentActiveFilter === 'all') {
        fetchEvents(fullEventsContainer, 12, observerTarget);
      }
    }, observerOptions);

    observer.observe(observerTarget);
  }

  // Event Filter Chip Click Handlers
  if (filterGroup) {
    const chips = filterGroup.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        chips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');

        currentActiveFilter = e.target.getAttribute('data-filter');
        renderFilteredEvents();

        if (observerTarget) {
          observerTarget.style.display = (currentActiveFilter === 'all' && currentEventPageToken) ? 'block' : 'none';
        }
      });
    });
  }

  if (wingContainer) loadWingImages();
});

/**
 * Shared HTML generator for an event card
 */
function createEventCardHTML(event) {
  const { month, day } = parseDateBadge(event.date);
  return `
    <a href="event-details.html?id=${event.id}" class="event-card">
      <img src="${event.imageUrl}" alt="${event.title || 'Event Flyer'}" class="event-card-img" loading="lazy" />
      <div class="event-card-body">
        <div class="event-date-badge">
          <span class="event-date-month">${month}</span>
          <span class="event-date-day">${day}</span>
        </div>
        <div class="event-info">
          <span class="event-status-badge ${event.tagClass}">${event.tag}</span>
          <div class="event-location">${event.location || 'KNUST Campus'}</div>
          <h3 class="event-title">${event.title || 'Special Gathering'}</h3>
          <p class="event-desc">${event.description || ''}</p>
        </div>
      </div>
    </a>
  `;
}

/**
 * Renders events to the full events grid based on the active filter chip
 */
function renderFilteredEvents() {
  const container = document.getElementById('full-events-container');
  if (!container) return;

  let filtered = allLoadedEvents;

  if (currentActiveFilter !== 'all') {
    filtered = allLoadedEvents.filter(event => {
      const tagLower = event.tag.toLowerCase();
      if (currentActiveFilter === 'today') return tagLower.includes('today');
      if (currentActiveFilter === 'tomorrow') return tagLower.includes('tomorrow');
      if (currentActiveFilter === 'upcoming') return tagLower.includes('upcoming') || tagLower.includes('every');
      if (currentActiveFilter === 'past') return tagLower.includes('past');
      return true;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: #6b7280;">
        <h5>No Events Found</h5>
        <p>There are no events matching this filter category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(createEventCardHTML).join('');
}

/**
 * Unified Fetching Logic
 */
async function fetchEvents(container, limit, observerTarget = null) {
  if (isFetchingEvents) return;
  isFetchingEvents = true;

  try {
    if (observerTarget && currentActiveFilter === 'all') observerTarget.style.display = 'block';

    const pageKey = currentEventPageToken ? currentEventPageToken : 'page_1';
    const cacheKey = `nubs_events_v3_${limit}_${pageKey}`;
    const cachedItem = localStorage.getItem(cacheKey);

    let data = null;
    let useCache = false;

    if (cachedItem) {
      const parsedCache = JSON.parse(cachedItem);
      if (new Date().getTime() < parsedCache.expiry) {
        data = parsedCache.data;
        useCache = true;
      } else {
        localStorage.removeItem(cacheKey); 
      }
    }

    if (!useCache) {
      let url = `/api/get-events?type=events&limit=${limit}`;
      if (currentEventPageToken) url += `&pageToken=${currentEventPageToken}`;

      const response = await fetch(url);
      data = await response.json();

      const expiryTime = currentEventPageToken 
        ? new Date().getTime() + (30 * 24 * 60 * 60 * 1000) 
        : new Date().getTime() + (60 * 60 * 1000);          

      localStorage.setItem(cacheKey, JSON.stringify({ expiry: expiryTime, data }));
    }

    if (!data.items || data.items.length === 0) {
      if (!currentEventPageToken && allLoadedEvents.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: #6b7280;">
            <h5>No Upcoming Events Listed</h5>
            <p>Check back soon for updates.</p>
          </div>
        `;
      }
      if (observerTarget) observerTarget.style.display = 'none';
      return;
    }

    const { upcoming, all } = processAndSortEvents(data.items);

    // HOME PAGE SPECIFIC LOGIC: Prioritize Today & Tomorrow, then Upcoming (No Past)
    if (container.id === 'home-events-container') {
      const todayTomorrow = upcoming.filter(e => e.tag.toLowerCase().includes('today') || e.tag.toLowerCase().includes('tomorrow'));
      const strictlyUpcoming = upcoming.filter(e => !todayTomorrow.includes(e));

      // Combine today/tomorrow first, fill remaining slots with upcoming events up to 3 cards
      const prioritizedHomeEvents = [...todayTomorrow, ...strictlyUpcoming].slice(0, 3);

      if (prioritizedHomeEvents.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem 0; color: #6b7280;"><p>No active gatherings right now.</p></div>`;
        return;
      }

      container.innerHTML = prioritizedHomeEvents.map(createEventCardHTML).join('');
      return;
    }

    // FULL EVENTS PAGE LOGIC: Append to master list and render
    all.forEach(newItem => {
      if (!allLoadedEvents.some(existing => existing.id === newItem.id)) {
        allLoadedEvents.push(newItem);
      }
    });

    renderFilteredEvents();
    currentEventPageToken = data.nextPageToken;

    if (observerTarget) {
      observerTarget.style.display = (currentEventPageToken && currentActiveFilter === 'all') ? 'block' : 'none';
    }

  } catch (error) {
    console.error("Error loading events:", error);
    if (!currentEventPageToken && allLoadedEvents.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #dc3545; padding: 2rem 0;">
          <p>Unable to load events at this time.</p>
        </div>
      `;
    }
  } finally {
    isFetchingEvents = false;
  }
}

async function loadWingImages() {
  try {
    const response = await fetch('/api/get-wings');
    const data = await response.json();
    if (!data.wings) return;

    data.wings.forEach(wing => {
      const cleanSlug = wing.slug.replace(/\.(jpg|jpeg|png|webp)$/i, '').trim().toLowerCase();
      const imgElement = document.getElementById(`wing-img-${cleanSlug}`);
      if (imgElement) imgElement.src = wing.imageUrl;
    });
  } catch (err) {
    console.error('[WINGS ERROR]', err);
  }
}