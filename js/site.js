/* CurioPlay landing page — motion layer, no libraries.
   Rules learned the hard way (Safari on a Retina Mac): no live blur, no backdrop-filter over moving content, one video
   decoding at a time, a poster image under every video, opacity/transform-only transitions, native sticky positioning. */
(function () {
  const html = document.documentElement;
  html.classList.replace('nojs', 'js');
  const still = /[?&]noanim=1/.test(location.search);
  const reduce = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('loaded')));   // hero words rise via CSS

  /* ---- reveal on scroll (IntersectionObserver) + safety net so nothing stays hidden ---- */
  const rv = [...document.querySelectorAll('.rv')];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  rv.forEach(el => { if (still || reduce) el.classList.add('in'); else io.observe(el); });
  setTimeout(() => rv.forEach(el => el.classList.add('in')), 2500);

  /* ---- videos: poster <img> + <video>; source attached near the viewport; ONE plays at a time (the one nearest the centre) ---- */
  const vids = [...document.querySelectorAll('.vid[data-src]')];
  const attach = v => { const el = v.querySelector('video'); if (!el || el.dataset.loaded) return; el.dataset.loaded = 1; el.src = v.dataset.src; el.load(); el.addEventListener('playing', () => v.classList.add('ready'), { once: true }); };
  const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { attach(e.target); near.unobserve(e.target); } }), { rootMargin: '500px 0px' });
  if (!still) vids.forEach(v => near.observe(v));
  let current = null, ticking = false;
  function choose() {
    ticking = false;
    const mid = innerHeight / 2; let best = null, bestD = Infinity;
    for (const v of vids) {
      if (v.dataset.gate === 'off') continue;
      const r = v.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) continue;
      const d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bestD) { bestD = d; best = v; }
    }
    if (best === current) return;
    if (current) { const el = current.querySelector('video'); if (el && !el.paused) el.pause(); }
    current = best;
    if (current) { attach(current); const el = current.querySelector('video'); el && el.play().catch(() => {}); }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(choose); } };
  if (!still) { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); setTimeout(choose, 300); }

  /* ---- chapters: the sticky frame shows the step nearest the middle of the viewport ---- */
  document.querySelectorAll('[data-chapter]').forEach(ch => {
    const steps = [...ch.querySelectorAll('.step')], media = [...ch.querySelectorAll('.frame > *')];
    const set = i => {
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      media.forEach((m, k) => { m.classList.toggle('on', k === i); if (m.classList.contains('vid')) m.dataset.gate = k === i ? 'on' : 'off'; });
      onScroll();
    };
    media.forEach((m, k) => { if (m.classList.contains('vid') && k !== 0) m.dataset.gate = 'off'; });
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) set(steps.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => obs.observe(s));
  });

  /* ---- four screens: sticky stage, phase from scroll progress, CSS does the crossfade ---- */
  const scene = document.querySelector('#screens .scene'), stage = document.querySelector('#screens .stage');
  if (scene && stage && !reduce) {
    const shots = [...stage.querySelectorAll('.shot')], n = shots.length;
    let phase = -1, raf = false;
    function update() {
      raf = false;
      const r = scene.getBoundingClientRect(); const travel = r.height - innerHeight; if (travel <= 0) return;
      const p = Math.min(1, Math.max(0, -r.top / travel));
      const ph = Math.min(n - 1, Math.floor(p * n));
      stage.style.setProperty('--p', (p * n - ph).toFixed(3));
      stage.style.setProperty('--zoom', (0.9 + 0.1 * Math.min(1, p * n)).toFixed(3));
      if (ph !== phase) { phase = ph; stage.dataset.phase = ph; }
    }
    const req = () => { if (!raf) { raf = true; requestAnimationFrame(update); } };
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); update();
  } else if (stage) { stage.dataset.phase = 0; }

  /* ---- how-to filter tabs ---- */
  const tuts = document.querySelector('.tuts');
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    tuts.dataset.show = b.dataset.show;
  }));
})();
