// js/library.js

let allLoadedBooks = [];
let currentLibraryFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;

  fetchBooks();

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
    <div class="book-cover ${book.badgeClass}">
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
        <p class="book-card-author">${book.author}</p>
        <p class="book-card-desc">${book.description || ''}</p>
      </div>
    </a>
  `;
}

function renderFilteredBooks() {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;

  const filtered = currentLibraryFilter === 'all'
    ? allLoadedBooks
    : allLoadedBooks.filter((b) => b.category === currentLibraryFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">No books in this category yet.</div>`;
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

    allLoadedBooks = data.items || [];
    console.log(`[LIBRARY] Loaded ${allLoadedBooks.length} books into state.`);

    if (allLoadedBooks.length === 0) {
      grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">No books available yet &mdash; check back soon.</div>`;
      return;
    }

    renderFilteredBooks();
  } catch (err) {
    console.error('[LIBRARY ERROR]', err);
    grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">Unable to load the library right now. Check console for details.</div>`;
  }
}