// Escape untrusted catalogue/API text before inserting it into HTML templates.
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}
function safeBookURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? escapeHTML(url.href) : '#';
  } catch { return '#'; }
}
