(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.16,1,.3,1)';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* ======================================================
     Akıcı kaydırma (Lenis)
     ====================================================== */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    window.__lenis = lenis; // tanıtım videosu kaydı için
  }
  function scrollToEl(target, offset) {
    if (lenis) lenis.scrollTo(target, { offset: offset || 0, duration: 1.4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    e.preventDefault();
    if (href === '#') {
      if (a.matches('.brand, .mini-brand')) scrollToEl(0);
      return;
    }
    var el = document.querySelector(href);
    if (el) scrollToEl(el, -76);
  });

  /* ======================================================
     Dil
     ====================================================== */
  var LANGS = ['tr', 'ku', 'en', 'de', 'nl', 'fr'];
  var lang = store('k-lang');
  if (LANGS.indexOf(lang) < 0) lang = 'tr';

  function t(k) {
    var d = window.I18N[lang] || window.I18N.tr;
    return d[k] != null ? d[k] : (window.I18N.tr[k] || '');
  }
  function cap(s, loc) { return s ? s.charAt(0).toLocaleUpperCase(loc) + s.slice(1) : s; }
  function fmtDate(d, kind) {
    if (lang === 'ku') {
      var K = window.I18N_KU;
      if (kind === 'full') return d.getDate() + ' ' + K.months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + K.days[d.getDay()];
      if (kind === 'dm') return d.getDate() + ' ' + K.months[d.getMonth()];
      if (kind === 'month') return K.months[d.getMonth()];
      return K.days[d.getDay()];
    }
    var loc = window.I18N_LOCALE[lang] || 'tr-TR';
    var o = kind === 'full' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
          : kind === 'dm' ? { day: 'numeric', month: 'long' }
          : kind === 'month' ? { month: 'long' } : { weekday: 'long' };
    var s = d.toLocaleDateString(loc, o);
    return (kind === 'month' || kind === 'weekday' || kind === 'full') ? cap(s, loc) : s;
  }

  function applyLang() {
    root.lang = lang;
    $$('[data-i18n]').forEach(function (el) { var v = t(el.getAttribute('data-i18n')); if (v) el.textContent = v; });
    $$('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });

    $$('.decades button').forEach(function (b) {
      var y = b.getAttribute('data-dec');
      if (y !== 'all') b.querySelector('.lbl').textContent = window.I18N_DECADE(lang, +y);
    });
    $$('[data-declabel]').forEach(function (el) { el.textContent = window.I18N_DECADE(lang, +el.getAttribute('data-declabel')); });

    var now = new Date();
    $('#today').textContent = fmtDate(now, 'full');
    $('#otd-date').textContent = fmtDate(now, 'dm');
    $$('.event[data-date]').forEach(function (li) {
      var p = li.getAttribute('data-date').split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      li.querySelector('.d').textContent = d.getDate();
      li.querySelector('.m').innerHTML = '<b>' + esc(fmtDate(d, 'month')) + '</b>' + esc(fmtDate(d, 'weekday'));
    });

    $('.langnote').hidden = lang === 'tr';
    $('.lang-cur').textContent = lang.toUpperCase();
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-lang') === lang)); });

    buildMiniNav();
    updateArcStatus();
    requestAnimationFrame(function () { moveInd(activeNav); positionSeg(); measure(); });
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    store('k-lang', l);
    if (document.startViewTransition && !reduce) {
      var vt = document.startViewTransition(applyLang);
      var noop = function () {};
      vt.ready.catch(noop); vt.finished.catch(noop); vt.updateCallbackDone.catch(noop);
      setTimeout(function () { try { vt.skipTransition(); } catch (e) {} }, 1500); // takılırsa bitir
    } else applyLang();
  }

  var langBox = $('.lang'), langBtn = $('.lang-btn');
  function closeLang() { langBox.classList.remove('open'); langBtn.setAttribute('aria-expanded', 'false'); }
  langBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = langBox.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) { if (!langBox.contains(e.target)) closeLang(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLang(); });
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { closeLang(); setLang(b.getAttribute('data-lang')); });
  });

  /* ======================================================
     Açık / koyu tema
     ====================================================== */
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : darkMq.matches;
  }
  function syncThemeIcon() { root.classList.toggle('is-dark', isDark()); }
  function setTheme(t) {
    function apply() { root.setAttribute('data-theme', t); syncThemeIcon(); }
    store('k-theme', t);
    if (document.startViewTransition && !reduce) {
      var vt = document.startViewTransition(apply);
      var noop = function () {};
      vt.ready.catch(noop); vt.finished.catch(noop); vt.updateCallbackDone.catch(noop);
      setTimeout(function () { try { vt.skipTransition(); } catch (e) {} }, 1500); // takılırsa bitir
    } else apply();
  }
  $('.theme-btn').addEventListener('click', function () { setTheme(isDark() ? 'light' : 'dark'); });
  if (darkMq.addEventListener) darkMq.addEventListener('change', syncThemeIcon);
  syncThemeIcon();

  /* ======================================================
     Yazı boyutu
     ====================================================== */
  var fsBtns = $$('.fs button');
  function setFs(i) {
    root.classList.remove('fs-1', 'fs-2');
    if (i > 0) root.classList.add('fs-' + i);
    fsBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', String(i === j)); });
    store('k-fs', String(i));
    requestAnimationFrame(function () { moveInd(activeNav); positionSeg(); measure(); });
  }
  fsBtns.forEach(function (b, i) { b.addEventListener('click', function () { setFs(i); }); });
  setFs(Math.min(Math.max(parseInt(store('k-fs') || '0', 10) || 0, 0), 2));

  /* ======================================================
     Menü: kayan alt çizgi + bulunduğun bölüm
     ====================================================== */
  var navIn = $('.nav-in'), ind = $('.nav-ind');
  var navLinks = $$('.nav-in a');
  var activeNav = $('.nav-in a.is-active') || navLinks[0];
  var hoveringNav = false;

  function moveInd(a) {
    if (!a) return;
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  function setActive(a) {
    if (!a || a === activeNav) return;
    activeNav.classList.remove('is-active');
    activeNav = a;
    a.classList.add('is-active');
    if (!hoveringNav) moveInd(a);
  }
  navLinks.forEach(function (a) {
    a.addEventListener('mouseenter', function () { hoveringNav = true; moveInd(a); });
    a.addEventListener('focus', function () { moveInd(a); });
  });
  navIn.addEventListener('mouseleave', function () { hoveringNav = false; moveInd(activeNav); });

  var spyLinks = {};
  navLinks.forEach(function (a) {
    var h = a.getAttribute('href');
    if (h.length > 1 && !spyLinks[h]) spyLinks[h] = a;
  });

  function buildMiniNav() {
    $('.mini-nav').innerHTML = navLinks.map(function (a) {
      return '<a href="' + esc(a.getAttribute('href')) + '">' + esc(a.textContent) + '</a>';
    }).join('');
  }

  /* ======================================================
     Kaydırma: küçük başlık, ilerleme çubuğu, başa dön
     ====================================================== */
  var mini = $('.minibar'), prog = $('.progress'), totop = $('.totop'), ring = $('.totop .fg');
  var headEnd = 300;
  function measure() {
    var n = $('.nav');
    headEnd = n.getBoundingClientRect().bottom + window.scrollY;
  }
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(y / max, 1) : 0;
    var show = y > headEnd + 40;
    if (show !== mini.classList.contains('show')) {
      mini.classList.toggle('show', show);
      if (show) mini.removeAttribute('inert'); else mini.setAttribute('inert', '');
    }
    prog.style.transform = 'scaleX(' + p + ')';
    totop.classList.toggle('show', y > window.innerHeight * 0.9);
    ring.style.strokeDashoffset = (150.8 * (1 - p)).toFixed(1);
    if (y < 200) setActive(navLinks[0]);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  totop.addEventListener('click', function () { scrollToEl(0); });

  /* ======================================================
     Son dakika şeridi
     ====================================================== */
  var track = $('.ticker-track'), list = $('.ticker-list');
  var clone = list.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  $$('a', clone).forEach(function (a) { a.tabIndex = -1; });
  track.appendChild(clone);
  function tickerSpeed() { track.style.setProperty('--ticker-dur', Math.max(list.scrollWidth / 55, 20) + 's'); }

  /* ======================================================
     Manşet kaydırıcı
     ====================================================== */
  var slider = $('.slider'), slides = $$('.slide'), tabs = $$('.tab'), cur = 0;
  slider.style.setProperty('--slide-dur', '7s');

  function go(i) {
    i = (i + slides.length) % slides.length;
    if (i === cur) return;
    slides[cur].classList.remove('is-active');
    slides[i].classList.add('is-active');
    tabs.forEach(function (tb, k) {
      tb.classList.remove('is-active');
      tb.classList.toggle('is-done', k < i);
    });
    void tabs[i].offsetWidth; // animasyonu baştan başlat
    tabs[i].classList.add('is-active');
    cur = i;
  }
  tabs.forEach(function (tb, k) {
    tb.addEventListener('click', function () { go(k); });
    tb.querySelector('.tab-bar').addEventListener('animationend', function () {
      if (!reduce && tb.classList.contains('is-active')) go(cur + 1);
    });
  });
  $('[data-prev]').addEventListener('click', function () { go(cur - 1); });
  $('[data-next]').addEventListener('click', function () { go(cur + 1); });
  slider.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') go(cur - 1);
    if (e.key === 'ArrowRight') go(cur + 1);
  });
  slider.addEventListener('focusin', function () { slider.classList.add('paused'); });
  slider.addEventListener('focusout', function () { slider.classList.remove('paused'); });

  // Parmakla kaydırma
  var sx = null, sy = null;
  var slidesEl = $('.slides');
  slidesEl.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  slidesEl.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    sx = null;
  });

  // Ekranda değilken dursun
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      slider.classList.toggle('paused', !es[0].isIntersecting);
    }, { threshold: 0.25 }).observe(slider);
  }

  /* ======================================================
     Süzme animasyonu (etkinlikler + arşiv)
     ====================================================== */
  function swap(all, shouldShow) {
    var showing = all.filter(function (el) { return !el.hidden; });
    var outs = reduce ? [] : showing.map(function (el) {
      return el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.98)' }],
        { duration: 200, easing: 'ease-in', fill: 'forwards' });
    });
    setTimeout(function () {
      var k = 0;
      all.forEach(function (el) { el.hidden = !shouldShow(el); });
      outs.forEach(function (a) { a.cancel(); });
      if (reduce) return;
      all.forEach(function (el) {
        if (el.hidden) return;
        el.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, easing: EASE, delay: (k++) * 75, fill: 'backwards' });
      });
    }, reduce ? 0 : 210);
  }
  function press(group, el) { group.forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); }

  // Etkinlikler
  var segBtns = $$('.seg button'), segInd = $('.seg-ind'), evs = $$('.event');
  function positionSeg() {
    var b = segBtns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0];
    if (!b) return;
    segInd.style.width = b.offsetWidth + 'px';
    segInd.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  segBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-pressed') === 'true') return;
      press(segBtns, b);
      positionSeg();
      var f = b.getAttribute('data-ev-filter');
      swap(evs, function (li) { return f === 'all' || li.getAttribute('data-ev').split(' ').indexOf(f) > -1; });
    });
  });

  // Arşiv
  var decBtns = $$('.decades button'), arcItems = $$('.arc-item'), curDec = 'all';
  var defaultSet = arcItems.filter(function (it) { return !it.hidden; });
  var arcStatus = $('#arc-status');
  function updateArcStatus() {
    var b = decBtns.filter(function (x) { return x.getAttribute('data-dec') === curDec; })[0];
    var label = curDec === 'all' ? t('arc.alldec') : window.I18N_DECADE(lang, +curDec);
    var n = b.querySelector('[data-n]').textContent;
    arcStatus.textContent = label + ' · ' + n + ' ' + t('arc.records');
  }
  decBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.getAttribute('data-dec');
      if (d === curDec) return;
      curDec = d;
      press(decBtns, b);
      updateArcStatus();
      if (b.scrollIntoView && b.parentNode.scrollWidth > b.parentNode.clientWidth) {
        b.parentNode.scrollTo({ left: b.offsetLeft - b.parentNode.clientWidth / 2 + b.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
      swap(arcItems, function (it) { return d === 'all' ? defaultSet.indexOf(it) > -1 : it.getAttribute('data-dec') === d; });
    });
  });

  // Ses dalgası çubukları
  $$('.wave').forEach(function (w, k) {
    var s = '';
    for (var i = 0; i < 44; i++) {
      var h = 16 + Math.abs(Math.sin(i * 0.55 + k * 2.1) * Math.cos(i * 0.19 + k)) * 84;
      s += '<i style="height:' + h.toFixed(0) + '%;--j:' + i + ';transition-delay:' + (i * 12) + 'ms"></i>';
    }
    w.innerHTML = s;
  });

  /* ======================================================
     Ekrana girince beliren öğeler + sayaçlar
     ====================================================== */
  function countUp(el) {
    var to = +el.getAttribute('data-count');
    if (reduce || !to) { el.textContent = to; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  var watched = $$('[data-reveal], .sec-head, .decades, .arc-vis, [data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    watched.forEach(function (el) { io.observe(el); });

    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) setActive(spyLinks['#' + e.target.id]);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(spyLinks).forEach(function (h) { var s = $(h); if (s) spy.observe(s); });
  } else {
    watched.forEach(function (el) { el.classList.add('in'); });
  }

  /* ======================================================
     Başlangıç
     ====================================================== */
  function layout() { moveInd(activeNav); positionSeg(); measure(); tickerSpeed(); onScroll(); }
  applyLang();
  layout();
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  function ready() { root.classList.add('ready'); }
  requestAnimationFrame(function () { requestAnimationFrame(ready); });
  setTimeout(ready, 300); // sekme arka plandaysa bile sayfa boş kalmasın
})();
