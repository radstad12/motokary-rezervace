import { db, ref, onValue, set, remove, push } from './firebase-config.js';

const calendar = document.getElementById("calendar");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");
const adminTools = document.getElementById("adminTools");

let slots = [];
let currentTargetKey = null;
const adminCode = "admin123";

const startHour = 17;
const endHour = 24;

function generateSlots() {
  const today = new Date().toISOString().split('T')[0];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 10) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const key = `${today}_${time.replace(':', '-')}`;
      slots.push({ time, key });
    }
  }
  slots.unshift({ time: "Celý den", key: `${today}_FULLDAY` });
}

generateSlots();

function renderSlots(data) {
  calendar.innerHTML = "";
  slots.forEach(slot => {
    const el = document.createElement("div");
    el.className = "slot";
    el.textContent = slot.time;

    if (data[slot.key]) {
      el.classList.add("reserved");
      el.textContent += `\n(${data[slot.key]})`;
    }

    el.onclick = () => {
      if (data[slot.key]) return;
      const name = prompt("Zadej své jméno pro rezervaci:");
      if (name) {
        set(ref(db, `reservations/${slot.key}`), name);
      }
    };

    el.oncontextmenu = (e) => {
      e.preventDefault();
      if (data[slot.key]) {
        currentTargetKey = slot.key;
        popupText.textContent = `Opravdu chceš zrušit rezervaci (${data[slot.key]})?`;
        popup.classList.remove("hidden");
      }
    };

    calendar.appendChild(el);
  });
}

function confirmAction(confirm) {
  popup.classList.add("hidden");
  if (confirm && currentTargetKey) {
    remove(ref(db, `reservations/${currentTargetKey}`));
  }
  currentTargetKey = null;
}

function clearAllSlots() {
  const sure = confirm("Opravdu smazat všechny rezervace?");
  if (sure) remove(ref(db, "reservations"));
}

window.confirmAction = confirmAction;
window.clearAllSlots = clearAllSlots;

onValue(ref(db, "reservations"), (snapshot) => {
  const data = snapshot.val() || {};
  renderSlots(data);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "@") {
    const code = prompt("Zadej admin kód:");
    if (code === adminCode) {
      adminTools.style.display = "block";
      alert("Admin režim aktivován");
    }
  }
});
