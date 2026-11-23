/*
 * Medicine Leaflet Service — interactive prototype.
 * Vanilla JS, hash routing, no network requests. Search runs on the in-memory demo catalogue.
 * Leaflet text is rendered exactly as stored in data.js: never rewritten, summarised or translated.
 */
(function () {
  'use strict';

  const { products, scanSamples } = window.LEAFLET_DATA;
  const main = document.getElementById('main');
  const announcer = document.getElementById('announcer');
  const speechBar = document.getElementById('speechBar');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================ */
  /* Utilities                                                        */
  /* ================================================================ */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => products.find((p) => p.id === id);
  const fullName = (p) => `${p.name} ${p.strength} ${p.form.toLowerCase()}`;
  const currentVersion = (p) => (p.currentUnavailable ? null : p.versions.find((v) => v.status === 'current') || null);
  const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const announce = (msg) => { announcer.textContent = ''; setTimeout(() => { announcer.textContent = msg; }, 50); };
  const qs = (obj) => { const u = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') u.set(k, v); }); const s = u.toString(); return s ? '?' + s : ''; };

  function setTitle(t) { document.title = `${t} · Leaflet Service (prototype)`; }

  function statusBadge(p, v) {
    if (!v) return '<span class="badge badge-unverified"><span class="dot"></span>Current version not verified</span>';
    if (v.status === 'current') return '<span class="badge badge-current"><span class="dot"></span>Current approved version</span>';
    if (p.currentUnavailable) return '<span class="badge badge-unverified"><span class="dot"></span>Not verified as current</span>';
    return '<span class="badge badge-previous"><span class="dot"></span>Previous version · not current</span>';
  }

  function packSvg(p, cls = 'pack') {
    const label = esc(p.name.split(' ')[0]);
    return `<svg class="${cls}" viewBox="0 0 136 98" role="img" aria-label="Illustration of the ${esc(p.name)} ${esc(p.strength)} pack (demo)">
      <rect x="2" y="2" width="132" height="94" rx="8" fill="#fff" stroke="#9aa6a0" stroke-width="2"/>
      <rect x="2" y="2" width="132" height="26" rx="8" fill="${p.color}"/>
      <rect x="2" y="20" width="132" height="8" fill="${p.color}"/>
      <text x="12" y="20" font-size="14" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">${label}</text>
      <text x="12" y="52" font-size="17" font-weight="800" fill="#17211D" font-family="system-ui,sans-serif">${esc(p.strength)}</text>
      <text x="12" y="70" font-size="10" fill="#4F5D57" font-family="system-ui,sans-serif">${esc(p.form.length > 16 ? p.form.slice(0, 15) + '…' : p.form)}</text>
      <text x="12" y="86" font-size="9" fill="#4F5D57" font-family="ui-monospace,monospace">PZN ${esc(p.pzn)}</text>
      <rect x="96" y="66" width="30" height="22" fill="#fff" stroke="#17211D"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${99 + i * 3.3}" y="69" width="${i % 3 ? 1.2 : 2}" height="16" fill="#17211D"/>`).join('')}
    </svg>`;
  }

  /* ================================================================ */
  /* Preferences (on this device only) and demo simulation toggles     */
  /* ================================================================ */
  const PREF_KEY = 'leaflet-reading-prefs';
  const DEMO_KEY = 'leaflet-demo-sim';
  const defaultPrefs = { size: '1', contrast: 'standard', spacing: 'normal' };
  let prefs = Object.assign({}, defaultPrefs, safeJSON(localStorage.getItem(PREF_KEY)));
  let demo = Object.assign({ printFail: false, speakFail: false }, safeJSON(sessionStorage.getItem(DEMO_KEY)));
  function safeJSON(s) { try { return JSON.parse(s) || {}; } catch (e) { return {}; } }

  function applyPrefs() {
    const root = document.documentElement;
    root.style.setProperty('--scale', prefs.size);
    root.dataset.contrast = prefs.contrast;
    root.dataset.spacing = prefs.spacing;
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }
  function saveDemo() { sessionStorage.setItem(DEMO_KEY, JSON.stringify(demo)); }

  const dlg = document.getElementById('readingDialog');
  const form = document.getElementById('readingForm');
  function syncForm() {
    ['size', 'contrast', 'spacing'].forEach((n) => {
      const el = form.querySelector(`input[name="${n}"][value="${prefs[n]}"]`);
      if (el) el.checked = true;
    });
  }
  function openReading() { syncForm(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  document.getElementById('readingBtn').addEventListener('click', openReading);
  form.addEventListener('change', (e) => {
    if (!e.target.name) return;
    // Keep the reader's place: remember the first paragraph in view, restore it after re-layout.
    const anchor = [...main.querySelectorAll('.leaflet-body .blk')].find((el) => el.getBoundingClientRect().top > 70);
    prefs[e.target.name] = e.target.value;
    applyPrefs();
    if (anchor) anchor.scrollIntoView({ block: 'start' });
    announce('Reading setting changed. The leaflet text is unchanged.');
  });
  document.getElementById('readingReset').addEventListener('click', () => { prefs = Object.assign({}, defaultPrefs); applyPrefs(); syncForm(); announce('Reading settings reset.'); });
  applyPrefs();

  /* ================================================================ */
  /* Search (local only — the query never leaves the device)          */
  /* ================================================================ */
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/[^a-z0-9.]+/g, ' ').trim();
  }
  function searchCatalogue(q) {
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 5 && digits.length === q.replace(/\s/g, '').length) {
      return products.filter((p) => p.pzn.startsWith(digits));
    }
    const tokens = norm(q).split(' ').filter(Boolean);
    if (!tokens.length) return [];
    return products.filter((p) => {
      const hay = norm(`${p.name} ${p.strength} ${p.form} ${p.substance}`).split(' ');
      return tokens.every((t) => hay.some((w) => w.startsWith(t)));
    }).sort((a, b) => a.name.localeCompare(b.name) || parseFloat(a.strength) - parseFloat(b.strength) || a.form.localeCompare(b.form));
  }
  function lev(a, b) {
    const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function suggestNames(q) {
    const first = norm(q).split(' ')[0] || '';
    if (first.length < 3) return [];
    const names = [...new Set(products.map((p) => p.name.split(' ')[0]))];
    return names.filter((n) => { const d = lev(first, n.toLowerCase()); return d > 0 && d <= (first.length > 5 ? 2 : 1); });
  }

  /* ================================================================ */
  /* Shared fragments                                                 */
  /* ================================================================ */
  function stepper(active) {
    const steps = ['Find', 'Check', 'Read'];
    return `<ol class="sr-only">${steps.map((s, i) => `<li>${s}${i + 1 === active ? ' (current step)' : ''}</li>`).join('')}</ol>
      <p class="eyebrow" aria-hidden="true">Step ${active} of 3 · ${steps[active - 1]}</p>`;
  }

  function searchBox(value = '', autofocus = false) {
    return `<form class="search-form" data-form="search" role="search">
      <label for="q">Medicine name or PZN</label>
      <div class="search-row">
        <input id="q" name="q" type="search" value="${esc(value)}" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search" ${autofocus ? 'autofocus' : ''} aria-describedby="qhint">
        <button class="btn btn-primary" type="submit">Search</button>
      </div>
      <p class="hint" id="qhint">Type the name as it is printed on the pack or blister, e.g. “Novadol”. No personal details needed.</p>
    </form>`;
  }

  function pharmacistNotice(p, v, text) {
    const link = `#/help${qs({ p: p && p.id, v: v && v.id })}`;
    return `<div class="notice notice-info"><span class="ico" aria-hidden="true">i</span><div>
      <p>${text || 'Questions about this medicine? This service shows the official leaflet only and cannot give advice.'} <a href="${link}">Ask a pharmacist</a>.</p></div></div>`;
  }

  function unitKey(type, text) { return `${type === 'li' ? 'li' : type}|${text}`; }

  function renderBody(p, v, opts = {}) {
    const prefix = opts.prefix || '';
    const diff = opts.diff || null; // Set of unit keys present in the OTHER version, per section
    const mark = (secId, type, text) => (diff && !diff.get(secId).has(unitKey(type, text)) ? ' diff' : '');
    return `<div class="leaflet-body" lang="en">
      ${v.sections.map((s) => `
        <section id="${prefix}${s.id}" data-sec="${s.id}" aria-labelledby="${prefix}${s.id}-h">
          <h2 id="${prefix}${s.id}-h" class="blk" tabindex="-1"><span class="num">${s.num}</span> ${esc(s.title)}</h2>
          ${opts.tools ? `<div class="section-tools no-print">
              <button type="button" class="btn btn-ghost" data-action="speak-section" data-sec="${s.id}"><span aria-hidden="true">🔊</span> Read section ${s.num} aloud</button>
              <a class="btn btn-ghost toc-mobile-only" href="#${prefix}toc" data-action="to-toc">↑ All sections</a>
            </div>` : ''}
          ${s.blocks.map(([t, c]) => {
            if (t === 'h') return `<h3 class="blk${mark(s.id, t, c)}">${esc(c)}</h3>`;
            if (t === 'p') return `<p class="blk${mark(s.id, t, c)}">${esc(c)}</p>`;
            if (t === 'box') return `<p class="box blk${mark(s.id, t, c)}">${esc(c)}</p>`;
            if (t === 'ul') return `<ul>${c.map((li) => `<li class="blk${mark(s.id, 'li', li)}">${esc(li)}</li>`).join('')}</ul>`;
            return '';
          }).join('')}
        </section>`).join('')}
    </div>`;
  }

  function unitsBySection(v) {
    const m = new Map();
    v.sections.forEach((s) => {
      const set = new Set();
      s.blocks.forEach(([t, c]) => { if (t === 'ul') c.forEach((li) => set.add(unitKey('li', li))); else set.add(unitKey(t, c)); });
      m.set(s.id, set);
    });
    return m;
  }

  /* ================================================================ */
  /* Views                                                            */
  /* ================================================================ */
  const views = {};

  views.home = () => {
    setTitle('Find your medicine leaflet');
    return `
    <div class="hero">
      <div class="stack">
        ${stepper(1)}
        <h1 tabindex="-1">Find the official leaflet for your medicine</h1>
        <p class="lead">Search by the name on the pack, or scan the pack code. You’ll check the exact product before the leaflet opens.</p>
        <div class="card">
          ${searchBox('', false)}
          <div class="or">or</div>
          <a class="btn btn-secondary scan-btn" href="#/scan">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>
            Scan pack code <span class="sim-tag">Simulated</span>
          </a>
          <p class="hint">Scanning is simulated in this prototype. No camera is used.</p>
        </div>
      </div>
      <aside class="stack" aria-label="How it works">
        <div class="card">
          <h2>How it works</h2>
          <ol class="steps-mini">
            <li><span><strong>Find</strong> your medicine by name, PZN or pack code.</span></li>
            <li><span><strong>Check</strong> the name, strength and form match your pack.</span></li>
            <li><span><strong>Read</strong> the complete approved leaflet. Jump to “How to use”, make text larger or have it read aloud.</span></li>
          </ol>
        </div>
        <div class="notice notice-info"><span class="ico" aria-hidden="true">i</span><div>
          <p><strong>Information only.</strong> This service shows official leaflets word for word. It does not give medical advice. For questions about your medicine, <a href="#/help">ask a pharmacist</a>.</p></div></div>
        <div class="notice notice-ok"><span class="ico" aria-hidden="true">✓</span><div>
          <p><strong>Private by design.</strong> We only need the medicine name or code. No account, no health details, no search history.</p></div></div>
        <p class="small muted">Recording a demo? Open the <a href="#/demo">demo guide</a>.</p>
      </aside>
    </div>`;
  };

  views.scan = () => {
    setTitle('Scan pack code (simulated)');
    return `
    <a class="back-link" href="#/">← Back</a>
    ${stepper(1)}
    <h1 tabindex="-1">Scan the code on your pack</h1>
    <div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div>
      <p><strong>Simulation.</strong> Real scanning is not part of this prototype and the camera is not used. Choose a demo pack below to simulate what the scanner would read.</p></div></div>
    <div class="stack" style="margin-top:1rem">
      <div class="viewfinder" id="viewfinder" aria-hidden="true">
        <span class="sim-flag sim-tag">Simulated camera</span>
        <div class="frame"><span id="vfText">Point at the code on the pack</span></div>
      </div>
      <div id="scanResult" aria-live="polite"></div>
      <h2 id="samplesH">Simulate scanning a demo pack</h2>
      <div class="sample-list" role="group" aria-labelledby="samplesH">
        ${scanSamples.map((s) => {
          const p = byId(s.result[0]);
          return `<button type="button" class="sample" data-action="scan" data-sample="${s.id}">
            ${p ? packSvg(p) : '<svg class="pack" viewBox="0 0 136 98" aria-hidden="true"><rect x="2" y="2" width="132" height="94" rx="8" fill="#ddd" stroke="#9aa6a0" stroke-width="2"/><path d="M10 30 L60 70 L90 40 L126 80" stroke="#999" stroke-width="3" fill="none"/></svg>'}
            <span><span class="s-label">${esc(s.label)}</span><br><span class="s-hint">${esc(s.hint)}</span></span>
          </button>`;
        }).join('')}
      </div>
      <p>Can’t scan? <a href="#/" data-action="focus-search">Type the medicine name instead</a>.</p>
    </div>`;
  };

  function doScan(sampleId) {
    const s = scanSamples.find((x) => x.id === sampleId);
    const vf = document.getElementById('vfText');
    const res = document.getElementById('scanResult');
    document.getElementById('viewfinder').insertAdjacentHTML('beforeend', '<div class="laser"></div>');
    vf.textContent = 'Reading code… (simulated)';
    res.innerHTML = '';
    main.querySelectorAll('.sample').forEach((b) => { b.disabled = true; });
    setTimeout(() => {
      if (!s || !s.result.length) {
        const laser = main.querySelector('.laser'); if (laser) laser.remove();
        vf.textContent = 'Code not recognised';
        main.querySelectorAll('.sample').forEach((b) => { b.disabled = false; });
        res.innerHTML = `<div class="notice notice-bad"><span class="ico" aria-hidden="true">✕</span><div>
          <h2>The code couldn’t be read</h2>
          <p>No medicine was identified, so no leaflet is shown. The code may be damaged or covered.</p>
          <div class="btn-row"><a class="btn btn-primary" href="#/" data-action="focus-search">Type the name instead</a>
          <button type="button" class="btn btn-secondary" data-action="scan-retry">Try scanning again</button>
          <a class="btn btn-quiet" href="#/help">Ask a pharmacist</a></div></div></div>`;
        res.querySelector('h2').setAttribute('tabindex', '-1'); res.querySelector('h2').focus();
        return;
      }
      if (s.result.length === 1) location.hash = `#/product/${s.result[0]}?via=scan`;
      else location.hash = `#/search?scan=${s.id}`;
    }, reduceMotion ? 300 : 1300);
  }

  views.search = (params) => {
    const q = (params.get('q') || '').trim();
    const scanId = params.get('scan');
    let results, heading, intro = '';
    if (scanId) {
      const s = scanSamples.find((x) => x.id === scanId);
      results = s ? s.result.map(byId) : [];
      heading = 'More than one product matches this code';
      intro = `<div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div>
        <p><strong>We can’t tell which product this is from the code alone.</strong> Compare the name, strength and form with your pack before you choose. If you’re not sure, <a href="#/help">ask a pharmacist</a>.</p></div></div>`;
    } else {
      results = q.length >= 2 ? searchCatalogue(q) : [];
      heading = q ? `Results for “${esc(q)}”` : 'Search';
    }
    setTitle(scanId ? 'Check scanned product' : (q ? `Results for ${q}` : 'Search'));
    const count = results.length;
    setTimeout(() => announce(scanId ? `${count} products match the scanned code. Check which one is yours.` : (count ? `${count} result${count > 1 ? 's' : ''} found` : `No verified match for ${q}`)), 100);

    let body;
    if (!scanId && q.length < 2) {
      body = `<p>Type at least 2 letters of the medicine name, or the 8-digit PZN.</p>`;
    } else if (!count) {
      const sug = suggestNames(q);
      body = `<div class="notice notice-bad"><span class="ico" aria-hidden="true">✕</span><div>
        <h2>No verified match for “${esc(q)}”</h2>
        <p>We couldn’t find this medicine in the official leaflet catalogue, so no leaflet is shown.</p>
        ${sug.length ? `<p>Did you mean ${sug.map((n) => `<a href="#/search?q=${encodeURIComponent(n)}">${esc(n)}</a>`).join(' or ')}? Only choose it if it matches your pack exactly.</p>` : ''}
        </div></div>
        <div class="card stack" style="margin-top:1rem">
          <h2>What you can do</h2>
          <ul>
            <li>Check the spelling against the pack or blister. Search only needs the name, e.g. “Cardiovex”.</li>
            <li>Search the 8-digit PZN printed on the pack.</li>
            <li><a href="#/scan">Scan the pack code</a> instead.</li>
            <li>Read the paper leaflet in the pack, or <a href="#/help">ask a pharmacist</a> for the official leaflet.</li>
          </ul>
        </div>`;
    } else {
      body = `${intro}
      <p class="muted" style="margin-top:.75rem">${count} product${count > 1 ? 's' : ''}. Choose the one that matches your pack: name, strength and form.</p>
      <ul class="results">
        ${results.map((p) => {
          const v = currentVersion(p);
          return `<li><a class="result" href="#/product/${p.id}${qs({ q, scan: scanId })}">
            ${packSvg(p)}
            <span>
              <span class="result-name">${esc(p.name)} <span class="result-strength">${esc(p.strength)}</span></span>
              <span class="facts"><span><b>${esc(p.form)}</b></span><span>${esc(p.pack)}</span><span>PZN ${esc(p.pzn)}</span></span>
              ${statusBadge(p, v)}
            </span>
            <span class="chev" aria-hidden="true">›</span>
          </a></li>`;
        }).join('')}
      </ul>`;
    }

    return `
    <a class="back-link" href="#/">← New search</a>
    ${stepper(1)}
    <h1 tabindex="-1">${heading}</h1>
    ${scanId ? '' : `<div class="card" style="margin-bottom:1rem">${searchBox(q)}</div>`}
    ${body}`;
  };

  views.product = (params, id) => {
    const p = byId(id);
    if (!p) return views.notFound();
    const v = currentVersion(p);
    const q = params.get('q'); const scanId = params.get('scan'); const via = params.get('via');
    setTitle(`Check: ${fullName(p)}`);
    const back = scanId ? `#/search?scan=${scanId}` : (q ? `#/search?q=${encodeURIComponent(q)}` : (via === 'scan' ? '#/scan' : '#/'));
    const appearance = (() => {
      const src = v || p.versions[0];
      const s6 = src.sections.find((s) => s.id === 's6');
      const i = s6.blocks.findIndex(([t, c]) => t === 'h' && /looks like/.test(c));
      return i >= 0 ? { text: s6.blocks[i + 1][1], src } : null;
    })();

    return `
    <a class="back-link" href="${back}">← Back to ${scanId || q ? 'results' : (via === 'scan' ? 'scan' : 'search')}</a>
    ${stepper(2)}
    <h1 tabindex="-1">Is this the medicine on your pack?</h1>
    ${via === 'scan' ? `<div class="notice notice-ok" style="margin-bottom:1rem"><span class="ico" aria-hidden="true">✓</span><div><p>Code read (simulated). Please still check the details below against your pack.</p></div></div>` : ''}
    ${scanId ? `<div class="notice notice-warn" style="margin-bottom:1rem"><span class="ico" aria-hidden="true">!</span><div><p>The scanned code matched more than one product. Check the <strong>form</strong> carefully: “${esc(p.form)}”.</p></div></div>` : ''}
    <div class="confirm-grid">
      <div class="card stack">
        <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
          ${packSvg(p, 'pack pack-lg')}
          <div>
            <p class="result-name" style="font-size:1.4rem;margin:0">${esc(p.name)} ${esc(p.strength)}</p>
            <p style="margin:0;font-weight:600">${esc(p.form)}</p>
          </div>
        </div>
        <table class="id-table">
          <caption class="sr-only">Product details</caption>
          <tr><th scope="row">Product name</th><td>${esc(p.name)}</td></tr>
          <tr><th scope="row">Strength</th><td>${esc(p.strength)}</td></tr>
          <tr><th scope="row">Form</th><td>${esc(p.form)}</td></tr>
          <tr><th scope="row">Pack</th><td>${esc(p.pack)}</td></tr>
          <tr><th scope="row">Active substance</th><td>${esc(p.substance)}</td></tr>
          <tr><th scope="row">PZN</th><td>${esc(p.pzn)} <span class="badge badge-demo">demo code</span></td></tr>
          <tr><th scope="row">Leaflet</th><td>${statusBadge(p, v)}<br>${v ? `Revised ${esc(v.revised)} · published ${fmtDate(v.published)}` : 'No verified current version'}</td></tr>
        </table>
      </div>
      <div class="stack">
        <div class="card stack">
          <h2>Check against your pack</h2>
          <ul class="check-list">
            <li>Name: <strong>${esc(p.name)}</strong></li>
            <li>Strength: <strong>${esc(p.strength)}</strong></li>
            <li>Form: <strong>${esc(p.form)}</strong></li>
            <li>PZN on the pack: <strong>${esc(p.pzn)}</strong></li>
          </ul>
          ${appearance ? `<div><p style="margin:0;font-weight:600">What the leaflet says it looks like:</p>
            <blockquote class="quote">${esc(appearance.text)}</blockquote>
            <p class="quote-src">Quoted word for word from section 6 of the ${appearance.src.status === 'current' ? 'current' : 'available'} leaflet (revised ${esc(appearance.src.revised)}).</p></div>` : ''}
        </div>
        ${v ? `
        <div class="btn-stack" id="confirmActions">
          <a class="btn btn-primary" href="#/leaflet/${p.id}">Yes, it matches — open leaflet</a>
          <button type="button" class="btn btn-secondary" data-action="no-match">No, it doesn’t match</button>
          <a class="btn btn-quiet" href="#/help${qs({ p: p.id })}">I’m not sure</a>
        </div>` : `
        <div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div>
          <h2>We can’t verify the current leaflet for this product</h2>
          <p>The current approved leaflet is not available in this service right now. We won’t show an older leaflet as if it were current.</p>
          <p>Use the paper leaflet in your pack, or ask a pharmacist for the current official leaflet.</p>
          <div class="btn-row"><a class="btn btn-primary" href="#/help${qs({ p: p.id })}">Ask a pharmacist</a>
          <a class="btn btn-secondary" href="#/leaflet/${p.id}?v=${p.versions[0].id}">View ${esc(p.versions[0].revised)} version (may be out of date)</a></div>
        </div></div>`}
        <div id="noMatch" aria-live="polite"></div>
      </div>
    </div>`;
  };

  views.leaflet = (params, id) => {
    const p = byId(id);
    if (!p) return views.notFound();
    const cur = currentVersion(p);
    const v = p.versions.find((x) => x.id === params.get('v')) || cur;
    if (!v) { location.replace(`#/product/${p.id}`); return ''; }
    const isCurrent = v.status === 'current' && !p.currentUnavailable;
    const how = v.sections.find((s) => s.howTo);
    setTitle(`Leaflet: ${fullName(p)}`);
    const vq = isCurrent ? '' : `?v=${v.id}`;

    const warn = isCurrent ? '' : (p.currentUnavailable
      ? `<div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div><p><strong>Not verified as current.</strong> This leaflet was revised in ${esc(v.revised)}. We couldn’t verify whether a newer approved version exists. Check the paper leaflet in your pack or <a href="#/help${qs({ p: p.id, v: v.id })}">ask a pharmacist</a>.</p></div></div>`
      : `<div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div><p><strong>This is a previous version (revised ${esc(v.revised)}). It is not the current leaflet.</strong> <a href="#/leaflet/${p.id}">Open the current version (${esc(cur.revised)})</a> · <a href="#/compare/${p.id}${qs({ a: cur.id, b: v.id })}">Compare both</a></p></div></div>`);

    return `
    <div class="no-print"><a class="back-link" href="#/product/${p.id}">← Product details</a></div>
    <div class="leaflet-head">
      ${stepper(3)}
      <h1 tabindex="-1">${esc(p.name)} ${esc(p.strength)} <span style="font-weight:600">${esc(p.form.toLowerCase())}</span></h1>
      <div class="version-line">${statusBadge(p, v)}<span>Revised ${esc(v.revised)}</span><span>Published ${fmtDate(v.published)}</span><span>PZN ${esc(p.pzn)}</span></div>
      ${warn}
      <div class="toolbar no-print" role="toolbar" aria-label="Leaflet tools">
        <button type="button" class="btn btn-ghost" data-action="open-reading"><span aria-hidden="true" class="aa">Aa</span> Text size &amp; contrast</button>
        <button type="button" class="btn btn-ghost" data-action="speak-all"><span aria-hidden="true">🔊</span> Read aloud</button>
        <a class="btn btn-ghost" href="#/print/${p.id}${vq}"><span aria-hidden="true">🖨</span> Print leaflet</a>
        <a class="btn btn-ghost" href="#/versions/${p.id}"><span aria-hidden="true">🕘</span> Versions (${p.versions.length})</a>
        <a class="btn btn-ghost" href="#/help${qs({ p: p.id, v: v.id })}"><span aria-hidden="true">💬</span> Ask a pharmacist</a>
      </div>
      ${how ? `<div class="how-jump no-print"><span><strong>Looking for how to use it?</strong> It’s in section ${how.num}: “${esc(how.title)}”.</span>
        <a class="btn btn-primary" href="#/leaflet/${p.id}${qs({ v: isCurrent ? '' : v.id, s: how.id })}" data-jump="${how.id}">Go to “How to use”</a></div>` : ''}
    </div>
    <div class="leaflet-layout">
      <nav class="toc no-print" id="toc" aria-label="Leaflet sections">
        <details class="toc-disclosure" ${window.innerWidth >= 960 ? 'open' : ''}>
          <summary>Sections in this leaflet (${v.sections.length})</summary>
          <h2 class="toc-mobile-only sr-only">Sections</h2>
          <ol>
            ${v.sections.map((s) => `<li><a href="#/leaflet/${p.id}${qs({ v: isCurrent ? '' : v.id, s: s.id })}" data-jump="${s.id}"><span class="n">${s.num}</span><span>${esc(s.title)}${s.howTo ? '<br><span class="tag-how">How to use</span>' : ''}</span></a></li>`).join('')}
          </ol>
        </details>
      </nav>
      <article class="leaflet-doc" aria-label="Complete leaflet text">
        <div class="doc-banner"><span class="badge badge-demo">DEMO CONTENT</span><span>Fictional leaflet written for this prototype — shown complete and unchanged, as stored.</span></div>
        <p class="eyebrow" style="margin-bottom:.1rem">Package leaflet: information for the user</p>
        <p class="leaflet-title">${esc(p.name)} ${esc(p.strength)} ${esc(p.form.toLowerCase())}</p>
        <p class="muted small">${esc(p.substance)}</p>
        ${renderBody(p, v, { tools: true })}
        <p class="doc-end">End of leaflet · ${esc(fullName(p))} · revised ${esc(v.revised)}. All ${v.sections.length} sections are shown above.</p>
      </article>
    </div>`;
  };

  views.versions = (params, id) => {
    const p = byId(id);
    if (!p) return views.notFound();
    const cur = currentVersion(p);
    setTitle(`Versions: ${fullName(p)}`);
    return `
    <a class="back-link" href="#/leaflet/${p.id}${cur ? '' : `?v=${p.versions[0].id}`}">← Back to leaflet</a>
    <p class="eyebrow">${esc(fullName(p))} · PZN ${esc(p.pzn)}</p>
    <h1 tabindex="-1">Leaflet versions</h1>
    <p>Manufacturers update leaflets and each update is approved before it is published. Previous versions are kept so you can look back. Only the current version is up to date.</p>
    ${p.currentUnavailable ? `<div class="notice notice-warn" style="margin-bottom:1rem"><span class="ico" aria-hidden="true">!</span><div><p><strong>The current approved version could not be verified.</strong> None of the versions below is shown as current.</p></div></div>` : ''}
    <ul class="version-list">
      ${p.versions.map((v) => `<li class="card version-item">
        <div>
          <p class="v-title" style="margin:0">Revised ${esc(v.revised)} ${statusBadge(p, v)}</p>
          <dl><div><dt>Published in service:</dt><dd>${fmtDate(v.published)}</dd></div><div><dt>Version:</dt><dd>${esc(v.id)}</dd></div><div><dt>Sections:</dt><dd>${v.sections.length} (complete)</dd></div></dl>
        </div>
        <div class="btn-row">
          <a class="btn ${v.status === 'current' ? 'btn-primary' : 'btn-secondary'}" href="#/leaflet/${p.id}${v.status === 'current' ? '' : `?v=${v.id}`}">Open this version</a>
          ${cur && v.id !== cur.id ? `<a class="btn btn-secondary" href="#/compare/${p.id}${qs({ a: cur.id, b: v.id })}">Compare with current</a>` : ''}
        </div>
      </li>`).join('')}
    </ul>
    ${p.versions.length < 2 ? '<p class="muted" style="margin-top:1rem">Only one version is available for this product, so there is nothing to compare.</p>' : ''}
    <div style="margin-top:1rem">${pharmacistNotice(p, null, 'Noticed something different about your medicine, such as its colour? This service can’t tell you what a change means.')}</div>`;
  };

  views.compare = (params, id) => {
    const p = byId(id);
    if (!p || p.versions.length < 2) return views.notFound();
    const cur = currentVersion(p) || p.versions[0];
    const a = p.versions.find((x) => x.id === params.get('a')) || cur;
    const b = p.versions.find((x) => x.id === params.get('b')) || p.versions.find((x) => x.id !== a.id);
    const sec = params.get('s') || 's1';
    const showDiff = params.get('diff') === '1';
    setTitle(`Compare versions: ${fullName(p)}`);
    const ua = unitsBySection(a), ub = unitsBySection(b);
    const differing = a.sections.filter((s) => {
      const x = ua.get(s.id), y = ub.get(s.id);
      return x.size !== y.size || [...x].some((k) => !y.has(k));
    });
    const opt = (sel) => p.versions.map((v) => `<option value="${v.id}" ${v.id === sel.id ? 'selected' : ''}>Revised ${esc(v.revised)}${v.status === 'current' && !p.currentUnavailable ? ' (current)' : ' (previous)'}</option>`).join('');
    const pane = (v, key, other) => `
      <section class="pane" id="pane-${key}" aria-labelledby="pane-${key}-h" ${key === 'b' ? 'hidden' : ''}>
        <div class="pane-head">
          <h2 class="v-title" id="pane-${key}-h" style="font-size:1.05rem;margin:0">Revised ${esc(v.revised)} ${statusBadge(p, v)}</h2>
          <span class="small muted">Published ${fmtDate(v.published)} · complete text</span>
        </div>
        <div class="pane-scroll" id="scroll-${key}">
          ${renderBody(p, v, { prefix: key + '-', diff: showDiff ? other : null })}
          <p class="doc-end">End of leaflet revised ${esc(v.revised)}.</p>
        </div>
      </section>`;

    return `
    <a class="back-link" href="#/versions/${p.id}">← All versions</a>
    <p class="eyebrow">${esc(fullName(p))} · PZN ${esc(p.pzn)}</p>
    <h1 tabindex="-1">Compare leaflet versions</h1>
    <p>Both leaflets are shown in full, exactly as approved. Choose a section to show it in both versions.</p>
    <div class="notice notice-info" style="margin-bottom:1rem"><span class="ico" aria-hidden="true">i</span><div>
      <p><strong>This service can’t tell you what a change means</strong>, for example why a capsule now looks different, or whether it affects you. A pharmacist can check your pack with you. <a href="#/help${qs({ p: p.id, v: a.id })}">Ask a pharmacist</a></p></div></div>
    <div class="card compare-controls no-print">
      <div class="field"><label for="selA">Version 1</label><select id="selA" data-action="cmp-a">${opt(a)}</select></div>
      <div class="field"><label for="selB">Version 2</label><select id="selB" data-action="cmp-b">${opt(b)}</select></div>
      <div class="field"><label for="selSec">Go to section in both</label><select id="selSec" data-action="cmp-sec">
        ${a.sections.map((s) => `<option value="${s.id}" ${s.id === sec ? 'selected' : ''}>${s.num}. ${esc(s.title)}${s.howTo ? ' (How to use)' : ''}</option>`).join('')}
      </select></div>
      <label class="check" style="grid-column:1/-1"><input type="checkbox" data-action="cmp-diff" ${showDiff ? 'checked' : ''}>
        <span>Mark paragraphs whose wording is not identical <span class="legend-diff">like this</span>. This is an exact text match only, it does not explain or interpret anything.</span></label>
      ${showDiff ? `<p class="small" style="grid-column:1/-1;margin:0" aria-live="polite">${a.id === b.id ? 'Same version selected twice.' : (differing.length ? `Wording is not identical in section${differing.length > 1 ? 's' : ''}: ${differing.map((s) => `<button type="button" class="btn btn-quiet" data-action="cmp-go" data-sec="${s.id}">${s.num}</button>`).join(' ')}` : 'The wording is identical in all sections.')}</p>` : ''}
    </div>
    <div class="pane-tabs no-print" role="group" aria-label="Show version" style="margin:1rem 0 .5rem">
      <button type="button" class="btn btn-ghost" aria-pressed="true" data-action="cmp-tab" data-pane="a">Version 1<br><span class="small">${esc(a.revised)}</span></button>
      <button type="button" class="btn btn-ghost" aria-pressed="false" data-action="cmp-tab" data-pane="b">Version 2<br><span class="small">${esc(b.revised)}</span></button>
    </div>
    <div class="panes" style="margin-top:1rem">
      ${pane(a, 'a', ub)}
      ${pane(b, 'b', ua)}
    </div>`;
  };

  views.print = (params, id) => {
    const p = byId(id);
    if (!p) return views.notFound();
    const cur = currentVersion(p);
    const v = p.versions.find((x) => x.id === params.get('v')) || cur;
    if (!v) { location.replace(`#/product/${p.id}`); return ''; }
    const isCurrent = v.status === 'current' && !p.currentUnavailable;
    setTitle(`Print: ${fullName(p)}`);
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
    <div class="print-root">
      <div class="stack">
        <a class="back-link" href="#/leaflet/${p.id}${isCurrent ? '' : `?v=${v.id}`}">← Back to leaflet</a>
        <h1 tabindex="-1">Print the complete leaflet</h1>
        <div class="confirm-grid">
          <div class="card stack">
            <h2>You are about to print</h2>
            <table class="id-table">
              <tr><th scope="row">Medicine</th><td>${esc(fullName(p))}</td></tr>
              <tr><th scope="row">PZN</th><td>${esc(p.pzn)}</td></tr>
              <tr><th scope="row">Leaflet version</th><td>${statusBadge(p, v)}<br>Revised ${esc(v.revised)} · published ${fmtDate(v.published)}</td></tr>
              <tr><th scope="row">Content</th><td>Complete leaflet, all ${v.sections.length} sections, unchanged</td></tr>
            </table>
            ${isCurrent ? '' : `<div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div><p>This is not the current leaflet. The printout will say so on every page.</p></div></div>`}
          </div>
          <div class="card stack" id="printPanel">
            <label class="check"><input type="checkbox" id="printCheck"><span>I have checked that the name, strength and form match the pack this printout is for.</span></label>
            <div class="btn-stack">
              <button type="button" class="btn btn-primary" data-action="do-print" id="printBtn" disabled>Print complete leaflet</button>
              <a class="btn btn-secondary" href="#/leaflet/${p.id}${isCurrent ? '' : `?v=${v.id}`}">Cancel</a>
            </div>
            <p class="small muted">Tip: to keep a copy instead, choose “Save as PDF” in the print window. Prefer listening? Use <strong>Read aloud</strong> on the leaflet page.</p>
            <div id="printStatus" aria-live="polite"></div>
          </div>
        </div>
        <h2>Preview</h2>
      </div>
      <div class="paper-scroll print-target" tabindex="0" aria-label="Print preview">
        <article class="paper print-doc">
          <div class="print-head">
            <div class="ph-title">${esc(fullName(p))}</div>
            <div class="ph-meta">PZN ${esc(p.pzn)} · Leaflet revised ${esc(v.revised)} · ${isCurrent ? 'Current approved version' : 'NOT the current version'} · Printed ${today}</div>
            <div class="ph-meta"><strong>DEMO CONTENT — fictional medicine and leaflet created for a prototype. Not medical information.</strong></div>
          </div>
          <p style="font-weight:700;margin-bottom:.25rem">Package leaflet: information for the user</p>
          ${renderBody(p, v, { prefix: 'pr-' })}
          <p class="doc-end">End of leaflet · ${esc(fullName(p))} · revised ${esc(v.revised)} · ${v.sections.length} of ${v.sections.length} sections printed.</p>
        </article>
      </div>
    </div>`;
  };

  function printFailed(reason) {
    const st = document.getElementById('printStatus');
    st.innerHTML = `<div class="notice notice-bad"><span class="ico" aria-hidden="true">✕</span><div>
      <h2 tabindex="-1">The leaflet didn’t print</h2>
      <p>${esc(reason)}</p>
      <ul>
        <li>Check the printer is switched on, has paper and is connected, then try again.</li>
        <li>Choose “Save as PDF” in the print window and print it later.</li>
        <li>Read it on screen with larger text, or use <strong>Read aloud</strong>.</li>
        <li>Ask the pharmacy for a printed copy of the official leaflet. <a href="#/help">Ask a pharmacist</a></li>
      </ul>
      <button type="button" class="btn btn-secondary" data-action="do-print">Try again</button></div></div>`;
    st.querySelector('h2').focus();
  }

  function doPrint() {
    const st = document.getElementById('printStatus');
    if (demo.printFail) { printFailed('The printer could not be reached. (Simulated failure — turn it off in the demo guide.)'); return; }
    st.innerHTML = '';
    try {
      window.print();
    } catch (e) { printFailed('The print window could not be opened on this device.'); return; }
    // Browsers can't report whether paper actually came out, so we ask.
    st.innerHTML = `<div class="notice notice-info"><span class="ico" aria-hidden="true">?</span><div>
      <p><strong>Did the complete leaflet print correctly?</strong></p>
      <div class="btn-row"><button type="button" class="btn btn-primary" data-action="print-ok">Yes</button>
      <button type="button" class="btn btn-secondary" data-action="print-bad">No, there was a problem</button></div></div></div>`;
  }

  views.help = (params) => {
    const p = byId(params.get('p'));
    const v = p && (p.versions.find((x) => x.id === params.get('v')) || currentVersion(p));
    setTitle('Ask a pharmacist');
    return `
    <a class="back-link" href="javascript:history.back()" data-action="back">← Back</a>
    <h1 tabindex="-1">Ask a pharmacist</h1>
    <p class="lead">This service shows official leaflets only. It can’t answer questions about symptoms, about changes to how a medicine looks, or about whether to start, stop or change a medicine. A pharmacist can.</p>
    <div class="help-grid">
      ${p ? `<div class="card stack">
        <h2>Show this to the pharmacist</h2>
        <div class="show-card">
          <p class="result-name" style="margin:0">${esc(fullName(p))}</p>
          <p style="margin:0">PZN ${esc(p.pzn)}</p>
          <p style="margin:0">Leaflet: ${v ? `revised ${esc(v.revised)} · ${v.status === 'current' && !p.currentUnavailable ? 'current version' : 'not verified as current'}` : 'current version not available'}</p>
        </div>
        <p class="small muted">Only the medicine and leaflet details. No personal or health information is included or stored.</p>
      </div>` : ''}
      <div class="card stack">
        <h2>Your pharmacy</h2>
        <p>Call or visit the pharmacy that gave you the medicine. Bring the pack, so the pharmacist can see exactly what you have.</p>
      </div>
      <div class="card stack">
        <h2>Outside opening hours</h2>
        <p>Pharmacies take turns to provide an emergency service at night, at weekends and on public holidays. The notice on any pharmacy door shows the nearest one on duty.</p>
      </div>
      <div class="card stack">
        <h2>Official sources</h2>
        <p>The paper leaflet in the pack is an approved source. Your pharmacy can also print the current official leaflet for you.</p>
      </div>
    </div>
    <div class="notice notice-bad" style="margin-top:1rem"><span class="ico" aria-hidden="true">!</span><div>
      <p><strong>In an emergency, call 112.</strong></p></div></div>`;
  };

  views.about = () => {
    setTitle('Content and privacy rules');
    return `
    <a class="back-link" href="#/">← Home</a>
    <h1 tabindex="-1">Content and privacy rules</h1>
    <div class="stack" style="max-width:46rem">
      <div class="card stack">
        <h2>What you see</h2>
        <ul>
          <li>Only the officially approved leaflet text, complete and word for word.</li>
          <li>No summaries, shortened versions, translations, generated answers or interpretations.</li>
          <li>Text size, contrast, spacing and read-aloud change how the text is presented, never what it says.</li>
          <li>If the medicine or its current leaflet can’t be verified, we say so and don’t present it as current.</li>
          <li>Questions about symptoms, changes to a medicine, or whether to take it go to a pharmacist.</li>
        </ul>
      </div>
      <div class="card stack">
        <h2>Your privacy</h2>
        <ul>
          <li>Search needs only the medicine name or code. No account, profile, diagnosis or medication history.</li>
          <li>In this prototype, search runs entirely in your browser. Nothing is sent to any server or third party.</li>
          <li>No search history is kept. Only your reading settings (text size, contrast, spacing) are saved, on this device.</li>
          <li>Read-aloud only uses voices built into your device. If none is available, it tells you instead of using an online voice.</li>
        </ul>
      </div>
      <div class="card stack">
        <h2>About this prototype</h2>
        <p>Every medicine, code, company and leaflet text here is fictional demo content written for a university prototype. It is not real medical information.</p>
      </div>
    </div>`;
  };

  views.demo = () => {
    setTitle('Demo guide');
    return `
    <a class="back-link" href="#/">← Home</a>
    <h1 tabindex="-1">Demo guide</h1>
    <p>Shortcuts and scripts for recording the use cases. Everything uses fictional demo data.</p>
    <div class="uc-grid">
      <div class="card uc">
        <h2>UC1 · Patient with a new medicine</h2>
        <ol>
          <li>Home → <strong>Scan pack code</strong> → “Novadol 400 mg pack”, <em>or</em> search <span class="kbd">novadol</span>.</li>
          <li>Results show 4 Novadol products. Pick <strong>400 mg film-coated tablets</strong>.</li>
          <li>Check details → <strong>Yes, it matches — open leaflet</strong>.</li>
          <li><strong>Go to “How to use”</strong> (section 3).</li>
          <li><strong>Text size &amp; contrast</strong> → Larger + High contrast.</li>
          <li>Optional: <strong>Read section 3 aloud</strong>.</li>
        </ol>
        <a class="btn btn-primary" href="#/">Start UC1</a>
      </div>
      <div class="card uc">
        <h2>UC2 · Caregiver helping a parent</h2>
        <ol>
          <li>Search the name read from the blister: <span class="kbd">cardiovex</span> (try the typo <span class="kbd">cardivex</span> first to show “did you mean”).</li>
          <li>Open <strong>Cardiovex 5 mg tablets</strong>, check details and the version date.</li>
          <li>Open the leaflet → <strong>Read aloud</strong> (pause, next, stop).</li>
          <li><strong>Print leaflet</strong> → tick the check → <strong>Print complete leaflet</strong>.</li>
        </ol>
        <a class="btn btn-primary" href="#/search?q=cardivex">Start UC2</a>
      </div>
      <div class="card uc">
        <h2>UC3 · Checking a change (capsule colour)</h2>
        <ol>
          <li>Search <span class="kbd">gastrozol</span> → <strong>20 mg capsules</strong>. The check screen quotes the current appearance.</li>
          <li>Open leaflet → <strong>Versions (3)</strong> → current and previous with dates.</li>
          <li><strong>Compare with current</strong> → section <strong>6. Contents of the pack</strong> → both full texts at that section.</li>
          <li>Optional: tick “Mark paragraphs whose wording is not identical”.</li>
          <li><strong>Ask a pharmacist</strong>. No interpretation of the colour change is given.</li>
        </ol>
        <a class="btn btn-primary" href="#/search?q=gastrozol">Start UC3</a>
      </div>
    </div>

    <div class="card stack" style="margin-top:1rem">
      <h2>Recovery states</h2>
      <ul>
        <li>No match: <a href="#/search?q=zoltrix">search “zoltrix”</a></li>
        <li>Uncertain product (code matches 2 products): <a href="#/search?scan=pack-lumetra">Lumetra scan</a></li>
        <li>Scan can’t read code: <a href="#/scan">Scan</a> → “Creased pack, code unreadable”</li>
        <li>Current leaflet unavailable: <a href="#/product/restalin-10">Restalin 10 mg</a></li>
        <li>Product doesn’t match pack: on any check screen, “No, it doesn’t match”</li>
        <li>Print and read-aloud failure: use the switches below</li>
      </ul>
      <fieldset class="stack">
        <legend>Simulated failures (this browser tab only)</legend>
        <label class="check"><input type="checkbox" data-action="sim" data-key="printFail" ${demo.printFail ? 'checked' : ''}><span>Simulate a printer failure</span></label>
        <label class="check"><input type="checkbox" data-action="sim" data-key="speakFail" ${demo.speakFail ? 'checked' : ''}><span>Simulate read-aloud being unavailable</span></label>
      </fieldset>
      <div class="btn-row"><button type="button" class="btn btn-secondary" data-action="reset-demo">Reset demo (settings and switches)</button></div>
    </div>`;
  };

  views.notFound = () => {
    setTitle('Not found');
    return `<h1 tabindex="-1">Page not found</h1><p>This page or product isn’t available. <a href="#/">Start a new search</a> or <a href="#/help">ask a pharmacist</a>.</p>`;
  };

  /* ================================================================ */
  /* Read aloud — speaks the displayed leaflet text exactly            */
  /* ================================================================ */
  const speech = { items: [], i: 0, playing: false, voice: null, rate: 0.95 };

  function getLocalVoice() {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve(null);
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        const local = voices.filter((v) => v.localService && /^en/i.test(v.lang));
        return local.find((v) => /en-GB/i.test(v.lang)) || local[0] || null;
      };
      const now = pick();
      if (now || window.speechSynthesis.getVoices().length) return resolve(now);
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(pick()); } };
      window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
      setTimeout(finish, 1500);
    });
  }

  function speechError(msg) {
    stopSpeech(true);
    speechBar.hidden = false;
    speechBar.innerHTML = `<div class="wrap" style="padding-block:.75rem"><div class="notice notice-bad"><span class="ico" aria-hidden="true">✕</span><div>
      <h2 tabindex="-1">Read aloud isn’t working on this device</h2>
      <p>${esc(msg)} The leaflet is still complete on screen.</p>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" data-action="open-reading">Make text larger</button>
        <a class="btn btn-secondary" href="${location.hash.split('?')[0].replace('#/leaflet', '#/print')}">Print the leaflet</a>
        <a class="btn btn-quiet" href="#/help">Ask a pharmacist</a>
        <button type="button" class="btn btn-quiet" data-action="speech-close">Close</button>
      </div>
      <p class="small" style="margin-top:.5rem">You can also use your device’s screen reader (VoiceOver on Apple devices, TalkBack on Android, Narrator on Windows).</p>
    </div></div></div>`;
    speechBar.querySelector('h2').focus();
  }

  async function startSpeech(secId) {
    if (demo.speakFail) { speechError('Speech output is not available. (Simulated failure — turn it off in the demo guide.)'); return; }
    const voice = await getLocalVoice();
    if (!voice) { speechError('No built-in voice was found. To keep the text private, we don’t use online voices.'); return; }
    speech.voice = voice;
    const all = [...main.querySelectorAll('.leaflet-doc .leaflet-body .blk')];
    let start = 0;
    if (secId) { const h = document.getElementById(`${secId}-h`); start = Math.max(0, all.indexOf(h)); }
    speech.items = all;
    speech.endAt = secId ? all.findIndex((el, idx) => idx > start && el.tagName === 'H2') : -1;
    if (speech.endAt === -1) speech.endAt = all.length;
    speech.i = start;
    speech.start = start;
    speech.scope = secId ? `Section ${secId.slice(1)}` : 'Whole leaflet';
    speech.playing = true;
    window.speechSynthesis.cancel();
    speakCurrent();
  }

  function speakCurrent() {
    main.querySelectorAll('.reading').forEach((e) => e.classList.remove('reading'));
    if (speech.i >= speech.endAt) { stopSpeech(); announce('Finished reading.'); return; }
    const el = speech.items[speech.i];
    el.classList.add('reading');
    el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    const text = el.textContent.replace(/\s+/g, ' ').trim(); // exactly the displayed wording
    const u = new SpeechSynthesisUtterance(text);
    u.voice = speech.voice; u.lang = speech.voice.lang; u.rate = speech.rate;
    const myIndex = speech.i;
    u.onend = () => { if (speech.playing && speech.i === myIndex) { speech.i++; speakCurrent(); } };
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') speechError(`The voice stopped unexpectedly (${e.error}).`); };
    window.speechSynthesis.speak(u);
    renderSpeechBar();
  }

  function renderSpeechBar() {
    const total = speech.endAt - speech.start; const pos = speech.i - speech.start + 1;
    const sec = speech.items[speech.i] && speech.items[speech.i].closest('section');
    const secTitle = sec ? sec.querySelector('h2').textContent.trim() : '';
    speechBar.hidden = false;
    speechBar.innerHTML = `<div class="wrap speech-inner">
      <div class="speech-status"><strong>${speech.playing ? 'Reading aloud' : 'Paused'} · ${esc(speech.scope)}</strong>
        <span class="small muted">${esc(secTitle)} · part ${pos} of ${total}. Reads the leaflet text exactly as shown, using your device’s voice.</span></div>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost icon-btn" data-action="sp-prev" aria-label="Previous paragraph">⏮</button>
        <button type="button" class="btn btn-primary" data-action="sp-toggle">${speech.playing ? '⏸ Pause' : '▶ Resume'}</button>
        <button type="button" class="btn btn-ghost icon-btn" data-action="sp-next" aria-label="Next paragraph">⏭</button>
        <label class="small" style="display:flex;gap:.35rem;align-items:center">Speed
          <select data-action="sp-rate" style="font:inherit;padding:.3rem;border-radius:8px">
            ${[[0.75, 'Slow'], [0.95, 'Normal'], [1.15, 'Fast']].map(([r, l]) => `<option value="${r}" ${r === speech.rate ? 'selected' : ''}>${l}</option>`).join('')}
          </select></label>
        <button type="button" class="btn btn-secondary" data-action="sp-stop">■ Stop</button>
      </div></div>`;
  }

  function stopSpeech(silent) {
    speech.playing = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    main.querySelectorAll('.reading').forEach((e) => e.classList.remove('reading'));
    if (!silent) { speechBar.hidden = true; speechBar.innerHTML = ''; }
  }

  /* ================================================================ */
  /* Navigation helpers                                               */
  /* ================================================================ */
  function jumpTo(secId, opts = {}) {
    const sec = document.getElementById(secId);
    if (!sec) return;
    const d = main.querySelector('details.toc-disclosure');
    if (d && window.innerWidth < 960) d.open = false;
    sec.scrollIntoView({ behavior: opts.instant || reduceMotion ? 'auto' : 'smooth', block: 'start' });
    sec.classList.remove('flash'); void sec.offsetWidth; sec.classList.add('flash');
    const h = document.getElementById(`${secId}-h`);
    if (h) h.focus({ preventScroll: true });
    const [path, q] = location.hash.split('?');
    const u = new URLSearchParams(q || ''); u.set('s', secId);
    history.replaceState(null, '', `${path}?${u}`);
    setCurrentToc(secId);
    announce(`Showing section: ${h ? h.textContent.trim() : secId}`);
  }
  function setCurrentToc(secId) {
    main.querySelectorAll('.toc a[data-jump]').forEach((a) => a.setAttribute('aria-current', a.dataset.jump === secId ? 'true' : 'false'));
  }

  function compareGo(secId, smooth) {
    ['a', 'b'].forEach((k) => {
      const box = document.getElementById(`scroll-${k}`);
      const el = document.getElementById(`${k}-${secId}`);
      if (!box || !el) return;
      if (window.innerWidth >= 960) {
        const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 8;
        box.scrollTo({ top, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
      }
    });
    if (window.innerWidth >= 960 && smooth) {
      const panes = main.querySelector('.panes');
      if (panes && panes.getBoundingClientRect().top > window.innerHeight * 0.5) panes.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (window.innerWidth < 960) {
      const visible = main.querySelector('.pane:not([hidden])');
      const el = visible && visible.querySelector(`[data-sec="${secId}"]`);
      if (el) el.scrollIntoView({ block: 'start', behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    }
    ['a', 'b'].forEach((k) => { const el = document.getElementById(`${k}-${secId}`); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } });
    const sel = document.getElementById('selSec'); if (sel) sel.value = secId;
    updateCompareURL({ s: secId });
  }
  function updateCompareURL(changes, rerender) {
    const [path, q] = location.hash.split('?');
    const u = new URLSearchParams(q || '');
    Object.entries(changes).forEach(([k, v]) => (v ? u.set(k, v) : u.delete(k)));
    if (rerender) location.hash = `${path}?${u}`;
    else history.replaceState(null, '', `${path}?${u}`);
  }

  /* ================================================================ */
  /* Event delegation                                                 */
  /* ================================================================ */
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form="search"]');
    if (!f) return;
    e.preventDefault();
    const q = f.q.value.trim();
    if (!q) { f.q.focus(); announce('Type a medicine name first.'); return; }
    location.hash = `#/search?q=${encodeURIComponent(q)}`;
  });

  document.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump]');
    if (jump) { e.preventDefault(); jumpTo(jump.dataset.jump); return; }
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const a = t.dataset.action;
    switch (a) {
      case 'open-reading': e.preventDefault(); openReading(); break;
      case 'scan': doScan(t.dataset.sample); break;
      case 'scan-retry': render(); break;
      case 'focus-search':
        if (location.hash === '#/' || location.hash === '') { e.preventDefault(); const i = document.getElementById('q'); if (i) i.focus(); }
        else { sessionStorage.setItem('focusSearch', '1'); }
        break;
      case 'no-match': {
        const box = document.getElementById('noMatch');
        box.innerHTML = `<div class="notice notice-warn"><span class="ico" aria-hidden="true">!</span><div>
          <h2 tabindex="-1">Don’t use this leaflet</h2>
          <p>A leaflet for a different product, strength or form may not apply to your medicine.</p>
          <div class="btn-row"><a class="btn btn-primary" href="${main.querySelector('.back-link').getAttribute('href')}">Back to results</a>
          <a class="btn btn-secondary" href="#/">Search again</a><a class="btn btn-secondary" href="#/scan">Scan instead</a>
          <a class="btn btn-quiet" href="#/help">Ask a pharmacist</a></div></div></div>`;
        box.querySelector('h2').focus();
        break;
      }
      case 'to-toc': {
        e.preventDefault();
        const toc = document.getElementById('toc'); const d = toc.querySelector('details'); d.open = true;
        toc.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        const first = toc.querySelector('a'); if (first) first.focus({ preventScroll: true });
        break;
      }
      case 'speak-all': startSpeech(null); break;
      case 'speak-section': startSpeech(t.dataset.sec); break;
      case 'sp-toggle':
        if (speech.playing) { speech.playing = false; window.speechSynthesis.cancel(); renderSpeechBar(); }
        else { speech.playing = true; speakCurrent(); }
        break;
      case 'sp-next': speech.i = Math.min(speech.i + 1, speech.endAt - 1); window.speechSynthesis.cancel(); speech.playing = true; speakCurrent(); break;
      case 'sp-prev': speech.i = Math.max(speech.i - 1, speech.start); window.speechSynthesis.cancel(); speech.playing = true; speakCurrent(); break;
      case 'sp-stop': stopSpeech(); announce('Stopped reading.'); break;
      case 'speech-close': stopSpeech(); break;
      case 'do-print': doPrint(); break;
      case 'print-ok': document.getElementById('printStatus').innerHTML = '<div class="notice notice-ok"><span class="ico" aria-hidden="true">✓</span><div><p>Good. Keep the printout with the medicine.</p></div></div>'; break;
      case 'print-bad': printFailed('Something went wrong while printing.'); break;
      case 'cmp-tab': {
        main.querySelectorAll('[data-action="cmp-tab"]').forEach((b) => b.setAttribute('aria-pressed', b === t ? 'true' : 'false'));
        document.getElementById('pane-a').hidden = t.dataset.pane !== 'a';
        document.getElementById('pane-b').hidden = t.dataset.pane !== 'b';
        compareGo(document.getElementById('selSec').value, false);
        break;
      }
      case 'cmp-go': compareGo(t.dataset.sec, true); break;
      case 'reset-demo':
        demo = { printFail: false, speakFail: false }; saveDemo();
        prefs = Object.assign({}, defaultPrefs); applyPrefs(); render(); announce('Demo reset.');
        break;
      case 'back': e.preventDefault(); if (history.length > 1) history.back(); else location.hash = '#/'; break;
      default: break;
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'printCheck') { document.getElementById('printBtn').disabled = !t.checked; return; }
    const a = t.dataset && t.dataset.action;
    if (!a) return;
    if (a === 'sim') { demo[t.dataset.key] = t.checked; saveDemo(); announce(`${t.dataset.key === 'printFail' ? 'Printer' : 'Read-aloud'} failure simulation ${t.checked ? 'on' : 'off'}.`); }
    if (a === 'sp-rate') { speech.rate = parseFloat(t.value); if (speech.playing) { window.speechSynthesis.cancel(); speakCurrent(); } }
    if (a === 'cmp-sec') compareGo(t.value, true);
    if (a === 'cmp-a') updateCompareURL({ a: t.value }, true);
    if (a === 'cmp-b') updateCompareURL({ b: t.value }, true);
    if (a === 'cmp-diff') updateCompareURL({ diff: t.checked ? '1' : '' }, true);
  });

  /* ================================================================ */
  /* Router                                                           */
  /* ================================================================ */
  let tocObserver = null;
  function render() {
    stopSpeech();
    const hash = location.hash || '#/';
    const [path, query] = hash.slice(1).split('?');
    const params = new URLSearchParams(query || '');
    const seg = path.split('/').filter(Boolean);
    const routes = {
      '': () => views.home(), search: () => views.search(params), scan: () => views.scan(),
      product: () => views.product(params, seg[1]), leaflet: () => views.leaflet(params, seg[1]),
      versions: () => views.versions(params, seg[1]), compare: () => views.compare(params, seg[1]),
      print: () => views.print(params, seg[1]), help: () => views.help(params),
      about: () => views.about(), demo: () => views.demo(),
    };
    const fn = routes[seg[0] || ''] || views.notFound;
    const html = fn();
    if (!html) return;
    main.innerHTML = html;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }

    const sec = params.get('s');
    if (seg[0] === 'leaflet') {
      tocObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setCurrentToc(en.target.id); });
      }, { rootMargin: '-20% 0px -70% 0px' });
      main.querySelectorAll('.leaflet-doc section').forEach((s) => tocObserver.observe(s));
    }
    if (seg[0] === 'leaflet' && sec) {
      requestAnimationFrame(() => jumpTo(sec, { instant: true }));
    } else if (seg[0] === 'compare') {
      window.scrollTo(0, 0);
      const h1 = main.querySelector('h1'); if (h1) h1.focus({ preventScroll: true });
      requestAnimationFrame(() => compareGo(params.get('s') || 's1', false));
    } else {
      window.scrollTo(0, 0);
      const focusSearch = sessionStorage.getItem('focusSearch');
      const target = focusSearch && document.getElementById('q') ? document.getElementById('q') : main.querySelector('h1');
      sessionStorage.removeItem('focusSearch');
      if (target) target.focus({ preventScroll: true });
    }
    if (seg[0] === 'help') { const b = main.querySelector('[data-action="back"]'); if (b) b.setAttribute('href', '#/'); }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('beforeunload', () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); });
  render();
})();
