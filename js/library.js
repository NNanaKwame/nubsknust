// js/library.js

let allLoadedBooks = [];
let currentLibraryFilter = 'all';
let libraryLoaded = false;

function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;

  fetchBooks();
  document.getElementById('librarySearch')?.addEventListener('input', renderFilteredBooks);
  const toggle = document.getElementById('librarySearchToggle');
  const field = document.getElementById('librarySearchField');
  const search = document.getElementById('librarySearch');
  function closeSearch() {
    search.value = '';
    field.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    renderFilteredBooks();
    toggle.focus();
  }
  toggle.addEventListener('click', () => {
    if (!field.hidden) return closeSearch();
    field.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    search.focus();
  });
  document.getElementById('librarySearchClose').addEventListener('click', closeSearch);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSearch();
  });

  const filterGroup = document.getElementById('libraryFilters');
  if (filterGroup) {
    filterGroup.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        filterGroup.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        currentLibraryFilter = chip.getAttribute('data-filter');
        renderFilteredBooks();
      });
    });
  }
});

function bookCoverHTML(book) {
  return `
    <div class="book-cover book-cover-preview ${book.badgeClass}">
      ${bookCoverImageHTML(book)}
      <i class="bi bi-book-fill"></i>
      <span class="book-cover-title">${book.title}</span>
    </div>
  `;
}

function createBookCardHTML(book) {
  return `
    <a href="${book.driveUrl}" target="_blank" rel="noopener noreferrer" class="book-card">
      ${bookCoverHTML(book)}
      <div class="book-card-body">
        <span class="gathering-badge ${book.badgeClass}">${book.categoryName}</span>
        <h3 class="book-card-heading">${book.title}</h3>
        <p class="book-card-author">${book.author}</p>
        <p class="book-card-desc">${book.description || ''}</p>
      </div>
    </a>
  `;
}

function renderFilteredBooks() {
  const grid = document.getElementById('libraryGrid');
  if (!grid || !libraryLoaded) return;

  const query = document.getElementById('librarySearch')?.value.trim() || '';
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const filtered = allLoadedBooks.filter((book) => {
    if (currentLibraryFilter !== 'all' && !book.categories.includes(currentLibraryFilter)) return false;
    const searchable = normalizeSearch([book.title, book.author].join(' '));
    return terms.every((term) => searchable.includes(term));
  });
  const status = document.getElementById('libraryResults');
  if (status) status.textContent = `${filtered.length} ${filtered.length === 1 ? 'book' : 'books'} found${query ? ` for “${query}”` : ''}${currentLibraryFilter !== 'all' ? ' in this category' : ''}.`;

  if (filtered.length === 0) {
    const message = allLoadedBooks.length === 0
      ? 'No books available yet — check back soon.'
      : terms.length ? 'No matching books. Try a different keyword or select All Books.' : 'No books in this category yet.';
    grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">${message}</div>`;
    return;
  }

  grid.innerHTML = filtered.map(createBookCardHTML).join('');
}

async function fetchBooks() {
  const grid = document.getElementById('libraryGrid');

  try {
    console.log('[LIBRARY] Fetching /books.json...');
    const response = await fetch('/books.json');
    console.log('[LIBRARY] Response status:', response.status, response.statusText);

    if (!response.ok) throw new Error(`Failed to load library data: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('[LIBRARY] Parsed data successfully:', data);

    allLoadedBooks = uniqueLibraryBooks(data.items || []);
    libraryLoaded = true;
    const search = document.getElementById('librarySearch');
    if (search) search.disabled = false;
    console.log(`[LIBRARY] Loaded ${allLoadedBooks.length} books into state.`);

    renderFilteredBooks();
  } catch (err) {
    console.error('[LIBRARY ERROR]', err);
    const status = document.getElementById('libraryResults');
    if (status) status.textContent = 'Library unavailable. Please refresh to try again.';
    grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">${location.protocol === 'file:' ? 'Open the library through the local web server at http://localhost:3000/library.html to load books and search.' : 'Unable to load the library right now. Please refresh to try again.'}</div>`;
  }
}
