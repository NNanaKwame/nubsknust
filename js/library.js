// js/library.js

let allLoadedBooks = [];
let currentBookPageToken = null;
let currentLibraryFilter = 'all';
let isFetchingBooks = false;

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

  const loadMoreBtn = document.getElementById('libraryLoadMore');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => fetchBooks());
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
  if (isFetchingBooks) return;
  isFetchingBooks = true;

  const grid = document.getElementById('libraryGrid');
  const loadMoreWrap = document.getElementById('libraryLoadMoreWrap');
  const loadMoreBtn = document.getElementById('libraryLoadMore');

  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
  }

  try {
    let url = '/api/get-books?limit=12';
    if (currentBookPageToken) url += `&pageToken=${currentBookPageToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Failed to load library');

    const items = data.items || [];

    if (items.length === 0 && allLoadedBooks.length === 0) {
      grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">No books available yet &mdash; check back soon.</div>`;
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    items.forEach((book) => {
      if (!allLoadedBooks.some((b) => b.id === book.id)) {
        allLoadedBooks.push(book);
      }
    });

    renderFilteredBooks();

    currentBookPageToken = data.nextPageToken;
    if (loadMoreWrap) loadMoreWrap.style.display = currentBookPageToken ? 'block' : 'none';
  } catch (err) {
    console.error('[LIBRARY ERROR]', err);
    if (allLoadedBooks.length === 0) {
      grid.innerHTML = `<div class="gallery-empty" style="grid-column: 1 / -1;">Unable to load the library right now.</div>`;
    }
  } finally {
    isFetchingBooks = false;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load More Books';
    }
  }
}