/**
 * Global portfolio polish — ambient background, scroll progress, nav, command palette.
 */
(function () {
  const PAGES = [
    { href: 'index.html', label: 'About', icon: 'fa-user' },
    { href: 'work.html', label: 'Work', icon: 'fa-briefcase' },
    { href: 'projects.html', label: 'Projects', icon: 'fa-folder-open' },
    { href: 'skills.html', label: 'Skills', icon: 'fa-layer-group' },
    { href: 'certifications.html', label: 'Certifications', icon: 'fa-award' },
    { href: 'contact.html', label: 'Contact', icon: 'fa-envelope' },
  ];

  function injectSiteBackground() {
    if (document.querySelector('.site-bg')) return;
    const bg = document.createElement('div');
    bg.className = 'site-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
      <div class="site-bg__grid"></div>
      <div class="site-bg__noise"></div>
      <div class="site-bg__glow site-bg__glow--1"></div>
      <div class="site-bg__glow site-bg__glow--2"></div>
    `;
    document.body.prepend(bg);
  }

  function injectScrollProgress() {
    if (document.querySelector('.scroll-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    return bar;
  }

  function injectBackToTop() {
    if (document.querySelector('.back-to-top')) return null;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return btn;
  }

  function injectCommandPalette() {
    if (document.querySelector('.command-palette')) return null;

    const palette = document.createElement('div');
    palette.className = 'command-palette';
    palette.setAttribute('role', 'dialog');
    palette.setAttribute('aria-modal', 'true');
    palette.setAttribute('aria-label', 'Quick navigation');
    palette.hidden = true;

    const links = PAGES.map(
      (p) =>
        `<li><a href="${p.href}" data-command-link><i class="fas ${p.icon}"></i> ${p.label}</a></li>`
    ).join('');

    palette.innerHTML = `
      <div class="command-palette__panel">
        <div class="command-palette__head">
          <i class="fas fa-search"></i>
          <input type="search" class="command-palette__input" placeholder="Go to…" autocomplete="off" aria-label="Search pages">
          <kbd class="command-palette__hint">esc</kbd>
        </div>
        <ul class="command-palette__list">${links}</ul>
      </div>
    `;

    document.body.appendChild(palette);

    const input = palette.querySelector('.command-palette__input');
    const listLinks = [...palette.querySelectorAll('[data-command-link]')];

    function open() {
      palette.hidden = false;
      palette.classList.add('is-open');
      input.value = '';
      filterLinks('');
      requestAnimationFrame(() => input.focus());
    }

    function close() {
      palette.classList.remove('is-open');
      palette.hidden = true;
    }

    function filterLinks(query) {
      const q = query.toLowerCase().trim();
      listLinks.forEach((link) => {
        const match = !q || link.textContent.toLowerCase().includes(q);
        link.closest('li').hidden = !match;
      });
    }

    palette.addEventListener('click', (e) => {
      if (e.target === palette) close();
    });

    input.addEventListener('input', () => filterLinks(input.value));

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (palette.classList.contains('is-open')) close();
        else open();
      }
      if (e.key === 'Escape' && palette.classList.contains('is-open')) close();
    });

    return { open, close };
  }

  function enhanceFooter() {
    const footer = document.querySelector('.footer .container');
    if (!footer || footer.querySelector('.footer-brand')) return;

    const social = footer.querySelector('.footer-social-links');
    const copy = footer.querySelector('p');
    if (!copy) return;

    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    brand.innerHTML = `
      <strong>Sreekar Bejjanki</strong>
      <span>Data Engineer · Hyderabad</span>
    `;

    const nav = document.createElement('ul');
    nav.className = 'footer-nav';
    nav.innerHTML = PAGES.map(
      (p) => `<li><a href="${p.href}">${p.label}</a></li>`
    ).join('');

    const end = document.createElement('div');
    end.className = 'footer-end';

    copy.className = 'footer-copy';
    footer.innerHTML = '';
    footer.appendChild(brand);
    footer.appendChild(nav);
    end.appendChild(copy);
    if (social) end.appendChild(social);
    footer.appendChild(end);
  }

  function initScrollProgress(bar) {
    if (!bar) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initNavScroll(nav) {
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initBackToTop(btn) {
    if (!btn) return;
    const onScroll = () => {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initPageReady() {
    document.documentElement.classList.remove('is-loading');
    document.documentElement.classList.add('is-ready');
  }

  document.documentElement.classList.add('is-loading');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', initPageReady);

  function boot() {
    document.body.classList.add('site');
    injectSiteBackground();
    const progress = injectScrollProgress();
    const backBtn = injectBackToTop();
    injectCommandPalette();
    enhanceFooter();

    initScrollProgress(progress);
    initNavScroll(document.querySelector('.main-nav'));
    initBackToTop(backBtn);

    if (document.readyState === 'complete') initPageReady();
  }
})();
