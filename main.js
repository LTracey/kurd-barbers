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
    } else if (dock) {
      dock.classList.add('show'); // inner pages have no hero, so the dock is there from the start
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

  /* ---------- booking ----------
     Live mode: real bookings go straight into the shop's booking diary (owner dashboard).
     If the diary can't be reached, it falls back to the original chair request by text or WhatsApp. */
  const booking = $('#booking');
  if (booking) {
    const API = 'https://c--dec45ca3-04ed-4355-a912-fef8ff22f1d4-prod.lovable.cloud/rest/v1/rpc/';
    const KEY = 'sb_publishable_65AichsJLkY5ubciGsbitA_VBdoi4fx'; // public booking key, safe in the browser
    const MANAGE = 'https://kurd-barbers.lovable.app/booking/';

    const state = { service: null, date: null, time: null, name: '', phone: '', note: '', consent: false };
    const dateWrap = $('#b-dates'), timeWrap = $('#b-times');
    const nameIn = $('#b-name'), noteIn = $('#b-note'), phoneIn = $('#b-phone'), consentIn = $('#b-consent'), hpIn = $('#b-website');
    const ticket = $('#ticket'), hint = $('#t-hint'), stamp = $('.t-stamp', ticket), brandSmall = $('.t-brand small', ticket);
    const sendSms = $('#send-sms'), sendWa = $('#send-wa'), bookNow = $('#book-now');
    const done = $('#t-done'), tRef = $('#t-ref'), tManage = $('#t-manage'), again = $('#book-again');
    const out = { service: $('#t-service'), day: $('#t-day'), time: $('#t-time'), name: $('#t-name') };
    let days = [];
    let live = false;
    let serviceIds = {};
    const slotCache = new Map();
    let busy = false;

    async function rpc(fn, body) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 12000);
      try {
        const r = await fetch(API + fn, {
          method: 'POST',
          headers: { apikey: KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {}),
          signal: ctl.signal,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      } finally { clearTimeout(timer); }
    }

    // minutes after midnight, UK time, for an ISO start time
    function ukMins(iso) {
      const p = Object.fromEntries(tf.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
      return (+p.hour % 24) * 60 + +p.minute;
    }
    const timeLabel = (t) => (t == null ? '' : fmt(typeof t === 'string' ? ukMins(t) : t));

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
      } else if (!live) {
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
        b.addEventListener('click', () => { state.date = d.key; state.time = null; renderDates(); renderTimes(); render(); });
        dateWrap.appendChild(b);
      });
    }

    function paintTimes(list) {
      timeWrap.innerHTML = '';
      list.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = timeLabel(t);
        b.setAttribute('aria-pressed', String(state.time === t));
        b.addEventListener('click', () => {
          state.time = t;
          $$('.slot', timeWrap).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          render();
        });
        timeWrap.appendChild(b);
      });
    }
    const say = (text) => { timeWrap.innerHTML = `<p class="empty">${text}</p>`; };

    function renderTimes() {
      const d = dayOf();
      if (!d) { say('No times left this week. Walk in, or give us a call.'); return; }
      if (!live) { paintTimes(d.slots); return; }
      if (!state.service) { say('Pick a service to see the free times.'); return; }
      const key = `${serviceIds[state.service]}|${d.key}`;
      if (slotCache.has(key)) {
        const list = slotCache.get(key);
        if (state.time != null && !list.includes(state.time)) state.time = null;
        if (list.length) paintTimes(list); else say('No free times that day. Try another day, or just walk in.');
        return;
      }
      say('Checking the diary…');
      rpc('kb_availability', { p_service: serviceIds[state.service], p_date: d.key })
        .then((res) => {
          slotCache.set(key, Array.isArray(res && res.slots) ? res.slots : []);
          if (`${serviceIds[state.service]}|${state.date}` === key) { renderTimes(); render(); }
        })
        .catch(() => { if (`${serviceIds[state.service]}|${state.date}` === key) say('Couldn’t load the times. Text the shop below, or just walk in.'); });
    }

    function message() {
      const d = dayOf();
      const lines = [
        `Hi ${SHOP.name}, I'd like to book a chair.`,
        `Service: ${state.service}`,
        `When: ${dayLabel(d, 'long')} at ${timeLabel(state.time)}`,
        `Name: ${state.name}`,
      ];
      if (state.note) lines.push(`Note: ${state.note}`);
      lines.push('(Sent from your website)');
      return lines.join('\n');
    }
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /Macintosh/.test(navigator.userAgent);
    const phoneOk = () => /^[+0-9][0-9 ()-]{6,}$/.test(state.phone);

    // What's still needed before a text/WhatsApp request can go…
    function missingMsg() {
      if (!state.service) return { text: 'Pick a service to start', el: $('.chips', booking) };
      if (!dayOf()) return { text: 'No days free this week', el: dateWrap };
      if (state.time == null) return { text: 'Now pick a time', el: timeWrap };
      if (!state.name) return { text: 'Last thing: your name', el: nameIn };
      return null;
    }
    // …and before a real booking can be made.
    function missing() {
      const m = missingMsg();
      if (m || !live) return m;
      if (!phoneOk()) return { text: 'Your mobile number', el: phoneIn };
      if (!state.consent) return { text: 'Tick the privacy note', el: consentIn };
      return null;
    }
    function setVal(el, v) {
      if (el.textContent === v) return;
      el.textContent = v;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    function render() {
      const d = dayOf();
      setVal(out.service, state.service || '—');
      setVal(out.day, d ? dayLabel(d, 'long') : '—');
      setVal(out.time, state.time != null ? timeLabel(state.time) : '—');
      setVal(out.name, state.name || '—');
      if (ticket.classList.contains('is-booked')) return;
      const m = missing();
      hint.textContent = m ? m.text : live ? 'Ready. Book it below.' : 'Ready. Send it below.';
      ticket.classList.toggle('is-ready', !m);
      if (bookNow) bookNow.setAttribute('aria-disabled', String(!!m));
      const mm = missingMsg();
      if (mm) {
        [sendSms, sendWa].forEach((a) => { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); });
      } else {
        const body = encodeURIComponent(message());
        sendSms.href = `sms:${SHOP.phone}${isApple ? '&' : '?'}body=${body}`;
        sendWa.href = `https://wa.me/${SHOP.whatsapp}?text=${body}`;
        [sendSms, sendWa].forEach((a) => a.setAttribute('aria-disabled', 'false'));
      }
    }
    function nudge(m) {
      ticket.classList.remove('shake'); void ticket.offsetWidth; ticket.classList.add('shake');
      m.el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      const target = m.el.closest('.step') || m.el;
      target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
      if (m.el.tagName === 'INPUT') setTimeout(() => m.el.focus({ preventScroll: true }), 350);
    }
    [sendSms, sendWa].forEach((a) => a.addEventListener('click', (e) => {
      const m = missingMsg();
      if (!m) return;
      e.preventDefault();
      nudge(m);
    }));

    async function submit() {
      if (busy) return;
      const m = missing();
      if (m) { hint.textContent = m.text; nudge(m); return; }
      busy = true;
      bookNow.setAttribute('aria-busy', 'true');
      bookNow.firstChild.textContent = 'Booking… ';
      try {
        const res = await rpc('kb_book', { p: {
          serviceId: serviceIds[state.service], staffId: null, date: state.date, start: state.time,
          name: state.name, phone: state.phone, email: '', notes: state.note, consent: true, website: hpIn ? hpIn.value : '',
        } });
        if (res && res.ok) { showBooked(res); return; }
        const err = (res && res.error) || 'Something went wrong. Please call us.';
        if (/taken/i.test(err)) { slotCache.clear(); state.time = null; renderTimes(); }
        render();
        hint.textContent = err;
        ticket.classList.remove('is-ready', 'shake'); void ticket.offsetWidth; ticket.classList.add('shake');
      } catch (e) {
        render();
        hint.textContent = 'Couldn’t reach the diary. Text the shop below instead.';
        ticket.classList.remove('is-ready', 'shake'); void ticket.offsetWidth; ticket.classList.add('shake');
      } finally {
        busy = false;
        bookNow.removeAttribute('aria-busy');
        bookNow.firstChild.textContent = 'Book my chair ';
      }
    }

    function showBooked(res) {
      ticket.classList.add('is-ready', 'is-booked');
      stamp.textContent = 'Booked';
      brandSmall.textContent = `Ref ${res.reference}`;
      tRef.textContent = res.reference;
      tManage.href = `${MANAGE}${encodeURIComponent(res.reference)}?t=${encodeURIComponent(res.token)}`;
      $$('.t-live, .t-or, .t-msg, .t-note', booking).forEach((el) => { el.hidden = true; });
      done.hidden = false;
      slotCache.clear();
      if (innerWidth < 900) ticket.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
    if (again) again.addEventListener('click', () => {
      ticket.classList.remove('is-booked', 'is-ready');
      stamp.textContent = 'Ready to book';
      brandSmall.textContent = 'Chair request';
      done.hidden = true;
      $$('.t-live, .t-or, .t-msg, .t-note', booking).forEach((el) => { el.hidden = false; });
      state.time = null;
      refresh();
      $('.chips', booking).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });

    // One service per booking.
    function pickService(s) {
      state.service = state.service === s ? null : s;
      state.time = null;
      $$('.chip', booking).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.service === state.service)));
      renderTimes();
      render();
    }
    $$('.chip', booking).forEach((c) => c.addEventListener('click', () => pickService(c.dataset.service)));
    $$('[data-book]').forEach((a) => a.addEventListener('click', () => { if (state.service !== a.dataset.book) pickService(a.dataset.book); }));
    nameIn.addEventListener('input', () => { state.name = nameIn.value.trim(); render(); });
    noteIn.addEventListener('input', () => { state.note = noteIn.value.trim(); render(); });
    if (phoneIn) phoneIn.addEventListener('input', () => { state.phone = phoneIn.value.trim(); render(); });
    if (consentIn) consentIn.addEventListener('change', () => { state.consent = consentIn.checked; render(); });
    if (bookNow) bookNow.addEventListener('click', submit);

    function refresh() { buildDays(); renderDates(); renderTimes(); render(); }

    // Arriving from a menu "Book" link: that service is already picked.
    const wanted = new URLSearchParams(location.search).get('service');
    if (wanted && $$('.chip', booking).some((c) => c.dataset.service === wanted)) {
      state.service = wanted;
      $$('.chip', booking).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.service === wanted)));
    }
    refresh();

    // Switch on live booking once the diary answers.
    rpc('kb_config').then((cfg) => {
      const list = (cfg && cfg.services) || [];
      list.forEach((s) => { serviceIds[s.name] = s.id; });
      if (!$$('.chip', booking).every((c) => serviceIds[c.dataset.service])) return; // names don't match: stay in message mode
      live = true;
      root.classList.add('kb-live');
      $$('[data-live]', booking).forEach((el) => { el.hidden = false; });
      sendSms.classList.replace('btn-sun', 'btn-ghost');
      stamp.textContent = 'Ready to book';
      state.time = null;
      refresh();
    }).catch(() => { /* diary unreachable: the original text/WhatsApp request still works */ });

    // keep times honest if the page is left open
    setInterval(() => { slotCache.clear(); refresh(); }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { slotCache.clear(); refresh(); } });
  }
})();
