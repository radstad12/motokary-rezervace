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



function generateSlotTable(reservations) {
  table.innerHTML = "";

  // Extra řádek s 00:00
  const midnightRow = document.createElement("tr");
  const midnightLabel = document.createElement("td");
  midnightLabel.textContent = "00:00";
  midnightLabel.className = "hour-label";
  midnightRow.appendChild(midnightLabel);
  const tdMid = document.createElement("td");
  tdMid.colSpan = 3;
  const singleMidSlot = document.createElement("div");
  singleMidSlot.className = "slot";
  singleMidSlot.dataset.time = "00:00";
  singleMidSlot.textContent = "00:00";

  const dateStrMid = formatDate(selectedDate);
  if (reservations && reservations[dateStrMid] && reservations[dateStrMid]["00:00"]) {
    const resData = reservations[dateStrMid]["00:00"];
    singleMidSlot.classList.add("taken");

    if (isAdmin) {
      singleMidSlot.title = `Jméno: ${resData.name}\nTel: ${resData.phone}`;
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✖";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const reservationRef = ref(db, `reservations/${dateStrMid}/00:00`);
        set(reservationRef, null);
      });
      singleMidSlot.appendChild(deleteBtn);
    } else {
      singleMidSlot.title = "Rezervováno";
    }
  }

  singleMidSlot.addEventListener("click", () => {
    if (singleMidSlot.classList.contains("taken") && !isAdmin) return;
    selectedSlot = "00:00";
    popupTime.textContent = selectedSlot;
    popup.classList.remove("hidden");
  });

  tdMid.appendChild(singleMidSlot);
  midnightRow.appendChild(tdMid);
  table.appendChild(midnightRow);

  const dateStr = formatDate(selectedDate);
  const allSlots = [];

  for (let h of [17,18,19,20,21,22,23,0,1]) {
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

      if (reservations && reservations[dateStr] && reservations[dateStr][time]) {
        const resData = reservations[dateStr][time];
        slot.classList.add("taken");

        if (isAdmin) {
          slot.title = `Jméno: ${resData.name}\nTel: ${resData.phone}`;
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "✖";
          deleteBtn.className = "delete-btn";
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const reservationRef = ref(db, `reservations/${dateStr}/${time}`);
            set(reservationRef, null);
          });
          slot.appendChild(deleteBtn);
        } else {
          slot.title = "Rezervováno";
        }
      }

      slot.addEventListener("click", () => {
        if (slot.classList.contains("taken") && !isAdmin) return;

        if (oneHourMode) {
          const index = allSlots.indexOf(slot);
          const group = allSlots.slice(index, index + 3);
          if (group.length < 3 || group.some(s => s.classList.contains("taken"))) return;

          allSlots.forEach(s => s.classList.remove("selected-1h"));
          group.forEach(s => s.classList.add("selected-1h"));

          selectedSlot = group.map(s => s.dataset.time);
        } else {
          selectedSlot = slot.dataset.time;
        }

        popupTime.textContent = selectedSlot instanceof Array ? selectedSlot.join(", ") : selectedSlot;
        popup.classList.remove("hidden");
      });

      slot.addEventListener("mouseover", () => {
        if (!oneHourMode || slot.classList.contains("taken")) return;
        const index = allSlots.indexOf(slot);
        const group = allSlots.slice(index, index + 3);
        if (group.length < 3 || group.some(s => s.classList.contains("taken"))) return;
        group.forEach(s => s.classList.add("selected-1h"));
      });

      slot.addEventListener("mouseout", () => {
        if (!oneHourMode) return;
        allSlots.forEach(s => s.classList.remove("selected-1h"));
      });

      allSlots.push(slot);
      td.appendChild(slot);
      row.appendChild(td);
    });

    table.appendChild(row);
  }
}
