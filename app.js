const storageKey = "pomopaw-state-v2";
const ambienceCatalog = [
  { id: "rain", label: "Rain" },
  { id: "breeze", label: "Breeze" },
  { id: "brown", label: "Brown Noise" },
  { id: "cafe", label: "Cafe Hum" },
];
const ambienceLabels = Object.fromEntries(
  ambienceCatalog.map((option) => [option.id, option.label]),
);
const defaultTodos = [];
const legacyDefaultTodos = [
  { text: "Read a book.", done: false },
  { text: "Have a great coffee.", done: false },
  { text: "Watch Netflix.", done: false },
  { text: "Buy Nintendo Switch.", done: true },
];

const defaultState = {
  mode: "focus",
  durations: {
    focus: 25,
    short: 5,
    long: 15,
  },
  ambience: [],
  timeLeft: 25 * 60,
  round: 1,
  completedFocusSessions: 0,
  todos: structuredClone(defaultTodos),
};

const state = loadState();
const audioState = {
  context: null,
  masterGain: null,
  layers: new Map(),
  noiseCache: new Map(),
};
let timerInterval = null;
let statusMessage = "Ready for a cozy focus session.";

const timerEl = document.getElementById("timer");
const statusTextEl = document.getElementById("statusText");
const ambienceSummaryEl = document.getElementById("ambienceSummary");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const settingsBtn = document.getElementById("settingsBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const closeBtn = document.getElementById("closeBtn");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const doneList = document.getElementById("doneList");
const sessionsCountEl = document.getElementById("sessionsCount");
const tasksOpenCountEl = document.getElementById("tasksOpenCount");
const tasksDoneCountEl = document.getElementById("tasksDoneCount");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
const settingsModal = document.getElementById("settingsModal");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsForm = document.getElementById("settingsForm");
const focusDurationInput = document.getElementById("focusDurationInput");
const focusDurationValue = document.getElementById("focusDurationValue");
const shortDurationInput = document.getElementById("shortDurationInput");
const shortDurationValue = document.getElementById("shortDurationValue");
const longDurationInput = document.getElementById("longDurationInput");
const longDurationValue = document.getElementById("longDurationValue");
const ambienceInputs = Array.from(
  document.querySelectorAll('input[name="ambience"]'),
);
const isDesktopApp = Boolean(window.desktopWindow);
const isEmbeddedPreview = window.self !== window.top;

document.body.classList.toggle("desktop-app", isDesktopApp);
document.body.classList.toggle("embedded-preview", isEmbeddedPreview);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));

    if (!saved || typeof saved !== "object") {
      return structuredClone(defaultState);
    }

    const mode = ["focus", "short", "long"].includes(saved.mode)
      ? saved.mode
      : "focus";
    const focus = sanitizeByMode("focus", saved?.durations?.focus, 25);
    const short = sanitizeByMode("short", saved?.durations?.short, 5);
    const long = sanitizeByMode("long", saved?.durations?.long, 15);
    const round =
      Number.isInteger(saved.round) && saved.round > 0 ? saved.round : 1;
    const completedFocusSessions =
      Number.isInteger(saved.completedFocusSessions) &&
      saved.completedFocusSessions >= 0
        ? saved.completedFocusSessions
        : 0;
    const ambience = Array.isArray(saved.ambience)
      ? saved.ambience.filter((soundId) => ambienceLabels[soundId])
      : [];
    let todos = Array.isArray(saved.todos)
      ? saved.todos
          .filter((item) => item && typeof item.text === "string")
          .map((item, index) => ({
            id: item.id || `todo-${Date.now()}-${index}`,
            text: item.text.trim().slice(0, 120),
            done: Boolean(item.done),
          }))
          .filter((item) => item.text.length > 0)
      : structuredClone(defaultTodos);

    if (matchesLegacyDefaultTodos(todos)) {
      todos = [];
    }

    const defaultTime = { focus, short, long }[mode] * 60;
    const timeLeft =
      Number.isInteger(saved.timeLeft) && saved.timeLeft > 0
        ? saved.timeLeft
        : defaultTime;

    return {
      mode,
      durations: { focus, short, long },
      ambience,
      timeLeft,
      round,
      completedFocusSessions,
      todos: todos.length > 0 ? todos : structuredClone(defaultTodos),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function matchesLegacyDefaultTodos(todos) {
  if (todos.length !== legacyDefaultTodos.length) {
    return false;
  }

  return legacyDefaultTodos.every((legacyItem, index) => {
    const currentItem = todos[index];
    return (
      currentItem &&
      currentItem.text === legacyItem.text &&
      currentItem.done === legacyItem.done
    );
  });
}

function sanitizeDuration(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 180
    ? Math.floor(parsed)
    : fallback;
}

function sanitizeByMode(mode, value, fallback) {
  const limits = {
    focus: 60,
    short: 30,
    long: 60,
  };
  const parsed = Number(value);
  const max = limits[mode] || 180;

  return Number.isFinite(parsed) && parsed >= 1 && parsed <= max
    ? Math.floor(parsed)
    : fallback;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function getModeLabel(mode) {
  if (mode === "short") {
    return "Short Break";
  }

  if (mode === "long") {
    return "Long Break";
  }

  return "Focus";
}

function setStatus(message) {
  statusMessage = message;
  statusTextEl.textContent = statusMessage;
}

function renderTimer() {
  timerEl.textContent = formatTime(state.timeLeft);

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });

  document.title = "PomoPaw";
}

function renderStats() {
  const openCount = state.todos.filter((item) => !item.done).length;
  const doneCount = state.todos.filter((item) => item.done).length;

  sessionsCountEl.textContent = String(state.completedFocusSessions);
  tasksOpenCountEl.textContent = String(openCount);
  tasksDoneCountEl.textContent = String(doneCount);
}

function renderTodos() {
  const pendingItems = state.todos.filter((item) => !item.done);
  const doneItems = state.todos.filter((item) => item.done);

  todoList.innerHTML = pendingItems.length
    ? pendingItems
        .map(
          (item) => `
            <li class="task-item">
              <button class="task-toggle" type="button" data-action="toggle" data-id="${item.id}">
                <span aria-hidden="true">&hearts;</span>
              </button>
              <span class="task-text">${escapeHtml(item.text)}</span>
              <button class="task-remove" type="button" data-action="delete" data-id="${item.id}">
                -
              </button>
            </li>
          `,
        )
        .join("")
    : `<li class="empty-state">No tasks yet. Add a cute goal for today.</li>`;

  doneList.innerHTML = doneItems.length
    ? doneItems
        .map(
          (item) => `
            <li class="task-item done">
              <button class="task-toggle done-toggle" type="button" data-action="toggle" data-id="${item.id}">
                <span aria-hidden="true">&heartsuit;</span>
              </button>
              <span class="task-text">${escapeHtml(item.text)}</span>
              <button class="task-remove done-remove" type="button" data-action="delete" data-id="${item.id}">
                x
              </button>
            </li>
          `,
        )
        .join("")
    : `<li class="empty-state">Finished tasks will sparkle here.</li>`;
}

function renderAmbienceSummary() {
  if (!state.ambience.length) {
    ambienceSummaryEl.textContent = "Ambience off";
    return;
  }

  ambienceSummaryEl.textContent = `Ambience ${state.ambience
    .map((soundId) => ambienceLabels[soundId])
    .join(" + ")}`;
}

function renderAll() {
  renderTimer();
  renderStats();
  renderTodos();
  renderAmbienceSummary();
  saveState();
}

function setDurationPreview(input, output) {
  output.textContent = `${sanitizeDuration(input.value, 1)} min`;
}

function populateSettingsForm() {
  focusDurationInput.value = String(state.durations.focus);
  shortDurationInput.value = String(state.durations.short);
  longDurationInput.value = String(state.durations.long);
  setDurationPreview(focusDurationInput, focusDurationValue);
  setDurationPreview(shortDurationInput, shortDurationValue);
  setDurationPreview(longDurationInput, longDurationValue);

  ambienceInputs.forEach((input) => {
    input.checked = state.ambience.includes(input.value);
  });
}

function openSettings() {
  populateSettingsForm();
  settingsModal.classList.remove("hidden");
  settingsModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  focusDurationInput.focus();
}

function closeSettings() {
  settingsModal.classList.add("hidden");
  settingsModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function handleSettingsSave(event) {
  event.preventDefault();

  state.durations = {
    focus: sanitizeByMode(
      "focus",
      focusDurationInput.value,
      state.durations.focus,
    ),
    short: sanitizeByMode(
      "short",
      shortDurationInput.value,
      state.durations.short,
    ),
    long: sanitizeByMode("long", longDurationInput.value, state.durations.long),
  };
  state.ambience = ambienceInputs
    .filter((input) => input.checked)
    .map((input) => input.value);

  if (!timerInterval) {
    state.timeLeft = state.durations[state.mode] * 60;
  }

  setStatus(
    timerInterval
      ? "Settings saved. New ambience applies now, and new durations apply on the next reset."
      : "Settings saved.",
  );

  renderAll();
  syncAmbiencePlayback();
  closeSettings();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  syncAmbiencePlayback();
}

function setMode(mode, message) {
  state.mode = mode;
  state.timeLeft = state.durations[mode] * 60;
  stopTimer();
  setStatus(message || `${getModeLabel(mode)} mode is ready.`);
  renderAll();
}

function completeSession() {
  stopTimer();

  if (state.mode === "focus") {
    state.completedFocusSessions += 1;
    state.round += 1;

    if (state.completedFocusSessions % 4 === 0) {
      setMode("long", "Focus session complete. Long break is ready.");
    } else {
      setMode("short", "Focus session complete. Short break is ready.");
    }

    return;
  }

  setMode(
    "focus",
    `${getModeLabel(state.mode)} complete. Focus mode is ready.`,
  );
}

function startTimer() {
  if (timerInterval) {
    return;
  }

  setStatus(`${getModeLabel(state.mode)} mode is running.`);

  timerInterval = window.setInterval(() => {
    state.timeLeft -= 1;

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      renderAll();
      completeSession();
      return;
    }

    renderAll();
  }, 1000);

  syncAmbiencePlayback();
}

function pauseTimer() {
  if (!timerInterval) {
    setStatus(`${getModeLabel(state.mode)} mode is paused.`);
    return;
  }

  stopTimer();
  setStatus(`${getModeLabel(state.mode)} mode is paused.`);
  renderAll();
}

function resetTimer() {
  state.timeLeft = state.durations[state.mode] * 60;
  stopTimer();
  setStatus(`${getModeLabel(state.mode)} mode reset.`);
  renderAll();
}

function createTodo(text) {
  return {
    id: createId(),
    text,
    done: false,
  };
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addTodo() {
  const text = todoInput.value.trim();

  if (!text) {
    setStatus("Write a task first so I can add it to your list.");
    todoInput.focus();
    return;
  }

  state.todos.unshift(createTodo(text));
  todoInput.value = "";
  setStatus("New task added to your checklist.");
  renderAll();
}

function toggleTodo(id) {
  state.todos = state.todos.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item,
  );

  const toggledItem = state.todos.find((item) => item.id === id);

  if (toggledItem) {
    setStatus(
      toggledItem.done ? "Task moved to done." : "Task moved back to to-do.",
    );
  }

  renderAll();
}

function deleteTodo(id) {
  const nextTodos = state.todos.filter((item) => item.id !== id);

  if (nextTodos.length === state.todos.length) {
    return;
  }

  state.todos = nextTodos;
  setStatus("Task removed from your list.");
  renderAll();
}

function handleTaskClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "toggle") {
    toggleTodo(id);
    return;
  }

  if (action === "delete") {
    deleteTodo(id);
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAudioContext() {
  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioState.context) {
    audioState.context = new AudioContextConstructor();
    audioState.masterGain = audioState.context.createGain();
    audioState.masterGain.gain.value = 1;
    audioState.masterGain.connect(audioState.context.destination);
  }

  return audioState.context;
}

function getNoiseBuffer(context, color) {
  const cacheKey = `${color}-${context.sampleRate}`;

  if (audioState.noiseCache.has(cacheKey)) {
    return audioState.noiseCache.get(cacheKey);
  }

  const buffer = context.createBuffer(
    1,
    context.sampleRate * 2,
    context.sampleRate,
  );
  const channel = buffer.getChannelData(0);

  if (color === "brown") {
    let lastOut = 0;

    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      channel[index] = lastOut * 3.5;
    }
  } else {
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }
  }

  audioState.noiseCache.set(cacheKey, buffer);
  return buffer;
}

function createLayerController() {
  const stoppables = [];
  const disconnectables = [];
  const childLayers = [];

  return {
    source(node) {
      stoppables.push(node);
      disconnectables.push(node);
      return node;
    },
    node(node) {
      disconnectables.push(node);
      return node;
    },
    child(layer) {
      childLayers.push(layer);
      return layer;
    },
    stop() {
      childLayers.forEach((layer) => {
        layer.stop();
      });

      stoppables.forEach((node) => {
        try {
          node.stop();
        } catch {}
      });

      disconnectables.reverse().forEach((node) => {
        try {
          node.disconnect();
        } catch {}
      });
    },
  };
}

function createNoiseSource(context, color) {
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context, color);
  source.loop = true;
  return source;
}

function createLfo(context, targetParam, baseValue, depth, rate) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  targetParam.value = baseValue;
  oscillator.type = "sine";
  oscillator.frequency.value = rate;
  gain.gain.value = depth;

  oscillator.connect(gain);
  gain.connect(targetParam);
  oscillator.start();

  return {
    stop() {
      try {
        oscillator.stop();
      } catch {}

      oscillator.disconnect();
      gain.disconnect();
    },
  };
}

function createRainLayer(context, masterGain) {
  const layer = createLayerController();
  const source = layer.source(createNoiseSource(context, "white"));
  const highpass = layer.node(context.createBiquadFilter());
  const lowpass = layer.node(context.createBiquadFilter());
  const gain = layer.node(context.createGain());

  highpass.type = "highpass";
  highpass.frequency.value = 700;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 5600;
  gain.gain.value = 0.014;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(masterGain);

  layer.child(createLfo(context, gain.gain, 0.014, 0.006, 0.18));
  source.start();

  return layer;
}

function createBreezeLayer(context, masterGain) {
  const layer = createLayerController();
  const source = layer.source(createNoiseSource(context, "brown"));
  const highpass = layer.node(context.createBiquadFilter());
  const lowpass = layer.node(context.createBiquadFilter());
  const gain = layer.node(context.createGain());

  highpass.type = "highpass";
  highpass.frequency.value = 80;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 430;
  gain.gain.value = 0.016;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(masterGain);

  layer.child(createLfo(context, gain.gain, 0.016, 0.01, 0.07));
  source.start();

  return layer;
}

function createBrownNoiseLayer(context, masterGain) {
  const layer = createLayerController();
  const source = layer.source(createNoiseSource(context, "brown"));
  const lowpass = layer.node(context.createBiquadFilter());
  const gain = layer.node(context.createGain());

  lowpass.type = "lowpass";
  lowpass.frequency.value = 240;
  gain.gain.value = 0.028;

  source.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(masterGain);
  source.start();

  return layer;
}

function createCafeLayer(context, masterGain) {
  const layer = createLayerController();
  const noise = layer.source(createNoiseSource(context, "white"));
  const bandpass = layer.node(context.createBiquadFilter());
  const hushGain = layer.node(context.createGain());
  const lowHum = layer.node(context.createGain());
  const toneA = layer.source(context.createOscillator());
  const toneB = layer.source(context.createOscillator());
  const toneAGain = layer.node(context.createGain());
  const toneBGain = layer.node(context.createGain());

  bandpass.type = "bandpass";
  bandpass.frequency.value = 980;
  bandpass.Q.value = 0.45;
  hushGain.gain.value = 0.006;
  lowHum.gain.value = 0.004;
  toneA.type = "sine";
  toneA.frequency.value = 160;
  toneB.type = "sine";
  toneB.frequency.value = 240;
  toneAGain.gain.value = 0.0018;
  toneBGain.gain.value = 0.0012;

  noise.connect(bandpass);
  bandpass.connect(hushGain);
  hushGain.connect(masterGain);

  toneA.connect(toneAGain);
  toneB.connect(toneBGain);
  toneAGain.connect(lowHum);
  toneBGain.connect(lowHum);
  lowHum.connect(masterGain);

  layer.child(createLfo(context, hushGain.gain, 0.006, 0.0025, 0.11));
  noise.start();
  toneA.start();
  toneB.start();

  return layer;
}

async function syncAmbiencePlayback() {
  const shouldPlay = Boolean(timerInterval) && state.ambience.length > 0;

  if (!shouldPlay) {
    stopAmbienceLayers();
    return;
  }

  const context = getAudioContext();

  if (!context || !audioState.masterGain) {
    return;
  }

  try {
    if (context.state === "suspended") {
      await context.resume();
    }
  } catch {
    return;
  }

  const selectedIds = new Set(state.ambience);
  const builders = {
    rain: createRainLayer,
    breeze: createBreezeLayer,
    brown: createBrownNoiseLayer,
    cafe: createCafeLayer,
  };

  audioState.layers.forEach((layer, soundId) => {
    if (!selectedIds.has(soundId)) {
      layer.stop();
      audioState.layers.delete(soundId);
    }
  });

  state.ambience.forEach((soundId) => {
    if (!audioState.layers.has(soundId) && builders[soundId]) {
      audioState.layers.set(
        soundId,
        builders[soundId](context, audioState.masterGain),
      );
    }
  });
}

function stopAmbienceLayers() {
  audioState.layers.forEach((layer) => {
    layer.stop();
  });
  audioState.layers.clear();
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && !settingsModal.classList.contains("hidden")) {
    closeSettings();
  }
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
settingsBtn.addEventListener("click", openSettings);
settingsBackdrop.addEventListener("click", closeSettings);
settingsForm.addEventListener("submit", handleSettingsSave);
focusDurationInput.addEventListener("input", () => {
  setDurationPreview(focusDurationInput, focusDurationValue);
});
shortDurationInput.addEventListener("input", () => {
  setDurationPreview(shortDurationInput, shortDurationValue);
});
longDurationInput.addEventListener("input", () => {
  setDurationPreview(longDurationInput, longDurationValue);
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(
      button.dataset.mode,
      `${getModeLabel(button.dataset.mode)} mode selected.`,
    );
  });
});

addTodoBtn.addEventListener("click", addTodo);
todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodo();
  }
});

todoList.addEventListener("click", handleTaskClick);
doneList.addEventListener("click", handleTaskClick);
document.addEventListener("keydown", handleGlobalKeydown);

minimizeBtn.addEventListener("click", () => {
  window.desktopWindow?.minimize();
});

closeBtn.addEventListener("click", () => {
  stopAmbienceLayers();

  if (window.desktopWindow?.close) {
    window.desktopWindow.close();
    return;
  }

  window.close();
});

window.addEventListener("beforeunload", stopAmbienceLayers);

setStatus("Ready for a cozy focus session.");
renderAll();
