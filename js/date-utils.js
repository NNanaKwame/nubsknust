// js/date-utils.js

/**
 * Helper to parse month and day from date strings with fallback handling
 */
function parseDateBadge(dateStr) {
  if (!dateStr || dateStr.trim() === '' || dateStr.trim().toUpperCase() === 'TBA') {
    return { month: 'TBA', day: '-' };
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      month: parsed.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: parsed.getDate().toString()
    };
  }

  const dayMatch = dateStr.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/i);
  const monthMatch = dateStr.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i);

  if (monthMatch && dayMatch) {
    return { 
      month: monthMatch[1].substring(0, 3).toUpperCase(), 
      day: dayMatch[1] 
    };
  }

  return { month: 'TBA', day: '-' };
}

/**
 * Helper to find the exact date of the next occurrence of a specific weekday
 */
function getNextOccurrence(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay();

  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  } else if (daysToAdd === 0) {
    daysToAdd = 0; 
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate;
}

/**
 * Uniformly processes, sorts, and tags events for both home and events pages.
 */
function processAndSortEvents(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const past = [];

  events.forEach(event => {
    let dateStr = event.date || '';
    let descriptionStr = (event.description || '').toLowerCase();
    let titleStr = (event.title || '').toLowerCase();
    
    let combinedText = `${dateStr} ${titleStr} ${descriptionStr}`.toLowerCase();

    let eventDate = null;
    let isRecurring = false;
    let foundDay = null;

    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    foundDay = daysOfWeek.find(d => 
      combinedText.includes('every ' + d) || 
      (combinedText.includes('weekly') && combinedText.includes(d)) ||
      combinedText.includes(d + 's')
    );

    if (foundDay) {
      eventDate = getNextOccurrence(foundDay);
      isRecurring = true;
      event.date = eventDate.toISOString();
    } else {
      eventDate = new Date(dateStr);
    }

    if (isNaN(eventDate.getTime())) {
      event.tag = 'TBA';
      event.tagClass = 'tag-upcoming';
      upcoming.push(event);
      return;
    }

    eventDate.setHours(0, 0, 0, 0);
    const timeDiff = eventDate.getTime() - today.getTime();
    const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

    if (daysDiff === 0) {
      event.tag = isRecurring ? 'Today (Weekly)' : 'Today';
      event.tagClass = 'tag-today';
    } else if (daysDiff === 1) {
      event.tag = isRecurring ? 'Tomorrow (Weekly)' : 'Tomorrow';
      event.tagClass = 'tag-tomorrow';
    } else if (daysDiff < 0) {
      event.tag = 'Past';
      event.tagClass = 'tag-past';
    } else {
      const dayCapitalized = foundDay ? foundDay.charAt(0).toUpperCase() + foundDay.slice(1) : '';
      event.tag = isRecurring ? `Every ${dayCapitalized}` : 'Upcoming';
      event.tagClass = 'tag-upcoming';
    }

    if (daysDiff >= 0) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  });

  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  past.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { upcoming, past, all: [...upcoming, ...past] };
}