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

  const minWait = new Promise((res) => setTimeout(res, 300));
  const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  const fontsReady = Promise.race([document.fonts.ready, new Promise((res) => setTimeout(res, 1500))]);
  Promise.all([minWait, decoded, fontsReady]).then(settle);
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
// TIMELINE TAGS: p5.js rectangular blobs behind the tag text
// ═══════════════════════════════════════════════
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Run `callback` once, when `target` is within `margin` of the viewport
function whenNear(target, margin, callback) {
  if (!target) return;
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    callback();
  }, { rootMargin: margin });
  io.observe(target);
}

function initTagBlobs() {
  whenNear(document.getElementById('timeline'), '800px 0px', () => {
    loadScript('vendor/p5.min.js')
      .then(createTagBlobs)
      .catch(() => {});
  });
}

function createTagBlobs() {
  if (typeof p5 === 'undefined') return;

  const PAD = 14;
  const POINTS = 120;
  const SQUARENESS = 5;
  const WOBBLE = 0.16;
  const SPEED = 0.006;
  const GRAIN_STRENGTH = 18;

  document.querySelectorAll('.timeline__tag').forEach((el, index) => {
    const color = getComputedStyle(el).backgroundColor;
    el.innerHTML = '<span class="timeline__tag-text">' + el.innerHTML + '</span>';
    el.classList.add('is-blob');

    new p5((p) => {
      let w = 0, h = 0, grain;

      function fit() {
        w = el.offsetWidth;
        h = el.offsetHeight;
        p.resizeCanvas(w + PAD * 2, h + PAD * 2);
        if (grain) grain.remove();
        grain = p.createGraphics(p.width, p.height);
        grain.pixelDensity(1);
        grain.loadPixels();
        for (let i = 0; i < grain.pixels.length; i += 4) {
          const shade = p.random(255);
          grain.pixels[i] = grain.pixels[i + 1] = grain.pixels[i + 2] = shade;
          grain.pixels[i + 3] = GRAIN_STRENGTH;
        }
        grain.updatePixels();
      }

      p.setup = () => {
        p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
        const canvas = p.createCanvas(10, 10);
        canvas.elt.classList.add('timeline__tag-canvas');
        canvas.elt.style.left = -PAD + 'px';
        canvas.elt.style.top = -PAD + 'px';
        el.prepend(canvas.elt);
        p.noStroke();
        fit();
        new IntersectionObserver(([entry]) => (entry.isIntersecting ? p.loop() : p.noLoop())).observe(el);
      };

      p.draw = () => {
        if (el.offsetWidth !== w || el.offsetHeight !== h) fit();
        p.clear();
        const time = p.frameCount * SPEED + index * 10;
        const power = 2 / SQUARENESS;
        const ctx = p.drawingContext;

        ctx.save();
        ctx.translate(p.width / 2, p.height / 2);
        ctx.beginPath();
        for (let i = 0; i < POINTS; i++) {
          const a = (i / POINTS) * p.TWO_PI;
          const c = Math.cos(a), s = Math.sin(a);
          const offset = (p.noise(1 + c, 1 + s, time) - 0.5) * 2 * h * WOBBLE;
          const x = Math.sign(c) * Math.pow(Math.abs(c), power) * (w / 2) + c * offset;
          const y = Math.sign(s) * Math.pow(Math.abs(s), power) * (h / 2) + s * offset;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.clip();
        ctx.translate(-p.width / 2, -p.height / 2);
        p.image(grain, 0, 0, p.width, p.height);
        ctx.restore();
      };
    });
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
// HERO BLOBS: animated, grainy blobs that bulge toward the cursor
// ═══════════════════════════════════════════════
function initHeroBlobs() {
  const canvas = document.getElementById('heroBlobs');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');

  const LUMPINESS = 0.1;
  const MORPH_SPEED = 0.004;
  const POINT_COUNT = 200;
  const BREATH_AMOUNT = 0.015;
  const BREATH_SPEED = 0.008;
  const MOUSE_PULL = 0.35;
  const MOUSE_FOCUS = 4;
  const MOUSE_RANGE = 2.5;
  const MOUSE_EASE = 0.08;
  const DRIFT_SPEED = 0.0015;
  const DRIFT_RANGE = 0.3;
  const GRAIN_STRENGTH = 18;
  const SHADOW_OPACITY = 0.35;
  const SHADOW_BLUR = 0.2;

  // x/y are fractions of the hero, size is a fraction of its smaller side
  const blobs = [
    { x: 0.15, y: 0.25, size: 0.16, seed: 1, color: '255, 211, 122' },
    { x: 0.85, y: 0.2, size: 0.13, seed: 40, color: '220, 168, 255' },
    { x: 0.7, y: 0.8, size: 0.17, seed: 90, color: '255, 143, 100' },
    { x: 0.3, y: 0.8, size: 0.12, seed: 130, color: '183, 255, 147' },
    { x: 0.5, y: 0.15, size: 0.1, seed: 170, color: '248, 167, 255' },
].map((b) => ({ ...b, fx: 0, fy: 0, ready: false }));

  const units = Array.from({ length: POINT_COUNT }, (_, i) => {
    const a = (i / POINT_COUNT) * Math.PI * 2;
    return { x: Math.cos(a), y: Math.sin(a) };
  });

  // Smooth 3D value noise, 0..1
  const hash = (x, y, z) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const fade = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
    const n = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
    return mix(
      mix(mix(n(0, 0, 0), n(1, 0, 0), u), mix(n(0, 1, 0), n(1, 1, 0), u), v),
      mix(mix(n(0, 0, 1), n(1, 0, 1), u), mix(n(0, 1, 1), n(1, 1, 1), u), v),
      w
    );
  }

  let width = 0, height = 0, dpr = 1;
  let grain = null;
  let mouse = null;
  let frame = 0;
  let visible = true;

  function makeGrain() {
    grain = document.createElement('canvas');
    grain.width = Math.round(width * dpr);
    grain.height = Math.round(height * dpr);
    const g = grain.getContext('2d');
    const data = g.createImageData(grain.width, grain.height);
    for (let i = 0; i < data.data.length; i += 4) {
      const shade = Math.random() * 255;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = shade;
      data.data[i + 3] = GRAIN_STRENGTH;
    }
    g.putImageData(data, 0, 0);
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    makeGrain();
  }

  function trace(edges) {
    ctx.beginPath();
    edges.forEach((edge) => {
      edge.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
    });
  }

  function draw() {
    requestAnimationFrame(draw);
    if (!visible || !width) return;
    frame++;
    const time = frame * MORPH_SPEED;
    const breath = 1 + Math.sin(frame * BREATH_SPEED) * BREATH_AMOUNT;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const edges = [];
    const colors = [];
    let maxRadius = 0;
    blobs.forEach((b) => {
      const drift = frame * DRIFT_SPEED;
      const cx = (b.x + (noise(b.seed + 200, 0, drift) - 0.5) * 2 * DRIFT_RANGE) * width;
      const cy = (b.y + (noise(0, b.seed + 300, drift) - 0.5) * 2 * DRIFT_RANGE) * height;
      const base = Math.min(width, height) * b.size;
      maxRadius = Math.max(maxRadius, base);

      if (!b.ready) { b.fx = cx; b.fy = cy; b.ready = true; }
      const tx = mouse ? mouse.x : cx;
      const ty = mouse ? mouse.y : cy;
      b.fx += (tx - b.fx) * MOUSE_EASE;
      b.fy += (ty - b.fy) * MOUSE_EASE;

      const dx = b.fx - cx, dy = b.fy - cy;
      const dist = Math.hypot(dx, dy);
      const rampIn = Math.min(Math.max(dist / base, 0), 1);
      const fadeOut = 1 - Math.min(Math.max((dist - base) / (base * (MOUSE_RANGE - 1)), 0), 1);
      const strength = rampIn * fadeOut;
      const dirX = dist < 1 ? 0 : dx / dist;
      const dirY = dist < 1 ? 0 : dy / dist;

      colors.push(b.color);
      edges.push(units.map((p) => {
        const facing = Math.max(0, p.x * dirX + p.y * dirY);
        const bulge = 1 + MOUSE_PULL * strength * Math.pow(facing, MOUSE_FOCUS);
        const n = noise(b.seed + 1 + p.x, b.seed + 1 + p.y, time);
        const r = base * (1 + (n * 2 - 1) * LUMPINESS) * breath * bulge;
        return { x: cx + p.x * r, y: cy + p.y * r };
      }));
    });

    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${SHADOW_OPACITY})`;
    ctx.shadowBlur = maxRadius * SHADOW_BLUR * dpr;
    edges.forEach((edge, i) => {
      ctx.fillStyle = `rgb(${colors[i]})`;
      trace([edge]);
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    trace(edges);
    ctx.clip();
    ctx.drawImage(grain, 0, 0, width, height);
    ctx.restore();
  }

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  hero.addEventListener('mouseleave', () => { mouse = null; });

  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);
  resize();
  requestAnimationFrame(draw);
}

// ═══════════════════════════════════════════════
// GRAIN: the same random speckle as the hero blobs, tiled behind backgrounds
// ═══════════════════════════════════════════════
function initGrain() {
  const size = 256;
  const tile = document.createElement('canvas');
  tile.width = tile.height = size;
  const g = tile.getContext('2d');
  const data = g.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const shade = Math.random() * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = shade;
    data.data[i + 3] = 18;
  }
  g.putImageData(data, 0, 0);
  document.documentElement.style.setProperty('--grain', `url(${tile.toDataURL('image/png')})`);
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
initTagBlobs();
initHeroMagneticTitle();
initCopyEmail();
initGrain();
whenNear(document.getElementById('work'), '800px 0px', () => {
  loadScript('https://www.instagram.com/embed.js').catch(() => {});
});
initHeroBlobs();

document.documentElement.classList.add('is-intro');
playIntro();
