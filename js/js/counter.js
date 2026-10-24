let DEPTS = [];

async function register() {
  const name = $('name').value.trim(), age = Number($('age').value);
  if (!name || !age) { $('err').hidden = false; return; }
  $('err').hidden = true;
  $('reg').disabled = true;
  try {
    const deptId = $('dept').value;
    const id = await takeToken(deptId, {
      name, age,
      gender: $('gender').value,
      phone: $('mobile').value.trim(),
      language: $('lang').value,
      channel: 'counter',
      priority: $('prio').checked
    });
    const snap = await db.collection('patients').doc(id).get();
    const url = new URL('status.html?id=' + id, location.href).href;   // same page online patients land on

    $('tok').textContent = snap.data().token;
    $('rDept').textContent = DEPTS.find(d => d.id === deptId).name.en;
    $('qr').innerHTML = '';
    new QRCode($('qr'), { text: url, width: 200, height: 200 });
    $('formBox').hidden = true;
    $('result').hidden = false;
  } catch (e) {
    console.error(e);
    alert('Could not register. Please try again.');
  }
  $('reg').disabled = false;
}

function resetForm() {
  ['name', 'age', 'mobile'].forEach(f => { $(f).value = ''; });
  $('prio').checked = false;
  $('result').hidden = true;
  $('formBox').hidden = false;
}

requireRole('counter', async () => {
  DEPTS = await (await fetch('data/departments.json')).json();
  DEPTS.forEach(d => $('dept').add(new Option(d.name.en + ' - ' + d.doctor, d.id)));
  $('reg').onclick = register;
  $('again').onclick = resetForm;
  $('urgent').onclick = async () => {
    await db.collection('alerts').add({
      type: 'urgent', language: 'en', phone: '', color: '', status: 'new',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    $('urgentMsg').hidden = false;
  };
});