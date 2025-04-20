import { db } from './firebase-config.js';
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const table = document.getElementById("slotTable");
const datePicker = document.getElementById("datePicker");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");
const todayBtn = document.getElementById("todayBtn");
const hourBtn = document.getElementById("hourBtn");

const popup = document.getElementById("popup");
const popupTime = document.getElementById("popupTime");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

let selectedDate = new Date();
let selectedSlot = null;
let oneHourMode = false;

function formatDate(date) {
  return date.toISOString().split('T')[0];
}



function loadReservations() {
  onValue(ref(db, 'reservations'), (snapshot) => {
    const data = snapshot.val();
    generateSlotTable(data);
  });
}

function changeDay(offset) {
  selectedDate.setDate(selectedDate.getDate() + offset);
  datePicker.value = formatDate(selectedDate);
  loadReservations();
}

datePicker.addEventListener("change", () => {
  selectedDate = new Date(datePicker.value);
  loadReservations();
});

prevDayBtn.addEventListener("click", () => changeDay(-1));
nextDayBtn.addEventListener("click", () => changeDay(1));
todayBtn.addEventListener("click", () => {
  selectedDate = new Date();
  datePicker.value = formatDate(selectedDate);
  loadReservations();
});

hourBtn.addEventListener("click", () => {
  oneHourMode = !oneHourMode;
  hourBtn.style.background = oneHourMode ? "#e91e63" : "#ffa500";
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));
});

confirmBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!name || !phone) {
    alert("Vyplň jméno a telefonní číslo.");
    return;
  }

  const dateStr = formatDate(selectedDate);

  if (Array.isArray(selectedSlot)) {
    selectedSlot.forEach(time => {
      const reservationRef = ref(db, `reservations/${dateStr}/${time}`);
      set(reservationRef, { name, phone });
    });
  } else {
    const reservationRef = ref(db, `reservations/${dateStr}/${selectedSlot}`);
    set(reservationRef, { name, phone });
  }

  popup.classList.add("hidden");
  nameInput.value = "";
  phoneInput.value = "";
  oneHourMode = false;
  hourBtn.style.background = "#ffa500";
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));
});

cancelBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));
});

datePicker.value = formatDate(selectedDate);
loadReservations();



let isAdmin = false;

document.getElementById("adminBtn").addEventListener("click", () => {
  const username = prompt("Zadej přihlašovací jméno:");
  const password = prompt("Zadej heslo:");

  if (username === "radstad12" && password === "Stadlerra9") {
    alert("Přihlášen jako admin.");
    isAdmin = true;
    loadReservations(); // reload se jmény
  } else {
    alert("Neplatné přihlašovací údaje.");
  }
});

// Úprava renderování obsazeného slotu

