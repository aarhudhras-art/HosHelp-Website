const $ = id => document.getElementById(id);
const KEY = 'consultState';
let DEPTS = [];
let busy = false;
let state = {
  step: 1,
  q: { pregnant: 'no', child: 'no', elderly: 'no' },
  name: '', age: '', gender: '', mobile: '',
  alerted: false, priority: false
};

function save() { sessionStorage.setItem(KEY, JSON.stringify(state)); }
function load() {
  try { Object.assign(state, JSON.parse(sessionStorage.getItem(KEY)) || {}); } catch (e) {}
}

function show(n) {
  state.step = n; save();
  [1, 2, 3].forEach(i => { $('s' + i).hidden = (i !== n); });
  window.scrollTo(0, 0);
}

function paintQuestions() {
  document.querySelectorAll('.yn').forEach(g => {
    g.querySelectorAll('button').forEach(b =>
      b.classList.toggle('on', b.dataset.v === state.q[g.dataset.q]));
  });
  $('notice').hidden = !state.alerted;
  if (state.alerted) {
    $('next1').dataset.i18n = 'continue_reg';
    $('next1').textContent = t('continue_reg');
  }
}

function buildCards() {
  const box = $('docs');
  box.innerHTML = '';
  DEPTS.forEach(d => {
    const b = document.createElement('button');
    b.className = 'doc';
    b.innerHTML = '<span class="ic"></span><span class="n"></span><small></small>';
    b.querySelector('.ic').textContent = d.icon;
    b.querySelector('.n').textContent = d.name[currentLang] || d.name.en;
    b.querySelector('small').textContent = d.doctor;
    b.onclick = () => register(d.id);
    box.append(b);
  });
  const help = document.createElement('a');
  help.className = 'doc help';
  help.href = 'navigate.html?from=gate&to=helpdesk';
  help.textContent = '❓ ' + t('doc_help');
  box.append(help);
}

async function register(deptId) {
  if (busy) return;
  busy = true;
  $('saveMsg').hidden = false;
  $('saveMsg').textContent = t('saving');
  try {
    const id = await takeToken(deptId, {
      name: state.name.trim(),
      age: Number(state.age),
      gender: state.gender,
      phone: state.mobile || '',
      language: currentLang,
      channel: 'online',
      priority: !!state.priority
    });
    localStorage.setItem('myPatientId', id);
    sessionStorage.removeItem(KEY);
    location.href = 'status.html?id=' + id;
  } catch (e) {
    console.error(e);
    $('saveMsg').textContent = t('save_error');
    busy = false;
  }
}

appReady.then(async () => {
  DEPTS = await (await fetch('data/departments.json')).json();
  load();

  // restore typed answers (so Back / refresh keeps everything)
  ['name', 'age', 'gender', 'mobile'].forEach(f => {
    $(f).value = state[f];
    $(f).addEventListener('input', () => { state[f] = $(f).value; save(); });
  });

  document.querySelectorAll('.yn').forEach(g => {
    g.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      state.q[g.dataset.q] = b.dataset.v;
      save(); paintQuestions();
    };
  });

  $('next1').onclick = () => {
    const yes = Object.keys(state.q).filter(k => state.q[k] === 'yes');
    if (yes.length && !state.alerted) {
      state.alerted = true; state.priority = true; save();
      paintQuestions();
      db.collection('alerts').add({
        type: 'priority', reasons: yes, language: currentLang, status: 'new',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(console.error);
      return;                      // shows the notice; next click continues
    }
    show(2);
  };

  $('back2').onclick = () => show(1);
  $('next2').onclick = () => {
    if (!state.name.trim() || !state.age) { $('err').hidden = false; return; }
    $('err').hidden = true;
    show(3);
  };
  $('back3').onclick = () => show(2);

  paintQuestions();
  buildCards();
  show(state.step);
  document.addEventListener('langchange', () => { buildCards(); paintQuestions(); });
});