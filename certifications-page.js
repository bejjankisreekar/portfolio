/**
 * Certifications page — category filters, reveal animations, hero count.
 */
(function () {
  const cards = document.querySelectorAll('[data-cert-item]');
  const filters = document.querySelectorAll('[data-cert-filter-btn]');
  const visibleCountEl = document.querySelector('[data-certs-visible-count]');
  const emptyState = document.querySelector('[data-certs-empty]');
  const grid = document.querySelector('[data-certs-grid]');
  const countStat = document.querySelector('[data-certs-stat="count"]');
  const resetBtn = document.querySelector('[data-certs-filter-reset]');

  if (!cards.length) return;

  let activeFilter = 'all';

  if (countStat) countStat.textContent = String(cards.length);

  function applyFilter(filter) {
    let visible = 0;

    cards.forEach((card) => {
      const tags = (card.dataset.certFilter || '').split(/\s+/);
      const match = filter === 'all' || tags.includes(filter);
      card.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    });

    if (visibleCountEl) visibleCountEl.textContent = String(visible);
    if (emptyState) emptyState.hidden = visible > 0;
    if (grid) grid.hidden = visible === 0;
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.certFilterBtn || 'all';

      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      applyFilter(activeFilter);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelector('[data-cert-filter-btn="all"]')?.click();
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
    { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
  );

  cards.forEach((card, i) => {
    card.style.setProperty('--cert-delay', `${i * 70}ms`);
    revealObserver.observe(card);
  });

  document.querySelector('.certs-section')?.classList.add('visible');
  applyFilter('all');
})();
