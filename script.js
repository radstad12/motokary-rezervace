import { db } from './firebase-config.js';
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const table = document.getElementById("slotTable");
const datePicker = document.getElementById("datePicker");
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

function generateSlotTable(reservations) {
  table.innerHTML = "";
  const dateStr = formatDate(selectedDate);

  for (let h = 17; h <= 23; h++) {
    const row = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = `${h}h`;
    label.className = "hour-label";
    row.appendChild(label);

    [0, 20, 40].forEach(min => {
      const time = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const td = document.createElement("td");
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = time;

      if (reservations && reservations[dateStr] && reservations[dateStr][time]) {
        slot.classList.add("taken");
        slot.title = `Rezervováno: ${reservations[dateStr][time].name}`;
      } else {
        slot.addEventListener("click", () => {
          selectedSlot = time;
          popupTime.textContent = time;
          popup.classList.remove("hidden");
        });
      }

      td.appendChild(slot);
      row.appendChild(td);
    });

    table.appendChild(row);
  }
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

cancelBtn.addEventListener("click", () => popup.classList.add("hidden"));

datePicker.value = formatDate(selectedDate);
loadReservations();
const todayBtn = document.getElementById("todayBtn");
todayBtn.addEventListener("click", () => {
  selectedDate = new Date();
  datePicker.value = formatDate(selectedDate);
  loadReservations();
});

const hourBtn = document.getElementById("hourBtn");
let oneHourMode = false;

hourBtn.addEventListener("click", () => {
  oneHourMode = !oneHourMode;
  hourBtn.style.background = oneHourMode ? "#ff9100" : "#ffa500";
});

function generateSlotTable(reservations) {
  table.innerHTML = "";
  const dateStr = formatDate(selectedDate);

  for (let h = 17; h <= 23; h++) {
    const row = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = `${h}h`;
    label.className = "hour-label";
    row.appendChild(label);

    [0, 20, 40].forEach(min => {
      const time = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const td = document.createElement("td");
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = time;

      if (reservations && reservations[dateStr] && reservations[dateStr][time]) {
        slot.classList.add("taken");
        slot.title = `Rezervováno: ${reservations[dateStr][time].name}`;
      } else {
        slot.addEventListener("click", () => {
          if (oneHourMode) {
            const base = h * 60 + min;
            const nextTimes = [0, 20, 40].map(offset => {
              const total = base + offset;
              const hour = Math.floor(total / 60);
              const minute = total % 60;
              return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            });

            selectedSlots = nextTimes;
            document.querySelectorAll(".slot").forEach(el => el.classList.remove("selected-1h"));

            nextTimes.forEach(t => {
              const target = Array.from(document.querySelectorAll(".slot")).find(s => s.textContent === t && !s.classList.contains("taken"));
              if (target) target.classList.add("selected-1h");
            });

            selectedSlot = nextTimes;
            popupTime.textContent = nextTimes.join(', ');
            popup.classList.remove("hidden");

          } else {
            selectedSlot = time;
            popupTime.textContent = time;
            popup.classList.remove("hidden");
          }
        });
      }

      td.appendChild(slot);
      row.appendChild(td);
    });

    table.appendChild(row);
  }
}

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
});
