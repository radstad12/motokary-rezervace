// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  push
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Konfigurace z tvého Firebase projektu
const firebaseConfig = {
  apiKey: "AIzaSyBLPUkWM8j77f1rs8ZrVUAPX2AmDU9Ocx4",
  authDomain: "cartarena-ls.firebaseapp.com",
  databaseURL: "https://cartarena-ls-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cartarena-ls",
  storageBucket: "cartarena-ls.appspot.com",
  messagingSenderId: "485144557401",
  appId: "1:485144557401:web:077474913768f62e70fe48",
  measurementId: "G-YXJ0XRGBTL"
};

// Inicializace Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export potřebných funkcí
export { db, ref, onValue, set, remove, push };
