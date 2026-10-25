// ===== SETUP =====
const habitInput = document.querySelector("#habitInput");
const addBtn = document.querySelector("#addBtn");
const habitList = document.querySelector("#habitList");
const emptyState = document.querySelector("#emptyState");
const todayDate = document.querySelector("#todayDate");
const totalHabitsEl = document.querySelector("#totalHabits");
const doneTodayEl = document.querySelector("#doneToday");
const bestStreakEl = document.querySelector("#bestStreak");

// ===== STATE =====
let habits = JSON.parse(localStorage.getItem("habits")) || [];

// ===== DATE HELPERS =====
function getToday() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ===== STREAK CALCULATOR =====
function calculateStreak(history) {
    if (history.length === 0) return 0;

    const sorted = [...history].sort().reverse();
    const today = getToday();
    const yesterday = getYesterday();

    // Streak only counts if user has done today OR yesterday
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let streak = 1;
    let currentDate = new Date(sorted[0]);

    for (let i = 1; i < sorted.length; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        const expected = currentDate.toISOString().split("T")[0];
        if (sorted[i] === expected) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// ===== SAVE =====
function save() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

// ===== ACTIONS =====
function addHabit() {
    const name = habitInput.value.trim();
    if (!name) return;

    habits.push({
        id: Date.now(),
        name,
        history: []
    });

    habitInput.value = "";
    habitInput.focus();
    save();
    render();
}

function toggleToday(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = getToday();
    const idx = habit.history.indexOf(today);

    if (idx === -1) {
        habit.history.push(today);
    } else {
        habit.history.splice(idx, 1);
    }

    save();
    render();
}

function deleteHabit(habitId) {
    if (!confirm("Delete this habit and its history?")) return;
    habits = habits.filter(h => h.id !== habitId);
    save();
    render();
}

function duplicateHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    habits.push({
        id: Date.now(),
        name: `${habit.name} (copy)`,
        history: []
    });
    save();
    render();
}

// ===== RENDER =====
function render() {
    // Update date
    todayDate.textContent = formatDate(getToday());

    // Show/hide empty state
    emptyState.classList.toggle("hidden", habits.length > 0);

    // Clear list
    habitList.innerHTML = "";

    const today = getToday();

    // Render each habit
    habits.forEach(habit => {
        const doneToday = habit.history.includes(today);
        const streak = calculateStreak(habit.history);

        // List item
        const li = document.createElement("li");
        if (doneToday) li.classList.add("done-today");

        // ===== Check button =====
        const checkBtn = document.createElement("button");
        checkBtn.className = "check-btn";
        if (doneToday) checkBtn.classList.add("done");
        checkBtn.textContent = doneToday ? "✓" : "";
        checkBtn.title = doneToday ? "Mark as not done" : "Mark as done today";
        checkBtn.setAttribute("aria-label",
            doneToday ? "Mark as not done" : "Mark as done today"
        );
        checkBtn.addEventListener("click", () => toggleToday(habit.id));

        // ===== Habit info =====
        const info = document.createElement("div");
        info.className = "habit-info";

        const nameEl = document.createElement("p");
        nameEl.className = "habit-name";
        nameEl.textContent = habit.name;

        // Streak — clear English text
        const streakEl = document.createElement("span");
        streakEl.className = "habit-streak";
        if (streak >= 3) streakEl.classList.add("fire");

        if (streak === 0) {
            streakEl.textContent = "Not started";
        } else if (streak === 1) {
            streakEl.textContent = "1 day streak";
        } else if (streak < 3) {
            streakEl.textContent = `${streak} day streak`;
        } else {
            streakEl.textContent = `🔥 ${streak} days in a row!`;
        }

        info.appendChild(nameEl);
        info.appendChild(streakEl);

        // ===== Actions (Duplicate + Delete) =====
        const actions = document.createElement("div");
        actions.className = "habit-actions";

        // Duplicate button
        const dupBtn = document.createElement("button");
        dupBtn.className = "dup-btn";
        dupBtn.textContent = "Duplicate";
        dupBtn.title = "Copy this habit";
        dupBtn.setAttribute("aria-label", `Duplicate habit: ${habit.name}`);
        dupBtn.addEventListener("click", () => duplicateHabit(habit.id));

        // Delete button — clear English
        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.textContent = "Delete";
        delBtn.title = "Remove this habit";
        delBtn.setAttribute("aria-label", `Delete habit: ${habit.name}`);
        delBtn.addEventListener("click", () => deleteHabit(habit.id));

        actions.appendChild(dupBtn);
        actions.appendChild(delBtn);

        // ===== Assemble =====
        li.appendChild(checkBtn);
        li.appendChild(info);
        li.appendChild(actions);
        habitList.appendChild(li);
    });

    // ===== Update stats =====
    totalHabitsEl.textContent = habits.length;
    doneTodayEl.textContent = habits.filter(h => h.history.includes(today)).length;
    bestStreakEl.textContent = habits.length > 0
        ? Math.max(...habits.map(h => calculateStreak(h.history)))
        : 0;
}

// ===== EVENTS =====
addBtn.addEventListener("click", addHabit);

habitInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addHabit();
});

// ===== START =====
render();