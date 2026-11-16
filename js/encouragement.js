const quoteCard = document.getElementById('encouragement-card');
if (quoteCard) {
  const text = document.getElementById('encouragement-text');
  const author = document.getElementById('encouragement-author');
  const next = document.getElementById('encouragement-next');
  let current = -1;
  let remaining = [];
  const showQuote = () => {
    // Visit every quotation once per cycle, including across cycle boundaries.
    if (!remaining.length) {
      remaining = encouragementQuotes.map((_, index) => index);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      const last = remaining.length - 1;
      if (last > 0 && remaining[last] === current) {
        [remaining[0], remaining[last]] = [remaining[last], remaining[0]];
      }
    }
    current = remaining.pop();
    const quote = encouragementQuotes[current];
    text.textContent = `“${quote.text}”`;
    author.textContent = quote.author;
    author.href = quote.source;
    author.setAttribute('aria-label', `${quote.author} — read the quotation source (opens in a new tab)`);
  };
  showQuote();
  next.hidden = false;
  next.addEventListener('click', showQuote);
}
