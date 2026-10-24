// Field names used in the "patients" collection. Change here if firebase.js uses other names.
const STAFF_FIELD = { dept: 'dept', token: 'token', status: 'status' };
const ROLE_PAGE = { nurse: 'nurse.html', counter: 'counter.html', ward: 'wardboy.html' };
const $ = id => document.getElementById(id);

function roleOf(u) { return (u.email || '').split('@')[0].toLowerCase(); }

function requireRole(role, ready) {
  firebase.auth().onAuthStateChanged(u => {
    if (!u || roleOf(u) !== role) { location.href = 'staff-login.html'; return; }
    ready(u);
  });
}

function staffLogout() {
  firebase.auth().signOut().then(() => { location.href = 'staff-login.html'; });
}

let audioCtx;
function enableSound() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
  beep();
}
function beep() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.frequency.value = 880; g.gain.value = 0.2;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.3);
}

function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}