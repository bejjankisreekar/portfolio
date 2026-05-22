(function () {
  try {
    var stored = localStorage.getItem('portfolio-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
