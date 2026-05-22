const LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';
const LEETCODE_CACHE_MS = 5 * 60 * 1000;

let portfolioCounts = {
  projects: null,
  certifications: null,
  problemsSolved: null,
};

function formatStatCount(count) {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n}+`;
}

async function countFromPage(path, selector) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('fetch failed');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelectorAll(selector).length;
  } catch {
    return null;
  }
}

async function resolvePortfolioCounts() {
  const [projects, certifications] = await Promise.all([
    countFromPage('projects.html', '[data-project-card], .project-card'),
    countFromPage('certifications.html', '[data-cert-item]'),
  ]);

  return {
    projects: projects || 0,
    certifications: certifications || 0,
    problemsSolved: portfolioCounts.problemsSolved,
  };
}

function applyPortfolioStatDisplays(counts) {
  const projects = formatStatCount(counts.projects);
  const problems =
    counts.problemsSolved != null ? formatStatCount(counts.problemsSolved) : '—';
  const certs = formatStatCount(counts.certifications);

  document.querySelectorAll('[data-portfolio-stat="projects"]').forEach((el) => {
    el.textContent = projects;
  });
  document.querySelectorAll('[data-portfolio-stat="problems"]').forEach((el) => {
    el.textContent = problems;
  });
  document.querySelectorAll('[data-portfolio-stat="certifications"]').forEach((el) => {
    el.textContent = certs;
  });

  const projectsPanel = document.querySelector('[data-portfolio-stat="projects-panel"]');
  if (projectsPanel) projectsPanel.textContent = `${projects} shipped`;

  const problemsPanel = document.querySelector('[data-portfolio-stat="problems-panel"]');
  if (problemsPanel) problemsPanel.textContent = `${problems} solved`;

  const certificationsPanel = document.querySelector('[data-portfolio-stat="certifications-panel"]');
  if (certificationsPanel) certificationsPanel.textContent = `${certs} earned`;

  const projectsBento = document.querySelector('[data-portfolio-stat="projects-bento"]');
  if (projectsBento) projectsBento.textContent = `${projects} builds`;

  const certificationsBento = document.querySelector('[data-portfolio-stat="certifications-bento"]');
  if (certificationsBento) certificationsBento.textContent = `${certs} certifications`;
}

const PLATFORM_USER = {
  leetcode: 'sreekarbejjanki',
  hackerrank: 'sreekarbejjanki',
};

let liveLeetcodeSolved = null;
let liveHackerRankSolved = null;

function hasProblemsSolvedStat() {
  return Boolean(document.querySelector('[data-portfolio-stat="problems"]'));
}

function noteLiveProblemCounts(leetcodeTotal, hackerRankSolved) {
  if (leetcodeTotal != null) liveLeetcodeSolved = leetcodeTotal;
  if (hackerRankSolved != null) liveHackerRankSolved = hackerRankSolved;
  syncProblemsSolvedDisplay();
}

function syncProblemsSolvedDisplay() {
  if (!hasProblemsSolvedStat()) return;

  const hasLeetcode = liveLeetcodeSolved != null;
  const hasHackerRank = liveHackerRankSolved != null;
  if (!hasLeetcode && !hasHackerRank) return;

  const combined = (Number(liveLeetcodeSolved) || 0) + (Number(liveHackerRankSolved) || 0);
  if (combined <= 0) return;

  portfolioCounts.problemsSolved = combined;
  applyPortfolioStatDisplays(portfolioCounts);
}

function hydrateProblemsFromCache() {
  if (!hasProblemsSolvedStat()) return;

  try {
    const cached = sessionStorage.getItem(`leetcode-stats-${PLATFORM_USER.leetcode}`);
    if (cached) {
      const { stats, ts } = JSON.parse(cached);
      if (Date.now() - ts < LEETCODE_CACHE_MS && stats?.total != null) {
        liveLeetcodeSolved = stats.total;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const cached = sessionStorage.getItem(`hackerrank-stats-${PLATFORM_USER.hackerrank}`);
    if (cached) {
      const { stats, ts } = JSON.parse(cached);
      if (Date.now() - ts < LEETCODE_CACHE_MS && stats?.solved != null) {
        liveHackerRankSolved = stats.solved;
      }
    }
  } catch {
    /* ignore */
  }

  syncProblemsSolvedDisplay();
}

async function initPortfolioStats() {
  if (!document.querySelector('[data-portfolio-stat]')) return;
  hydrateProblemsFromCache();
  portfolioCounts = await resolvePortfolioCounts();
  applyPortfolioStatDisplays(portfolioCounts);
}

function formatLeetCodeRank(rank) {
  if (rank == null || Number.isNaN(rank)) return '—';
  return `#${Number(rank).toLocaleString('en-US')}`;
}

function getSqlSolvedCount(languageData) {
  const languages = languageData?.languageProblemCount;
  if (!Array.isArray(languages)) return null;

  const sqlNames = ['mysql', 'mssql', 'postgresql', 'sql', 'oracle'];
  let total = 0;
  let found = false;

  languages.forEach(({ languageName, problemsSolved }) => {
    const name = (languageName || '').toLowerCase();
    if (sqlNames.some((sql) => name.includes(sql))) {
      total += Number(problemsSolved) || 0;
      found = true;
    }
  });

  return found ? total : null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function normalizeLeetCodeBadgeIcon(icon) {
  if (!icon) return '';
  if (icon.startsWith('http')) return icon;
  return `https://leetcode.com${icon.startsWith('/') ? icon : `/${icon}`}`;
}

function collectLeetCodeBadges(badgesData) {
  if (!badgesData) return [];

  const list = Array.isArray(badgesData.badges) ? [...badgesData.badges] : [];
  const active = badgesData.activeBadge;

  if (active?.id && !list.some((b) => b.id === active.id)) {
    list.unshift(active);
  }

  return list.map((badge) => ({
    id: badge.id,
    name: badge.displayName || badge.name || 'Badge',
    icon: normalizeLeetCodeBadgeIcon(badge.icon),
    date: badge.creationDate || null,
  }));
}

function buildLeetCodeStatsPayload(solvedData, profileData, languageData, badgesData) {
  const totalSolved =
    solvedData.solvedProblem ??
    solvedData.acSubmissionNum?.find((item) => item.difficulty === 'All')?.count;

  return {
    total: totalSolved,
    easy: solvedData.easySolved,
    medium: solvedData.mediumSolved,
    hard: solvedData.hardSolved,
    rank: profileData.ranking,
    sql: getSqlSolvedCount(languageData),
    badges: collectLeetCodeBadges(badgesData),
    badgeCount: badgesData?.badgesCount ?? collectLeetCodeBadges(badgesData).length,
  };
}

function renderLeetCodeBadgesHtml(badges) {
  const withIcons = (badges || []).filter((badge) => badge.icon);

  if (!withIcons.length) {
    return '<div class="leetcode-badges"><span class="leetcode-badges__label">Badges</span><span class="leetcode-stat-line leetcode-stat-line--muted">No badges yet</span></div>';
  }

  const items = withIcons
    .map((badge) => {
      const name = escapeHtml(badge.name);
      const icon = escapeHtml(badge.icon);
      return `<img class="leetcode-badge" src="${icon}" alt="${name}" title="${name}" width="40" height="40" loading="lazy">`;
    })
    .join('');

  return `
    <div class="leetcode-badges">
      <span class="leetcode-badges__label">Badges <span class="leetcode-badges__count">(${withIcons.length})</span></span>
      <div class="leetcode-badges__list" role="list">${items}</div>
    </div>
  `;
}

function renderPlatformStatRows(rows) {
  return rows
    .map((row) => {
      const classes = ['platform-stat-row'];
      if (row.primary) classes.push('platform-stat-row--primary');
      if (row.muted) classes.push('platform-stat-row--muted');

      if (row.label) {
        return `<div class="${classes.join(' ')}">
          <span class="platform-stat-row__label">${escapeHtml(row.label)}</span>
          <span class="platform-stat-row__value">${row.value}</span>
        </div>`;
      }

      return `<div class="${classes.join(' ')}"><span class="platform-stat-row__value">${row.value}</span></div>`;
    })
    .join('');
}

function renderLeetCodeStatsHtml(stats) {
  const total = stats.total != null ? stats.total : '—';
  const rows = [
    {
      primary: true,
      label: 'Problem solving',
      value: `<strong>${total}</strong> problems solved`,
    },
  ];

  if (stats.easy != null && stats.medium != null && stats.hard != null) {
    rows.push({
      muted: true,
      value: `Easy <strong>${stats.easy}</strong> · Medium <strong>${stats.medium}</strong> · Hard <strong>${stats.hard}</strong>`,
    });
  }

  rows.push({
    label: 'Global rank',
    value: formatLeetCodeRank(stats.rank),
  });

  if (stats.sql != null) {
    rows.push({
      label: 'SQL',
      value: `<strong>${stats.sql}</strong> solved`,
    });
  }

  return renderPlatformStatRows(rows);
}

function renderLeetCodeStatsElement(el, stats, loading) {
  el.classList.toggle('leetcode-stats--loading', loading);

  if (loading) {
    el.innerHTML = '<span class="platform-stat-line">Loading stats…</span>';
    return;
  }

  const richExtras =
    el.dataset.leetcodeRich === 'true' ? renderLeetCodeBadgesHtml(stats.badges) : '';

  el.innerHTML = `${renderLeetCodeStatsHtml(stats)}${richExtras}`;
}

function setLeetCodeStatsOnPage(elements, stats, loading) {
  elements.forEach((el) => renderLeetCodeStatsElement(el, stats, loading));
}

async function loadLeetCodeStats() {
  const statsEls = document.querySelectorAll('[data-leetcode-stats]');
  const updateHomeProblems = hasProblemsSolvedStat();
  if (!statsEls.length && !updateHomeProblems) return;

  const username =
    statsEls[0]?.dataset.username || PLATFORM_USER.leetcode;
  const cacheKey = `leetcode-stats-${username}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { stats, ts } = JSON.parse(cached);
      if (Date.now() - ts < LEETCODE_CACHE_MS && stats) {
        if (statsEls.length) setLeetCodeStatsOnPage(statsEls, stats, false);
        noteLiveProblemCounts(stats.total, null);
        return;
      }
    }
  } catch {
    sessionStorage.removeItem(cacheKey);
  }

  if (statsEls.length) setLeetCodeStatsOnPage(statsEls, {}, true);

  try {
    const [solvedRes, profileRes, languageRes, badgesRes] = await Promise.all([
      fetch(`${LEETCODE_API}/${encodeURIComponent(username)}/solved`),
      fetch(`${LEETCODE_API}/${encodeURIComponent(username)}`),
      fetch(`${LEETCODE_API}/${encodeURIComponent(username)}/language`),
      fetch(`${LEETCODE_API}/${encodeURIComponent(username)}/badges`),
    ]);

    if (!solvedRes.ok || !profileRes.ok) {
      throw new Error(`LeetCode API responded ${solvedRes.status}/${profileRes.status}`);
    }

    const solvedData = await solvedRes.json();
    const profileData = await profileRes.json();
    const languageData = languageRes.ok ? await languageRes.json() : null;
    const badgesData = badgesRes.ok ? await badgesRes.json() : null;

    const stats = buildLeetCodeStatsPayload(solvedData, profileData, languageData, badgesData);
    if (statsEls.length) setLeetCodeStatsOnPage(statsEls, stats, false);
    noteLiveProblemCounts(stats.total, null);

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ stats, ts: Date.now() }));
    } catch {
      /* ignore quota errors */
    }
  } catch {
    if (statsEls.length) {
      setLeetCodeStatsOnPage(statsEls, { total: null, rank: null, sql: null }, false);
    }
    statsEls.forEach((el) => {
      if (el.dataset.leetcodeRich === 'true') {
        el.innerHTML = '<span class="platform-stat-line">Open profile for stats</span>';
      } else {
        el.textContent = 'Open profile for stats';
      }
      el.classList.remove('leetcode-stats--loading');
    });
  }
}

const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

async function fetchViaProxy(url) {
  const response = await fetch(CORS_PROXY + encodeURIComponent(url));
  const text = await response.text();
  if (!text?.trim()) throw new Error('Empty response');
  return JSON.parse(text);
}

function renderPlatformStatsBlock(el, rows, loading, errorText) {
  el.classList.toggle('leetcode-stats--loading', loading);
  if (loading) {
    el.innerHTML = '<span class="platform-stat-line">Loading stats…</span>';
    return;
  }
  if (errorText) {
    el.innerHTML = `<span class="platform-stat-line platform-stat-line--muted">${escapeHtml(errorText)}</span>`;
    return;
  }
  el.innerHTML = renderPlatformStatRows(rows);
}

function parseHackerRankBadges(data) {
  const models = data?.models || [];
  const problemSolving = models.find(
    (m) => m.badge_type === 'problem-solving' || m.badge_name === 'Problem Solving'
  );
  const topBySolved = [...models].sort(
    (a, b) => (Number(b.solved) || 0) - (Number(a.solved) || 0)
  )[0];

  return {
    solved: problemSolving?.solved ?? 0,
    rank: problemSolving?.hacker_rank,
    stars: problemSolving?.stars,
    topSkill: topBySolved?.badge_name,
    topSkillSolved: topBySolved?.solved,
  };
}

async function loadHackerRankStats() {
  const blocks = document.querySelectorAll('[data-hackerrank-stats]');
  const updateHomeProblems = hasProblemsSolvedStat();
  if (!blocks.length && !updateHomeProblems) return;

  const username =
    blocks[0]?.dataset.username || PLATFORM_USER.hackerrank;
  const cacheKey = `hackerrank-stats-${username}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { stats, ts } = JSON.parse(cached);
      if (Date.now() - ts < LEETCODE_CACHE_MS && stats) {
        blocks.forEach((el) =>
          renderPlatformStatsBlock(el, buildHackerRankStatRows(stats), false)
        );
        noteLiveProblemCounts(null, stats.solved);
        return;
      }
    }
  } catch {
    sessionStorage.removeItem(cacheKey);
  }

  if (blocks.length) blocks.forEach((el) => renderPlatformStatsBlock(el, [], true));

  try {
    const data = await fetchViaProxy(
      `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges`
    );
    const stats = parseHackerRankBadges(data);
    if (blocks.length) {
      blocks.forEach((el) =>
        renderPlatformStatsBlock(el, buildHackerRankStatRows(stats), false)
      );
    }
    noteLiveProblemCounts(null, stats.solved);

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ stats, ts: Date.now() }));
    } catch {
      /* ignore */
    }
  } catch {
    if (blocks.length) {
      blocks.forEach((el) =>
        renderPlatformStatsBlock(el, [], false, 'Open profile · stats unavailable')
      );
    }
  }
}

function buildHackerRankStatRows(stats) {
  const rows = [
    {
      primary: true,
      label: 'Problem solving',
      value: `<strong>${stats.solved ?? 0}</strong> challenges solved`,
    },
    {
      label: 'Rank',
      value: formatLeetCodeRank(stats.rank),
    },
  ];

  if (stats.topSkill && stats.topSkillSolved != null && stats.topSkill !== 'Problem Solving') {
    rows.push({
      label: escapeHtml(stats.topSkill),
      value: `<strong>${stats.topSkillSolved}</strong> solved`,
    });
  } else if (stats.stars != null && stats.stars > 0) {
    rows.push({
      label: 'Rating',
      value: `${stats.stars}★ stars`,
    });
  }

  return rows;
}

/** Google Drive file IDs — paste ID from Share link (same format as drive.google.com/file/d/ID/view) */
const CERT_DRIVE_IDS = {
  python: '10JZ-4SVTCSGfES_kh8Pp7Sjhiv8Pe8Z2',
  django: 'YOUR_DJANGO_FILE_ID',
};

function getGoogleDriveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

function extractGoogleDriveFileId(value) {
  if (!value || value.includes('YOUR_')) return null;
  const match = String(value).match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : value.trim();
}

function parseWorkYearMonth(value) {
  if (!value) return null;
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
}

function experienceFromStartDates(startValues) {
  const starts = (startValues || [])
    .map(parseWorkYearMonth)
    .filter(Boolean);
  if (!starts.length) return null;

  const earliestStart = starts.reduce((min, d) => (d < min ? d : min), starts[0]);
  const today = new Date();

  let months =
    (today.getFullYear() - earliestStart.getFullYear()) * 12 +
    (today.getMonth() - earliestStart.getMonth());

  if (today.getDate() < earliestStart.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const remainder = months % 12;

  if (years < 1) return { label: `${months}+`, months, years: 0 };
  if (remainder >= 6) return { label: `${years + 1}+`, months, years: years + 1 };
  return { label: `${years}+`, months, years };
}

function calculateTotalWorkExperienceYears(root = document) {
  const starts = [...root.querySelectorAll('[data-work-start]')].map(
    (el) => el.dataset.workStart
  );
  return experienceFromStartDates(starts);
}

function calculateDataRoleExperienceYears(root = document) {
  const starts = [...root.querySelectorAll('[data-work-current][data-work-start]')].map(
    (el) => el.dataset.workStart
  );
  return experienceFromStartDates(starts);
}

async function resolveWorkExperience() {
  const onPageRoles = document.querySelectorAll('[data-work-start]');
  if (onPageRoles.length) {
    return {
      total: calculateTotalWorkExperienceYears(document),
      data: calculateDataRoleExperienceYears(document),
    };
  }

  try {
    const response = await fetch('work.html');
    if (!response.ok) throw new Error('fetch failed');
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    return {
      total: calculateTotalWorkExperienceYears(doc),
      data: calculateDataRoleExperienceYears(doc),
    };
  } catch {
    return null;
  }
}

function applyExperienceDisplays(experience) {
  if (!experience) return;

  if (experience.total) {
    const { label } = experience.total;
    document.querySelectorAll('[data-experience-stat="total"]').forEach((el) => {
      el.textContent = label;
    });
    document.querySelectorAll('[data-portfolio-stat="experience-panel"]').forEach((el) => {
      el.textContent = `${label} years`;
    });
  }

  if (experience.data) {
    document.querySelectorAll('[data-experience-stat="data"]').forEach((el) => {
      el.textContent = experience.data.label;
    });
  }
}

async function initExperienceStats() {
  const needsExperience = document.querySelector(
    '[data-experience-stat], [data-portfolio-stat="experience-panel"]'
  );
  const orgsEl = document.querySelector('[data-work-hero-stat="organizations"]');
  if (!needsExperience && !orgsEl) return;

  if (needsExperience) {
    const experience = await resolveWorkExperience();
    applyExperienceDisplays(experience);
  }

  if (orgsEl) {
    let count = document.querySelectorAll('[data-work-card]').length;
    if (!count) count = (await countFromPage('work.html', '[data-work-card]')) || 0;
    orgsEl.textContent = count > 0 ? String(count) : '—';
  }
}

function initCertDriveLinks() {
  document.querySelectorAll('[data-cert-drive]').forEach((link) => {
    const key = link.dataset.certDriveKey;
    const raw = (key && CERT_DRIVE_IDS[key]) || link.dataset.certDrive;
    const fileId = extractGoogleDriveFileId(raw);
    if (!fileId) return;
    link.href = getGoogleDriveViewUrl(fileId);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
}

function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch {
      /* ignore */
    }
    toggle.setAttribute('aria-pressed', String(isLight));
    toggle.setAttribute(
      'aria-label',
      isLight ? 'Switch to dark mode' : 'Switch to light mode'
    );
    toggle.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
  };

  const current = root.getAttribute('data-theme') || 'dark';
  applyTheme(current);

  toggle.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();

  const nav = document.querySelector('.main-nav');
  const navList = document.querySelector('.main-nav ul');
  const navToggle = document.querySelector('.nav-toggle');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('open');
    });

    navList.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navList.classList.remove('open');
      });
    });
  }

  function getPageSlug(pathOrHref) {
    const segment = String(pathOrHref).split('/').filter(Boolean).pop() || '';
    if (!segment || segment === 'index' || segment === 'index.html') return 'index';
    return segment.replace(/\.html$/i, '').toLowerCase();
  }

  const currentSlug = getPageSlug(window.location.pathname);

  document.querySelectorAll('.main-nav ul li a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    link.classList.toggle('active', getPageSlug(href) === currentSlug);
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 0;
      window.scrollTo({
        top: target.offsetTop - navHeight - 16,
        behavior: 'smooth',
      });
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.section').forEach((section) => observer.observe(section));

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initPortfolioStats();
  initCertDriveLinks();
  loadLeetCodeStats();
  loadHackerRankStats();

  initExperienceStats();

  document.querySelectorAll('[data-work-card]').forEach((card) => {
    const trigger = card.querySelector('.work-card__trigger');
    const panel = card.querySelector('.work-card__panel');
    if (!trigger || !panel) return;

    const setOpen = (open) => {
      trigger.setAttribute('aria-expanded', String(open));
      card.classList.toggle('is-open', open);
      panel.hidden = !open;
    };

    trigger.addEventListener('click', () => {
      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';

      document.querySelectorAll('[data-work-card].is-open').forEach((other) => {
        if (other === card) return;
        const otherTrigger = other.querySelector('.work-card__trigger');
        const otherPanel = other.querySelector('.work-card__panel');
        if (otherTrigger && otherPanel) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          other.classList.remove('is-open');
          otherPanel.hidden = true;
        }
      });

      setOpen(willOpen);
    });
  });
});
