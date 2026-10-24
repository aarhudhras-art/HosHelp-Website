// Creates the nurse alert when the Emergency button is pressed.
// The red emergency screen (common.js) always shows first; the alert is sent on top of it.
let lastAlert = { id: null, at: 0 };

window.onEmergency = async () => {
  const o = document.getElementById('emOverlay');

  // optional phone box (never blocks anything)
  if (o && !o.querySelector('#emPhone')) {
    const box = document.createElement('div');
    box.innerHTML =
      '<label data-i18n="em_phone"></label>' +
      '<input id="emPhone" type="tel" inputmode="numeric">' +
      '<button class="btn alt" id="emSend" data-i18n="em_send"></button>' +
      '<p id="emSent" hidden data-i18n="em_sent"></p>';
    o.insertBefore(box, o.querySelector('#emClose'));
    box.querySelector('#emSend').onclick = async () => {
      const v = box.querySelector('#emPhone').value.trim();
      if (!v || !lastAlert.id) return;
      try {
        await db.collection('alerts').doc(lastAlert.id).update({ phone: v });
        box.querySelector('#emSent').hidden = false;
      } catch (e) { console.error(e); }
    };
    applyLang();
  }

  if (typeof db === 'undefined') return;           // page without Firebase: screen still works
  const now = Date.now();
  if (lastAlert.id && now - lastAlert.at < 30000) return;   // avoid duplicate alerts from repeat taps
  try {
    const ref = await db.collection('alerts').add({
      type: 'emergency', language: currentLang, phone: '', color: '', status: 'new',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    lastAlert = { id: ref.id, at: now };
  } catch (e) { console.error(e); }
};