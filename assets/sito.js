(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* Titolo: parole che salgono in sequenza */
  var h1 = document.getElementById('titolo');
  if (h1 && !reduce) {
    var i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { split(n); }
      });
    })(h1);
  }

  /* Numeri che contano */
  function countUp(el) {
    var to = +el.getAttribute('data-to'); if (!to) return;
    var t0 = null, dur = 1400;
    function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * k).toLocaleString('it-IT'); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* Comparsa allo scorrimento: ciò che è già visibile resta visibile */
  var rv = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (!reduce && 'IntersectionObserver' in window) {
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('wait'); e.target.classList.add('in');
        Array.prototype.forEach.call(e.target.querySelectorAll('.count'), countUp);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    rv.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) { el.classList.add('in'); return; }
      el.classList.add('wait');
      Array.prototype.forEach.call(el.querySelectorAll('.count'), function (c) { c.textContent = '0'; });
      io.observe(el);
    });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* Barra dei settori */
  var secs = Array.prototype.slice.call(document.querySelectorAll('[data-sector]'));
  var track = document.querySelector('.sectors');
  if (track) {
    track.style.gridTemplateColumns = 'repeat(' + secs.length + ', 1fr)';
    track.innerHTML = secs.map(function () { return '<i><b></b></i>'; }).join('');
  }
  var bars = document.querySelectorAll('.sectors b');
  var lab = document.getElementById('sector');
  var navLinks = document.querySelectorAll('.nav a');
  function onScroll() {
    var y = window.scrollY + window.innerHeight * 0.35, cur = 0;
    secs.forEach(function (s, k) {
      var top = s.getBoundingClientRect().top + window.scrollY, h = s.offsetHeight;
      var p = Math.max(0, Math.min(1, (y - top) / h));
      if (k === secs.length - 1 && window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) p = 1;
      if (bars[k]) bars[k].style.setProperty('--p', p.toFixed(3));
      if (y >= top) cur = k;
    });
    if (lab) lab.textContent = 'S' + (cur + 1) + '/' + secs.length;
    var tl = document.getElementById('timeline'), fill = document.getElementById('tl-fill');
    if (tl && fill) {
      var r = tl.getBoundingClientRect(), mid = window.innerHeight * 0.6;
      var hh = Math.max(0, Math.min(r.height - 12, mid - r.top));
      fill.style.height = (reduce ? r.height - 12 : hh) + 'px';
    }
    Array.prototype.forEach.call(navLinks, function (a) {
      if (a.hasAttribute('aria-current')) return;
      var id = secs[cur] && secs[cur].id; a.classList.toggle('on', !!id && a.getAttribute('href') === '#' + id);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();

  /* Vetrina in apertura */
  var vt = document.querySelector('.vetrina');
  if (vt) {
    var slides = vt.querySelectorAll('.slide'), segs = vt.querySelectorAll('.vt-seg button');
    var vName = document.getElementById('vt-name'), vKind = document.getElementById('vt-kind'), vText = vt.querySelector('.vt-text');
    var cur = 0;
    function show(n) {
      if (n === cur) return;
      var prev = slides[cur]; prev.classList.remove('is-on'); prev.classList.add('is-out');
      setTimeout(function () { prev.classList.remove('is-out'); }, 900);
      slides[n].classList.add('is-on');
      Array.prototype.forEach.call(segs, function (b, k) { b.classList.toggle('on', k === n); b.setAttribute('aria-pressed', k === n); });
      vName.textContent = slides[n].getAttribute('data-name'); vKind.textContent = slides[n].getAttribute('data-kind');
      vText.classList.remove('swap'); void vText.offsetWidth; vText.classList.add('swap');
      cur = n;
    }
    Array.prototype.forEach.call(segs, function (b, k) {
      b.addEventListener('click', function () { show(k); });
      b.querySelector('i').addEventListener('animationend', function () { if (!reduce) show((k + 1) % slides.length); });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vt.classList.toggle('paused', !es[0].isIntersecting); }).observe(vt);
  }

  /* Esploratore delle funzioni: schede con tastiera */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(x.getAttribute('aria-controls'));
      if (panel) { panel.hidden = !on; if (on) { panel.classList.remove('show'); void panel.offsetWidth; panel.classList.add('show'); } }
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); selectTab(tabs[(k + d + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });

  /* Archivio di esempio: ricerca dal vivo */
  var find = document.getElementById('cerca-doc');
  if (find) {
    var docs = Array.prototype.slice.call(document.querySelectorAll('#elenco-doc li'));
    var none = document.getElementById('nessun-doc');
    find.addEventListener('input', function () {
      var q = find.value.trim().toLowerCase(), shown = 0;
      docs.forEach(function (li) { var hit = !q || li.textContent.toLowerCase().indexOf(q) > -1; li.hidden = !hit; if (hit) shown++; });
      none.hidden = shown > 0;
    });
  }

  /* Bozza da approvare */
  var appr = document.getElementById('approva');
  if (appr) appr.addEventListener('click', function () {
    var box = document.getElementById('bozza'), st = document.getElementById('bozza-stato');
    var done = box.classList.toggle('approvata');
    st.textContent = done ? 'Approvata · parte domattina alle 9:00' : 'Bozza · in attesa della tua approvazione';
    appr.textContent = done ? 'Annulla' : 'Approva';
  });

  /* Copia dell'indirizzo email */
  Array.prototype.forEach.call(document.querySelectorAll('[data-copia]'), function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copia'), label = b.textContent;
      function ok() { b.textContent = 'Copiato'; setTimeout(function () { b.textContent = label; }, 1800); }
      function fallback() {
        var el = document.getElementById(b.getAttribute('aria-controls'));
        if (el) { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
        b.textContent = 'Selezionato: premi Copia';
        setTimeout(function () { b.textContent = label; }, 2400);
      }
      try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
    });
  });

  /* Mini quiz con le scatole di Leitner */
  var card = document.getElementById('card'), exp = document.getElementById('quiz-e'), reset = document.getElementById('quiz-reset');
  if (card) {
  var opts = Array.prototype.slice.call(document.querySelectorAll('.quiz-o button'));
  function moveCard(box) { var w = card.parentNode.offsetWidth; card.style.transform = 'translateX(' + ((box - 3) * (w + 6) / 5) + 'px)'; }
  var box = 3; moveCard(box);
  opts.forEach(function (b) {
    b.addEventListener('click', function () {
      var ok = b.hasAttribute('data-ok');
      opts.forEach(function (o) { o.disabled = true; if (o.hasAttribute('data-ok')) o.classList.add('ok'); });
      if (!ok) b.classList.add('ko');
      box = ok ? 4 : 1; moveCard(box);
      exp.textContent = (ok ? 'Giusto. La domanda sale alla scatola 4 e torna fra 3 giorni. ' : 'Sbagliato. La domanda torna alla scatola 1 e si ripropone subito. ') +
        'Pseudonimizzato vuol dire ancora riconducibile a una persona: solo il dato anonimo esce dal GDPR.';
      reset.hidden = false;
    });
  });
  reset.addEventListener('click', function () {
    opts.forEach(function (o) { o.disabled = false; o.classList.remove('ok', 'ko'); });
    box = 3; moveCard(box); reset.hidden = true;
    exp.textContent = 'Scegli una risposta: la domanda si sposta tra le scatole del ripasso.';
  });
  window.addEventListener('resize', function () { moveCard(box); });
  }

  /* Tracciato con il delta dal vivo */
  var cv = document.getElementById('trace'); if (!cv) return;
  var ctx = cv.getContext('2d');
  var elD = document.getElementById('delta'), elT = document.getElementById('time'), elS = document.getElementById('speed'), elL = document.getElementById('lap');
  // Strada di collina: curve a spirale e tornanti, coordinate normalizzate
  var ctrl = [[.08,.80],[.18,.92],[.32,.86],[.36,.70],[.40,.54],[.26,.46],[.30,.32],[.34,.18],[.52,.12],[.60,.24],[.68,.36],[.56,.52],[.66,.62],[.78,.72],[.90,.62],[.88,.44],[.86,.30],[.92,.18],[.94,.10]];
  var pts = [];
  for (var s = 0; s + 3 < ctrl.length; s += 3) {
    var a = ctrl[s], b = ctrl[s+1], c = ctrl[s+2], d = ctrl[s+3];
    for (var t = 0; t < 1; t += 0.02) {
      var u = 1 - t;
      pts.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]);
    }
  }
  pts.push(ctrl[ctrl.length - 1]);
  var cum = [0]; for (var k = 1; k < pts.length; k++) cum.push(cum[k-1] + Math.hypot(pts[k][0]-pts[k-1][0], pts[k][1]-pts[k-1][1]));
  var L = cum[cum.length - 1];
  function at(f) { var target = f * L, lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (cum[m] < target) lo = m; else hi = m; }
    var seg = (target - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
    return [pts[lo][0] + (pts[hi][0]-pts[lo][0]) * seg, pts[lo][1] + (pts[hi][1]-pts[lo][1]) * seg, lo]; }
  var W = 0, H = 0, dpr = 1;
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }
  function col(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function delta(f) { return -1.6 * Math.sin(f * Math.PI * 1.15) + 0.55 * Math.sin(f * 9) + 0.25; }
  function fmt(x) { var s = Math.abs(x).toFixed(1).replace('.', ','); return (x < 0 ? '−' : '+') + s + ' s'; }
  var LAP = 10000, PAUSE = 1600, start = null, visible = true;
  function draw(f) {
    var ink = col('--ink'), rule = col('--rule'), acc = col('--accent'), gain = col('--gain'), loss = col('--loss'), ink2 = col('--ink-2');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var pad = 18, sx = function (p) { return pad + p[0] * (W - 2*pad); }, sy = function (p) { return pad + p[1] * (H - 2*pad); };
    // quota orizzontale sotto il tracciato
    ctx.strokeStyle = ink2; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(pad, H - 6); ctx.lineTo(W - pad, H - 6); ctx.moveTo(pad, H - 10); ctx.lineTo(pad, H - 2); ctx.moveTo(W - pad, H - 10); ctx.lineTo(W - pad, H - 2); ctx.stroke();
    ctx.fillStyle = ink2; ctx.font = '10px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = col('--sheet'); var lbl = '4,2 km · 3 settori'; var tw = ctx.measureText(lbl).width + 10; ctx.fillRect(W/2 - tw/2, H - 12, tw, 12);
    ctx.fillStyle = ink2; ctx.fillText(lbl, W/2, H - 3);
    // strada intera
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = rule; ctx.lineWidth = 9; ctx.beginPath();
    pts.forEach(function (p, j) { j ? ctx.lineTo(sx(p), sy(p)) : ctx.moveTo(sx(p), sy(p)); }); ctx.stroke();
    // parte percorsa, colorata per guadagno o perdita
    var cur = at(f), n = cur[2];
    ctx.lineWidth = 4;
    for (var j = 1; j <= n; j++) {
      var fj = cum[j] / L; ctx.strokeStyle = delta(fj) < 0 ? gain : loss;
      ctx.beginPath(); ctx.moveTo(sx(pts[j-1]), sy(pts[j-1])); ctx.lineTo(sx(pts[j]), sy(pts[j])); ctx.stroke();
    }
    ctx.strokeStyle = delta(f) < 0 ? gain : loss; ctx.beginPath(); ctx.moveTo(sx(pts[n]), sy(pts[n])); ctx.lineTo(sx(cur), sy(cur)); ctx.stroke();
    // confini dei settori
    [1/3, 2/3].forEach(function (q, m) {
      var p = at(q); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(sx(p), sy(p), 3.5, 0, 7); ctx.fill();
      ctx.textAlign = 'left'; ctx.font = '600 10px "IBM Plex Mono", monospace'; ctx.fillText('S' + (m + 2), sx(p) + 8, sy(p) - 6);
    });
    var p0 = at(0), p1 = at(1);
    ctx.fillStyle = ink; ctx.font = '600 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('PARTENZA', sx(p0) - 4, sy(p0) - 12); ctx.textAlign = 'right'; ctx.fillText('ARRIVO', sx(p1) - 10, sy(p1) + 4);
    // auto
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(sx(cur), sy(cur), 7, 0, 7); ctx.fill();
    ctx.strokeStyle = col('--sheet'); ctx.lineWidth = 2.5; ctx.stroke();
    // letture
    var dv = delta(f); elD.textContent = fmt(dv); elD.style.color = dv < 0 ? gain : loss;
    var secs = Math.floor(f * 154); elT.textContent = Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2);
    elS.textContent = Math.round(62 + 24 * Math.sin(f * 11) + 8 * Math.cos(f * 23));
    elL.textContent = 'Settore ' + Math.min(3, 1 + Math.floor(f * 3)) + '/3';
  }
  function frame(t) {
    if (!visible) { start = null; return; }
    if (start === null) start = t;
    var e = (t - start) % (LAP + PAUSE); draw(Math.min(1, e / LAP));
    requestAnimationFrame(frame);
  }
  size();
  if (reduce) { draw(0.62); }
  else {
    new IntersectionObserver(function (es) { var was = visible; visible = es[0].isIntersecting; if (visible && !was) requestAnimationFrame(frame); }).observe(cv);
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () { size(); if (reduce) draw(0.62); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (reduce) draw(0.62); });
})();
