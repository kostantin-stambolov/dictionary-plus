const SESSION_SIZE = 10;
const STORAGE_KEY = "dictionary-progress-v1";
const USER_STORAGE_KEY = "dictionary-user-v2";

const WORDS = [
  { ko: "물", bg: ["вода"], romanization: "mul", category: "nature", query: "water" },
  { ko: "불", bg: ["огън"], romanization: "bul", category: "nature", query: "fire" },
  { ko: "집", bg: ["къща", "дом"], romanization: "jip", category: "place", query: "house" },
  { ko: "학교", bg: ["училище"], romanization: "hakgyo", category: "place", query: "school" },
  { ko: "책", bg: ["книга"], romanization: "chaek", category: "object", query: "book" },
  { ko: "사람", bg: ["човек"], romanization: "saram", category: "people", query: "person" },
  { ko: "친구", bg: ["приятел", "приятелка"], romanization: "chingu", category: "people", query: "friends" },
  { ko: "가족", bg: ["семейство"], romanization: "gajok", category: "people", query: "family" },
  { ko: "어머니", bg: ["майка"], romanization: "eomeoni", category: "people", query: "mother" },
  { ko: "아버지", bg: ["баща"], romanization: "abeoji", category: "people", query: "father" },
  { ko: "아이", bg: ["дете"], romanization: "ai", category: "people", query: "child" },
  { ko: "남자", bg: ["мъж"], romanization: "namja", category: "people", query: "man" },
  { ko: "여자", bg: ["жена"], romanization: "yeoja", category: "people", query: "woman" },
  { ko: "이름", bg: ["име"], romanization: "ireum", category: "basic", query: "name" },
  { ko: "날", bg: ["ден"], romanization: "nal", category: "time", query: "day" },
  { ko: "밤", bg: ["нощ"], romanization: "bam", category: "time", query: "night" },
  { ko: "아침", bg: ["сутрин"], romanization: "achim", category: "time", query: "morning" },
  { ko: "저녁", bg: ["вечер"], romanization: "jeonyeok", category: "time", query: "evening" },
  { ko: "시간", bg: ["време", "час"], romanization: "sigan", category: "time", query: "time" },
  { ko: "오늘", bg: ["днес"], romanization: "oneul", category: "time", query: "today" },
  { ko: "내일", bg: ["утре"], romanization: "naeil", category: "time", query: "tomorrow" },
  { ko: "어제", bg: ["вчера"], romanization: "eoje", category: "time", query: "yesterday" },
  { ko: "음식", bg: ["храна"], romanization: "eumsik", category: "food", query: "food" },
  { ko: "밥", bg: ["ориз", "храна"], romanization: "bap", category: "food", query: "rice" },
  { ko: "빵", bg: ["хляб"], romanization: "ppang", category: "food", query: "bread" },
  { ko: "고기", bg: ["месо"], romanization: "gogi", category: "food", query: "meat" },
  { ko: "생선", bg: ["риба"], romanization: "saengseon", category: "food", query: "fish" },
  { ko: "과일", bg: ["плод"], romanization: "gwail", category: "food", query: "fruit" },
  { ko: "사과", bg: ["ябълка"], romanization: "sagwa", category: "food", query: "apple" },
  { ko: "우유", bg: ["мляко"], romanization: "uyu", category: "food", query: "milk" },
  { ko: "커피", bg: ["кафе"], romanization: "keopi", category: "food", query: "coffee" },
  { ko: "차", bg: ["чай", "кола"], romanization: "cha", category: "food", query: "tea" },
  { ko: "돈", bg: ["пари"], romanization: "don", category: "city", query: "money" },
  { ko: "가게", bg: ["магазин"], romanization: "gage", category: "city", query: "store" },
  { ko: "시장", bg: ["пазар"], romanization: "sijang", category: "city", query: "market" },
  { ko: "길", bg: ["път", "улица"], romanization: "gil", category: "city", query: "road" },
  { ko: "차", bg: ["кола", "автомобил", "чай"], romanization: "cha", category: "city", query: "car" },
  { ko: "버스", bg: ["автобус"], romanization: "beoseu", category: "city", query: "bus" },
  { ko: "기차", bg: ["влак"], romanization: "gicha", category: "city", query: "train" },
  { ko: "비행기", bg: ["самолет"], romanization: "bihaenggi", category: "city", query: "airplane" },
  { ko: "문", bg: ["врата"], romanization: "mun", category: "object", query: "door" },
  { ko: "창문", bg: ["прозорец"], romanization: "changmun", category: "object", query: "window" },
  { ko: "의자", bg: ["стол"], romanization: "uija", category: "object", query: "chair" },
  { ko: "탁자", bg: ["маса"], romanization: "takja", category: "object", query: "table" },
  { ko: "침대", bg: ["легло"], romanization: "chimdae", category: "object", query: "bed" },
  { ko: "전화", bg: ["телефон"], romanization: "jeonhwa", category: "object", query: "phone" },
  { ko: "컴퓨터", bg: ["компютър"], romanization: "keompyuteo", category: "object", query: "computer" },
  { ko: "옷", bg: ["дрехи", "дреха"], romanization: "ot", category: "object", query: "clothes" },
  { ko: "신발", bg: ["обувки", "обувка"], romanization: "sinbal", category: "object", query: "shoes" },
  { ko: "가방", bg: ["чанта"], romanization: "gabang", category: "object", query: "bag" },
  { ko: "머리", bg: ["глава", "коса"], romanization: "meori", category: "body", query: "head" },
  { ko: "눈", bg: ["око", "очи", "сняг"], romanization: "nun", category: "body", query: "eye" },
  { ko: "코", bg: ["нос"], romanization: "ko", category: "body", query: "nose" },
  { ko: "입", bg: ["уста"], romanization: "ip", category: "body", query: "mouth" },
  { ko: "손", bg: ["ръка"], romanization: "son", category: "body", query: "hand" },
  { ko: "발", bg: ["крак", "стъпало"], romanization: "bal", category: "body", query: "foot" },
  { ko: "몸", bg: ["тяло"], romanization: "mom", category: "body", query: "body" },
  { ko: "마음", bg: ["сърце", "ум"], romanization: "maeum", category: "body", query: "heart" },
  { ko: "하늘", bg: ["небе"], romanization: "haneul", category: "nature", query: "sky" },
  { ko: "땅", bg: ["земя"], romanization: "ttang", category: "nature", query: "earth" },
  { ko: "바다", bg: ["море"], romanization: "bada", category: "nature", query: "sea" },
  { ko: "산", bg: ["планина"], romanization: "san", category: "nature", query: "mountain" },
  { ko: "나무", bg: ["дърво"], romanization: "namu", category: "nature", query: "tree" },
  { ko: "꽃", bg: ["цвете"], romanization: "kkot", category: "nature", query: "flower" },
  { ko: "비", bg: ["дъжд"], romanization: "bi", category: "nature", query: "rain" },
  { ko: "눈", bg: ["сняг", "око", "очи"], romanization: "nun", category: "nature", query: "snow" },
  { ko: "바람", bg: ["вятър"], romanization: "baram", category: "nature", query: "wind" },
  { ko: "해", bg: ["слънце", "година"], romanization: "hae", category: "nature", query: "sun" },
  { ko: "달", bg: ["луна", "месец"], romanization: "dal", category: "nature", query: "moon" },
  { ko: "별", bg: ["звезда"], romanization: "byeol", category: "nature", query: "star" },
  { ko: "크다", bg: ["голям", "голяма", "голямо"], romanization: "keuda", category: "adjective", query: "large" },
  { ko: "작다", bg: ["малък", "малка", "малко"], romanization: "jakda", category: "adjective", query: "small" },
  { ko: "좋다", bg: ["добър", "добра", "добро", "хубав"], romanization: "jota", category: "adjective", query: "good" },
  { ko: "나쁘다", bg: ["лош", "лоша", "лошо"], romanization: "nappeuda", category: "adjective", query: "bad" },
  { ko: "새롭다", bg: ["нов", "нова", "ново"], romanization: "saeropda", category: "adjective", query: "new" },
  { ko: "오래되다", bg: ["стар", "стара", "старо"], romanization: "oraedoeda", category: "adjective", query: "old" },
  { ko: "빠르다", bg: ["бърз", "бърза", "бързо"], romanization: "ppareuda", category: "adjective", query: "fast" },
  { ko: "느리다", bg: ["бавен", "бавна", "бавно"], romanization: "neurida", category: "adjective", query: "slow" },
  { ko: "많다", bg: ["много"], romanization: "manta", category: "adjective", query: "many" },
  { ko: "적다", bg: ["малко"], romanization: "jeokda", category: "adjective", query: "few" },
  { ko: "가다", bg: ["отивам"], romanization: "gada", category: "verb", query: "go" },
  { ko: "오다", bg: ["идвам"], romanization: "oda", category: "verb", query: "come" },
  { ko: "보다", bg: ["виждам", "гледам"], romanization: "boda", category: "verb", query: "see" },
  { ko: "듣다", bg: ["слушам", "чувам"], romanization: "deutda", category: "verb", query: "listen" },
  { ko: "말하다", bg: ["говоря", "казвам"], romanization: "malhada", category: "verb", query: "speak" },
  { ko: "먹다", bg: ["ям"], romanization: "meokda", category: "verb", query: "eat" },
  { ko: "마시다", bg: ["пия"], romanization: "masida", category: "verb", query: "drink" },
  { ko: "자다", bg: ["спя"], romanization: "jada", category: "verb", query: "sleep" },
  { ko: "일하다", bg: ["работя"], romanization: "ilhada", category: "verb", query: "work" },
  { ko: "공부하다", bg: ["уча"], romanization: "gongbuhada", category: "verb", query: "study" },
  { ko: "읽다", bg: ["чета"], romanization: "ikda", category: "verb", query: "read" },
  { ko: "쓰다", bg: ["пиша", "използвам"], romanization: "sseuda", category: "verb", query: "write" },
  { ko: "만들다", bg: ["правя", "създавам"], romanization: "mandeulda", category: "verb", query: "make" },
  { ko: "사다", bg: ["купувам"], romanization: "sada", category: "verb", query: "buy" },
  { ko: "알다", bg: ["знам"], romanization: "alda", category: "verb", query: "know" },
  { ko: "모르다", bg: ["не знам"], romanization: "moreuda", category: "verb", query: "unknown" },
  { ko: "사랑하다", bg: ["обичам"], romanization: "saranghada", category: "verb", query: "love" },
  { ko: "기다리다", bg: ["чакам"], romanization: "gidarida", category: "verb", query: "wait" },
  { ko: "찾다", bg: ["търся", "намирам"], romanization: "chatda", category: "verb", query: "search" },
  { ko: "주다", bg: ["давам"], romanization: "juda", category: "verb", query: "give" },
];

const CATEGORY_LABELS = {
  all: "Всички",
  people: "Хора",
  time: "Време",
  food: "Храна",
  city: "Град",
  object: "Предмети",
  body: "Тяло",
  nature: "Природа",
  adjective: "Качества",
  verb: "Действия",
  place: "Места",
  basic: "Базови",
};

const CATEGORY_VISUALS = {
  people: { icon: "人", color: "#e9a25d" },
  time: { icon: "◷", color: "#4f7cac" },
  food: { icon: "◐", color: "#c95f3d" },
  city: { icon: "▦", color: "#69777f" },
  object: { icon: "◼", color: "#8a7356" },
  body: { icon: "✦", color: "#b65f76" },
  nature: { icon: "☼", color: "#4f8f63" },
  adjective: { icon: "◆", color: "#7b68a8" },
  verb: { icon: "➜", color: "#176b66" },
  place: { icon: "⌂", color: "#3d7f88" },
  basic: { icon: "●", color: "#d84e2f" },
};

const WORD_VISUALS = {
  water: "💧",
  fire: "🔥",
  house: "🏠",
  school: "🏫",
  book: "📘",
  person: "🧍",
  friends: "🧑‍🤝‍🧑",
  family: "👨‍👩‍👧",
  mother: "👩",
  father: "👨",
  child: "🧒",
  man: "👨",
  woman: "👩",
  name: "🏷️",
  day: "☀️",
  night: "🌙",
  morning: "🌅",
  evening: "🌆",
  time: "🕒",
  today: "📍",
  tomorrow: "➡️",
  yesterday: "⬅️",
  food: "🍽️",
  rice: "🍚",
  bread: "🍞",
  meat: "🥩",
  fish: "🐟",
  fruit: "🍎",
  apple: "🍎",
  milk: "🥛",
  coffee: "☕",
  tea: "🍵",
  money: "💵",
  store: "🏪",
  market: "🧺",
  road: "🛣️",
  car: "🚗",
  bus: "🚌",
  train: "🚆",
  airplane: "✈️",
  door: "🚪",
  window: "🪟",
  chair: "🪑",
  table: "🍽️",
  bed: "🛏️",
  phone: "☎️",
  computer: "💻",
  clothes: "👕",
  shoes: "👟",
  bag: "🎒",
  head: "🙂",
  eye: "👁️",
  nose: "👃",
  mouth: "👄",
  hand: "✋",
  foot: "🦶",
  body: "🧍",
  heart: "❤️",
  sky: "🌤️",
  earth: "🌍",
  sea: "🌊",
  mountain: "⛰️",
  tree: "🌳",
  flower: "🌸",
  rain: "🌧️",
  snow: "❄️",
  wind: "💨",
  sun: "☀️",
  moon: "🌙",
  star: "⭐",
  large: "⬛",
  small: "▪️",
  good: "👍",
  bad: "👎",
  new: "✨",
  old: "🕰️",
  fast: "⚡",
  slow: "🐢",
  many: "🔢",
  few: "▫️",
  go: "🚶",
  come: "👋",
  see: "👁️",
  listen: "👂",
  speak: "💬",
  eat: "🍽️",
  drink: "🥤",
  sleep: "😴",
  work: "💼",
  study: "📚",
  read: "📖",
  write: "✍️",
  make: "🛠️",
  buy: "🛒",
  know: "💡",
  unknown: "❓",
  love: "❤️",
  wait: "⌛",
  search: "🔎",
  give: "🤲",
};

const WORD_BY_KEY = new Map(WORDS.map((word) => [wordKey(word), word]));
const storedUserData = loadUserData();

const state = {
  user: storedUserData.user,
  backendAvailable: false,
  booting: true,
  authMode: "login",
  authDraft: storedUserData.user.name === "Default user" ? "" : storedUserData.user.name,
  pinDraft: "",
  syncMessage: "Зареждане...",
  mode: storedUserData.ui.mode,
  category: storedUserData.ui.category,
  focused: storedUserData.ui.focused,
  activeIndex: storedUserData.ui.activeIndex,
  showBulgarian: true,
  quizIndex: 0,
  quizInput: "",
  quizResults: [],
  answerState: null,
  progress: storedUserData.progress,
  sessions: storedUserData.sessions,
};

const app = document.getElementById("app");

app.addEventListener("click", handleClick);
app.addEventListener("input", handleInput);
app.addEventListener("submit", handleSubmit);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

render();
bootBackend();

function render() {
  const words = filteredWords();
  const session = currentSession(words);
  const current = session[state.activeIndex] || session[0] || words[0];
  const learned = Object.keys(state.progress.learned).length;
  const mastered = Object.values(state.progress.learned).filter((item) => item.correct >= 3).length;
  const dictionaryLabel = `${CATEGORY_LABELS[state.category]} · Корейски → Български`;
  const sessionRange = session.length ? `${session.length} от ${words.length}` : `0 от ${words.length}`;

  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Активен речник</p>
        <h1>Dictionary</h1>
        <p class="dictionary-meta">${dictionaryLabel}</p>
        <p class="user-pill">Потребител: ${escapeHtml(state.user.name)} · ${state.backendAvailable ? "Postgres sync" : "local dev"}</p>
      </div>
      ${
        state.focused
          ? `<button class="text-button" data-action="change-session">Смени</button>`
          : `<button class="icon-button" data-action="reset-session" title="Нова сесия" aria-label="Нова сесия">↻</button>`
      }
    </header>

    ${renderLogin()}

    ${
      state.focused
        ? renderFocused(session, current, words)
        : renderHome({ learned, mastered, sessionRange })
    }
  `;
}

function renderLogin() {
  if (state.focused) return "";

  const isLoggedIn = state.user.id && state.user.id !== "local" && state.user.id !== "default";
  if (isLoggedIn && state.backendAvailable) {
    return `
      <div class="login-row">
        <p>Здравей, <strong>${escapeHtml(state.user.name)}</strong></p>
        <button class="text-button" data-action="logout">Смени профил</button>
        <p>${escapeHtml(state.syncMessage)}</p>
      </div>
    `;
  }

  if (!state.backendAvailable) {
    return `
      <div class="login-row">
        <p>${escapeHtml(state.syncMessage)}</p>
      </div>
    `;
  }

  const isRegister = state.authMode === "register";
  return `
    <form class="login-row" data-form="auth">
      <div class="auth-toggle">
        <button type="button" class="${!isRegister ? "active" : ""}" data-action="set-auth-login">Влез</button>
        <button type="button" class="${isRegister ? "active" : ""}" data-action="set-auth-register">Регистрация</button>
      </div>
      <label>
        <span>Име</span>
        <input name="displayName" value="${escapeHtml(state.authDraft)}" placeholder="например: Mira" autocomplete="username" />
      </label>
      <label>
        <span>PIN (4–6 цифри)</span>
        <input name="pin" type="password" inputmode="numeric" maxlength="6" value="${escapeHtml(state.pinDraft)}" placeholder="••••" autocomplete="${isRegister ? "new-password" : "current-password"}" />
      </label>
      <button class="primary" type="submit">${isRegister ? "Създай профил" : "Влез"}</button>
      <p>${escapeHtml(state.syncMessage)}</p>
    </form>
  `;
}

function renderHome({ learned, mastered, sessionRange }) {
  return `
    <section class="stats" aria-label="Прогрес">
      <div><strong>${CATEGORY_LABELS[state.category]}</strong><span>сет думи</span></div>
      <div><strong>${sessionRange}</strong><span>текуща сесия</span></div>
      <div><strong>${mastered}/${learned || 0}</strong><span>стабилни / учени</span></div>
    </section>

    <section class="filters" aria-label="Категории">
      ${Object.keys(CATEGORY_LABELS)
        .map(
          (key) => `<button class="${state.category === key ? "active" : ""}" data-category="${key}">${CATEGORY_LABELS[key]}</button>`,
        )
        .join("")}
    </section>

    <nav class="mode-grid" aria-label="Режим">
      <button class="primary" data-mode="learn">Започни учене</button>
      <button data-mode="quiz">Куиз със сесията</button>
      <button data-mode="library">Отвори речника</button>
    </nav>
  `;
}

function renderFocused(session, current, words) {
  return `
    ${state.mode === "learn" ? renderLearn(session, current, words) : ""}
    ${state.mode === "quiz" ? renderQuiz(session) : ""}
    ${state.mode === "library" ? renderLibrary(words) : ""}
  `;
}

function renderLearn(session, current, words) {
  if (!current) return renderEmpty();
  if (state.sessions[state.category]?.completed) return renderSessionComplete(session, words);
  const progress = ((state.activeIndex + 1) / session.length) * 100;
  return `
    <section class="session-head">
      <div>
        <p class="section-title">Сесия от ${session.length} ${session.length === 1 ? "дума" : "думи"}</p>
        <p>${state.activeIndex + 1} от ${session.length} · ${wordCountLabel(words.length)} в избрания сет</p>
      </div>
      <button class="text-button" data-action="start-quiz">Започни куиз</button>
    </section>

    <div class="progress-track"><span style="width:${progress}%"></span></div>

    <article class="word-card">
      ${renderVisual(current, "large")}
      <div class="word-content">
        <p class="romanization">${current.romanization}</p>
        <h2 lang="ko">${current.ko}</h2>
        <p class="translation ${state.showBulgarian ? "" : "hidden"}">${current.bg.join(" / ")}</p>
      </div>
    </article>

    <section class="practice">
      <button data-action="speak">Чуй думата</button>
      <button data-action="toggle-translation">${state.showBulgarian ? "Скрий превода" : "Покажи превода"}</button>
      <button class="primary" data-action="know-next">Знам я →</button>
    </section>

    <section class="pager">
      <button data-action="prev" ${state.activeIndex === 0 ? "disabled" : ""}>← Назад</button>
      <button data-action="${state.activeIndex === session.length - 1 ? "complete-session" : "next"}">${state.activeIndex === session.length - 1 ? "Приключи" : "Напред →"}</button>
    </section>
  `;
}

function renderSessionComplete(session, words) {
  return `
    <section class="result-panel">
      <p class="section-title">Сесията е завършена</p>
      <h2>${session.length}/${SESSION_SIZE}</h2>
      <p>Тези думи са минати за ${escapeHtml(state.user.name)}. Продължи с куиз или започни нова сесия от същия сет.</p>
      <div class="practice">
        <button class="primary" data-action="start-quiz">Започни куиз</button>
        <button data-action="new-session">Нова сесия</button>
      </div>
    </section>
  `;
}

function renderQuiz(session) {
  if (!session.length) return renderEmpty();

  if (state.quizIndex >= session.length) {
    const correct = state.quizResults.filter(Boolean).length;
    return `
      <section class="result-panel">
        <p class="section-title">Резултат</p>
        <h2>${correct}/${session.length}</h2>
        <p>Целта на първото ниво е да разпознаваш корейската дума и да напишеш правилно значението на български.</p>
        <div class="result-list">
          ${session
            .map(
              (word, index) => `
                <div class="${state.quizResults[index] ? "ok" : "miss"}">
                  <span lang="ko">${word.ko}</span>
                  <strong>${word.bg.join(" / ")}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
        <button class="primary" data-action="restart-quiz">Нов куиз със същите думи</button>
      </section>
    `;
  }

  const word = session[state.quizIndex];
  return `
    <form class="quiz-card">
      <p class="section-title">Куиз · ${state.quizIndex + 1}/${session.length}</p>
      <div class="quiz-word" lang="ko">${word.ko}</div>
      <p class="romanization">${word.romanization}</p>
      <label>
        <span>Значение на български</span>
        <input
          name="quiz"
          value="${escapeHtml(state.quizInput)}"
          placeholder="например: вода"
          autocomplete="off"
          autocapitalize="none"
          autofocus
        />
      </label>
      ${state.answerState ? renderAnswerState(word) : ""}
      <div class="practice">
        <button type="button" data-action="speak-quiz">Чуй</button>
        <button type="submit" class="primary">${state.answerState ? "Следваща" : "Провери"}</button>
      </div>
    </form>
  `;
}

function renderAnswerState(word) {
  const isCorrect = state.answerState === "correct";
  return `
    <div class="answer ${isCorrect ? "correct" : "wrong"}">
      ${isCorrect ? "Правилно." : `Не точно. Верен отговор: ${word.bg.join(" / ")}.`}
    </div>
  `;
}

function renderLibrary(words) {
  return `
    <section class="library">
      ${words
        .map(
          (word) => `
            <article class="library-row">
              ${renderVisual(word, "thumb")}
              <div>
                <strong lang="ko">${word.ko}</strong>
                <span>${word.romanization}</span>
              </div>
              <p>${word.bg.join(" / ")}</p>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderVisual(word, size = "small") {
  const visual = CATEGORY_VISUALS[word.category] || CATEGORY_VISUALS.basic;
  const icon = WORD_VISUALS[word.query] || visual.icon;
  const translation = escapeHtml(word.bg[0]);
  return `
    <div class="word-visual ${size}" style="--visual-color:${visual.color}" role="img" aria-label="${translation}">
      <span class="visual-icon">${icon}</span>
    </div>
  `;
}

function renderEmpty() {
  return `<section class="empty">Няма думи в тази категория.</section>`;
}

async function bootBackend() {
  try {
    const health = await apiGet("/api/health");
    state.backendAvailable = Boolean(health.database);

    if (state.backendAvailable) {
      const userId = state.user.id;
      const hasRealUserId = userId && userId !== "local" && userId !== "default";
      if (hasRealUserId) {
        await restoreSession(userId);
      } else {
        state.syncMessage = "Влез или се регистрирай.";
        state.booting = false;
        render();
      }
    } else {
      state.syncMessage = "Локален режим без DATABASE_URL.";
      state.booting = false;
      render();
    }
  } catch {
    state.backendAvailable = false;
    state.booting = false;
    state.syncMessage = "Локален режим. Server API не е достъпен.";
    render();
  }
}

async function restoreSession(userId) {
  state.syncMessage = "Възстановяване на профил...";
  try {
    const payload = await apiGet(`/api/state?userId=${userId}`);
    applyRemoteState(payload.user, payload.state);
    state.syncMessage = "Профилът е възстановен.";
  } catch {
    state.user = { id: "local", name: "" };
    state.syncMessage = "Сесията е изтекла. Влез отново.";
    saveUserData();
  } finally {
    state.booting = false;
    render();
  }
}

async function loginUser(displayName, pin) {
  const name = normalizeDisplayName(displayName);
  state.syncMessage = "Влизане...";
  render();
  try {
    const payload = await apiPost("/api/login", { displayName: name, pin });
    applyRemoteState(payload.user, payload.state);
    state.syncMessage = "Добре дошъл, " + (payload.user.displayName || name) + "!";
  } catch (error) {
    state.syncMessage = error.message || "Неуспешно влизане.";
  } finally {
    state.booting = false;
    render();
  }
}

async function registerUser(displayName, pin) {
  const name = normalizeDisplayName(displayName);
  state.syncMessage = "Създаване на профил...";
  render();
  try {
    const payload = await apiPost("/api/register", { displayName: name, pin });
    applyRemoteState(payload.user, payload.state);
    state.syncMessage = "Профилът е създаден. Добре дошъл, " + (payload.user.displayName || name) + "!";
  } catch (error) {
    state.syncMessage = error.message || "Неуспешна регистрация.";
  } finally {
    state.booting = false;
    render();
  }
}

function handleClick(event) {
  const mode = event.target.closest("[data-mode]")?.dataset.mode;
  const category = event.target.closest("[data-category]")?.dataset.category;
  const action = event.target.closest("[data-action]")?.dataset.action;

  if (mode) {
    state.mode = mode;
    state.focused = true;
    if (mode === "quiz") resetQuiz();
    saveUserData();
    render();
    return;
  }

  if (category) {
    state.category = category;
    const sessionRecord = ensureSession(category, filteredWords(), false);
    state.activeIndex = sessionRecord.activeIndex || 0;
    resetQuiz();
    saveUserData();
    render();
    return;
  }

  if (!action) return;

  const words = filteredWords();
  const session = currentSession(words);

  if (action === "logout") {
    state.user = { id: "local", name: "" };
    state.authDraft = "";
    state.pinDraft = "";
    state.syncMessage = "Излязъл си.";
    state.focused = false;
    state.progress = { learned: {} };
    state.sessions = {};
    saveUserData();
    render();
    return;
  }

  if (action === "set-auth-login") {
    state.authMode = "login";
    state.syncMessage = "";
    render();
    return;
  }

  if (action === "set-auth-register") {
    state.authMode = "register";
    state.syncMessage = "";
    render();
    return;
  }

  if (action === "reset-session") {
    createSession(state.category, words, true);
    resetQuiz();
  }

  if (action === "new-session") {
    createSession(state.category, words, true);
    resetQuiz();
  }

  if (action === "change-session") {
    state.focused = false;
  }

  if (action === "start-quiz") {
    state.mode = "quiz";
    state.focused = true;
    resetQuiz();
  }

  if (action === "prev") {
    state.activeIndex = Math.max(0, state.activeIndex - 1);
    saveActiveIndex();
  }

  if (action === "next") {
    advanceSession(session, words, false);
  }

  if (action === "complete-session") {
    completeCurrentSession();
  }

  if (action === "toggle-translation") {
    state.showBulgarian = !state.showBulgarian;
  }

  if (action === "know-next") {
    const word = session[state.activeIndex];
    bumpProgress(word, "known");
    advanceSession(session, words, true);
  }

  if (action === "speak" || action === "speak-quiz") {
    const word = action === "speak" ? session[state.activeIndex] : session[state.quizIndex];
    speak(word?.ko);
  }

  if (action === "restart-quiz") {
    resetQuiz();
  }

  saveUserData();
  render();
}

function handleInput(event) {
  if (event.target.name === "quiz") {
    state.quizInput = event.target.value;
    saveUiState();
  }

  if (event.target.name === "displayName") {
    state.authDraft = event.target.value;
  }

  if (event.target.name === "pin") {
    state.pinDraft = event.target.value.replace(/\D/g, "").slice(0, 6);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (event.target.dataset.form === "auth") {
    if (state.authMode === "register") {
      await registerUser(state.authDraft, state.pinDraft);
    } else {
      await loginUser(state.authDraft, state.pinDraft);
    }
    render();
    return;
  }

  const session = currentSession(filteredWords());
  const word = session[state.quizIndex];

  if (!word) return;

  if (state.answerState) {
    state.quizIndex += 1;
    state.quizInput = "";
    state.answerState = null;
    saveUserData();
    render();
    return;
  }

  const correct = word.bg.some((answer) => normalize(answer) === normalize(state.quizInput));
  state.answerState = correct ? "correct" : "wrong";
  state.quizResults[state.quizIndex] = correct;
  bumpProgress(word, correct ? "correct" : "wrong");
  saveUserData();
  render();
}

function filteredWords() {
  if (state.category === "all") return WORDS;

  const selected = WORDS.filter((word) => word.category === state.category);
  if (selected.length >= SESSION_SIZE) return selected;

  const selectedKeys = new Set(selected.map(wordKey));
  const supplement = WORDS.filter((word) => !selectedKeys.has(wordKey(word))).slice(0, SESSION_SIZE - selected.length);
  return [...selected, ...supplement];
}

function currentSession(words) {
  const sessionRecord = ensureSession(state.category, words, false);
  state.activeIndex = Math.min(sessionRecord.activeIndex || 0, Math.max(0, sessionRecord.wordKeys.length - 1));
  sessionRecord.activeIndex = state.activeIndex;
  return sessionRecord.wordKeys.map((key) => WORD_BY_KEY.get(key)).filter(Boolean);
}

function ensureSession(category, words, forceNew) {
  const existing = state.sessions[category];
  const validKeys = new Set(words.map(wordKey));
  const existingKeys = existing?.wordKeys?.filter((key) => validKeys.has(key)) || [];

  if (!forceNew && existingKeys.length >= SESSION_SIZE) {
    existing.wordKeys = existingKeys.slice(0, SESSION_SIZE);
    existing.activeIndex = Math.min(existing.activeIndex || 0, Math.max(0, existing.wordKeys.length - 1));
    return existing;
  }

  return createSession(category, words, forceNew);
}

function createSession(category, words, countAsNewRound) {
  const previous = state.sessions[category];
  const round = (previous?.round || 0) + (countAsNewRound ? 1 : 0);
  const selected = selectSessionWords(words, round);
  const record = {
    wordKeys: selected.map(wordKey),
    activeIndex: 0,
    round,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  state.sessions[category] = record;
  state.activeIndex = 0;
  state.showBulgarian = true;
  saveUserData();
  return record;
}

function selectSessionWords(words, round) {
  return [...words]
    .sort((left, right) => {
      const leftScore = wordPriority(left);
      const rightScore = wordPriority(right);
      if (leftScore !== rightScore) return leftScore - rightScore;
      return stableHash(`${wordKey(left)}:${round}`) - stableHash(`${wordKey(right)}:${round}`);
    })
    .slice(0, SESSION_SIZE);
}

function wordPriority(word) {
  const progress = state.progress.learned[wordKey(word)] || {};
  return (progress.known || 0) + (progress.correct || 0) * 2 - (progress.wrong || 0);
}

function resetQuiz() {
  state.quizIndex = 0;
  state.quizInput = "";
  state.quizResults = [];
  state.answerState = null;
}

function advanceSession(session, words, completeAtEnd) {
  if (state.activeIndex >= session.length - 1) {
    if (completeAtEnd) {
      completeCurrentSession();
    } else {
      createSession(state.category, words, true);
    }
  } else {
    state.activeIndex += 1;
    saveActiveIndex();
  }
  state.showBulgarian = true;
}

function completeCurrentSession() {
  const sessionRecord = state.sessions[state.category];
  if (sessionRecord) {
    sessionRecord.completed = true;
    sessionRecord.completedAt = new Date().toISOString();
    sessionRecord.activeIndex = state.activeIndex;
  }
  saveUserData();
}

function saveActiveIndex() {
  const sessionRecord = state.sessions[state.category];
  if (sessionRecord) {
    sessionRecord.activeIndex = state.activeIndex;
  }
  saveUserData();
}

function bumpProgress(word, field) {
  if (!word) return;
  const key = wordKey(word);
  const current = state.progress.learned[key] || { known: 0, correct: 0, wrong: 0 };
  current[field] = (current[field] || 0) + 1;
  current.lastSeen = new Date().toISOString();
  state.progress.learned[key] = current;
  saveProgress();
}

function wordKey(word) {
  return `${word.ko}:${word.bg[0]}`;
}

function wordCountLabel(count) {
  return `${count} ${count === 1 ? "дума" : "думи"}`;
}

function normalizeDisplayName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return name || "Default user";
}

function loadUserData() {
  const fallback = {
    user: { id: "default", name: "Default user" },
    progress: loadProgress(),
    sessions: {},
    ui: { category: "all", mode: "learn", activeIndex: 0, focused: false },
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
    if (!parsed) return fallback;
    return {
      user: normalizeStoredUser(parsed.user || fallback.user),
      progress: parsed.progress || fallback.progress,
      sessions: parsed.sessions || {},
      ui: {
        category: parsed.ui?.category || "all",
        mode: parsed.ui?.mode || "learn",
        activeIndex: parsed.ui?.activeIndex || 0,
        focused: Boolean(parsed.ui?.focused),
      },
    };
  } catch {
    return fallback;
  }
}

function normalizeStoredUser(user) {
  return {
    id: user.id || "local",
    name: user.name || user.displayName || "Default user",
  };
}

function applyRemoteState(user, remoteState) {
  state.user = { id: user.id, name: user.displayName || user.name || "Default user" };
  state.authDraft = state.user.name;
  state.progress = remoteState.progress || { learned: {} };
  state.sessions = remoteState.sessions || {};
  state.category = remoteState.ui?.category || "all";
  state.mode = remoteState.ui?.mode || "learn";
  state.activeIndex = remoteState.ui?.activeIndex || 0;
  state.focused = Boolean(remoteState.ui?.focused);
  state.showBulgarian = true;
  resetQuiz();
  saveUserData();
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { learned: {} };
  } catch {
    return { learned: {} };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function saveUiState() {
  saveUserData();
}

function saveUserData() {
  const sessionRecord = state.sessions[state.category];
  if (sessionRecord) {
    sessionRecord.activeIndex = state.activeIndex;
  }

  const data = {
    user: state.user,
    progress: state.progress,
    sessions: state.sessions,
    ui: {
      category: state.category,
      mode: state.mode,
      activeIndex: state.activeIndex,
      focused: state.focused,
    },
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));

  if (state.backendAvailable && state.user.id && state.user.id !== "local") {
    queueSync(data);
  }
}

let syncTimer = null;
let latestSyncData = null;

function queueSync(data) {
  latestSyncData = data;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(syncNow, 250);
}

async function syncNow() {
  if (!latestSyncData || !state.backendAvailable || !state.user.id) return;
  const data = latestSyncData;
  latestSyncData = null;

  try {
    await apiPost("/api/sync", {
      userId: state.user.id,
      state: {
        progress: data.progress,
        sessions: data.sessions,
        ui: data.ui,
      },
    });
    state.syncMessage = "Синхронизирано.";
  } catch (error) {
    state.syncMessage = error.message || "Sync failed.";
  }
}

async function apiGet(path) {
  const response = await fetch(path);
  return readApiResponse(response);
}

async function apiPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse(response);
}

async function readApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "API request failed.");
  }
  return payload;
}

function stableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function speak(text) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function normalize(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
