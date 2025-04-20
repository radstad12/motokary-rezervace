import { db } from './firebase-config.js';
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const slotsContainer = document.getElementById("slots");
const currentDateDisplay = document.getElementById("currentDate");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");

const popup = document.getElementById("popup");
const popupTime = document.getElementById("popupTime");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

let selectedDate = new Date();
let selectedSlot = null;

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('cs-CZ', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

function generateTimeSlots() {
  const start = 17 * 60;
  const end = 24 * 60;
  let slots = [];
  for (let t = start; t < end; t += 20) {
    const hours = Math.floor(t / 60);
    const minutes = t % 60;
    const label = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(label);
  }
  return slots;
}

function renderSlots(reservations) {
  slotsContainer.innerHTML = "";
  const dateStr = formatDate(selectedDate);

  generateTimeSlots().forEach(time => {
    const isTaken = reservations && reservations[dateStr] && reservations[dateStr][time];
    const slot = document.createElement("div");
    slot.className = `slot ${isTaken ? 'taken' : 'available'}`;
    slot.innerHTML = `<span>${time}</span><span>${isTaken ? 'Obsazeno' : 'Volné'}</span>`;

    if (!isTaken) {
      slot.addEventListener("click", () => {
        selectedSlot = time;
        popupTime.textContent = time;
        popup.classList.remove("hidden");
      });
    } else {
      slot.title = `Rezervováno: ${reservations[dateStr][time].name}`;
    }

    slotsContainer.appendChild(slot);
  });
}

function loadReservations() {
  onValue(ref(db, 'reservations'), (snapshot) => {
    const data = snapshot.val();
    renderSlots(data);
  });
}

function changeDay(diff) {
  selectedDate.setDate(selectedDate.getDate() + diff);
  updateDateDisplay();
  loadReservations();
}

function updateDateDisplay() {
  currentDateDisplay.textContent = formatDisplayDate(selectedDate);
}

confirmBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name || !phone) {
    alert("Vyplň jméno a telefonní číslo.");
    return;
  }

  const dateStr = formatDate(selectedDate);
  const reservationRef = ref(db, `reservations/${dateStr}/${selectedSlot}`);
  set(reservationRef, { name, phone });

  popup.classList.add("hidden");
  nameInput.value = "";
  phoneInput.value = "";
});

cancelBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
});

prevDayBtn.addEventListener("click", () => changeDay(-1));
nextDayBtn.addEventListener("click", () => changeDay(1));

updateDateDisplay();
loadReservations();