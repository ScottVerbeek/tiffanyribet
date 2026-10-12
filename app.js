// ═══════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════
gsap.registerPlugin(ScrollTrigger);

const nav = document.getElementById('nav');
const hero = document.getElementById('hero');
const menuButton = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

// ═══════════════════════════════════════════════
// SMOOTH SCROLL (Lenis + GSAP ticker)
// ═══════════════════════════════════════════════
function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.08 });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
}

// INTRO: full-screen photo on white, then settle between TIFFANY and RIBET
// ═══════════════════════════════════════════════
function playIntro() {
  const img = document.getElementById('heroImg');
  const slot = document.getElementById('heroPhoto');
  const root = document.documentElement;

  gsap.set('.hero__meta', { opacity: 0, y: 24 });

  const settle = () => {
    const r = slot.getBoundingClientRect();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      img.classList.remove('intro');
      img.removeAttribute('style');
      root.classList.remove('is-intro');
    };
    img.addEventListener('transitionend', (e) => { if (e.propertyName === 'width') finish(); });
    setTimeout(finish, 1500);

    img.style.top = r.top + 'px';
    img.style.left = r.left + 'px';
    img.style.width = r.width + 'px';
    img.style.height = r.height + 'px';
    gsap.to('.hero__meta', { opacity: 1, y: 0, duration: 0.8, delay: 0.7, ease: 'power3.out' });
  };

  const minWait = new Promise((res) => setTimeout(res, 1000));
  const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  Promise.all([minWait, decoded, document.fonts.ready]).then(settle);
}

// ═══════════════════════════════════════════════
function updateNavAppearance() {
  const pastHero = window.scrollY >= hero.offsetHeight - 80;
  nav.classList.toggle('nav--past-hero', pastHero);
}

function initNavScrollWatcher() {
  window.addEventListener('scroll', updateNavAppearance, { passive: true });
  updateNavAppearance();
}

// ═══════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════
function closeMobileMenu() {
  mobileMenu.classList.remove('is-open');
  menuButton.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

function toggleMobileMenu() {
  const isOpen = mobileMenu.classList.toggle('is-open');
  menuButton.classList.toggle('is-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
}

function initMobileMenu() {
  menuButton.addEventListener('click', toggleMobileMenu);
  document.querySelectorAll('.nav__mobile-link').forEach((link) =>
    link.addEventListener('click', closeMobileMenu)
  );
}

// ═══════════════════════════════════════════════
// SCROLL-TRIGGERED ENTRANCE ANIMATIONS
// ═══════════════════════════════════════════════
function initScrollAnimations() {
  gsap.utils.toArray('.about__title, .work__title').forEach((el) =>
    gsap.from(el, {
      opacity: 0,
      y: 50,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    })
  );

  gsap.from('.about__text', {
    opacity: 0,
    x: -40,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.about__body', start: 'top 80%' },
  });

  gsap.utils.toArray('.scd-01__card').forEach((card, i) =>
    gsap.from(card, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      delay: i * 0.08,
      scrollTrigger: { trigger: card, start: 'top 90%' },
    })
  );

  gsap.from('.testimonial-card', {
    opacity: 0,
    y: 50,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.testimonials__grid', start: 'top 82%' },
  });
}

// ═══════════════════════════════════════════════
// TIMELINE: pinned horizontal scroll
// ═══════════════════════════════════════════════
function initTimelineScroll() {
  const wrap = document.querySelector('.timeline__scroll');
  const track = document.querySelector('.timeline__track');
  if (!wrap || !track) return;

  const navHeight = () => (nav ? nav.offsetHeight : 0);

  gsap.to(track, {
    x: () => -(track.scrollWidth - wrap.offsetWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: wrap,
      pin: true,
      scrub: 0.5,
      start: () => `top ${navHeight() + 24}px`,
      end: () => '+=' + (track.scrollWidth - wrap.offsetWidth) * 1.0,
      invalidateOnRefresh: true,
    },
  });
}

// ═══════════════════════════════════════════════
// HERO TITLE: magnetic letter-spacing that follows the cursor
// ═══════════════════════════════════════════════
function initHeroMagneticTitle() {
  const title = document.querySelector('.hero__title');
  const row = document.querySelector('.hero__title-row');
  const overlay = document.querySelector('.hero__overlay');
  if (!hero || !title || !row || !overlay) return;

  const LERP = 0.08;
  const LETTER_SPACING_MIN = -0.02;

  let letterSpacingMax = 0;
  let target = 0;
  let current = 0;

  function recalculateLetterSpacing() {
    // Temporarily reset spacing to measure the title's natural width
    title.style.letterSpacing = '0em';
    const padLeft = parseFloat(getComputedStyle(overlay).paddingLeft) || 0;
    const fontSize = parseFloat(getComputedStyle(title).fontSize);
    const textWidth = row.getBoundingClientRect().width;
    const available = window.innerWidth - padLeft;
    const gaps = row.textContent.trim().length - 1;
    const letterSpacingEm = gaps > 0 ? ((available - textWidth) / gaps) / fontSize : 0;

    letterSpacingMax = Math.max(letterSpacingEm, 0);
    target = letterSpacingMax;
    current = letterSpacingMax;
    document.documentElement.style.setProperty('--hero-ls', letterSpacingMax.toFixed(5) + 'em');
  }

  function animateLetterSpacing() {
    current += (target - current) * LERP;
    document.documentElement.style.setProperty('--hero-ls', current.toFixed(5) + 'em');
    requestAnimationFrame(animateLetterSpacing);
  }

  document.fonts.ready.then(recalculateLetterSpacing);
  window.addEventListener('resize', recalculateLetterSpacing);

  hero.addEventListener('mousemove', (event) => {
    const xPct = event.clientX / window.innerWidth;
    target = letterSpacingMax - xPct * (letterSpacingMax - LETTER_SPACING_MIN);
  });
  hero.addEventListener('mouseleave', () => {
    target = letterSpacingMax;
  });

  requestAnimationFrame(animateLetterSpacing);
}

// ═══════════════════════════════════════════════
// COPY EMAIL
// ═══════════════════════════════════════════════
function initCopyEmail() {
  const btn = document.getElementById('copyEmailBtn');
  if (!btn) return;
  const label = btn.querySelector('.btn__label');
  const arrow = btn.querySelector('.btn__arrow');
  const original = label.textContent;
  let timer;

  btn.addEventListener('click', async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const input = document.createElement('textarea');
      input.value = email;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    label.textContent = 'Email copied!';
    arrow.hidden = true;
    clearTimeout(timer);
    timer = setTimeout(() => { label.textContent = original; arrow.hidden = false; }, 2000);
  });
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
initSmoothScroll();
initNavScrollWatcher();
initMobileMenu();
initScrollAnimations();
initTimelineScroll();
initHeroMagneticTitle();
initCopyEmail();

document.documentElement.classList.add('is-intro');
window.addEventListener('load', playIntro);
