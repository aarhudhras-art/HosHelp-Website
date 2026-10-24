const VOICE = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;


function speak(text) {
  if (!('speechSynthesis' in window)) {
    alert('Read Aloud is not supported in this browser.');
    return;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE[currentLang] || 'en-IN';

  const voices = speechSynthesis.getVoices();
  const prefix = u.lang.toLowerCase().split('-')[0];

  u.voice = voices.find(v =>
    v.lang.toLowerCase().startsWith(prefix)
  ) || null;

  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}


function listenInto(input) {
  if (!SR) return;
  const r = new SR();
  r.lang = VOICE[currentLang] || 'en-IN';
  r.onresult = e => {
    let v = e.results[0][0].transcript;
    if (input.type === 'number') v = v.replace(/\D/g, '');
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  r.start();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-speak]').forEach(btn => {
    if (!('speechSynthesis' in window)) { btn.hidden = true; return; }
    btn.onclick = () => speak(document.querySelector(btn.dataset.speak).innerText);
  });
  document.querySelectorAll('[data-mic]').forEach(btn => {
    if (!SR) { btn.hidden = true; return; }
    btn.onclick = () => listenInto(document.getElementById(btn.dataset.mic));
  });
});