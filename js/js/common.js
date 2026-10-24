const LANGS = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी' };
let STRINGS = {};
let currentLang = localStorage.getItem('lang') || 'en';

function t(key, ...args) {
  let s = (STRINGS[currentLang] && STRINGS[currentLang][key]) ||
          (STRINGS.en && STRINGS.en[key]) || key;
  args.forEach((a, i) => { s = s.replace('{' + i + '}', a); });
  return s;
}

function applyLang() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.dispatchEvent(new Event('langchange'));
}

function buildChrome() {
  // top bar: language on the left, staff login (home page) or Home link on the right
  const bar = document.createElement('header');
  bar.className = 'topbar';
  const sel = document.createElement('select');
  sel.setAttribute('aria-label', 'Language');
  Object.entries(LANGS).forEach(([k, v]) => sel.add(new Option(v, k)));
  sel.value = currentLang;
  sel.onchange = () => {
    currentLang = sel.value;
    localStorage.setItem('lang', currentLang);
    applyLang();
  };
  const link = document.createElement('a');
  if (document.body.dataset.staff) { link.href = 'staff-login.html'; link.dataset.i18n = 'staff_login'; }
  else { link.href = 'index.html'; link.dataset.i18n = 'home'; }
  bar.append(sel, link);
  document.body.prepend(bar);

  // safety banner
  const ban = document.createElement('div');
  ban.className = 'banner';
  ban.dataset.i18n = 'banner';
  document.body.append(ban);

  // floating emergency button
  if (!document.body.dataset.noemergency) {
    const sos = document.createElement('button');
    sos.className = 'sos';
    sos.dataset.i18n = 'emergency';
    sos.onclick = triggerEmergency;
    document.body.append(sos);
  }
}

function showEmergency() {
  let o = document.getElementById('emOverlay');
  if (!o) {
    o = document.createElement('div');
    o.id = 'emOverlay';
    o.className = 'overlay';
    o.innerHTML =
      '<h1 data-i18n="em_title"></h1>' +
      '<p data-i18n="em_text"></p>' +
      '<a class="btn alt" href="tel:112" data-i18n="em_call"></a>' +
      '<a class="btn alt" href="navigate.html?from=gate&to=casualty" data-i18n="em_route"></a>' +
      '<button class="btn alt" id="emClose" data-i18n="close"></button>';
    document.body.append(o);
    o.querySelector('#emClose').onclick = () => { o.hidden = true; };
  }
  o.hidden = false;
  applyLang();
}

// emergency.js (later) can set window.onEmergency to also create the nurse alert
function triggerEmergency() {
  showEmergency();
  if (window.onEmergency) window.onEmergency();
}

window.appReady = (async () => {
  STRINGS = await (await fetch('data/lang.json')).json();
  buildChrome();
  applyLang();

}

)();