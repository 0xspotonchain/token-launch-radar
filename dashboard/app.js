// Token Launch Radar — the page: one static dashboard, no network, no fetch.
// Everything renders from window.RADAR, written by main.ts from the same sealed snapshot
// as board.json. Sort, filter, search, the detail view and the model sandbox all run here.
//
// Deep links (read on load, kept in step as the page changes):
//   #detail=<slug>   open one protocol's detail view
//   #cat=<category>  filter by category
//   #chain=<chain>   filter by chain
//   #q=<text>        search text
//   #sort=<key>      rank | tvl | growth | age | name
//   #watch=1         watchlist only
//   #live            the Live tokens view
(function () {
  'use strict';
  var R = window.RADAR;
  if (!R) {
    document.body.insertAdjacentHTML('beforeend', '<p style="padding:20px">No radar data: run main.ts first so data.js exists next to this page.</p>');
    return;
  }
  var MODEL = R.model;
  var WATCH = new Set(R.watchlist || []);

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var money = function (n) {
    if (n == null || !isFinite(n)) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  };
  var moneyFull = function (n) {
    if (n == null || !isFinite(n)) return '—';
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  var pct = function (n) {
    if (n == null || !isFinite(n)) return '—';
    var v = (Math.abs(n) < 10 ? n.toFixed(2) : n.toFixed(1));
    return (n > 0 ? '+' : n < 0 ? '−' : '') + v.replace('-', '') + '%';
  };
  var ageText = function (n) { return n == null ? '—' : n + 'd'; };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

  // ---- the model, as the page re-scores it (same figures, same constants as lib/model.ts) ----
  function score(row, baseMultiple, growthWeight) {
    var growthPct = clamp(row.change_7d == null ? 0 : row.change_7d, MODEL.growth_floor, MODEL.growth_cap);
    var growthMult = 1 + (growthPct / 100) * growthWeight;
    var age = row.age_days == null ? MODEL.unknown_age_days : row.age_days;
    var maturityMult = MODEL.maturity_floor + (Math.min(Math.max(age, 0), MODEL.maturity_days) / MODEL.maturity_days) * MODEL.maturity_range;
    var base = row.tvl_usd * baseMultiple;
    var implied = Math.max(1, Math.round(base * growthMult * maturityMult));
    return { base: base, growthPct: growthPct, growthMult: growthMult, maturityMult: maturityMult, implied: implied };
  }

  // ---- farm plans, generated in the page from the row's own figures (same plan as board.json) ----
  function capitalFor(row) {
    if (row.tvl_usd >= 5000000000) return 500;
    if (row.tvl_usd >= 1000000000) return 250;
    if (row.tvl_usd >= 100000000) return 100;
    return 50;
  }
  function holdDaysFor(row) {
    var age = row.age_days;
    if (age == null) return 60;
    if (age < 180) return 90;
    if (age < 365) return 60;
    return 45;
  }
  function actionFor(row, capital, chain) {
    var c = (row.category || '').toLowerCase();
    var name = row.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Lend $' + capital + ' of USDC through ' + name + ' on ' + chain + ' and leave the deposit working.';
    if (c.indexOf('dex') >= 0) return 'Add $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and leave the position open.';
    if (c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('farm') >= 0) return 'Deposit $' + capital + " into " + name + "'s main vault on " + chain + ' and keep the shares.';
    if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC through ' + name + ' to ' + chain + ' and use the funds inside its app.';
    if (c.indexOf('stak') >= 0) return 'Stake $' + capital + ' through ' + name + ' and hold the receipt token.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('basis trad') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedged position.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' on ' + name + ' and take one position in an open market.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the vault shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
    if (c.indexOf('rwa') >= 0) return 'Mint $' + capital + " of " + name + "'s yield asset on " + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy active.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function farmSteps(row) {
    var chain = row.chains && row.chains.length > 0 ? row.chains[0] : 'its main chain';
    var capital = capitalFor(row);
    var hold = holdDaysFor(row);
    var gas = capital >= 250 ? 8 : 4;
    var steps = [
      ['Open a fresh wallet for this farm only, fund it with just the capital below, and keep its seed phrase on paper offline.', 'about $2 of gas to fund and set up', '5 minutes'],
      [actionFor(row, capital, chain), '$' + capital + ' of capital and about $' + gas + ' of gas', '15 minutes to set up'],
      ['Come back once a week and do one real action: a deposit, a swap, a borrow or a vote.', 'about $2 of gas a week', '10 minutes a week'],
      ['Keep the position open for at least ' + hold + ' days so the activity lands in more than one snapshot.', 'the $' + capital + ' stays in the position', hold + ' days'],
      ['Check the protocol\u2019s own site and official channels before any claim, and never pay a fee or share a seed phrase to claim.', 'no fee to check, and never pay to claim', '10 minutes'],
      ['Record the wallet, the dates and every transaction hash in a farm log so you can repeat or unwind the position.', 'nothing but the log', '5 minutes'],
    ];
    return steps.map(function (s) { return s[0] + ' Cost: ' + s[1] + '. Time: ' + s[2] + '.'; });
  }

  // ---- state ----
  var state = {
    view: 'board',
    q: '', cat: '', chain: '', sort: 'rank', watch: false,
    detail: null,
    sandbox: null, // { base, growth } or null for the published model
  };

  function parseHash() {
    var h = window.location.hash.replace(/^#/, '');
    var parts = h ? h.split('&') : [];
    var kv = {};
    parts.forEach(function (p) {
      var i = p.indexOf('=');
      if (i > 0) kv[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1));
      else if (p) kv[p] = '1';
    });
    state.view = kv.live ? 'live' : 'board';
    state.q = kv.q || '';
    state.cat = kv.cat || '';
    state.chain = kv.chain || '';
    state.sort = kv.sort || 'rank';
    state.watch = kv.watch === '1';
    state.detail = kv.detail || null;
  }
  function writeHash() {
    var p = [];
    if (state.view === 'live') p.push('live');
    if (state.q) p.push('q=' + encodeURIComponent(state.q));
    if (state.cat) p.push('cat=' + encodeURIComponent(state.cat));
    if (state.chain) p.push('chain=' + encodeURIComponent(state.chain));
    if (state.sort !== 'rank') p.push('sort=' + state.sort);
    if (state.watch) p.push('watch=1');
    if (state.detail) p.push('detail=' + encodeURIComponent(state.detail));
    var h = p.length ? '#' + p.join('&') : '';
    if (window.location.hash !== h) window.history.replaceState(null, '', h || window.location.pathname);
  }

  // ---- header ----
  $('asof').textContent = R.as_of;
  $('stats').innerHTML = [
    ['Board rows', R.board_size],
    ['Watchlist', R.watchlist_size],
    ['Early finds', R.early_size],
    ['Live set aside', R.live_size],
  ].map(function (s) { return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('');

  // ---- filter options from the data ----
  function fillOptions() {
    var cats = {}, chains = {};
    R.rows.concat(R.live).forEach(function (r) {
      if (r.category) cats[r.category] = 1;
      (r.chains || []).forEach(function (c) { chains[c] = 1; });
    });
    var catSel = $('cat'), chainSel = $('chain');
    Object.keys(cats).sort().forEach(function (c) {
      var o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
    });
    Object.keys(chains).sort().forEach(function (c) {
      var o = document.createElement('option'); o.value = c; o.textContent = c; chainSel.appendChild(o);
    });
  }

  // ---- the ranked rows, under the published model or the sandbox ----
  function scoredRows() {
    var sb = state.sandbox;
    var rows = R.rows.map(function (r) {
      if (!sb) return { row: r, implied: r.implied_value_usd };
      return { row: r, implied: score(r, sb.base, sb.growth).implied };
    });
    rows.sort(function (a, b) {
      return b.implied - a.implied || (a.row.slug < b.row.slug ? -1 : a.row.slug > b.row.slug ? 1 : 0);
    });
    rows.forEach(function (s, i) { s.rank = i + 1; });
    return rows;
  }

  function matches(r, q) {
    if (state.watch && !WATCH.has(r.slug)) return false;
    if (state.cat && r.category !== state.cat) return false;
    if (state.chain && !(r.chains || []).includes(state.chain)) return false;
    if (q) {
      var hay = (r.name + ' ' + r.slug).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }

  function sortRows(list) {
    var key = state.sort;
    var by = {
      rank: function (a, b) { return a.rank - b.rank; },
      tvl: function (a, b) { return b.row.tvl_usd - a.row.tvl_usd; },
      growth: function (a, b) { return (b.row.change_7d == null ? -1e9 : b.row.change_7d) - (a.row.change_7d == null ? -1e9 : a.row.change_7d); },
      age: function (a, b) { return (b.row.age_days == null ? -1 : b.row.age_days) - (a.row.age_days == null ? -1 : a.row.age_days); },
      name: function (a, b) { return a.row.name.localeCompare(b.row.name); },
    }[key] || function (a, b) { return a.rank - b.rank; };
    return list.slice().sort(by);
  }

  var BOARD_HEAD = '<tr><th scope="col" class="num">Rank</th><th scope="col">Protocol</th><th scope="col">Category</th><th scope="col">Chains</th><th scope="col" class="num">TVL</th><th scope="col" class="num">7d</th><th scope="col" class="num">Age</th><th scope="col" class="num">Implied value</th></tr>';
  var LIVE_HEAD = '<tr><th scope="col" class="num">#</th><th scope="col">Protocol</th><th scope="col">Category</th><th scope="col">Chains</th><th scope="col" class="num">TVL</th><th scope="col" class="num">7d</th><th scope="col" class="num">Market cap</th></tr>';

  function render() {
    $('q').value = state.q;
    $('cat').value = state.cat;
    $('chain').value = state.chain;
    $('sort').value = state.sort;
    $('watch').checked = state.watch;
    $('tab-board').classList.toggle('active', state.view === 'board');
    $('tab-live').classList.toggle('active', state.view === 'live');
    $('tab-board').setAttribute('aria-pressed', state.view === 'board' ? 'true' : 'false');
    $('tab-live').setAttribute('aria-pressed', state.view === 'live' ? 'true' : 'false');
    $('watch').disabled = state.view === 'live';

    var thead = $('table').querySelector('thead');
    var tbody = $('rows');
    var q = state.q.trim().toLowerCase();

    if (state.view === 'live') {
      thead.innerHTML = LIVE_HEAD;
      var live = R.live
        .filter(function (r) { return matches(r, q); })
        .map(function (r, i) { return { row: r, rank: i + 1, implied: r.mcap_usd || 0 }; });
      var key = state.sort;
      live.sort(function (a, b) {
        if (key === 'tvl') return b.row.tvl_usd - a.row.tvl_usd;
        if (key === 'growth') return (b.row.change_7d == null ? -1e9 : b.row.change_7d) - (a.row.change_7d == null ? -1e9 : a.row.change_7d);
        if (key === 'name') return a.row.name.localeCompare(b.row.name);
        return (b.row.mcap_usd || 0) - (a.row.mcap_usd || 0);
      });
      tbody.innerHTML = live.map(function (s) {
        var r = s.row;
        var g = r.change_7d;
        return '<tr data-slug="' + esc(r.slug) + '" tabindex="0"><td class="num">' + (live.indexOf(s) + 1) + '</td>' +
          '<td>' + esc(r.name) + '</td><td>' + esc(r.category || '—') + '</td><td>' + esc((r.chains || []).slice(0, 3).join(', ') || '—') + '</td>' +
          '<td class="num">' + money(r.tvl_usd) + '</td><td class="num ' + (g == null ? '' : g >= 0 ? 'pos' : 'neg') + '">' + pct(g) + '</td>' +
          '<td class="num">' + money(r.mcap_usd) + '</td></tr>';
      }).join('');
      $('count').textContent = live.length + ' of ' + R.live_size + ' live-token protocols (market cap is the market\u2019s own value, never a model\u2019s).';
      $('detail').hidden = true;
    } else {
      thead.innerHTML = BOARD_HEAD;
      var list = sortRows(scoredRows().filter(function (s) { return matches(s.row, q); }));
      tbody.innerHTML = list.map(function (s) {
        var r = s.row;
        var g = r.change_7d;
        var badge = WATCH.has(r.slug) ? '<span class="badge">Watchlist</span>' : '';
        return '<tr data-slug="' + esc(r.slug) + '" tabindex="0" class="' + (state.detail === r.slug ? 'selected' : '') + '"><td class="num">' + s.rank + '</td>' +
          '<td>' + esc(r.name) + badge + '</td><td>' + esc(r.category || '—') + '</td><td>' + esc((r.chains || []).slice(0, 3).join(', ') || '—') + '</td>' +
          '<td class="num">' + money(r.tvl_usd) + '</td><td class="num ' + (g == null ? '' : g >= 0 ? 'pos' : 'neg') + '">' + pct(g) + '</td>' +
          '<td class="num">' + ageText(r.age_days) + '</td><td class="num">' + money(s.implied) + '</td></tr>';
      }).join('');
      $('count').textContent = list.length + ' of ' + R.board_size + ' ranked protocols' + (state.sandbox ? ' — sandbox re-ranking active' : '') + '.';
      renderDetail();
    }
    writeHash();
  }

  function renderDetail() {
    var panel = $('detail');
    var row = null;
    if (state.detail) {
      for (var i = 0; i < R.rows.length; i++) if (R.rows[i].slug === state.detail) { row = R.rows[i]; break; }
    }
    if (!row) { panel.hidden = true; return; }
    var sb = state.sandbox;
    var s = score(row, sb ? sb.base : MODEL.base_multiple, sb ? sb.growth : MODEL.growth_weight);
    var rank = sb ? scoredRows().filter(function (x) { return x.row.slug === row.slug; })[0].rank : row.rank;
    $('detail-name').textContent = '#' + rank + '  ' + row.name + (WATCH.has(row.slug) ? '  ·  Watchlist' : '');
    $('detail-facts').innerHTML = [
      ['TVL', moneyFull(row.tvl_usd)],
      ['7-day change', pct(row.change_7d)],
      ['Age (no token)', row.age_days == null ? 'Unknown' : row.age_days + ' days'],
      ['Category', row.category || '—'],
      ['Chains', (row.chains || []).join(', ') || '—'],
      ['Token status', 'Records no token'],
    ].map(function (f) { return '<div class="fact"><b>' + esc(f[1]) + '</b><span>' + f[0] + '</span></div>'; }).join('');
    var ageShown = row.age_days == null ? MODEL.unknown_age_days + ' (unknown, counted as ' + MODEL.unknown_age_days + ')' : String(row.age_days);
    $('detail-model').innerHTML =
      '<div>base&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= TVL &times; ' + (sb ? sb.base : MODEL.base_multiple) + ' = ' + moneyFull(s.base) + '</div>' +
      '<div>growth&nbsp;&nbsp;&nbsp;= 1 + (' + s.growthPct + '% &times; ' + (sb ? sb.growth : MODEL.growth_weight) + ') = &times;' + s.growthMult.toFixed(4) + '</div>' +
      '<div>maturity = 0.65 + 0.35 &times; min(' + ageShown + 'd, 730d) / 730 = &times;' + s.maturityMult.toFixed(4) + '</div>' +
      '<div class="total">implied&nbsp;&nbsp;= ' + moneyFull(s.implied) + (sb ? ' (sandbox constants)' : ' (published model ' + esc(R.model_version) + ')') + '</div>';
    $('detail-steps').innerHTML = farmSteps(row).map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('');
    panel.hidden = false;
  }

  function openDetail(slug, scroll) {
    state.detail = slug;
    state.view = 'board';
    render();
    if (scroll) $('detail').scrollIntoView({ block: 'start' });
  }

  // ---- events ----
  $('q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  $('cat').addEventListener('change', function (e) { state.cat = e.target.value; render(); });
  $('chain').addEventListener('change', function (e) { state.chain = e.target.value; render(); });
  $('sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  $('watch').addEventListener('change', function (e) { state.watch = e.target.checked; render(); });
  $('tab-board').addEventListener('click', function () { state.view = 'board'; state.detail = null; render(); });
  $('tab-live').addEventListener('click', function () { state.view = 'live'; state.detail = null; render(); });
  $('detail-close').addEventListener('click', function () { state.detail = null; render(); });
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (tr && state.view === 'board') openDetail(tr.getAttribute('data-slug'), true);
  });
  $('rows').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var tr = e.target.closest('tr[data-slug]');
    if (tr && state.view === 'board') openDetail(tr.getAttribute('data-slug'), true);
  });
  window.addEventListener('hashchange', function () { parseHash(); syncSandboxInputs(); render(); });

  // ---- sandbox ----
  function syncSandboxInputs() {
    var sb = state.sandbox;
    $('base').value = sb ? sb.base : MODEL.base_multiple;
    $('growth').value = sb ? sb.growth : MODEL.growth_weight;
    $('base-out').textContent = String($('base').value);
    $('growth-out').textContent = String($('growth').value);
    $('sandbox-note').textContent = sb
      ? 'Sandbox active: base multiple ' + sb.base + ', growth weight ' + sb.growth + ' — the board above is re-ranked from the same snapshot figures.'
      : 'Published model: base multiple ' + MODEL.base_multiple + ', growth weight ' + MODEL.growth_weight + '. Move a slider to re-rank the board.';
  }
  function sandboxChanged() {
    var base = parseFloat($('base').value);
    var growth = parseFloat($('growth').value);
    $('base-out').textContent = String(base);
    $('growth-out').textContent = String(growth);
    state.sandbox = (base === MODEL.base_multiple && growth === MODEL.growth_weight) ? null : { base: base, growth: growth };
    syncSandboxInputs();
    render();
  }
  $('base').addEventListener('input', sandboxChanged);
  $('growth').addEventListener('input', sandboxChanged);
  $('sandbox-reset').addEventListener('click', function () {
    state.sandbox = null;
    syncSandboxInputs();
    render();
  });

  // ---- boot ----
  fillOptions();
  parseHash();
  syncSandboxInputs();
  render();
  // A deep-linked detail view scrolls into place after load: scrolling during the first
  // script run is undone by the browser's own fragment handling at load time.
  function scrollToDetail() {
    if (state.detail && !$('detail').hidden) $('detail').scrollIntoView({ block: 'start' });
  }
  if (document.readyState === 'complete') setTimeout(scrollToDetail, 50);
  else window.addEventListener('load', function () { setTimeout(scrollToDetail, 50); });
})();
