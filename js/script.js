// js/script.js
// トップページ用の処理

/* =========================
   DOM
========================= */

const taskModal = document.getElementById("taskModal");
const openAddTaskModalButton = document.getElementById("openAddTaskModalButton");
const closeTaskModalButton = document.getElementById("closeTaskModalButton");

const taskModalForm = document.getElementById("taskModalForm");
const modalTitle = document.getElementById("modalTitle");
const modalTaskId = document.getElementById("modalTaskId");
const modalTaskTitle = document.getElementById("modalTaskTitle");

const modalTaskCategory = document.getElementById("modalTaskCategory");
const modalTaskLocation = document.getElementById("modalTaskLocation");
const modalTaskIsAllDay = document.getElementById("modalTaskIsAllDay");


const modalTaskStartDate = document.getElementById("modalTaskStartDate");
const modalTaskStartTime = document.getElementById("modalTaskStartTime");
const modalTaskEndDate = document.getElementById("modalTaskEndDate");
const modalTaskEndTime = document.getElementById("modalTaskEndTime");

const modalTaskTravelMode = document.getElementById("modalTaskTravelMode");
const modalTaskTravelTime = document.getElementById("modalTaskTravelTime");

const modalTaskImportance = document.getElementById("modalTaskImportance");
const modalTaskMemo = document.getElementById("modalTaskMemo");


const modalTaskDetail = document.getElementById("modalTaskDetail");

const saveTaskButton = document.getElementById("saveTaskButton");
const deleteTaskButton = document.getElementById("deleteTaskButton");

const taskPreview = document.getElementById("taskPreview");

/* =========================
   Utility
========================= */

function getPriorityClass(importance) {
  if (importance >= 5) return "priority-high";
  if (importance >= 3) return "priority-middle";
  return "priority-low";
}

function getDaysText(daysLeft) {
  if (daysLeft === 0) return "今日";
  if (daysLeft === 1) return "明日";
  if (daysLeft > 1) return `あと${daysLeft}日`;
  return `${Math.abs(daysLeft)}日前`;
}

function getTaskDate(task) {
  return task.startDate;
}

function getTaskCategory(task) {
  return task.category || "その他";
}

function formatTaskTime(task) {
  if (task.isAllDay) {
    return "終日";
  }

  if (!task.startTime && !task.endTime) {
    return "時刻未設定";
  }

  return `${task.startTime || "--:--"} - ${task.endTime || "--:--"}`;
}

function updateTimeInputsState() {
  const isAllDay = modalTaskIsAllDay.checked;

  modalTaskStartTime.disabled = isAllDay;
  modalTaskEndTime.disabled = isAllDay;

  if (isAllDay) {
    modalTaskStartTime.value = "";
    modalTaskEndTime.value = "";
  }
}

function refreshDashboard() {
  renderUpcomingTasks();
  renderMiniCalendar();
}

/* =========================
   直近の予定・締切
========================= */

function renderUpcomingTasks() {
  const upcomingList = document.getElementById("upcomingList");
  const tasks = loadTasks();

  const sortedTasks = tasks
    .map(task => {
      const daysLeft = getDaysLeft(getTaskDate(task));
      return {
        ...task,
        daysLeft
      };
    })
    .filter(task => task.daysLeft >= 0 && !task.completed)
    .sort((a, b) => {
      if (a.daysLeft !== b.daysLeft) {
        return a.daysLeft - b.daysLeft;
      }
      return b.importance - a.importance;
    });

  upcomingList.innerHTML = "";

  if (sortedTasks.length === 0) {
    upcomingList.innerHTML = `<li class="empty-message">直近の予定はありません。</li>`;
    return;
  }

  sortedTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "upcoming-item";
    li.dataset.id = task.id;

    const taskDate = getTaskDate(task);
    const category = getTaskCategory(task);
    const importance = getAutoImportance(taskDate);
    const priorityClass = getPriorityClass(importance);
    const daysText = getDaysText(task.daysLeft);
    const timeText = formatTaskTime(task);

    li.innerHTML = `
      <div class="upcoming-date">${taskDate.slice(5).replace("-", "/")}</div>
      <div>
        <div class="upcoming-title">${task.title}</div>
        <div class="upcoming-meta">${category}・${timeText}・${daysText}</div>
      </div>
      <div class="${priorityClass}">重要度 ${importance}</div>
    `;

    upcomingList.appendChild(li);
  });
}

document.getElementById("upcomingList").addEventListener("click", event => {
  const item = event.target.closest(".upcoming-item");
  if (!item) return;

  const taskId = item.dataset.id;
  openEditTaskModal(taskId);
});

document.getElementById("upcomingList").addEventListener("mouseover", event => {
  const item = event.target.closest(".upcoming-item");
  if (!item) return;

  const taskId = item.dataset.id;
  showTaskPreview(taskId, event.clientX, event.clientY);
});

document.getElementById("upcomingList").addEventListener("mousemove", event => {
  const item = event.target.closest(".upcoming-item");
  if (!item) return;

  moveTaskPreview(event.clientX, event.clientY);
});

document.getElementById("upcomingList").addEventListener("mouseout", event => {
  const item = event.target.closest(".upcoming-item");
  if (!item) return;

  hideTaskPreview();
});

/* =========================
   Mini Calendar: Day / Week / Month
========================= */

const miniCalendar = document.getElementById("miniCalendar");
const calendarModeButtons = document.querySelectorAll(".calendar-mode-button");

let miniCalendarMode = localStorage.getItem("miniCalendarMode") || "month";
let miniDayDate = new Date();
let miniWeekBaseDate = new Date();
let dayViewStartHour = 8;

const DAY_VIEW_TOTAL_HOURS = 25; // 00:00〜24:00
const DAY_VIEW_ROW_HEIGHT = 38;
const DAY_VIEW_MIN_ROWS_PER_COLUMN = 4;
const DAY_VIEW_MAX_ROWS_PER_COLUMN = 13;
const DAY_VIEW_WHEEL_THRESHOLD = 220;

let dayViewWheelDelta = 0;

function formatDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthDate(dateString) {
  return dateString.slice(5).replace("-", "/");
}

function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function getWeekdayLabel(date) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays[date.getDay()];
}

function getStartOfWeek(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function isSameDate(dateA, dateB) {
  return formatDateString(dateA) === formatDateString(dateB);
}

function getTasksForDate(dateString) {
  const tasks = loadTasks();

  return tasks
    .filter(task => {
      if (task.completed) return false;

      const startDate = task.startDate;
      const endDate = task.endDate || task.startDate;

      return startDate <= dateString && dateString <= endDate;
    })
    .sort((a, b) => {
      if (a.isAllDay !== b.isAllDay) {
        return a.isAllDay ? -1 : 1;
      }

      return (a.startTime || "99:99").localeCompare(b.startTime || "99:99");
    });
}

function timeToMinutes(timeString) {
  if (!timeString) return null;

  const [hour, minute] = timeString.split(":").map(Number);
  return hour * 60 + minute;
}

function taskOverlapsHour(task, dateString, hour) {
  if (task.isAllDay) return false;

  const startDate = task.startDate;
  const endDate = task.endDate || task.startDate;

  if (!(startDate <= dateString && dateString <= endDate)) {
    return false;
  }

  const hourStart = hour * 60;
  const hourEnd = hourStart + 60;

  // 日をまたぐ予定への最低限対応
  let taskStart = timeToMinutes(task.startTime);
  let taskEnd = timeToMinutes(task.endTime);

  if (dateString > startDate) {
    taskStart = 0;
  }

  if (dateString < endDate) {
    taskEnd = 24 * 60;
  }

  if (taskStart === null) taskStart = 0;
  if (taskEnd === null) taskEnd = taskStart + 60;

  return taskStart < hourEnd && taskEnd > hourStart;
}

function getDayViewRowsPerColumn(allDayTaskCount) {
  const miniCalendarHeight = miniCalendar.clientHeight || 300;

  // ヘッダー、終日予定、ヘルプ表示分をざっくり差し引く
  const reservedHeight = 78 + (allDayTaskCount > 0 ? 34 : 0);
  const availableHeight = Math.max(160, miniCalendarHeight - reservedHeight);

  const rows = Math.floor(availableHeight / DAY_VIEW_ROW_HEIGHT);

  return Math.max(
    DAY_VIEW_MIN_ROWS_PER_COLUMN,
    Math.min(DAY_VIEW_MAX_ROWS_PER_COLUMN, rows)
  );
}

function clampDayViewStartHour(visibleRowsPerColumn) {
  const maxStartHour = Math.max(0, DAY_VIEW_TOTAL_HOURS - visibleRowsPerColumn * 2);

  if (dayViewStartHour < 0) {
    dayViewStartHour = 0;
  }

  if (dayViewStartHour > maxStartHour) {
    dayViewStartHour = maxStartHour;
  }
}

function renderTaskLabel(task) {
  const category = getTaskCategory(task);
  const color = getCategoryColor(category);

  return `
    <div
      class="calendar-task-label"
      style="background: ${color};"
      title="${task.title}"
    >
      ${task.title}
    </div>
  `;
}

function updateCalendarModeButtons() {
  calendarModeButtons.forEach(button => {
    const mode = button.dataset.calendarMode;
    button.classList.toggle("active", mode === miniCalendarMode);
  });
}

function renderMiniCalendar() {
  updateCalendarModeButtons();

  if (miniCalendarMode === "day") {
    renderMiniDayView();
    return;
  }

  if (miniCalendarMode === "week") {
    renderMiniWeekView();
    return;
  }

  renderMiniMonthView();
}

function renderMiniMonthView() {
  const tasks = loadTasks();

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay();
  const lastDate = lastDay.getDate();

  let html = `
    <div class="calendar-title">${year}年 ${month + 1}月</div>

    <div class="calendar-weekdays">
      <span>日</span>
      <span>月</span>
      <span>火</span>
      <span>水</span>
      <span>木</span>
      <span>金</span>
      <span>土</span>
    </div>

    <div class="calendar-days">
  `;

  for (let i = 0; i < startWeekday; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  for (let date = 1; date <= lastDate; date++) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

    const dayTasks = tasks
      .filter(task => {
        if (task.completed) return false;

        const startDate = task.startDate;
        const endDate = task.endDate || task.startDate;

        return startDate <= dateString && dateString <= endDate;
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 2);

    const totalCount = getTasksForDate(dateString).length;
    const hiddenCount = totalCount - dayTasks.length;

    const isToday = date === today.getDate();

    html += `
      <div class="calendar-day ${isToday ? "today" : ""}" data-date="${dateString}">
        <div class="calendar-day-number">${date}</div>
        <div class="calendar-task-area">
          ${dayTasks.map(renderTaskLabel).join("")}
          ${hiddenCount > 0 ? `<div class="calendar-more">+${hiddenCount}</div>` : ""}
        </div>
      </div>
    `;
  }

  html += `
    </div>
  `;

  miniCalendar.innerHTML = html;
}

function renderMiniDayView() {
  const dateString = formatDateString(miniDayDate);
  const tasks = getTasksForDate(dateString);

  const allDayTasks = tasks.filter(task => task.isAllDay);
  const today = new Date();

  const visibleRowsPerColumn = getDayViewRowsPerColumn(allDayTasks.length);
  clampDayViewStartHour(visibleRowsPerColumn);

  miniCalendar.style.setProperty("--day-view-rows", visibleRowsPerColumn);

  const leftHours = [];
  const rightHours = [];

  for (let i = 0; i < visibleRowsPerColumn; i++) {
    const leftHour = dayViewStartHour + i;
    const rightHour = dayViewStartHour + visibleRowsPerColumn + i;

    if (leftHour < DAY_VIEW_TOTAL_HOURS) {
      leftHours.push(leftHour);
    }

    if (rightHour < DAY_VIEW_TOTAL_HOURS) {
      rightHours.push(rightHour);
    }
  }

  miniCalendar.innerHTML = `
    <div class="mini-day-view">
      <div class="mini-day-header">
        <button type="button" class="mini-calendar-nav-button" id="prevMiniDayButton">‹</button>
        <div class="mini-day-title">
          ${miniDayDate.getFullYear()}/${miniDayDate.getMonth() + 1}/${miniDayDate.getDate()}（${getWeekdayLabel(miniDayDate)}）
        </div>
        <button type="button" class="mini-calendar-nav-button" id="nextMiniDayButton">›</button>
      </div>

      ${
        allDayTasks.length > 0
          ? `
            <div class="mini-day-all-day">
              ${allDayTasks.map(renderTaskLabel).join("")}
            </div>
          `
          : ""
      }

      <div class="mini-day-grid" id="miniDayGrid">
        <div class="mini-day-column">
          ${leftHours.map(hour => renderMiniHourRow(dateString, hour, today)).join("")}
        </div>

        <div class="mini-day-column">
          ${rightHours.map(hour => renderMiniHourRow(dateString, hour, today)).join("")}
        </div>
      </div>

      <div class="mini-day-help">
        ホイールで時間帯を移動
      </div>
    </div>
  `;

  document.getElementById("prevMiniDayButton").addEventListener("click", () => {
    miniDayDate = addDays(miniDayDate, -1);
    renderMiniCalendar();
  });

  document.getElementById("nextMiniDayButton").addEventListener("click", () => {
    miniDayDate = addDays(miniDayDate, 1);
    renderMiniCalendar();
  });

  const miniDayGrid = document.getElementById("miniDayGrid");

  miniDayGrid.addEventListener("wheel", event => {
    event.preventDefault();

    dayViewWheelDelta += event.deltaY;

    if (Math.abs(dayViewWheelDelta) < DAY_VIEW_WHEEL_THRESHOLD) {
      return;
    }

    const moveAmount = Math.trunc(dayViewWheelDelta / DAY_VIEW_WHEEL_THRESHOLD);
    dayViewWheelDelta = dayViewWheelDelta % DAY_VIEW_WHEEL_THRESHOLD;

    const maxStartHour = Math.max(0, DAY_VIEW_TOTAL_HOURS - visibleRowsPerColumn * 2);

    dayViewStartHour = Math.max(
      0,
      Math.min(maxStartHour, dayViewStartHour + moveAmount)
    );

    renderMiniCalendar();
  }, { passive: false });
}

function renderMiniHourRow(dateString, hour, today) {
  const tasks = hour >= 24
    ? []
    : getTasksForDate(dateString).filter(task => taskOverlapsHour(task, dateString, hour));

  const now = new Date();
  const isTodayDate = formatDateString(now) === dateString;
  const isCurrentHour = isTodayDate && now.getHours() === hour;

  return `
    <div class="mini-hour-row ${isCurrentHour ? "current-hour" : ""}">
      <div class="mini-hour-label">${String(hour).padStart(2, "0")}:00</div>
      <div class="mini-hour-tasks">
        ${
          tasks.length > 0
            ? tasks.map(renderTaskLabel).join("")
            : `<span class="mini-empty-hour">空き</span>`
        }
      </div>
    </div>
  `;
}

function renderMiniWeekView() {
  const weekStart = getStartOfWeek(miniWeekBaseDate);
  const today = new Date();

  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  miniCalendar.innerHTML = `
    <div class="mini-week-header">
      <button type="button" class="mini-calendar-nav-button" id="prevMiniWeekButton">‹</button>
      <div class="mini-week-title">
        ${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()}〜${weekDays[6].getMonth() + 1}/${weekDays[6].getDate()}
      </div>
      <button type="button" class="mini-calendar-nav-button" id="nextMiniWeekButton">›</button>
    </div>

    <div class="mini-week-grid">
      ${weekDays.map(day => renderMiniWeekDay(day, today)).join("")}
    </div>
  `;

  document.getElementById("prevMiniWeekButton").addEventListener("click", () => {
    miniWeekBaseDate = addDays(miniWeekBaseDate, -7);
    renderMiniCalendar();
  });

  document.getElementById("nextMiniWeekButton").addEventListener("click", () => {
    miniWeekBaseDate = addDays(miniWeekBaseDate, 7);
    renderMiniCalendar();
  });
}

function renderMiniWeekDay(day, today) {
  const dateString = formatDateString(day);
  const tasks = getTasksForDate(dateString).slice(0, 4);

  return `
    <div class="mini-week-day ${isSameDate(day, today) ? "today" : ""}" data-date="${dateString}">
      <div class="mini-week-date">
        ${day.getDate()}<br>
        ${getWeekdayLabel(day)}
      </div>

      <div class="mini-week-tasks">
        ${
          tasks.length > 0
            ? tasks.map(task => {
                const category = getTaskCategory(task);
                const color = getCategoryColor(category);

                return `
                  <div
                    class="mini-week-task"
                    style="background: ${color};"
                    title="${task.title}"
                  >
                    ${task.title}
                  </div>
                `;
              }).join("")
            : `<span class="mini-empty-hour">なし</span>`
        }
      </div>
    </div>
  `;
}

calendarModeButtons.forEach(button => {
  button.addEventListener("click", () => {
    miniCalendarMode = button.dataset.calendarMode;
    localStorage.setItem("miniCalendarMode", miniCalendarMode);
    renderMiniCalendar();
  });
});

/* =========================
   モーダル
========================= */

function openModal() {
  taskModal.classList.add("active");
}

function closeModal() {
  taskModal.classList.remove("active");
  resetModalForm();
}

function resetModalForm() {
  taskModalForm.reset();
  modalTaskId.value = "";
  modalTitle.textContent = "予定を追加";
  saveTaskButton.textContent = "追加する";
  deleteTaskButton.classList.add("hidden");
  modalTaskDetail.innerHTML = "";
}

function openAddTaskModal() {
  resetModalForm();

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  modalTaskStartDate.value = todayString;
  modalTaskEndDate.value = todayString;

  modalTaskStartTime.value = "09:00";
  modalTaskEndTime.value = "10:00";

  modalTaskImportance.value = getAutoImportance(todayString);

  updateTimeInputsState();
  openModal();
}

function openEditTaskModal(taskId) {
  const tasks = loadTasks();
  const task = tasks.find(task => task.id === taskId);

  if (!task) return;

  const taskDate = getTaskDate(task);
  const daysLeft = getDaysLeft(taskDate);
  const daysText = getDaysText(daysLeft);
  const category = getTaskCategory(task);

  modalTaskId.value = task.id;
  modalTaskTitle.value = task.title;
  modalTaskLocation.value = task.location || "";
  modalTaskCategory.value = category;

  modalTaskIsAllDay.checked = Boolean(task.isAllDay);

  modalTaskStartDate.value = task.startDate;
  modalTaskStartTime.value = task.startTime || "";
  modalTaskEndDate.value = task.endDate || task.startDate;
  modalTaskEndTime.value = task.endTime || "";

  modalTaskTravelMode.value = task.travelMode || "none";
  modalTaskTravelTime.value = task.travelTimeMinutes || 0;

  modalTaskImportance.value = getAutoImportance(taskDate);
  modalTaskMemo.value = task.memo || "";

  modalTitle.textContent = "予定の詳細・編集";
  saveTaskButton.textContent = "更新する";
  deleteTaskButton.classList.remove("hidden");

  modalTaskDetail.innerHTML = `
    <strong>現在の予定情報</strong><br>
    日付：${task.startDate} ${task.isAllDay ? "終日" : `${task.startTime || "--:--"} - ${task.endTime || "--:--"}`}<br>
    終了：${task.endDate || task.startDate} ${task.isAllDay ? "" : task.endTime || ""}<br>
    場所：${task.location || "未設定"}<br>
    カテゴリ：${category}<br>
    重要度：${getAutoImportance(taskDate)}<br>
    締切まで：${daysText}<br>
    移動手段：${task.travelMode || "none"}<br>
    移動時間：${task.travelTimeMinutes || 0}分<br>
    メモ：${task.memo || "未設定"}
  `;

  updateTimeInputsState();
  openModal();
}

openAddTaskModalButton.addEventListener("click", event => {
  event.stopPropagation();
  openAddTaskModal();
});

closeTaskModalButton.addEventListener("click", closeModal);

taskModal.addEventListener("click", event => {
  if (event.target === taskModal) {
    closeModal();
  }
});

taskModalForm.addEventListener("submit", event => {
  event.preventDefault();

const taskData = {
  title: modalTaskTitle.value,
  category: modalTaskCategory.value,
  location: modalTaskLocation.value,

  isAllDay: modalTaskIsAllDay.checked,

  startDate: modalTaskStartDate.value,
  startTime: modalTaskStartTime.value,
  endDate: modalTaskEndDate.value,
  endTime: modalTaskEndTime.value,

  travelMode: modalTaskTravelMode.value,
  travelTimeMinutes: Number(modalTaskTravelTime.value),

  importance: getAutoImportance(modalTaskStartDate.value),
  memo: modalTaskMemo.value
};

  const editingTaskId = modalTaskId.value;

  if (editingTaskId) {
    updateTask(editingTaskId, taskData);
  } else {
    addTask(taskData);
  }

  closeModal();
  refreshDashboard();
});

deleteTaskButton.addEventListener("click", () => {
  const taskId = modalTaskId.value;

  if (!taskId) return;

  const ok = confirm("この予定を削除しますか？");

  if (ok) {
    deleteTask(taskId);
    closeModal();
    refreshDashboard();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
    closeLayoutSettingsModal();
    hideTaskPreview();
  }
});

modalTaskStartDate.addEventListener("change", () => {
  modalTaskImportance.value = getAutoImportance(modalTaskStartDate.value);

  if (!modalTaskEndDate.value || modalTaskEndDate.value < modalTaskStartDate.value) {
    modalTaskEndDate.value = modalTaskStartDate.value;
  }
});

modalTaskIsAllDay.addEventListener("change", updateTimeInputsState);

/* =========================
   トップページ用ミニ時計
========================= */

const homeTicksContainer = document.getElementById("homeTicks");
const homeNumbersContainer = document.getElementById("homeNumbers");

const homeHourHand = document.getElementById("homeHourHand");
const homeMinuteHand = document.getElementById("homeMinuteHand");
const homeSecondHand = document.getElementById("homeSecondHand");
const homeCurrentDate = document.getElementById("homeCurrentDate");

function createHomeClockParts() {
  for (let i = 0; i < 60; i++) {
    const tick = document.createElement("div");
    tick.classList.add("tick");

    if (i % 5 === 0) {
      tick.classList.add("major");
    }

    tick.style.setProperty("--i", i);
    homeTicksContainer.appendChild(tick);
  }

  for (let i = 1; i <= 12; i++) {
    const number = document.createElement("div");
    number.classList.add("number");
    number.style.setProperty("--i", i);
    number.innerHTML = `<span>${i}</span>`;
    homeNumbersContainer.appendChild(number);
  }
}

function updateHomeClock() {
  const now = new Date();

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  homeHourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
  homeMinuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
  homeSecondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[now.getDay()];

  homeCurrentDate.innerHTML = `${year}/${month}/${date}<br>(${weekday})`;
}


function showTaskPreview(taskId, x, y) {
  const tasks = loadTasks();
  const task = tasks.find(task => task.id === taskId);

  if (!task) return;

  const taskDate = getTaskDate(task);
  const daysLeft = getDaysLeft(taskDate);
  const daysText = getDaysText(daysLeft);
  const importance = getAutoImportance(taskDate);
  const category = getTaskCategory(task);
  const timeText = formatTaskTime(task);

  taskPreview.innerHTML = `
    <div class="task-preview-title">${task.title}</div>
    <div class="task-preview-meta">
      日付：${task.startDate}<br>
      時間：${timeText}<br>
      カテゴリ：${category}<br>
      重要度：${importance}<br>
      締切まで：${daysText}<br>
      場所：${task.location || "未設定"}<br>
      メモ：${task.memo || "未設定"}
    </div>
  `;

  taskPreview.style.left = `${x + 16}px`;
  taskPreview.style.top = `${y + 16}px`;
  taskPreview.classList.add("active");
}

function moveTaskPreview(x, y) {
  taskPreview.style.left = `${x + 16}px`;
  taskPreview.style.top = `${y + 16}px`;
}

function hideTaskPreview() {
  taskPreview.classList.remove("active");
}

/* =========================
   Layout Settings
========================= */

const layoutSettingsModal = document.getElementById("layoutSettingsModal");
const openLayoutSettingsButton = document.getElementById("openLayoutSettingsButton");
const closeLayoutSettingsButton = document.getElementById("closeLayoutSettingsButton");

const dashboardWidthRange = document.getElementById("dashboardWidthRange");
const dashboardWidthValue = document.getElementById("dashboardWidthValue");

const topGridRatioRange = document.getElementById("topGridRatioRange");
const topGridRatioValue = document.getElementById("topGridRatioValue");

const clockHeightRange = document.getElementById("clockHeightRange");
const clockHeightValue = document.getElementById("clockHeightValue");

const saveLayoutSettingsButton = document.getElementById("saveLayoutSettingsButton");
const resetLayoutSettingsButton = document.getElementById("resetLayoutSettingsButton");

const topGrid = document.getElementById("topGrid");
const homeClockCard = document.getElementById("homeClockCard");

const LAYOUT_STORAGE_KEY = "myDashboardLayoutSettings";

const defaultLayoutSettings = {
  dashboardWidth: 96,
  topGridRatio: 3,
  clockHeight: 460
};

function loadLayoutSettings() {
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);

  if (!saved) {
    return defaultLayoutSettings;
  }

  return JSON.parse(saved);
}

function saveLayoutSettings(settings) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(settings));
}

function applyLayoutSettings(settings) {
  document.documentElement.style.setProperty("--dashboard-width", `${settings.dashboardWidth}vw`);
  document.documentElement.style.setProperty("--clock-card-height", `${settings.clockHeight}px`);

  topGrid.style.gridTemplateColumns = `minmax(0, ${settings.topGridRatio}fr) minmax(320px, 1fr)`;

  dashboardWidthRange.value = settings.dashboardWidth;
  dashboardWidthValue.textContent = settings.dashboardWidth;

  topGridRatioRange.value = settings.topGridRatio;
  topGridRatioValue.textContent = `${settings.topGridRatio} : 1`;

  clockHeightRange.value = settings.clockHeight;
  clockHeightValue.textContent = settings.clockHeight;
}

function getCurrentLayoutSettingsFromInputs() {
  return {
    dashboardWidth: Number(dashboardWidthRange.value),
    topGridRatio: Number(topGridRatioRange.value),
    clockHeight: Number(clockHeightRange.value)
  };
}

function openLayoutSettingsModal() {
  layoutSettingsModal.classList.add("active");
}

function closeLayoutSettingsModal() {
  layoutSettingsModal.classList.remove("active");
}

function updateLayoutPreview() {
  const settings = getCurrentLayoutSettingsFromInputs();
  applyLayoutSettings(settings);
}

openLayoutSettingsButton.addEventListener("click", openLayoutSettingsModal);
closeLayoutSettingsButton.addEventListener("click", closeLayoutSettingsModal);

layoutSettingsModal.addEventListener("click", event => {
  if (event.target === layoutSettingsModal) {
    closeLayoutSettingsModal();
  }
});

dashboardWidthRange.addEventListener("input", updateLayoutPreview);
topGridRatioRange.addEventListener("input", updateLayoutPreview);
clockHeightRange.addEventListener("input", updateLayoutPreview);

saveLayoutSettingsButton.addEventListener("click", () => {
  const settings = getCurrentLayoutSettingsFromInputs();
  saveLayoutSettings(settings);
  applyLayoutSettings(settings);
  closeLayoutSettingsModal();
});

resetLayoutSettingsButton.addEventListener("click", () => {
  saveLayoutSettings(defaultLayoutSettings);
  applyLayoutSettings(defaultLayoutSettings);
});

/* =========================
   初期化
========================= */

applyLayoutSettings(loadLayoutSettings());

refreshDashboard();
createHomeClockParts();
updateHomeClock();

setInterval(updateHomeClock, 1000);