const firebaseConfig = {
  apiKey: "AIzaSyCIRFcItdFuxs5_U6NQKKI8Xugz-8JwoCk",
  authDomain: "hospital-c574e.firebaseapp.com",
  projectId: "hospital-c574e",
  appId: "1:368365731242:web:a76b5ae18f57abb689ffd3",
  measurementId: "G-85RPRNH0M4",
  messagingSenderId: "368365731242",
  storageBucket: "hospital-c574e.firebasestorage.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Creates the patient and takes the next token in one transaction,
// so two people can never get the same number. Returns the patient's ID.
async function takeToken(deptId, patientData) {
  const cRef = db.collection('counters').doc(deptId);
  const pRef = db.collection('patients').doc();
  await db.runTransaction(async tx => {
    const snap = await tx.get(cRef);
    const last = snap.exists ? (snap.data().last || 0) : 0;
    const serving = snap.exists ? (snap.data().serving || 0) : 0;
    const token = last + 1;
    tx.set(cRef, { last: token, serving: serving });
    tx.set(pRef, {
      ...patientData,
      department: deptId,
      token: token,
      status: 'waiting',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  return pRef.id;
}