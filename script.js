import { db } from './firebase-config.js';
import { ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const slotsContainer = document.getElementById("slots");

// Vygeneruj časové sloty mezi 17:00 a 24:00 (po 10 minutách)
function generateTimeSlots() {
  const start = 17 * 60;
  const end = 24 * 60;
  let slots = [];

  for (let t = start; t < end; t += 10) {
    const hours = Math.floor(t / 60);
    const minutes = t % 60;
    const label = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(label);
  }
  return slots;
}

function renderSlots(reservations) {
  slotsContainer.innerHTML = "";

  generateTimeSlots().forEach(time => {
    const isTaken = reservations && reservations[time];
    const slot = document.createElement("div");
    slot.className = `slot ${isTaken ? 'taken' : 'available'}`;
    slot.innerHTML = `<span>${time}</span><span>${isTaken ? 'Obsazeno' : 'Volné'}</span>`;

    if (!isTaken) {
      slot.addEventListener("click", () => {
        const name = prompt(`Zadej jméno pro rezervaci ${time}:`);
        if (name) {
          set(ref(db, 'reservations/' + time), { name });
        }
      });
    } else {
      slot.title = `Rezervováno: ${reservations[time].name}`;
    }

    slotsContainer.appendChild(slot);
  });
}

onValue(ref(db, 'reservations'), (snapshot) => {
  const data = snapshot.val();
  renderSlots(data);
});
