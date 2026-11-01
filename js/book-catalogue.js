// Verified external covers; keep separate from generated metadata so imports retain them.
const BOOK_COVER_SOURCES = {
  '1mVEYxoUyvrcfZ1yDu1_1HEz44p9fEim4': {
    image: 'https://www.harvesthousepublishers.com/data/images/front/9780736990219_cft.png',
    source: 'https://www.harvesthousepublishers.com/books/power-of-a-praying-parent-9780736990219/'
  },
  '1G1OMcsmRQk1fFZbZbLBwQcR6Xxeao9eP': {
    image: 'https://cdn11.bigcommerce.com/s-g9n04qy/images/stencil/320w/products/1384895/1414857/510Sfpc_zZL__25487.1780836583.jpg?c=2',
    source: 'https://www.americanbookwarehouse.com/5050426/'
  },
  '1qx_9Ifgz3PD6o6yQIuy0CjjFLn1IeCrj': {
    image: 'https://cdn.shopify.com/s/files/1/0674/5433/7265/files/9780768426748_p0.jpg?v=1768959406',
    source: 'https://www.barnesandnoble.com/w/maximizing-your-potential-myles-munroe/1100071817'
  }
};

function bookCoverImageHTML(book) {
  const drive = `/api/image-proxy?id=${encodeURIComponent(book.id)}&w=400`;
  const external = BOOK_COVER_SOURCES[book.id]?.image;
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<img class="book-cover-image" src="${escape(external || drive)}" ${external ? `data-fallback="${escape(drive)}"` : ''} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.classList.add('is-loaded')" onerror="bookCoverFailed(this)" />`;
}

function bookCoverFailed(image) {
  image.classList.remove('is-loaded');
  if (image.dataset.fallback) {
    const fallback = image.dataset.fallback;
    delete image.dataset.fallback;
    image.src = fallback;
  } else image.remove();
}

// Collapse duplicate uploads for display while retaining every category membership.
function uniqueLibraryBooks(books) {
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const grouped = new Map();
  for (const book of books) {
    const title = normalize(book.title);
    const author = normalize(book.author);
    const key = title && author && author !== 'unknown' ? `${title}|${author}` : book.id;
    if (!grouped.has(key)) grouped.set(key, { ...book, categories: [book.category] });
    else {
      const existing = grouped.get(key);
      if (!existing.categories.includes(book.category)) existing.categories.push(book.category);
    }
  }
  return [...grouped.values()];
}
