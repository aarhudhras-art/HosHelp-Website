let unsub = null, waitingList = [];

const del = id => db.collection('patients').doc(id).delete();   // nothing is kept after this

function row(p, buttons) {
  const r = document.createElement('div');
  r.className = 'card';
  r.innerHTML = '<b class="t"></b> <span class="pill" hidden>Priority</span><div class="n"></div><div class="row b"></div>';
  r.querySelector('.t').textContent = 'Token ' + p[F.token];
  r.querySelector('.pill').hidden = !p.priority;
  r.querySelector('.n').textContent = p.name + (p.age ? ', ' + p.age : '');
  buttons.forEach(([txt, fn]) => {
    const b = document.createElement('button');
    b.className = 'btn alt';
    b.textContent = txt;
    b.onclick = fn;
    r.querySelector('.b').append(b);
  });
  return r;
}

function paint(list) {
  const called = list.filter(p => p[F.status] === 'called');
  waitingList = list.filter(p => p[F.status] !== 'called')
    .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || a[F.token] - b[F.token]);

  $('called').innerHTML = '';
  if (!called.length) $('called').textContent = 'Nobody right now.';
  called.forEach(p => $('called').append(row(p, [
    ['✔ Seen by doctor', () => del(p.id)],
    ['No-show, remove', () => del(p.id)]
  ])));

  $('waiting').innerHTML = '';
  if (!waitingList.length) $('waiting').textContent = 'Nobody waiting.';
  waitingList.forEach(p => $('waiting').append(row(p, [])));
  $('next').disabled = waitingList.length === 0;
}

function watch() {
  if (unsub) unsub();
  unsub = db.collection('patients').where(F.dept, '==', $('dept').value)
    .onSnapshot(s => paint(s.docs.map(d => ({ id: d.id, ...d.data() }))));
}

async function resetAll() {
  if (!confirm('Delete ALL demo patients and alerts?')) return;
  for (const col of ['patients', 'alerts']) {
    const s = await db.collection(col).get();
    const b = db.batch();
    s.docs.forEach(d => b.delete(d.ref));
    await b.commit();
  }
}

requireRole('ward', async () => {
  const depts = await (await fetch('data/departments.json')).json();
  depts.forEach(d => $('dept').add(new Option(d.name.en + ' - ' + d.doctor, d.id)));
  $('dept').onchange = watch;
  $('next').onclick = () => {
    if (waitingList.length) db.collection('patients').doc(waitingList[0].id).update({ [F.status]: 'called' });
  };
  $('reset').onclick = resetAll;
  watch();
});