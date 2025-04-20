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

function generateSlotTable(reservations) {
  table.innerHTML = "";
  const dateStr = formatDate(selectedDate);
  const slotElements = [];

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
      slot.dataset.time = time;
      slot.dataset.index = slotElements.length;
      td.appendChild(slot);

      if (reservations && reservations[dateStr] && reservations[dateStr][time]) {
        slot.classList.add("taken");
        slot.title = `Rezervováno: ${reservations[dateStr][time].name}`;
      }

      slotElements.push(slot);
      row.appendChild(td);
    });

    table.appendChild(row);
  }

  slotElements.forEach((slot, index) => {
    if (!slot.classList.contains("taken")) {
      slot.addEventListener("mouseenter", () => {
        if (oneHourMode) {
          document.querySelectorAll(".slot").forEach(s => s.classList.remove("hovered-1h"));
          const nextThree = slotElements.slice(index, index + 3);
          const valid = nextThree.every(s => s && !s.classList.contains("taken"));
          if (valid && nextThree.length === 3) {
            nextThree.forEach(s => s.classList.add("hovered-1h"));
          }
        }
      });
      slot.addEventListener("mouseleave", () => {
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("hovered-1h"));
      });

      slot.addEventListener("click", () => {
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));
        if (oneHourMode) {
          const nextThree = slotElements.slice(index, index + 3);
          const valid = nextThree.every(s => s && !s.classList.contains("taken"));
          if (valid && nextThree.length === 3) {
            selectedSlot = nextThree.map(s => s.dataset.time);
            nextThree.forEach(s => s.classList.add("selected-1h"));
            popupTime.textContent = selectedSlot.join(", ");
            popup.classList.remove("hidden");
          } else {
            alert("Musí být volné 3 po sobě jdoucí časy.");
          }
        } else {
          selectedSlot = slot.dataset.time;
          popupTime.textContent = selectedSlot;
          popup.classList.remove("hidden");
        }
      });
    }
  });
    if (!slot.classList.contains("taken")) {
      slot.addEventListener("click", () => {
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));

        if (oneHourMode) {
          const toSelect = slotElements.slice(index, index + 3);
          const available = toSelect.every(s => s && !s.classList.contains("taken"));

          if (toSelect.length === 3 && available) {
            selectedSlot = toSelect.map(s => s.dataset.time);
            toSelect.forEach(s => s.classList.add("selected-1h"));
            popupTime.textContent = selectedSlot.join(", ");
            popup.classList.remove("hidden");
          } else {
            alert("Musí být volné 3 po sobě jdoucí časy pro hodinovou rezervaci.");
          }
        } else {
          selectedSlot = slot.dataset.time;
          popupTime.textContent = selectedSlot;
          popup.classList.remove("hidden");
        }
      });
    }
  });
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
  hourBtn.classList.toggle("active", oneHourMode);
  document.querySelectorAll(".slot").forEach(s => {
    s.classList.remove("selected-1h");
    s.classList.remove("hovered-1h");
  });
});
  oneHourMode = !oneHourMode;
  hourBtn.style.background = oneHourMode ? "#ff9100" : "#ffa500";
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
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));
  oneHourMode = false;
  hourBtn.style.background = "#ffa500";
});

cancelBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected-1h"));
});

datePicker.value = formatDate(selectedDate);
loadReservations();
