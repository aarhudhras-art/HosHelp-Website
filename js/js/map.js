const $ = id => document.getElementById(id);
let MAP, DEPTS, from, to, path = [], steps = [], k = 0;

const N = id => MAP.nodes.find(n => n.id === id);
const nameOf = id => {
  const d = DEPTS.find(x => x.id === id);
  return d ? (d.name[currentLang] || d.name.en) : t('n_' + id);
};
const label = id => (N(id).junction ? t('n_junction') : nameOf(id));
const dist = (a, b) => Math.hypot(N(a).x - N(b).x, N(a).y - N(b).y);
const neighbours = id => MAP.edges
  .filter(e => e[0] === id || e[1] === id)
  .map(e => (e[0] === id ? e[1] : e[0]));

// Shortest route (Dijkstra)
function shortest(a, b) {
  const d = {}, prev = {}, todo = new Set(MAP.nodes.map(n => n.id));
  MAP.nodes.forEach(n => { d[n.id] = Infinity; });
  d[a] = 0;
  while (todo.size) {
    let u = null;
    todo.forEach(id => { if (u === null || d[id] < d[u]) u = id; });
    if (d[u] === Infinity) break;
    todo.delete(u);
    if (u === b) break;
    neighbours(u).forEach(v => {
      const alt = d[u] + dist(u, v);
      if (alt < d[v]) { d[v] = alt; prev[v] = u; }
    });
  }
  const p = [];
  for (let c = b; c; c = prev[c]) p.unshift(c);
  return p[0] === a ? p : [];
}

// Turn the route into steps: straight stretches are merged,
// and each turn (left / right / around) starts a new step.
function buildSteps(p) {
  const out = [];
  let heading = null, cur = null;
  for (let i = 1; i < p.length; i++) {
    const dx = N(p[i]).x - N(p[i - 1]).x, dy = N(p[i]).y - N(p[i - 1]).y;
    let key = 'walk_straight', same = false;
    if (heading) {
      const len = Math.hypot(heading.x, heading.y) * Math.hypot(dx, dy);
      const cross = (heading.x * dy - heading.y * dx) / len;
      const dot = (heading.x * dx + heading.y * dy) / len;
      if (dot > 0.9) same = true;
      else if (cross > 0.5) key = 'turn_right';
      else if (cross < -0.5) key = 'turn_left';
      else key = 'turn_back';
    }
    if (same && cur) cur.end = p[i];
    else { cur = { key: key, end: p[i] }; out.push(cur); }
    heading = { x: dx, y: dy };
  }
  return out;
}

function drawStatic() {
  $('edges').innerHTML = '';
  $('labels').innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  MAP.edges.forEach(([a, b]) => {
    const l = document.createElementNS(ns, 'line');
    l.setAttribute('class', 'edge');
    l.setAttribute('x1', N(a).x); l.setAttribute('y1', N(a).y);
    l.setAttribute('x2', N(b).x); l.setAttribute('y2', N(b).y);
    $('edges').append(l);
  });
  MAP.nodes.filter(n => !n.junction).forEach(n => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', 10);
    c.setAttribute('fill', n.id === to ? '#e11d48' : '#64748b');
    const tx = document.createElementNS(ns, 'text');
    tx.setAttribute('class', 'lbl');
    tx.setAttribute('x', n.x); tx.setAttribute('y', n.y - 18);
    tx.textContent = nameOf(n.id);
    $('labels').append(c, tx);
  });
}

function buildSelect() {
  const sel = $('dest');
  sel.innerHTML = '';
  ['registration', 'helpdesk', 'casualty', ...DEPTS.map(d => d.id)]
    .forEach(id => sel.add(new Option(nameOf(id), id)));
  sel.value = to;
}

function render() {
  $('stepText').textContent = k < steps.length
    ? t(steps[k].key, label(steps[k].end))
    : t('arrived');
  $('stepCount').textContent = steps.length
    ? t('step') + ' ' + Math.min(k + 1, steps.length) + ' ' + t('of') + ' ' + steps.length
    : '';
  const at = k === 0 ? from : steps[k - 1].end;
  $('dot').style.transform = 'translate(' + N(at).x + 'px,' + N(at).y + 'px)';
  $('prev').disabled = (k === 0);
  $('nextStep').disabled = (k >= steps.length);
}

function plan() {
  path = shortest(from, to);
  steps = buildSteps(path);
  k = 0;
  $('route').setAttribute('points', path.map(id => N(id).x + ',' + N(id).y).join(' '));
  drawStatic();
  render();
}

appReady.then(async () => {
  [MAP, DEPTS] = await Promise.all([
    fetch('data/hospital-map.json').then(r => r.json()),
    fetch('data/departments.json').then(r => r.json())
  ]);
  const q = new URLSearchParams(location.search);
  from = N(q.get('from')) ? q.get('from') : 'gate';
  to = N(q.get('to')) ? q.get('to') : 'registration';

  buildSelect();
  plan();

  $('dest').onchange = () => {
    to = $('dest').value;
    history.replaceState(null, '', '?from=' + from + '&to=' + to);
    plan();
  };
  $('nextStep').onclick = () => { if (k < steps.length) { k++; render(); } };
  $('prev').onclick = () => { if (k > 0) { k--; render(); } };

  document.addEventListener('langchange', () => { buildSelect(); drawStatic(); render(); });
});