const $ = id => document.getElementById(id);
const pid = new URLSearchParams(location.search).get('id') || localStorage.getItem('myPatientId');
let DEPTS = [], patient = null, serving = 0, unsubCounter = null;

function showNotFound() {
  $('card').hidden = true;
  $('notfound').hidden = false;
}

function watchCounter() {
  if (unsubCounter) return;
  unsubCounter = db.collection('counters').doc(patient.department).onSnapshot(s => {
    serving = s.exists ? (s.data().serving || 0) : 0;
    render();
  });
}

function render() {
  if (!patient) return;
  const d = DEPTS.find(x => x.id === patient.department) ||
            { name: { en: patient.department }, doctor: '-', room: '-', avgMin: 8 };
  const myTurn = patient.status === 'called' || serving >= patient.token;
  const ahead = myTurn ? 0 : Math.max(0, patient.token - serving - 1);

  $('tokenNo').textContent = patient.token;
  $('dept').textContent = d.name[currentLang] || d.name.en;
  $('doc').textContent = d.doctor;
  $('room').textContent = d.room;
  $('ahead').textContent = ahead;
  $('wait').textContent = (ahead * d.avgMin) + ' ' + t('min');
  $('turn').hidden = !myTurn;
  $('nav').href = 'navigate.html?from=gate&to=' + patient.department;
  $('notfound').hidden = true;
  $('card').hidden = false;
}

appReady.then(async () => {
  DEPTS = await (await fetch('data/departments.json')).json();
  if (!pid) return showNotFound();

  db.collection('patients').doc(pid).onSnapshot(snap => {
    if (!snap.exists) return showNotFound();   // deleted after "Seen"
    patient = snap.data();
    watchCounter();
    render();
  }, err => { console.error(err); showNotFound(); });

  document.addEventListener('langchange', render);
});