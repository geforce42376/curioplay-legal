/* CurioPlay landing page — motion layer. Everything degrades to a static page without JS.
   Performance rules: one composited background layer, no filters animated per frame, videos load only near the
   viewport and play only in it, a poster image sits under every video so nothing ever shows black. */
(function () {
  const html = document.documentElement;
  html.classList.replace('nojs', 'js');
  const still = /[?&]noanim=1/.test(location.search);
  const reduce = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---- reveal on scroll (IntersectionObserver: robust to layout shifts) + safety net ---- */
  const rv = [...document.querySelectorAll('.rv')];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  rv.forEach(el => { if (still) el.classList.add('in'); else io.observe(el); });
  setTimeout(() => rv.forEach(el => el.classList.add('in')), 2500);   // nothing stays hidden, whatever happens

  /* ---- lazy videos: .vid[data-src] = poster <img> + <video>; load near the viewport, play only inside it ---- */
  const vids = [...document.querySelectorAll('.vid[data-src]')];
  const attach = v => { const el = v.querySelector('video'); if (!el || el.dataset.loaded) return; el.dataset.loaded = 1; el.src = v.dataset.src; el.load(); el.addEventListener('playing', () => v.classList.add('ready'), { once: true }); };
  const play = v => { const el = v.querySelector('video'); if (!el) return; if (!el.dataset.loaded) attach(v); if (v.dataset.gate === 'off') return; el.play().catch(() => {}); };
  const pause = v => { const el = v.querySelector('video'); if (el && !el.paused) el.pause(); };
  const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { attach(e.target); near.unobserve(e.target); } }), { rootMargin: '600px 0px' });
  const inView = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? play(e.target) : pause(e.target); }), { threshold: .25 });
  vids.forEach(v => { if (still) return; near.observe(v); inView.observe(v); });

  /* ---- chapters: the pinned media follows the step nearest the middle of the viewport; only the active video plays ---- */
  document.querySelectorAll('[data-chapter]').forEach(ch => {
    const steps = [...ch.querySelectorAll('.step')], media = [...ch.querySelectorAll('.frame > *')];
    const set = i => {
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      media.forEach((m, k) => { m.classList.toggle('on', k === i); if (m.classList.contains('vid')) { m.dataset.gate = k === i ? 'on' : 'off'; k === i ? play(m) : pause(m); } });
    };
    media.forEach((m, k) => { if (m.classList.contains('vid') && k !== 0) m.dataset.gate = 'off'; });
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) set(steps.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => obs.observe(s));
  });

  /* ---- how-to filter tabs ---- */
  const tuts = document.querySelector('.tuts');
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    tuts.dataset.show = b.dataset.show;
    if (hasGsap) ScrollTrigger.refresh();
  }));

  if (!hasGsap || reduce) { document.querySelectorAll('#screens .shot, #screens .cap').forEach((el, i) => { el.style.opacity = (i === 0 || i === 4) ? 1 : 0; }); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---- hero: words rise in once ---- */
  gsap.from('h1 .w', { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08, delay: .1 });
  gsap.from('.hero .lede, .hero .cta, .hero .fine, .hero .strip', { y: 22, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, delay: .4 });

  /* ---- four screens: pinned scene, media + captions crossfade as you scroll (opacity/scale only: composited) ---- */
  ScrollTrigger.matchMedia({
    '(min-width: 961px)': function () {
      const shots = gsap.utils.toArray('#screens .shot'), caps = gsap.utils.toArray('#screens .cap'), bars = gsap.utils.toArray('#screens .progress i');
      gsap.set(shots[0], { opacity: 1 }); gsap.set(caps[0], { opacity: 1 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: '#screens .stage', start: 'top top', end: '+=' + (shots.length * 85) + '%', pin: true, scrub: true, anticipatePin: 1 } });
      shots.forEach((s, i) => {
        if (i === 0) { tl.fromTo(s, { scale: .88 }, { scale: 1, duration: 1, ease: 'none' }, 0); }
        else {
          tl.to(shots[i - 1], { opacity: 0, scale: 1.04, duration: .6, ease: 'power2.inOut' }, i);
          tl.to(caps[i - 1], { opacity: 0, y: -12, duration: .4 }, i);
          tl.fromTo(s, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .8, ease: 'power2.out' }, i + .1);
          tl.fromTo(caps[i], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5 }, i + .3);
        }
        tl.to(bars[i], { '--p': 1, duration: 1, ease: 'none' }, i);
      });
      tl.to({}, { duration: .6 });
    }
  });
})();
