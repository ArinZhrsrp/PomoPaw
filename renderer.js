let timerInterval = null;
let currentMode = "focus";

const durations = {
  focus: 25,
  short: 5,
  long: 15,
};

let timeLeft = durations.focus * 60;

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const exitBtn = document.getElementById("exitBtn");
const modeBtns = document.querySelectorAll(".mode");

const focusInput = document.getElementById("focusInput");
const shortInput = document.getElementById("shortInput");
const longInput = document.getElementById("longInput");

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function updateDisplay() {
  timerEl.textContent = formatTime(timeLeft);
}

function applyInputValues() {
  durations.focus = Number(focusInput.value) || 25;
  durations.short = Number(shortInput.value) || 5;
  durations.long = Number(longInput.value) || 15;
}

function setMode(mode) {
  currentMode = mode;
  applyInputValues();
  timeLeft = durations[mode] * 60;
  updateDisplay();

  modeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft -= 1;
      updateDisplay();
    } else {
      pauseTimer();
      alert("Session complete");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  pauseTimer();
  setMode(currentMode);
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
exitBtn.addEventListener("click", () => {
  window.close();
});

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    pauseTimer();
    setMode(btn.dataset.mode);
  });
});

focusInput.addEventListener("change", () => {
  if (currentMode === "focus") setMode("focus");
});
shortInput.addEventListener("change", () => {
  if (currentMode === "short") setMode("short");
});
longInput.addEventListener("change", () => {
  if (currentMode === "long") setMode("long");
});

updateDisplay();
