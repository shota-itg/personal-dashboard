// js/clock.js

const ticksContainer = document.getElementById("ticks");
const numbersContainer = document.getElementById("numbers");

const hourHand = document.getElementById("hourHand");
const minuteHand = document.getElementById("minuteHand");
const secondHand = document.getElementById("secondHand");
const currentDate = document.getElementById("currentDate");

function createClockParts() {
  for (let i = 0; i < 60; i++) {
    const tick = document.createElement("div");
    tick.classList.add("tick");

    if (i % 5 === 0) {
      tick.classList.add("major");
    }

    tick.style.setProperty("--i", i);
    ticksContainer.appendChild(tick);
  }

  for (let i = 1; i <= 12; i++) {
    const number = document.createElement("div");
    number.classList.add("number");
    number.style.setProperty("--i", i);
    number.innerHTML = `<span>${i}</span>`;
    numbersContainer.appendChild(number);
  }
}

function updateClock() {
  const now = new Date();

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
  minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
  secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[now.getDay()];

  currentDate.innerHTML = `${year}/${month}/${date}<br>(${weekday})`;
}

createClockParts();
updateClock();
setInterval(updateClock, 1000);