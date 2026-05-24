// js/tasks.js
// 予定データの保存・読み込み・追加・編集・削除を管理する

const STORAGE_KEY = "myDashboardTasks";

const DEFAULT_CATEGORIES = [
  { name: "締切", color: "#ffd6d6" },
  { name: "研究", color: "#d8f3dc" },
  { name: "授業", color: "#fff3bf" },
  { name: "就活", color: "#dbeafe" },
  { name: "私用", color: "#f3d9fa" },
  { name: "その他", color: "#e5e7eb" }
];

const TRAVEL_MODES = [
  { value: "none", label: "なし" },
  { value: "walk", label: "徒歩" },
  { value: "train", label: "電車" },
  { value: "car", label: "車" }
];

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    saveTasks([]);
    return [];
  }

  const tasks = JSON.parse(savedTasks);

  // 念のため、古い形式のデータがあっても新形式へ寄せる
  return tasks.map(normalizeTask);
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function normalizeTask(task) {
  const baseDate = task.startDate || task.date || "";
  const category = task.category || task.type || "その他";

  return {
    id: task.id || `task-${Date.now()}`,
    title: task.title || "",
    location: task.location || "",
    category: category,

    isAllDay: Boolean(task.isAllDay),

    startDate: task.startDate || baseDate,
    startTime: task.startTime || "",
    endDate: task.endDate || baseDate,
    endTime: task.endTime || "",

    travelMode: task.travelMode || "none",
    travelTimeMinutes: Number(task.travelTimeMinutes || 0),

    importance: Number(task.importance || getAutoImportance(baseDate)),
    memo: task.memo || "",
    completed: Boolean(task.completed)
  };
}

function addTask(task) {
  const tasks = loadTasks();

  const newTask = {
    id: `task-${Date.now()}`,
    title: task.title,
    location: task.location || "",
    category: task.category || "その他",

    isAllDay: Boolean(task.isAllDay),

    startDate: task.startDate,
    startTime: task.isAllDay ? "" : task.startTime,
    endDate: task.endDate,
    endTime: task.isAllDay ? "" : task.endTime,

    travelMode: task.travelMode || "none",
    travelTimeMinutes: Number(task.travelTimeMinutes || 0),

    importance: getAutoImportance(task.startDate),
    memo: task.memo || "",
    completed: false
  };

  tasks.push(newTask);
  saveTasks(tasks);
}

function updateTask(taskId, updatedTask) {
  const tasks = loadTasks();

  const newTasks = tasks.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        title: updatedTask.title,
        location: updatedTask.location || "",
        category: updatedTask.category || "その他",

        isAllDay: Boolean(updatedTask.isAllDay),

        startDate: updatedTask.startDate,
        startTime: updatedTask.isAllDay ? "" : updatedTask.startTime,
        endDate: updatedTask.endDate,
        endTime: updatedTask.isAllDay ? "" : updatedTask.endTime,

        travelMode: updatedTask.travelMode || "none",
        travelTimeMinutes: Number(updatedTask.travelTimeMinutes || 0),

        importance: getAutoImportance(updatedTask.startDate),
        memo: updatedTask.memo || ""
      };
    }

    return task;
  });

  saveTasks(newTasks);
}

function deleteTask(taskId) {
  const tasks = loadTasks();
  const newTasks = tasks.filter(task => task.id !== taskId);
  saveTasks(newTasks);
}

function toggleTaskCompleted(taskId) {
  const tasks = loadTasks();

  const newTasks = tasks.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        completed: !task.completed
      };
    }

    return task;
  });

  saveTasks(newTasks);
}

function getDaysLeft(dateString) {
  if (!dateString) return 9999;

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getAutoImportance(dateString) {
  const daysLeft = getDaysLeft(dateString);

  if (daysLeft <= 3) return 5;
  if (daysLeft <= 7) return 4;
  if (daysLeft <= 14) return 3;
  if (daysLeft <= 30) return 2;
  return 1;
}

function getCategoryColor(categoryName) {
  const category = DEFAULT_CATEGORIES.find(category => category.name === categoryName);
  return category ? category.color : "#e5e7eb";
}