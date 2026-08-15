/* ============================================================
   Anish Lohani — portfolio interactions v3
   Graphic novel style with real images, purple palette.
   ============================================================ */

(function () {
  'use strict';

  const has = (name) => typeof window[name] !== 'undefined';
  const gsap = has('gsap') ? window.gsap : null;
  const ScrollTrigger = has('ScrollTrigger') ? window.ScrollTrigger : null;
  const LenisCtor = has('Lenis') ? window.Lenis : null;
  const SplitType = has('SplitType') ? window.SplitType : null;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animationsOK = gsap && ScrollTrigger && !reduceMotion;

  /* ---------- Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  const storedTheme = (() => {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  })();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'dark'); // Default to dark

  function applyTheme(theme, animate) {
    root.setAttribute('data-theme', theme);
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0A0812' : '#F1EBDE');
    }
    if (animate) {
      root.classList.add('theme-anim');
      clearTimeout(applyTheme._t);
      applyTheme._t = setTimeout(() => root.classList.remove('theme-anim'), 520);
    }
  }

  applyTheme(initialTheme, false);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (LenisCtor && !reduceMotion) {
    lenis = new LenisCtor({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    if (animationsOK) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time * 1000); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else if (reduceMotion) {
    root.classList.add('no-lenis');
  }

  /* Anchor navigation */
  const headerEl = document.querySelector('.site-header');
  const headerOffset = headerEl ? headerEl.offsetHeight : 76;
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const scrollToTarget = () => {
        if (lenis) {
          lenis.scrollTo(target, { offset: -(headerOffset + 8) });
        } else {
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      };
      /* From an open mobile menu: play the exit animation first, then scroll */
      const mm = document.getElementById('mobileMenu');
      const fromOpenMenu = mm && mm.classList.contains('is-open') && mm.contains(link);
      if (fromOpenMenu) {
        closeMobileMenu(scrollToTarget);
      } else {
        scrollToTarget();
      }
    });
  });

  /* ---------- Header state ---------- */
  const header = document.querySelector('.site-header');
  const onScrollState = () => {
    if (header) header.classList.toggle('is-scrolled', (window.scrollY || 0) > 12);
  };
  window.addEventListener('scroll', onScrollState, { passive: true });
  onScrollState();

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  function setMenu(open) {
    if (!navToggle || !mobileMenu) return;
    navToggle.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    /* Clear inline styles left by the exit animation so the CSS entrance looks fresh */
    if (open && gsap) {
      gsap.set(mobileMenu, { clearProps: 'opacity,transform' });
      gsap.set(mobileMenu.querySelectorAll('.m-link'), { clearProps: 'opacity,transform' });
    }
  }

  /* Animated close on navigation: links cascade out, panel fades, then the callback (scroll) runs */
  function closeMobileMenu(onDone) {
    if (!mobileMenu) {
      if (onDone) onDone();
      return;
    }
    if (!animationsOK || !gsap) {
      setMenu(false);
      if (onDone) onDone();
      return;
    }
    const links = Array.from(mobileMenu.querySelectorAll('.m-link'));
    const panelTransition = mobileMenu.style.transition;
    mobileMenu.style.transition = 'none';
    links.forEach((l) => { l.style.transition = 'none'; });
    gsap.to(links, {
      y: -22,
      opacity: 0,
      duration: 0.28,
      stagger: { each: 0.04, from: 'end' },
      ease: 'power3.in',
      overwrite: 'auto',
    });
    gsap.to(mobileMenu, {
      opacity: 0,
      y: -16,
      duration: 0.3,
      delay: 0.12,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        mobileMenu.style.transition = panelTransition;
        links.forEach((l) => { l.style.transition = ''; });
        setMenu(false);
        if (onDone) onDone();
      },
    });
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      setMenu(!mobileMenu.classList.contains('is-open'));
    });
    /* Non-anchor links (mailto etc.) just close the menu */
    mobileMenu.querySelectorAll('a').forEach((link) => {
      if (!link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', () => setMenu(false));
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- Cursor glow ---------- */
  if (finePointer && !reduceMotion) {
    const glow = document.querySelector('.cursor-glow');
    if (glow) {
      let mouseX = 0, mouseY = 0;
      let glowX = 0, glowY = 0;
      let isVisible = false;

      document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isVisible) {
          isVisible = true;
          glow.classList.add('active');
        }
      });

      document.addEventListener('mouseleave', () => {
        isVisible = false;
        glow.classList.remove('active');
      });

      function animateGlow() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animateGlow);
      }
      animateGlow();
    }
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion && gsap) {
    document.querySelectorAll('.btn-magnetic').forEach((btn) => {
      const strength = 0.28;
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* ---------- Periodic tile flip (tap & keyboard) ---------- */
  const pTiles = document.querySelectorAll('.p-tile');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  pTiles.forEach((tile) => {
    /* Touch devices: tap to flip (hover covers desktop) */
    if (coarsePointer) {
      tile.addEventListener('click', () => tile.classList.toggle('is-flipped'));
    }
    /* Keyboard: Enter / Space to flip */
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tile.classList.toggle('is-flipped');
      }
    });
    tile.addEventListener('blur', () => tile.classList.remove('is-flipped'));
  });

  /* ============================================================
     RNA helix visuals
     ============================================================ */
  const NS = 'http://www.w3.org/2000/svg';

  function makeHelix(opts = {}) {
    const width = opts.width || 220;
    const height = opts.height || 520;
    const amp = opts.amp || 52;
    const wave = opts.wave || 130;
    const phase = opts.phase || 0;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const strandA = document.createElementNS(NS, 'path');
    const strandB = document.createElementNS(NS, 'path');
    const rungG = document.createElementNS(NS, 'g');
    rungG.setAttribute('class', 'helix-rungs');
    svg.appendChild(strandA);
    svg.appendChild(strandB);
    svg.appendChild(rungG);

    const strandD = (k, ph) => {
      let d = '';
      for (let y = 0; y <= height; y += 6) {
        const x = width / 2 + amp * Math.sin((2 * Math.PI * y) / wave + ph + k * Math.PI);
        d += (y === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y + ' ';
      }
      return d.trim();
    };

    const paint = (ph) => {
      strandA.setAttribute('d', strandD(0, ph));
      strandB.setAttribute('d', strandD(1, ph));
      strandA.setAttribute('class', 'helix-strand helix-strand-a');
      strandB.setAttribute('class', 'helix-strand helix-strand-b');
      while (rungG.firstChild) rungG.removeChild(rungG.firstChild);
      const step = wave / 4;
      for (let y = 0; y < height; y += step) {
        const x1 = width / 2 + amp * Math.sin((2 * Math.PI * y) / wave + ph);
        const x2 = width / 2 + amp * Math.sin((2 * Math.PI * y) / wave + ph + Math.PI);
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', x1.toFixed(1));
        l.setAttribute('y1', y.toFixed(1));
        l.setAttribute('x2', x2.toFixed(1));
        l.setAttribute('y2', y.toFixed(1));
        l.setAttribute('class', 'helix-rung');
        rungG.appendChild(l);
      }
    };

    paint(phase);
    return { svg, paint };
  }

  function mountHelixLoop(selector, opts) {
    const el = document.querySelector(selector);
    if (!el) return null;
    const wrap = document.createElement('div');
    wrap.className = 'helix-loop';
    for (let i = 0; i < 2; i++) {
      const { svg } = makeHelix(opts);
      svg.setAttribute('class', 'helix-loop-item');
      wrap.appendChild(svg);
    }
    el.appendChild(wrap);
  }

  /* Hero helix */
  mountHelixLoop('#heroHelix', { width: 220, height: 520, amp: 54, wave: 130, phase: 0.6 });

  /* ---------- Gel dividers ---------- */
  const gels = document.querySelectorAll('.gel');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-run');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    gels.forEach((g) => io.observe(g));
  } else {
    gels.forEach((g) => g.classList.add('is-run'));
  }

  /* ============================================================
     GSAP choreography
     ============================================================ */
  if (!animationsOK) {
    root.classList.remove('js-ready');
    document.body.classList.add('no-js-anim');
    return;
  }

  root.classList.add('js-ready');
  gsap.registerPlugin(ScrollTrigger);

  /* Scroll progress bar */
  const progress = document.querySelector('.scroll-progress');
  if (progress) {
    gsap.to(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });
  }

  /* ---------- Hero entrance ---------- */
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    /* Hold the ANiSH nameplate until its entrance tween runs */
    gsap.set('.hero-periodic', { opacity: 0, y: 30, filter: 'blur(4px)' });
  }
  if (heroTitle && SplitType) {
    const lines = heroTitle.querySelectorAll('.h-line');
    const words = [];
    lines.forEach((line) => {
      const st = new SplitType(line, { types: 'words' });
      if (st.words) words.push(...st.words);
    });

    const emphasis = ['engineer', 'my', 'own.'];
    words.forEach((w) => {
      const txt = w.textContent.trim().toLowerCase();
      if (emphasis.includes(txt)) w.classList.add('em-word');
    });

    gsap.set(lines, { overflow: 'hidden' });
    gsap.set(words, { yPercent: 115, opacity: 0 });

    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.2 });

    heroTl
      .to(words, { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.06 })
      .fromTo('.hero-meta',
        { opacity: 0, y: 20, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo('.hero-foot',
        { opacity: 0, y: 24, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out' },
        '-=0.65'
      )
      .fromTo('.hero-visual',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.8'
      )
      .fromTo('.hero-periodic',
        { opacity: 0, y: 30, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out', clearProps: 'filter' },
        '-=0.8'
      );
  } else if (heroTitle) {
    gsap.fromTo('.hero-title', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.1 });
    gsap.fromTo('.hero-meta, .hero-foot, .hero-periodic', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.5 });
  }

  /* ---------- Section title word reveals ---------- */
  if (SplitType) {
    document.querySelectorAll('.section-title').forEach((title) => {
      const st = new SplitType(title, { types: 'words' });
      if (!st.words) return;
      gsap.fromTo(st.words,
        { yPercent: 90, opacity: 0, filter: 'blur(6px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.04,
          scrollTrigger: { trigger: title, start: 'top 88%', once: true },
        }
      );
    });
  }

  /* ---------- Generic reveals ---------- */
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 50, filter: 'blur(3px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    );
  });

  /* ---------- Image panels parallax ---------- */
  gsap.utils.toArray('.image-panel img, .image-break img, .helix-interlude-bg img').forEach((img) => {
    gsap.to(img, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: img.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  });

  /* ---------- Stats counters ---------- */
  document.querySelectorAll('.stat-num[data-count]').forEach((el) => {
    const end = parseInt(el.dataset.count, 10) || 0;
    const obj = { v: 0 };
    gsap.fromTo(el.parentElement,
      { scale: 0.95, opacity: 0.5 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }
    );
    gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });

  /* ---------- Watermark parallax ---------- */
  gsap.utils.toArray('.watermark').forEach((wm) => {
    gsap.to(wm, {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: wm.closest('.section') || wm.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  });

  /* ---------- Active nav link ---------- */
  const navLinks = Array.from(document.querySelectorAll('.site-nav a, .mobile-menu a'));
  if (navLinks.length) {
    navLinks.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        },
      });
    });
  }

  /* ---------- Card tilt on hover ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.card, .stat, .tool-group').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-4px) perspective(800px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Floating nucleotides parallax ---------- */
  gsap.utils.toArray('.base-float').forEach((el, i) => {
    gsap.to(el, {
      y: (i % 2 === 0 ? -20 : 15),
      x: (i % 3 === 0 ? 10 : -8),
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('.helix-interlude') || el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    });
  });

  /* ---------- Refresh on load ---------- */
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
