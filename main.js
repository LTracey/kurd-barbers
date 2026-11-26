/* Kurd Barbers · Newbridge — site behaviour.
   Shop details live in SHOP below: change hours or numbers here and the
   live open/closed status, hours table and booking times all follow. */
(() => {
  'use strict';
  window.__kb = true;

  const SHOP = {
    name: 'Kurd Barbers',
    phone: '+447577727097',          // tel: and text messages
    whatsapp: '447577727097',        // wa.me number, no plus
    // 0 = Sunday … 6 = Saturday. [open, close] in minutes after midnight, UK time.
    hours: {
      0: [9 * 60, 16 * 60],
      1: [9 * 60, 18 * 60],
      2: [9 * 60, 18 * 60],
      3: [9 * 60, 18 * 60],
      4: [9 * 60, 18 * 60],
      5: [9 * 60, 18 * 60],
      6: [9 * 60, 18 * 60],
    },
    slotStep: 30,     // minutes between bookable times
    lastSlotBefore: 30, // last bookable time is this long before closing
    minNotice: 30,    // can't book a time sooner than this from now
    daysAhead: 8,
  };

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ---------- the Kurdish sun: 21 rays ---------- */
  function sunSVG(mode) {
    const rays = 21;
    if (mode === 'line') {
      let g = '';
      for (let i = 0; i < rays; i++) {
        const a = (Math.PI * 2 * i) / rays - Math.PI / 2;
        const p = (r) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
        g += `<path d="M${p(30)} L${p(49)}"/>`;
      }
      return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width=".28" stroke-linecap="round">${g}<circle cx="50" cy="50" r="26"/><circle cx="50" cy="50" r="22" stroke-dasharray=".6 1.4"/></g></svg>`;
    }
    const pts = [];
    for (let i = 0; i < rays * 2; i++) {
      const a = (Math.PI * i) / rays - Math.PI / 2;
      const r = i % 2 ? 31 : 49;
      pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><polygon points="${pts.join(' ')}" fill="currentColor"/><circle class="sun-ring" cx="50" cy="50" r="28.6" fill="none" stroke-width="1.5"/><circle cx="50" cy="50" r="26.4" fill="currentColor"/></svg>`;
  }
  $$('[data-sun]').forEach((el) => { el.innerHTML = sunSVG(el.dataset.sun); });

  /* ---------- UK time + live open/closed ---------- */
  const tf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short',
  });
  function ukNow() {
    const p = Object.fromEntries(tf.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return {
      y: +p.year, m: +p.month, d: +p.day,
      wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
      mins: (+p.hour % 24) * 60 + +p.minute,
    };
  }
  function fmt(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    const ap = h >= 12 ? 'pm' : 'am';
    const h12 = ((h + 11) % 12) + 1;
    return m ? `${h12}:${String(m).padStart(2, '0')}${ap}` : `${h12}${ap}`;
  }
  function status() {
    const n = ukNow();
    const today = SHOP.hours[n.wd];
    if (today && n.mins >= today[0] && n.mins < today[1]) {
      const left = today[1] - n.mins;
      return { open: true, text: left <= 60 ? `Open now · closes in ${left} min` : `Open now · until ${fmt(today[1])}` };
    }
    if (today && n.mins < today[0]) return { open: false, text: `Closed · opens ${fmt(today[0])} today` };
    for (let i = 1; i <= 7; i++) {
      const wd = (n.wd + i) % 7;
      const h = SHOP.hours[wd];
      if (h) return { open: false, text: `Closed · opens ${fmt(h[0])} ${i === 1 ? 'tomorrow' : DAYS[wd]}` };
    }
    return { open: false, text: 'Closed' };
  }
  function paintStatus() {
    const s = status();
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      const t = $('.status-text', el);
      if (t) t.textContent = s.text;
    });
    const wd = ukNow().wd;
    $$('.hours [data-day]').forEach((li) => li.classList.toggle('is-today', +li.dataset.day === wd));
  }
  paintStatus();
  setInterval(paintStatus, 30000);

  const yr = $('#yr');
  if (yr) yr.textContent = ukNow().y;

  /* ---------- entrance ---------- */
  requestAnimationFrame(() => root.classList.add('ready'));

  /* ---------- header, scroll progress pole, hero parallax ---------- */
  const nav = $('.nav');
  const pole = $('.pole');
  const hero = $('.hero');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 24);
    if (pole) {
      const max = document.documentElement.scrollHeight - innerHeight;
      pole.style.setProperty('--prog', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      pole.style.setProperty('--p', (y * 0.35).toFixed(1));
    }
    if (hero && !reduceMotion && y < innerHeight * 1.2) hero.style.setProperty('--hy', y.toFixed(1));
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const burger = $('.burger');
  const mmenu = $('#mmenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mmenu.classList.toggle('open', open);
    mmenu.setAttribute('aria-hidden', !open);
    root.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mmenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mmenu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- reveals + mobile dock ---------- */
  $$('.menu-row').forEach((r, i) => r.style.setProperty('--rd', `${i * 0.06}s`));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-reveal]').forEach((el) => io.observe(el));

    const dock = $('.dock');
    if (dock && hero) {
      new IntersectionObserver(([e]) => dock.classList.toggle('show', !e.isIntersecting), { threshold: 0.05 }).observe(hero);
    }
  } else {
    $$('[data-reveal]').forEach((el) => el.classList.add('in'));
    const dock = $('.dock'); if (dock) dock.classList.add('show');
  }

  /* ---------- menu: image follows the cursor ---------- */
  const list = $('.menu-list');
  if (list && finePointer && !reduceMotion) {
    const fl = document.createElement('div');
    fl.className = 'float-img';
    fl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fl);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, warmed = false;
    const loop = () => {
      x += (tx - x) * 0.15; y += (ty - y) * 0.15;
      fl.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      raf = Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    list.addEventListener('pointerenter', () => {
      if (warmed) return; warmed = true;
      $$('.menu-row', list).forEach((r) => { const im = new Image(); im.src = r.dataset.img; });
    });
    list.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    $$('.menu-row', list).forEach((r) => r.addEventListener('pointerenter', (e) => {
      fl.style.backgroundImage = `url("${r.dataset.img}")`;
      if (!fl.classList.contains('on')) { x = tx = e.clientX; y = ty = e.clientY; fl.style.translate = `${x}px ${y}px`; }
      fl.classList.add('on');
    }));
    list.addEventListener('pointerleave', () => fl.classList.remove('on'));
    addEventListener('scroll', () => fl.classList.remove('on'), { passive: true });
  }

  /* ---------- gallery: drag to scroll + arrows ---------- */
  const reel = $('.reel');
  if (reel) {
    const step = () => { const s = $('.shot', reel); return s ? s.getBoundingClientRect().width + 18 : 300; };
    $$('[data-reel]').forEach((b) => b.addEventListener('click', () => {
      reel.scrollBy({ left: step() * +b.dataset.reel, behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
    if (finePointer) {
      let down = false, moved = false, sx = 0, sl = 0;
      reel.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; moved = false; sx = e.clientX; sl = reel.scrollLeft;
      });
      addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (!moved && Math.abs(dx) > 5) { moved = true; reel.classList.add('dragging'); }
        if (moved) reel.scrollLeft = sl - dx;
      });
      addEventListener('pointerup', () => {
        if (!down) return;
        down = false;
        if (moved) {
          reel.classList.remove('dragging');
          // settle on the nearest photo
          const w = step();
          reel.scrollTo({ left: Math.round(reel.scrollLeft / w) * w, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
      reel.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.mag').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2), my = e.clientY - (r.top + r.height / 2);
        b.style.transform = `translate(${(mx * 0.16).toFixed(1)}px, ${(my * 0.26).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- booking: build a chair request and send it by text or WhatsApp ---------- */
  const booking = $('#booking');
  if (booking) {
    const state = { services: [], date: null, time: null, name: '', note: '' };
    const dateWrap = $('#b-dates'), timeWrap = $('#b-times');
    const nameIn = $('#b-name'), noteIn = $('#b-note');
    const ticket = $('#ticket'), hint = $('#t-hint');
    const sendSms = $('#send-sms'), sendWa = $('#send-wa');
    const out = { service: $('#t-service'), day: $('#t-day'), time: $('#t-time'), name: $('#t-name') };
    let days = [];

    function buildDays() {
      const n = ukNow();
      days = [];
      for (let i = 0; i < SHOP.daysAhead; i++) {
        const dt = new Date(Date.UTC(n.y, n.m - 1, n.d + i));
        const wd = dt.getUTCDay();
        const h = SHOP.hours[wd];
        const slots = [];
        if (h) {
          for (let t = h[0]; t <= h[1] - SHOP.lastSlotBefore; t += SHOP.slotStep) {
            if (i === 0 && t < n.mins + SHOP.minNotice) continue;
            slots.push(t);
          }
        }
        days.push({ key: dt.toISOString().slice(0, 10), dt, i, slots });
      }
      if (!days.some((d) => d.key === state.date && d.slots.length)) {
        const first = days.find((d) => d.slots.length);
        state.date = first ? first.key : null;
        state.time = null;
      } else {
        const d = days.find((x) => x.key === state.date);
        if (state.time != null && !d.slots.includes(state.time)) state.time = null;
      }
    }
    const dayOf = () => days.find((d) => d.key === state.date);
    const dayLabel = (d, style) => d.dt.toLocaleDateString('en-GB', { weekday: style, day: 'numeric', month: style === 'long' ? 'long' : 'short', timeZone: 'UTC' });

    function renderDates() {
      dateWrap.innerHTML = '';
      days.forEach((d) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'date';
        b.disabled = !d.slots.length;
        b.setAttribute('aria-pressed', String(state.date === d.key));
        b.setAttribute('aria-label', `${dayLabel(d, 'long')}${d.slots.length ? '' : ', no times left'}`);
        const wd = d.i === 0 ? 'Today' : d.i === 1 ? 'Tmrw' : d.dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
        b.innerHTML = `<span class="date-wd">${wd}</span><span class="date-d">${d.dt.getUTCDate()}</span><span class="date-m">${d.dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</span>`;
        b.addEventListener('click', () => { state.date = d.key; state.time = null; renderDates(); renderTimes(); render('day'); });
        dateWrap.appendChild(b);
      });
    }
    function renderTimes() {
      timeWrap.innerHTML = '';
      const d = dayOf();
      if (!d) { timeWrap.innerHTML = '<p class="empty">No times left this week. Walk in, or give us a call.</p>'; return; }
      d.slots.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = fmt(t);
        b.setAttribute('aria-pressed', String(state.time === t));
        b.addEventListener('click', () => {
          state.time = t;
          $$('.slot', timeWrap).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          render('time');
        });
        timeWrap.appendChild(b);
      });
    }

    function message() {
      const d = dayOf();
      const lines = [
        `Hi ${SHOP.name}, I'd like to book a chair.`,
        `Service: ${state.services.join(' + ')}`,
        `When: ${dayLabel(d, 'long')} at ${fmt(state.time)}`,
        `Name: ${state.name}`,
      ];
      if (state.note) lines.push(`Note: ${state.note}`);
      lines.push('(Sent from your website)');
      return lines.join('\n');
    }
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /Macintosh/.test(navigator.userAgent);

    function missing() {
      if (!state.services.length) return { text: 'Pick a service to start', el: $('.chips', booking) };
      if (!dayOf()) return { text: 'No days free this week', el: dateWrap };
      if (state.time == null) return { text: 'Now pick a time', el: timeWrap };
      if (!state.name) return { text: 'Last thing: your name', el: nameIn };
      return null;
    }
    function setVal(el, v) {
      if (el.textContent === v) return;
      el.textContent = v;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    function render() {
      const d = dayOf();
      setVal(out.service, state.services.length ? state.services.join(' + ') : '—');
      setVal(out.day, d ? dayLabel(d, 'long') : '—');
      setVal(out.time, state.time != null ? fmt(state.time) : '—');
      setVal(out.name, state.name || '—');
      const m = missing();
      hint.textContent = m ? m.text : 'Ready. Send it below.';
      ticket.classList.toggle('is-ready', !m);
      if (m) {
        [sendSms, sendWa].forEach((a) => { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); });
      } else {
        const body = encodeURIComponent(message());
        sendSms.href = `sms:${SHOP.phone}${isApple ? '&' : '?'}body=${body}`;
        sendWa.href = `https://wa.me/${SHOP.whatsapp}?text=${body}`;
        [sendSms, sendWa].forEach((a) => a.setAttribute('aria-disabled', 'false'));
      }
    }
    [sendSms, sendWa].forEach((a) => a.addEventListener('click', (e) => {
      const m = missing();
      if (!m) return;
      e.preventDefault();
      ticket.classList.remove('shake'); void ticket.offsetWidth; ticket.classList.add('shake');
      m.el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      const target = m.el.closest('.step') || m.el;
      target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
      if (m.el === nameIn) setTimeout(() => nameIn.focus({ preventScroll: true }), 350);
    }));

    function toggleService(s, on) {
      const has = state.services.includes(s);
      const want = on == null ? !has : on;
      if (want && !has) state.services.push(s);
      if (!want && has) state.services = state.services.filter((x) => x !== s);
      $$('.chip', booking).forEach((c) => { if (c.dataset.service === s) c.setAttribute('aria-pressed', String(want)); });
      render();
    }
    $$('.chip', booking).forEach((c) => c.addEventListener('click', () => toggleService(c.dataset.service)));
    $$('[data-book]').forEach((a) => a.addEventListener('click', () => toggleService(a.dataset.book, true)));
    nameIn.addEventListener('input', () => { state.name = nameIn.value.trim(); render(); });
    noteIn.addEventListener('input', () => { state.note = noteIn.value.trim(); render(); });

    function refresh() { buildDays(); renderDates(); renderTimes(); render(); }
    refresh();
    // keep times honest if the page is left open
    setInterval(refresh, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }
})();
