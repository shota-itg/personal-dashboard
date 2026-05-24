// js/calendar.js

const fullCalendarTitle = document.getElementById("fullCalendarTitle");
const fullCalendarDays = document.getElementById("fullCalendarDays");
const prevMonthButton = document.getElementById("prevMonthButton");
const nextMonthButton = document.getElementById("nextMonthButton");

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function renderFullCalendar() {
  const tasks = loadTasks();

  fullCalendarTitle.textContent = `${currentYear}年 ${currentMonth + 1}月`;
  fullCalendarDays.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const startWeekday = firstDay.getDay();
  const lastDate = lastDay.getDate();

  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "full-calendar-day empty";
    fullCalendarDays.appendChild(empty);
  }

  for (let date = 1; date <= lastDate; date++) {
    const day = document.createElement("div");
    day.className = "full-calendar-day";

    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

    const today = new Date();
    const isToday =
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      date === today.getDate();

    if (isToday) {
      day.classList.add("today");
    }

    const dayTasks = tasks
      .filter(task => task.date === dateString && !task.completed)
      .sort((a, b) => b.importance - a.importance);

    const taskLabels = dayTasks.map(task => {
      return `
        <div class="calendar-task-label type-${task.type}" title="${task.title}">
          ${task.title}
        </div>
      `;
    }).join("");

    day.innerHTML = `
      <div class="full-calendar-day-number">${date}</div>
      <div class="full-calendar-task-area">
        ${taskLabels}
      </div>
    `;

    fullCalendarDays.appendChild(day);
  }
}

prevMonthButton.addEventListener("click", () => {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  renderFullCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  renderFullCalendar();
});

renderFullCalendar();