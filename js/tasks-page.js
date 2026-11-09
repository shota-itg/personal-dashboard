// js/tasks-page.js

const taskForm = document.getElementById("taskForm");
const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskLocationInput = document.getElementById("taskLocation");
const taskCategoryInput = document.getElementById("taskCategory");
const taskIsAllDayInput = document.getElementById("taskIsAllDay");
const taskStartDateInput = document.getElementById("taskStartDate");
const taskStartTimeInput = document.getElementById("taskStartTime");
const taskEndDateInput = document.getElementById("taskEndDate");
const taskEndTimeInput = document.getElementById("taskEndTime");
const taskTravelModeInput = document.getElementById("taskTravelMode");
const taskTravelTimeInput = document.getElementById("taskTravelTime");
const taskImportanceInput = document.getElementById("taskImportance");
const taskMemoInput = document.getElementById("taskMemo");
const taskList = document.getElementById("taskList");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");

function updateTaskTimeInputsState() {
  const isAllDay = taskIsAllDayInput.checked;

  taskStartTimeInput.disabled = isAllDay;
  taskEndTimeInput.disabled = isAllDay;

  if (isAllDay) {
    taskStartTimeInput.value = "";
    taskEndTimeInput.value = "";
  }
}

function resetTaskForm() {
  taskForm.reset();
  taskIdInput.value = "";
  submitButton.textContent = "追加する";
  updateTaskTimeInputsState();
}

function renderTaskList() {
  const tasks = loadTasks()
    .map(task => ({
      ...task,
      daysLeft: getDaysLeft(getTaskDate(task))
    }))
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (a.daysLeft !== b.daysLeft) {
        return a.daysLeft - b.daysLeft;
      }

      return b.importance - a.importance;
    });

  taskList.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-list-item";

    if (task.completed) {
      li.classList.add("completed");
    }

    const category = getTaskCategory(task);
    const daysText = getDaysText(task.daysLeft);
    const timeText = formatTaskTime(task);

    li.innerHTML = `
      <div class="task-main">
        <input type="checkbox" ${task.completed ? "checked" : ""} data-action="toggle" data-id="${task.id}" />
        <div>
          <div class="task-title">${task.title}</div>
          <div class="task-meta">${task.startDate}・${category}・${timeText}・${daysText}・重要度 ${task.importance}</div>
        </div>
      </div>

      <div class="task-actions">
        <button data-action="edit" data-id="${task.id}">編集</button>
        <button data-action="delete" data-id="${task.id}">削除</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const taskData = {
    title: taskTitleInput.value,
    category: taskCategoryInput.value,
    location: taskLocationInput.value,

    isAllDay: taskIsAllDayInput.checked,

    startDate: taskStartDateInput.value,
    startTime: taskStartTimeInput.value,
    endDate: taskEndDateInput.value,
    endTime: taskEndTimeInput.value,

    travelMode: taskTravelModeInput.value,
    travelTimeMinutes: Number(taskTravelTimeInput.value),

    memo: taskMemoInput.value
  };

  const editingTaskId = taskIdInput.value;

  if (editingTaskId) {
    updateTask(editingTaskId, taskData);
  } else {
    addTask(taskData);
  }

  resetTaskForm();
  renderTaskList();
});

taskList.addEventListener("click", event => {
  const action = event.target.dataset.action;
  const taskId = event.target.dataset.id;

  if (!action || !taskId) return;

  if (action === "toggle") {
    toggleTaskCompleted(taskId);
    renderTaskList();
  }

  if (action === "edit") {
    const tasks = loadTasks();
    const task = tasks.find(task => task.id === taskId);

    if (!task) return;

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskLocationInput.value = task.location || "";
    taskCategoryInput.value = getTaskCategory(task);

    taskIsAllDayInput.checked = Boolean(task.isAllDay);

    taskStartDateInput.value = task.startDate;
    taskStartTimeInput.value = task.startTime || "";
    taskEndDateInput.value = task.endDate || task.startDate;
    taskEndTimeInput.value = task.endTime || "";

    taskTravelModeInput.value = task.travelMode || "none";
    taskTravelTimeInput.value = task.travelTimeMinutes || 0;

    taskImportanceInput.value = task.importance;
    taskMemoInput.value = task.memo || "";

    updateTaskTimeInputsState();

    submitButton.textContent = "更新する";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "delete") {
    const ok = confirm("この予定を削除しますか？");

    if (ok) {
      deleteTask(taskId);
      renderTaskList();
    }
  }
});

cancelEditButton.addEventListener("click", () => {
  resetTaskForm();
});

taskIsAllDayInput.addEventListener("change", updateTaskTimeInputsState);

taskStartDateInput.addEventListener("change", () => {
  if (!taskEndDateInput.value || taskEndDateInput.value < taskStartDateInput.value) {
    taskEndDateInput.value = taskStartDateInput.value;
  }
});

renderTaskList();
