(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const screens = $$(".screen");
  const state = { date: null, hour: 16, noMoves: 0, sortable: null };

  const places = [
    ["⛸️","Каток"],["☕","Уютная кофейня"],["🐈","Антикафе с котиками"],["🎬","Кино"],["🏰","Прогулка по Старому городу"],
    ["🍝","Итальянский ресторан"],["🎨","Творческий мастер-класс"],["🌳","Пикник в парке"],["🧁","Дегустация десертов"],["🎳","Боулинг"],
    ["🕯️","Ужин при свечах"],["🖼️","Художественная галерея"],["🌅","Встреча на закате"],["🎡","Парк аттракционов"],["📚","Книжный магазин и кофе"],
    ["🧩","Настольные игры"],["🍿","Домашний кинотеатр"],["🌿","Ботанический сад"],["🎤","Караоке"],["🛶","Прогулка у воды"]
  ];

  function goTo(name) {
    screens.forEach(screen => {
      const active = screen.dataset.screen === name;
      screen.classList.toggle("active", active);
      screen.setAttribute("aria-hidden", String(!active));
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "question") startQuestionTimer();
    if (name === "schedule") renderCalendar();
    if (name === "postcard") renderSummary();
  }

  $$("[data-go]").forEach(button => button.addEventListener("click", () => goTo(button.dataset.go)));

  function startQuestionTimer() {
    const yes = $("#yes-button");
    const note = $("#question-note");
    yes.classList.remove("visible");
    yes.disabled = true;
    note.textContent = "Попробуй поймать кнопку «Нет» несколько раз 🙈";
    state.noMoves = 0;
    const no = $("#no-button");
    no.style.left = "0px"; no.style.top = "0px"; no.style.position = "relative";
  }

  // The playful "No" button dodges four times. Then "Yes" appears immediately.
  // The "No" button remains available as a valid choice.
  const noButton = $("#no-button");
  function dodgeNo() {
    if (state.noMoves >= 4) return;
    const area = $("#question-actions").getBoundingClientRect();
    const maxX = Math.max(30, Math.min(110, area.width * 0.22));
    const maxY = Math.max(15, Math.min(45, area.height * 0.3));
    noButton.style.position = "relative";
    noButton.style.left = `${Math.round((Math.random() * 2 - 1) * maxX)}px`;
    noButton.style.top = `${Math.round((Math.random() * 2 - 1) * maxY)}px`;
    state.noMoves++;
    if (state.noMoves >= 4) {
      noButton.style.left = "0px"; noButton.style.top = "0px";
      const yes = $("#yes-button");
      yes.disabled = false;
      yes.classList.add("visible");
      $("#question-note").textContent = "Теперь можно выбрать «Да» или «Нет» — как тебе хочется 💗";
    }
  }
  noButton.addEventListener("pointerenter", dodgeNo);
  noButton.addEventListener("focus", () => { if (state.noMoves < 4) dodgeNo(); });
  noButton.addEventListener("click", () => {
    $("#question-note").textContent = "Спасибо, что честно сказала. Никакого давления 💗";
    noButton.textContent = "Поняла ♡";
    $("#yes-button").classList.remove("visible");
    $("#yes-button").disabled = true;
  });
  $("#yes-button").addEventListener("click", () => goTo("places"));

  function renderPlaces() {
    const list = $("#places-list");
    list.innerHTML = places.map(([emoji, name], index) => `
      <li class="place-item" data-place="${escapeHtml(name)}" tabindex="0">
        <span class="drag-grip" aria-hidden="true">⠿</span>
        <span class="place-emoji" aria-hidden="true">${emoji}</span>
        <span class="place-name">${escapeHtml(name)}</span>
        <span class="place-number">${String(index + 1).padStart(2, "0")}</span>
      </li>`).join("");
    if (window.Sortable) {
      state.sortable = Sortable.create(list, {
        animation: 220, ghostClass: "sortable-ghost", chosenClass: "sortable-chosen",
        handle: ".place-item", delayOnTouchOnly: true, delay: 100, touchStartThreshold: 4,
        onEnd: updatePlaceNumbers
      });
    }
    updatePlaceNumbers();
  }
  function updatePlaceNumbers() {
    $$(".place-item", $("#places-list")).forEach((item, index) => {
      $(".place-number", item).textContent = String(index + 1).padStart(2, "0");
    });
  }
  function currentPlaces() {
    return $$(".place-item", $("#places-list")).map(item => item.dataset.place);
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const yearEnd = new Date(today.getFullYear(), 10, 30);
  let shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthNames = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const monthTitles = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }
  function renderCalendar() {
    const label = $("#month-label");
    const grid = $("#calendar-days");
    label.textContent = `${monthTitles[shownMonth.getMonth()]} ${shownMonth.getFullYear()}`;
    grid.innerHTML = "";
    const firstDay = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7;
    for (let i=0; i<offset; i++) {
      const empty = document.createElement("span"); empty.className = "calendar-day empty"; grid.appendChild(empty);
    }
    const count = new Date(shownMonth.getFullYear(), shownMonth.getMonth()+1, 0).getDate();
    for (let day=1; day<=count; day++) {
      const date = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), day);
      const button = document.createElement("button");
      button.type = "button"; button.className = "calendar-day"; button.textContent = day;
      button.setAttribute("aria-label", `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`);
      const isBefore = date < today;
      const isAfter = date > yearEnd || date.getFullYear() !== today.getFullYear();
      button.disabled = isBefore || isAfter;
      if (dateKey(date) === dateKey(today)) button.classList.add("today");
      if (state.date && dateKey(date) === dateKey(state.date)) {
        button.classList.add("selected"); button.setAttribute("aria-pressed","true");
      } else button.setAttribute("aria-pressed","false");
      button.addEventListener("click", () => { state.date = date; renderCalendar(); });
      grid.appendChild(button);
    }
    $("#prev-month").disabled = shownMonth.getFullYear() === today.getFullYear() && shownMonth.getMonth() === today.getMonth();
    $("#next-month").disabled = shownMonth.getFullYear() > today.getFullYear() ||
      (shownMonth.getFullYear() === today.getFullYear() && shownMonth.getMonth() >= 10);
  }
  $("#prev-month").addEventListener("click", () => {
    shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth()-1, 1); renderCalendar();
  });
  $("#next-month").addEventListener("click", () => {
    shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth()+1, 1); renderCalendar();
  });

  function updateTimeMood() {
    const hour = Number($("#time-slider").value);
    state.hour = hour;
    $("#time-label").textContent = `${String(hour).padStart(2,"0")}:00`;
    const card = $("#time-card");
    let mood, icon, label;
    if (hour < 12) { mood = "morning"; icon = "☀️"; label = "утреннее солнышко"; }
    else if (hour < 18) { mood = "day"; icon = "🌤️"; label = "дневное тепло"; }
    else { mood = "evening"; icon = "🌙✨"; label = "вечер под звёздами"; }
    card.className = `glass-card time-card mood-${mood}`;
    $("#time-icon").textContent = icon;
    $("#summary-time-icon").textContent = icon;
    $("#time-period").textContent = label;
    document.body.style.background = mood === "morning"
      ? "radial-gradient(ellipse at 12% 12%,#fff 0,transparent 34%),radial-gradient(ellipse at 90% 85%,#ffe4cf 0,transparent 34%),#fff6e9"
      : mood === "evening"
        ? "radial-gradient(ellipse at 12% 12%,#f4efff 0,transparent 34%),radial-gradient(ellipse at 90% 85%,#f7d9e7 0,transparent 34%),#f6eef8"
        : "radial-gradient(ellipse at 12% 12%,#fff 0,transparent 34%),radial-gradient(ellipse at 90% 85%,#fbe0e5 0,transparent 34%),#fff7ef";
  }
  $("#time-slider").addEventListener("input", updateTimeMood);

  $("#to-card").addEventListener("click", () => {
    $("#schedule-error").textContent = "";
    if (!state.date) {
      $("#schedule-error").textContent = "Выбери, пожалуйста, дату — и соберём открытку 💗";
      return;
    }
    goTo("postcard");
  });

  function renderSummary() {
    const top = currentPlaces().slice(0,3);
    $("#summary-places").innerHTML = top.map((place, index) => `<li>${escapeHtml(place)}</li>`).join("");
    if (state.date) {
      $("#summary-date").textContent = `${state.date.getDate()} ${monthNames[state.date.getMonth()]} ${state.date.getFullYear()}`;
    }
    $("#summary-time").textContent = `${String(state.hour).padStart(2,"0")}:00 · ${$("#time-period").textContent}`;
  }

  async function sendToTelegram(payload) {
    // Token and chat ID live in Netlify environment variables, never in browser code.
    const response = await fetch("/.netlify/functions/send-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Не удалось отправить сообщение");
    return result;
  }

  $("#confirm-button").addEventListener("click", async () => {
    const button = $("#confirm-button");
    button.disabled = true;
    button.textContent = "Отправляем…";
    goTo("success");
    const payload = {
      places: currentPlaces().slice(0,3),
      date: state.date ? dateKey(state.date) : null,
      time: `${String(state.hour).padStart(2,"0")}:00`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown"
    };
    try {
      await sendToTelegram(payload);
      $("#send-status").textContent = "Готово! План отправлен 💌";
    } catch (error) {
      console.error(error);
      $("#send-status").textContent = "Открытка готова, но отправка не удалась. Проверь настройки Telegram и Netlify.";
    } finally {
      button.disabled = false;
      button.textContent = "Подтвердить выбор 💌";
    }
  });

  $("#start-over").addEventListener("click", () => {
    state.date = null; state.hour = 16;
    $("#time-slider").value = "16"; updateTimeMood();
    shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar(); goTo("intro");
  });

  renderPlaces();
  updateTimeMood();
  renderCalendar();
  goTo("intro");
})();
