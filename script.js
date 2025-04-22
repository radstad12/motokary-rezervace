
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref as dbRef, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function loadHallOfFame() {
  const hallRef = dbRef(db, "hallOfFame");
  const list = document.getElementById("hallOfFameList");
  list.innerHTML = "";

  onValue(hallRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const sorted = Object.values(data).sort((a, b) => parseFloat(a.time) - parseFloat(b.time));

    sorted.slice(0, 10).forEach((record, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${record.name} – ${record.time}s`;
      list.appendChild(li);
    });
  });
}

loadHallOfFame();
