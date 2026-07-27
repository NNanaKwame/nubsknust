// Vercel Speed Insights initialization (vanilla/static usage)
(function () {
  window.si =
    window.si ||
    function () {
      (window.siq = window.siq || []).push(arguments);
    };

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://speed-insights.vercel.app/script.js';
  document.head.appendChild(script);
})();
