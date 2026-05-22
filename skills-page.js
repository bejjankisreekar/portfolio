/**
 * Skills page — category filters, live search, reveal animations, hero counters.
 */
(function () {
  const domains = document.querySelectorAll('[data-skill-domain]');
  const filters = document.querySelectorAll('[data-skill-filter-btn]');
  const searchInput = document.querySelector('[data-skill-search]');
  const emptyState = document.querySelector('[data-skills-empty]');
  const grid = document.querySelector('[data-skills-grid]');
  const visibleCountEl = document.querySelector('[data-skills-visible-count]');
  const resetBtn = document.querySelector('[data-skills-filter-reset]');

  if (!domains.length) return;

  let activeFilter = 'all';
  let searchQuery = '';

  function updateHeroStats() {
    const domainStat = document.querySelector('[data-skills-stat="domains"]');
    const skillsStat = document.querySelector('[data-skills-stat="skills"]');
    if (domainStat) domainStat.textContent = String(domains.length);

    if (skillsStat) {
      const pills = document.querySelectorAll('[data-skill-name]');
      skillsStat.textContent = String(pills.length);
    }
  }

  function normalize(value) {
    return value.toLowerCase().trim();
  }

  function domainMatchesFilter(domain) {
    if (activeFilter === 'all') return true;
    const tags = (domain.dataset.skillFilter || '').split(/\s+/);
    return tags.includes(activeFilter);
  }

  function pillMatchesSearch(pill) {
    if (!searchQuery) return true;
    const name = normalize(pill.dataset.skillName || pill.textContent);
    return name.includes(searchQuery);
  }

  function applyFilters() {
    let visibleDomains = 0;

    domains.forEach((domain) => {
      const filterMatch = domainMatchesFilter(domain);
      const pills = domain.querySelectorAll('[data-skill-name]');
      let visiblePills = 0;

      pills.forEach((pill) => {
        const show = filterMatch && pillMatchesSearch(pill);
        pill.classList.toggle('is-hidden', !show);
        if (show) visiblePills += 1;
      });

      const showDomain = filterMatch && visiblePills > 0;
      domain.classList.toggle('is-hidden', !showDomain);
      if (showDomain) visibleDomains += 1;
    });

    if (visibleCountEl) visibleCountEl.textContent = String(visibleDomains);
    if (emptyState) emptyState.hidden = visibleDomains > 0;
    if (grid) grid.hidden = visibleDomains === 0;
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.skillFilterBtn || 'all';

      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = normalize(searchInput.value);
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      document.querySelector('[data-skill-filter-btn="all"]')?.click();
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );

  domains.forEach((domain, i) => {
    domain.style.setProperty('--skill-delay', `${Math.min(i * 60, 480)}ms`);
    revealObserver.observe(domain);
  });

  document.querySelectorAll('.skills-platform-card').forEach((el, i) => {
    el.style.setProperty('--skill-delay', `${i * 50}ms`);
    revealObserver.observe(el);
  });

  document.querySelector('.skills-stack-section')?.classList.add('visible');

  updateHeroStats();
  applyFilters();
})();
