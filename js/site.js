/* CurioPlay landing page — motion layer (GSAP + ScrollTrigger). Everything degrades to a static page without JS. */
(function () {
  const html = document.documentElement;
  html.classList.replace('nojs', 'js');
  const still = /[?&]noanim=1/.test(location.search);           // static render for full-page review screenshots
  const reduce = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.rv').forEach(el => { if (still) el.classList.add('in'); else io.observe(el); });
  if (still) document.querySelectorAll('#screens .shot, #screens .cap').forEach((el, i) => { el.style.opacity = i === 0 || el.classList.contains('cap') && i === 4 ? 1 : 0; });

  /* ---- videos: play only while visible ---- */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.dataset.auto !== undefined && v.paused) v.play().catch(() => {}); }
    else if (!v.paused && v.dataset.auto !== undefined) v.pause();
  }), { threshold: .2 });
  document.querySelectorAll('video[data-auto]').forEach(v => vio.observe(v));

  /* ---- chapters: the pinned image follows the step nearest the middle of the viewport ---- */
  document.querySelectorAll('[data-chapter]').forEach(ch => {
    const steps = [...ch.querySelectorAll('.step')], media = [...ch.querySelectorAll('.frame > *')];
    const set = i => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); media.forEach((m, k) => { m.classList.toggle('on', k === i); if (m.tagName === 'VIDEO') { k === i ? m.play().catch(() => {}) : m.pause(); } }); };
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

  if (!hasGsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---- hero: words rise in, video parallax ---- */
  gsap.from('h1 .w', { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08, delay: .15 });
  gsap.from('.hero .lede, .hero .cta, .hero .fine, .hero .strip', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .5 });
  gsap.to('.hero .bg video', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---- four screens: pinned scene, media + captions crossfade as you scroll ---- */
  ScrollTrigger.matchMedia({
    '(min-width: 961px)': function () {
      const shots = gsap.utils.toArray('#screens .shot'), caps = gsap.utils.toArray('#screens .cap'), bars = gsap.utils.toArray('#screens .progress i');
      gsap.set(shots[0], { opacity: 1 }); gsap.set(caps[0], { opacity: 1 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: '#screens .stage', start: 'top top', end: '+=' + (shots.length * 90) + '%', pin: true, scrub: .8, anticipatePin: 1 } });
      shots.forEach((s, i) => {
        if (i === 0) { tl.fromTo(s, { scale: .86 }, { scale: 1, duration: 1, ease: 'none' }, 0); }
        else {
          tl.to(shots[i - 1], { opacity: 0, scale: 1.05, duration: .6, ease: 'power2.inOut' }, i);
          tl.to(caps[i - 1], { opacity: 0, y: -14, duration: .4 }, i);
          tl.fromTo(s, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .8, ease: 'power2.out' }, i + .1);
          tl.fromTo(caps[i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5 }, i + .3);
        }
        tl.to(bars[i], { '--p': 1, duration: 1, ease: 'none' }, i);
      });
      tl.to({}, { duration: .6 });
    }
  });

  /* ---- gentle parallax on chapter media and reel clips ---- */
  gsap.utils.toArray('.media .frame, .reel .clip').forEach(el => {
    gsap.fromTo(el, { y: 26 }, { y: -26, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---- section headings slide up a touch faster than the scroll ---- */
  gsap.utils.toArray('section h2').forEach(h => {
    gsap.from(h, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
})();
