// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getDatabase, ref, onValue, set, remove } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBLPUkWM8j77f1rs8ZrVUAPX2AmDU9Ocx4",
  authDomain: "cartarena-ls.firebaseapp.com",
  databaseURL: "https://cartarena-ls-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cartarena-ls",
  storageBucket: "cartarena-ls.firebasestorage.app",
  messagingSenderId: "485144557401",
  appId: "1:485144557401:web:077474913768f62e70fe48"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, set, remove };