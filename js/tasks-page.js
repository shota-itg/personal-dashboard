// js/tasks-page.js

const taskForm = document.getElementById("taskForm");
const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDateInput = document.getElementById("taskDate");
const taskTypeInput = document.getElementById("taskType");
const taskImportanceInput = document.getElementById("taskImportance");
const taskList = document.getElementById("taskList");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");

function renderTaskList() {
  const tasks = loadTasks()
    .map(task => ({
      ...task,
      daysLeft: getDaysLeft(task.date)
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

    let daysText = "";
    if (task.daysLeft === 0) {
      daysText = "今日";
    } else if (task.daysLeft === 1) {
      daysText = "明日";
    } else if (task.daysLeft > 1) {
      daysText = `あと${task.daysLeft}日`;
    } else {
      daysText = `${Math.abs(task.daysLeft)}日前`;
    }

    li.innerHTML = `
      <div class="task-main">
        <input type="checkbox" ${task.completed ? "checked" : ""} data-action="toggle" data-id="${task.id}" />
        <div>
          <div class="task-title">${task.title}</div>
          <div class="task-meta">${task.date}・${task.type}・${daysText}・重要度 ${task.importance}</div>
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
    date: taskDateInput.value,
    type: taskTypeInput.value,
    importance: taskImportanceInput.value
  };

  const editingTaskId = taskIdInput.value;

  if (editingTaskId) {
    updateTask(editingTaskId, taskData);
  } else {
    addTask(taskData);
  }

  taskForm.reset();
  taskIdInput.value = "";
  submitButton.textContent = "追加する";
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

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDateInput.value = task.date;
    taskTypeInput.value = task.type;
    taskImportanceInput.value = task.importance;

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
  taskForm.reset();
  taskIdInput.value = "";
  submitButton.textContent = "追加する";
});

renderTaskList();