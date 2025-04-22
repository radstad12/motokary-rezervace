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
  const dateStr = formatDate(selectedDate);
  onValue(ref(db, 'banned/' + dateStr), (banSnap) => {
    const bannedSlots = banSnap.val() || {};
    onValue(ref(db, 'reservations'), (snapshot) => {
      const data = snapshot.val();
      generateSlotTable(data, bannedSlots);
    });
  });

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
const dateStr = formatDate(selectedDate);
onValue(ref(db, 'banned/' + dateStr), (banSnap) => {
  const bannedSlots = banSnap.val() || {};
  onValue(ref(db, 'reservations'), (snapshot) => {
    const data = snapshot.val();
    generateSlotTable(data, bannedSlots);
  });
});

  const username = prompt("Zadej přihlašovací jméno:");
  const password = prompt("Zadej heslo:");

  if (username === "radstad12" && password === "Stadlerra9") {
    isAdmin = true;
    alert("Přihlášen jako admin.");
    document.getElementById("addRecordBtn").classList.remove("hidden");
    generateSlotTable();

    const addRecordBtn = document.getElementById("addRecordBtn");
    if (addRecordBtn) {
      addRecordBtn.onclick = () => {
        const name = prompt("Zadej jméno:");
        const time = prompt("Zadej čas (v sekundách, např. 42.38):");
        if (name && time) {
          const recordRef = ref(db, 'hallOfFame');
          push(recordRef, { name, time });
        }
      };
    }


    isAdmin = true;
    alert("Přihlášen jako admin.");
    

 // reload se jmény
  } else {
    alert("Neplatné přihlašovací údaje.");
  }
});

// Úprava renderování obsazeného slotu



function generateSlotTable(reservations, bannedSlots = {}) {
  table.innerHTML = "";

  
  const dateStr = formatDate(selectedDate);
  const allSlots = [];

  for (let h of [17,18,19,20,21,22,23,0,1]) {
    const row = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = h < 10 ? `0${h}:00H` : `${h}:00H`;
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

      
      if (bannedSlots[time]) {
        slot.classList.add("banned");
        slot.classList.add("forbidden");
        slot.title = "Není možné rezervovat";
      }

      if (isAdmin && !slot.classList.contains("taken")) {
        const banToggle = document.createElement("span");
        banToggle.textContent = bannedSlots[time] ? "✅" : "🚫";
        banToggle.className = "ban-toggle";
        banToggle.title = bannedSlots[time] ? "Povolit rezervaci" : "Zakázat rezervaci";
        banToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          const banRef = ref(db, `banned/${dateStr}/${time}`);
          const newState = !bannedSlots[time];
          set(banRef, newState ? true : null);
        });
        slot.appendChild(banToggle);
      }

      allSlots.push(slot);
      td.appendChild(slot);
      row.appendChild(td);
    });

    table.appendChild(row);
  }
}




const recordList = document.getElementById("hallOfFameList");
const addRecordBtn = document.getElementById("addRecordBtn");

function loadHallOfFame() {
  const recordRef = ref(db, 'hallOfFame');
  onValue(recordRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    const sorted = Object.values(data).sort((a, b) => parseFloat(a.time) - parseFloat(b.time)).slice(0, 10);
    recordList.innerHTML = "";
    sorted.forEach((entry, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${entry.name} – ${entry.time}s`;
      recordList.appendChild(li);
    });
  });
}



window.addEventListener("load", () => {
  loadHallOfFame();
});
