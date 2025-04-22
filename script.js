import { db } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  update,
  get,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentDate = new Date();
let reservations = {};
let disabledSlots = {};
let hallOfFame = [];
let selectedSlot = null;
let isAdmin = false;
let hourMode = false;
let leadTimeMinutes = 0;

const table = document.getElementById("slotTable");
const datePicker = document.getElementById("datePicker");
const popup = document.getElementById("popup");
const popupTime = document.getElementById("popupTime");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");
const todayBtn = document.getElementById("todayBtn");
const adminBtn = document.getElementById("adminBtn");
const hourBtn = document.getElementById("hourBtn");

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function generateSlotTable() {
  table.innerHTML = "";
  const startHour = 17;
  const endHour = 1;
  const rows = [];

  for (let h = startHour; h <= 23; h++) rows.push(h);
  rows.push(0, 1);

  rows.forEach((hour) => {
    const row = document.createElement("tr");
    const hourCell = document.createElement("td");
    hourCell.textContent = `${String(hour).padStart(2, "0")}H`;
    hourCell.className = "hour-cell";
    row.appendChild(hourCell);

    for (let m = 0; m < 60; m += 20) {
      const timeStr = formatTime(hour, m);
      const cell = document.createElement("td");
      const button = document.createElement("button");
      button.textContent = timeStr;

      const fullDateStr = `${datePicker.value}_${timeStr}`;
      const res = reservations[fullDateStr];
      const isDisabled = disabledSlots[fullDateStr];

      const now = new Date();
      const slotTime = new Date(`${datePicker.value}T${timeStr}:00`);
      const diffMin = (slotTime - now) / 60000;

      if (isDisabled) {
        button.className = "slot disabled";
        button.disabled = true;
        button.title = "Není možné rezervovat";
      } else if (res) {
        button.className = "slot reserved";
        button.title = isAdmin ? `${res.name} (${res.phone})` : "Rezervováno";
      } else if (slotTime < now || diffMin < leadTimeMinutes) {
        button.className = "slot past";
        button.disabled = true;
        button.title = slotTime < now ? "Čas již minul" : `Rezervace možná min. ${leadTimeMinutes} min předem`;
      } else {
        button.className = "slot";
        button.addEventListener("click", () => openPopup(fullDateStr));
      }

      if (isAdmin && !res) {
        const icon = document.createElement("span");
        icon.textContent = isDisabled ? "✅" : "🚫";
        icon.className = "disable-icon";
        icon.onclick = (e) => {
          e.stopPropagation();
          update(ref(db, `disabledSlots/${fullDateStr}`), isDisabled ? null : true);
        };
        button.appendChild(icon);
      }

      cell.appendChild(button);
      row.appendChild(cell);
    }

    table.appendChild(row);
  });
}

function openPopup(slot) {
  selectedSlot = slot;
  popup.classList.remove("hidden");
  popupTime.textContent = slot.split("_")[1];
}

function closePopup() {
  popup.classList.add("hidden");
  nameInput.value = "";
  phoneInput.value = "";
}

confirmBtn.onclick = () => {
  if (nameInput.value && phoneInput.value && selectedSlot) {
    set(ref(db, "reservations/" + selectedSlot), {
      name: nameInput.value,
      phone: phoneInput.value,
    }).then(closePopup);
  }
};

cancelBtn.onclick = closePopup;

prevDayBtn.onclick = () => changeDate(-1);
nextDayBtn.onclick = () => changeDate(1);
todayBtn.onclick = () => {
  currentDate = new Date();
  updateDatePicker();
};

function changeDate(days) {
  currentDate.setDate(currentDate.getDate() + days);
  updateDatePicker();
}

function updateDatePicker() {
  datePicker.value = currentDate.toISOString().split("T")[0];
  generateSlotTable();
}

datePicker.onchange = () => {
  currentDate = new Date(datePicker.value);
  generateSlotTable();
};

adminBtn.onclick = () => {
  const name = prompt("Jméno:");
  const pass = prompt("Heslo:");
  if (name === "radstad12" && pass === "Stadlerra9") {
    isAdmin = true;
    const addBtn = document.createElement("button");
    addBtn.textContent = "Přidat rekord";
    addBtn.className = "add-record";
    addBtn.onclick = () => {
      const recName = prompt("Jméno:");
      const recTime = prompt("Čas (např. 52.5s):");
      if (recName && recTime) {
        const recordRef = ref(db, "hallOfFame");
        get(recordRef).then((snapshot) => {
          const data = snapshot.val() || [];
          data.push({ name: recName, time: recTime });
          data.sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
          set(recordRef, data.slice(0, 10));
        });
      }
    };
    document.querySelector("header").appendChild(addBtn);
    generateSlotTable();
  } else {
    alert("Neplatné přihlašovací údaje.");
  }
};

onValue(ref(db, "reservations"), (snap) => {
  reservations = snap.val() || {};
  generateSlotTable();
});

onValue(ref(db, "disabledSlots"), (snap) => {
  disabledSlots = snap.val() || {};
  generateSlotTable();
});
