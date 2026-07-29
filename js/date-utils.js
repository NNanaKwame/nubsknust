// js/date-utils.js
//
// Shared date logic for event cards: badge parsing, recurring-weekday
// detection, and unified categorization/sorting. Loaded as a plain script
// before js/scripts.js (no modules) — parseDateBadge, getNextOccurrence,
// and processAndSortEvents are used as globals by scripts.js.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Parses a month/day badge from a date string, with fallback handling for
 * unparseable or explicit-text dates (e.g. "27th July").
 */
function parseDateBadge(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '' || dateStr.trim().toUpperCase() === 'TBA') {
    return { month: 'TBA', day: '-' };
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      month: parsed.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: parsed.getDate().toString()
    };
  }

  // Fallback: pull a day number and month name out of free-text dates
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
 * Returns the Date of the next occurrence of a given weekday, counting
 * today as valid if today IS that weekday (a "Thursdays 6pm" service
 * showing up as "Today" on Thursday, not skipping ahead a week).
 */
function getNextOccurrence(dayName) {
  const targetDay = WEEKDAYS.indexOf(String(dayName).toLowerCase());
  if (targetDay === -1) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate;
}

/**
 * Scans combined title+description+date text for genuine recurring-weekday
 * phrasing. Requires an explicit signal ("every thursday", "weekly ...
 * thursday") or a clean plural weekday mention ("thursdays") with word
 * boundaries — deliberately avoids matching a bare passing mention of a
 * weekday (e.g. "moved from Saturday to Sunday") as recurring.
 *
 * Limitation: if multiple weekdays are mentioned, only the first match
 * (in Sun-Sat order) is used. Multi-day recurring events aren't supported.
 */
function findRecurringDay(combinedText) {
  return WEEKDAYS.find((d) => {
    const everyPattern = new RegExp(`\\bevery\\s+${d}\\b`, 'i');
    const pluralPattern = new RegExp(`\\b${d}s\\b`, 'i');
    const weeklyPattern = new RegExp(`\\bweekly\\b`, 'i');
    return everyPattern.test(combinedText) ||
      (weeklyPattern.test(combinedText) && new RegExp(`\\b${d}\\b`, 'i').test(combinedText)) ||
      pluralPattern.test(combinedText);
  }) || null;
}

/**
 * Uniformly processes, sorts, and tags events for both the home page and
 * the full events page. Mutates event.date for recurring events to the
 * next actual occurrence (safe — happens after localStorage caching of the
 * raw API response, so the cache stays untouched and this recalculates
 * fresh relative to "today" on every load).
 */
function processAndSortEvents(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const past = [];

  events.forEach((event) => {
    const dateStr = event.date || '';
    const descriptionStr = (event.description || '').toLowerCase();
    const titleStr = (event.title || '').toLowerCase();
    const combinedText = `${dateStr} ${titleStr} ${descriptionStr}`.toLowerCase();

    const foundDay = findRecurringDay(combinedText);
    const isRecurring = !!foundDay;

    let eventDate;
    if (isRecurring) {
      eventDate = getNextOccurrence(foundDay);
      event.date = eventDate.toISOString();
    } else {
      eventDate = new Date(dateStr);
    }

    if (!eventDate || isNaN(eventDate.getTime())) {
      event.tag = 'TBA';
      event.tagClass = 'tag-upcoming';
      upcoming.push(event);
      return;
    }

    eventDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.round((eventDate.getTime() - today.getTime()) / 86400000);

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
