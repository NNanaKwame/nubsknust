// js/scripts.js

let currentEventPageToken = null;
let isFetchingEvents = false;
let allLoadedEvents = []; 
let currentActiveFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const homeEventsContainer = document.getElementById('home-events-container');
  const fullEventsContainer = document.getElementById('full-events-container');
  const eventsContainer = document.getElementById('events-container'); // Backward compatibility support
  const observerTarget = document.getElementById('events-observer-target');
  const wingContainer = document.getElementById('wings-container');
  const filterGroup = document.getElementById('event-filters');

  // Home Page: fetch and display optimized selection (top 3)
  if (homeEventsContainer) {
    fetchEvents(homeEventsContainer, 6);
  }

  // Events Page: Initial load (support both container IDs) and Infinite Scroll setup
  const targetEventsContainer = fullEventsContainer || eventsContainer;
  if (targetEventsContainer) {
    fetchEvents(targetEventsContainer, 12, observerTarget);

    if (observerTarget) {
      const observerOptions = { root: null, rootMargin: '200px', threshold: 0.1 };
      const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isFetchingEvents && currentEventPageToken && currentActiveFilter === 'all') {
          fetchEvents(targetEventsContainer, 12, observerTarget);
        }
      }, observerOptions);

      observer.observe(observerTarget);
    }
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

  // Wings Page
  if (wingContainer) {
    loadWingImages();
  }
});

/**
 * Shared HTML generator for an event card incorporating performance optimizations 
 * (resized proxy width parameter, eager loading for first card, and status badges).
 */
function createEventCardHTML(event, index = 1) {
  const { month, day } = parseDateBadge(event.date);
  const isFirst = index === 0;

  const sep = event.imageUrl.includes('?') ? '&' : '?';
  const imgSrc = `${event.imageUrl}${sep}w=700`;

  return `
    <a href="event-details.html?id=${event.id}" class="event-card">
      <img 
        src="${imgSrc}" 
        alt="${event.title || 'Event Flyer'}" 
        class="event-card-img" 
        width="600" height="220"
        ${isFirst ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'}
      />
      <div class="event-card-body">
        <div class="event-date-badge">
          <span class="event-date-month">${month}</span>
          <span class="event-date-day">${day}</span>
        </div>
        <div class="event-info">
          ${event.tag ? `<span class="event-status-badge ${event.tagClass || ''}">${event.tag}</span>` : ''}
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
  const container = document.getElementById('full-events-container') || document.getElementById('events-container');
  if (!container) return;

  let filtered = allLoadedEvents;

  if (currentActiveFilter !== 'all') {
    filtered = allLoadedEvents.filter(event => {
      const tagLower = (event.tag || '').toLowerCase();
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

  container.innerHTML = filtered.map((event, idx) => createEventCardHTML(event, idx)).join('');
}

/**
 * Fetch events from API with LocalStorage Caching, Infinite Scroll, and Unified Processing
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
          <div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 3rem 0; color: #6b7280;">
            <h5>No Upcoming Events Listed</h5>
            <p>Check back soon for updates.</p>
          </div>
        `;
      }
      if (observerTarget) observerTarget.style.display = 'none';
      return;
    }

    const { upcoming, all } = processAndSortEvents(data.items);

    // HOME PAGE SPECIFIC LOGIC: Prioritize Today & Tomorrow, then Upcoming (No Past, capped at 3)
    if (container.id === 'home-events-container') {
      const todayTomorrow = upcoming.filter(e => (e.tag || '').toLowerCase().includes('today') || (e.tag || '').toLowerCase().includes('tomorrow'));
      const strictlyUpcoming = upcoming.filter(e => !todayTomorrow.includes(e));

      const prioritizedHomeEvents = [...todayTomorrow, ...strictlyUpcoming].slice(0, 3);

      if (prioritizedHomeEvents.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 2rem 0; color: #6b7280;"><p>No active gatherings right now.</p></div>`;
        return;
      }

      container.innerHTML = prioritizedHomeEvents.map((event, idx) => createEventCardHTML(event, idx)).join('');
      return;
    }

    // FULL EVENTS PAGE LOGIC: Append to master list and render via filter pipeline
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
        <div style="grid-column: 1 / -1; width: 100%; text-align: center; color: #dc3545; padding: 2rem 0;">
          <p>Unable to load events at this time.</p>
        </div>
      `;
    }
  } finally {
    isFetchingEvents = false;
  }
}

/**
 * Helper to parse month and day from date strings with fallback handling
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
async function loadWingImages() {
  try {
    const response = await fetch('/api/get-wings');
    const data = await response.json();

    if (!data.wings || data.wings.length === 0) {
      console.warn('[WINGS] No wing images returned from API.');
      return;
    }

    data.wings.forEach(wing => {
      const cleanSlug = wing.slug
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .trim()
        .toLowerCase();

      const imgElement = document.getElementById(`wing-img-${cleanSlug}`);

      if (imgElement) {
        const sep = wing.imageUrl.includes('?') ? '&' : '?';
        imgElement.src = `${wing.imageUrl}${sep}w=700`;
        imgElement.loading = 'lazy';
      } else {
        console.warn(`[WINGS MISMATCH] Element #wing-img-${cleanSlug} not found in DOM.`);
      }
    });

  } catch (err) {
    console.error('[WINGS ERROR] Failed loading wing images:', err);
  }
}