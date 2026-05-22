/**
 * Projects page — filter tabs, reveal animations, dynamic counts.
 * Mirrors Framer Motion-style stagger via CSS custom properties + Intersection Observer.
 */
(function () {
  const grid = document.querySelector('[data-projects-grid]');
  const cards = document.querySelectorAll('[data-project-card]');
  const filters = document.querySelectorAll('.projects-filter');
  const visibleCountEl = document.querySelector('[data-projects-visible-count]');
  const emptyState = document.querySelector('[data-projects-empty]');
  const resetBtn = document.querySelector('[data-filter-reset]');
  const countStat = document.querySelector('[data-projects-stat="count"]');
  const featuredStat = document.querySelector('[data-projects-stat="featured"]');

  if (!grid || !cards.length) return;

  function updateHeroStats() {
    if (countStat) countStat.textContent = String(cards.length);
    if (featuredStat) {
      const featured = document.querySelectorAll('[data-project-card][data-featured="true"]').length;
      featuredStat.textContent = String(featured);
    }
  }

  function setVisibleCount(n) {
    if (visibleCountEl) visibleCountEl.textContent = String(n);
  }

  function applyFilter(filter) {
    let visible = 0;

    cards.forEach((card) => {
      const categories = (card.dataset.category || '').split(/\s+/);
      const match = filter === 'all' || categories.includes(filter);
      card.classList.toggle('is-hidden', !match);
      card.classList.toggle('is-visible', match);
      if (match) visible += 1;
    });

    setVisibleCount(visible);
    if (emptyState) emptyState.hidden = visible > 0;
    grid.hidden = visible === 0;
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter || 'all';

      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      applyFilter(filter);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const allBtn = document.querySelector('.projects-filter[data-filter="all"]');
      if (allBtn) allBtn.click();
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
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  cards.forEach((card) => revealObserver.observe(card));
  document.querySelector('.projects-section')?.classList.add('visible');

  updateHeroStats();
  applyFilter('all');
})();
