const http = require("http");
const fs = require("fs");
const path = require("path");

let Pool;
try {
  ({ Pool } = require("pg"));
} catch {
  Pool = null;
}

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const HAS_DATABASE = Boolean(process.env.DATABASE_URL && Pool);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const pool = HAS_DATABASE
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
    })
  : null;

// ── Rate limiting (in-memory) ──────────────────────────────
const loginAttempts = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;

function checkRateLimit(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  if (entry.count >= RATE_MAX) {
    const mins = Math.ceil((entry.resetAt - now) / 60000);
    throwHttp(429, `Твърде много опити. Изчакай ${mins} мин.`);
  }
  entry.count++;
}

function clearRateLimit(key) {
  loginAttempts.delete(key);
}

// ── Session auth ───────────────────────────────────────────
async function createSession(userId) {
  const result = await pool.query(
    `insert into user_sessions (user_id) values ($1) returning id`,
    [userId],
  );
  return result.rows[0].id;
}

function extractToken(request) {
  const auth = request.headers["authorization"] || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
}

async function requireSession(request) {
  const token = extractToken(request);
  if (!token) throwHttp(401, "Необходима е автентикация.");
  const result = await pool.query(
    `select user_id from user_sessions where id = $1 and expires_at > now()`,
    [token],
  );
  if (!result.rows[0]) throwHttp(401, "Невалидна или изтекла сесия.");
  return result.rows[0].user_id;
}

function throwHttp(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

// ── Schema ─────────────────────────────────────────────────
const migrations = `
create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_users add column if not exists pin_hash text;

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists user_sessions_user_idx on user_sessions (user_id);

create table if not exists language_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  from_lang text not null,
  to_lang text not null,
  description text,
  is_public boolean not null default true,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references language_packs(id) on delete cascade,
  term text not null,
  translations jsonb not null,
  romanization text,
  category text,
  visual_query text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(pack_id, term)
);

create index if not exists words_pack_idx on words (pack_id, category, sort_order);

create table if not exists user_dictionary_state (
  user_id uuid primary key references app_users(id) on delete cascade,
  progress jsonb not null default '{"learned": {}}'::jsonb,
  sessions jsonb not null default '{}'::jsonb,
  ui jsonb not null default '{"category": "all", "mode": "learn", "activeIndex": 0, "focused": false}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  event_type text not null,
  category text,
  mode text,
  duration_seconds int,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists app_users_handle_idx on app_users (handle);
create index if not exists activity_log_user_idx on activity_log (user_id, created_at desc);
`;

// ── Korean pack seed data ─────────────────────────────────
const KOREAN_WORDS = [
  { term: "물", translations: ["вода"], romanization: "mul", category: "nature", visual_query: "water" },
  { term: "불", translations: ["огън"], romanization: "bul", category: "nature", visual_query: "fire" },
  { term: "집", translations: ["къща", "дом"], romanization: "jip", category: "place", visual_query: "house" },
  { term: "학교", translations: ["училище"], romanization: "hakgyo", category: "place", visual_query: "school" },
  { term: "책", translations: ["книга"], romanization: "chaek", category: "object", visual_query: "book" },
  { term: "사람", translations: ["човек"], romanization: "saram", category: "people", visual_query: "person" },
  { term: "친구", translations: ["приятел", "приятелка"], romanization: "chingu", category: "people", visual_query: "friends" },
  { term: "가족", translations: ["семейство"], romanization: "gajok", category: "people", visual_query: "family" },
  { term: "어머니", translations: ["майка"], romanization: "eomeoni", category: "people", visual_query: "mother" },
  { term: "아버지", translations: ["баща"], romanization: "abeoji", category: "people", visual_query: "father" },
  { term: "아이", translations: ["дете"], romanization: "ai", category: "people", visual_query: "child" },
  { term: "남자", translations: ["мъж"], romanization: "namja", category: "people", visual_query: "man" },
  { term: "여자", translations: ["жена"], romanization: "yeoja", category: "people", visual_query: "woman" },
  { term: "이름", translations: ["име"], romanization: "ireum", category: "basic", visual_query: "name" },
  { term: "날", translations: ["ден"], romanization: "nal", category: "time", visual_query: "day" },
  { term: "밤", translations: ["нощ"], romanization: "bam", category: "time", visual_query: "night" },
  { term: "아침", translations: ["сутрин"], romanization: "achim", category: "time", visual_query: "morning" },
  { term: "저녁", translations: ["вечер"], romanization: "jeonyeok", category: "time", visual_query: "evening" },
  { term: "시간", translations: ["време", "час"], romanization: "sigan", category: "time", visual_query: "time" },
  { term: "오늘", translations: ["днес"], romanization: "oneul", category: "time", visual_query: "today" },
  { term: "내일", translations: ["утре"], romanization: "naeil", category: "time", visual_query: "tomorrow" },
  { term: "어제", translations: ["вчера"], romanization: "eoje", category: "time", visual_query: "yesterday" },
  { term: "음식", translations: ["храна"], romanization: "eumsik", category: "food", visual_query: "food" },
  { term: "밥", translations: ["ориз", "храна"], romanization: "bap", category: "food", visual_query: "rice" },
  { term: "빵", translations: ["хляб"], romanization: "ppang", category: "food", visual_query: "bread" },
  { term: "고기", translations: ["месо"], romanization: "gogi", category: "food", visual_query: "meat" },
  { term: "생선", translations: ["риба"], romanization: "saengseon", category: "food", visual_query: "fish" },
  { term: "과일", translations: ["плод"], romanization: "gwail", category: "food", visual_query: "fruit" },
  { term: "사과", translations: ["ябълка"], romanization: "sagwa", category: "food", visual_query: "apple" },
  { term: "우유", translations: ["мляко"], romanization: "uyu", category: "food", visual_query: "milk" },
  { term: "커피", translations: ["кафе"], romanization: "keopi", category: "food", visual_query: "coffee" },
  { term: "차", translations: ["чай", "кола"], romanization: "cha", category: "food", visual_query: "tea" },
  { term: "돈", translations: ["пари"], romanization: "don", category: "city", visual_query: "money" },
  { term: "가게", translations: ["магазин"], romanization: "gage", category: "city", visual_query: "store" },
  { term: "시장", translations: ["пазар"], romanization: "sijang", category: "city", visual_query: "market" },
  { term: "길", translations: ["път", "улица"], romanization: "gil", category: "city", visual_query: "road" },
  { term: "버스", translations: ["автобус"], romanization: "beoseu", category: "city", visual_query: "bus" },
  { term: "기차", translations: ["влак"], romanization: "gicha", category: "city", visual_query: "train" },
  { term: "비행기", translations: ["самолет"], romanization: "bihaenggi", category: "city", visual_query: "airplane" },
  { term: "문", translations: ["врата"], romanization: "mun", category: "object", visual_query: "door" },
  { term: "창문", translations: ["прозорец"], romanization: "changmun", category: "object", visual_query: "window" },
  { term: "의자", translations: ["стол"], romanization: "uija", category: "object", visual_query: "chair" },
  { term: "탁자", translations: ["маса"], romanization: "takja", category: "object", visual_query: "table" },
  { term: "침대", translations: ["легло"], romanization: "chimdae", category: "object", visual_query: "bed" },
  { term: "전화", translations: ["телефон"], romanization: "jeonhwa", category: "object", visual_query: "phone" },
  { term: "컴퓨터", translations: ["компютър"], romanization: "keompyuteo", category: "object", visual_query: "computer" },
  { term: "옷", translations: ["дрехи", "дреха"], romanization: "ot", category: "object", visual_query: "clothes" },
  { term: "신발", translations: ["обувки", "обувка"], romanization: "sinbal", category: "object", visual_query: "shoes" },
  { term: "가방", translations: ["чанта"], romanization: "gabang", category: "object", visual_query: "bag" },
  { term: "머리", translations: ["глава", "коса"], romanization: "meori", category: "body", visual_query: "head" },
  { term: "눈", translations: ["око", "очи", "сняг"], romanization: "nun", category: "body", visual_query: "eye" },
  { term: "코", translations: ["нос"], romanization: "ko", category: "body", visual_query: "nose" },
  { term: "입", translations: ["уста"], romanization: "ip", category: "body", visual_query: "mouth" },
  { term: "손", translations: ["ръка"], romanization: "son", category: "body", visual_query: "hand" },
  { term: "발", translations: ["крак", "стъпало"], romanization: "bal", category: "body", visual_query: "foot" },
  { term: "몸", translations: ["тяло"], romanization: "mom", category: "body", visual_query: "body" },
  { term: "마음", translations: ["сърце", "ум"], romanization: "maeum", category: "body", visual_query: "heart" },
  { term: "하늘", translations: ["небе"], romanization: "haneul", category: "nature", visual_query: "sky" },
  { term: "땅", translations: ["земя"], romanization: "ttang", category: "nature", visual_query: "earth" },
  { term: "바다", translations: ["море"], romanization: "bada", category: "nature", visual_query: "sea" },
  { term: "산", translations: ["планина"], romanization: "san", category: "nature", visual_query: "mountain" },
  { term: "나무", translations: ["дърво"], romanization: "namu", category: "nature", visual_query: "tree" },
  { term: "꽃", translations: ["цвете"], romanization: "kkot", category: "nature", visual_query: "flower" },
  { term: "비", translations: ["дъжд"], romanization: "bi", category: "nature", visual_query: "rain" },
  { term: "눈", translations: ["сняг", "око", "очи"], romanization: "nun", category: "nature", visual_query: "snow" },
  { term: "바람", translations: ["вятър"], romanization: "baram", category: "nature", visual_query: "wind" },
  { term: "해", translations: ["слънце", "година"], romanization: "hae", category: "nature", visual_query: "sun" },
  { term: "달", translations: ["луна", "месец"], romanization: "dal", category: "nature", visual_query: "moon" },
  { term: "별", translations: ["звезда"], romanization: "byeol", category: "nature", visual_query: "star" },
  { term: "크다", translations: ["голям", "голяма", "голямо"], romanization: "keuda", category: "adjective", visual_query: "large" },
  { term: "작다", translations: ["малък", "малка", "малко"], romanization: "jakda", category: "adjective", visual_query: "small" },
  { term: "좋다", translations: ["добър", "добра", "добро", "хубав"], romanization: "jota", category: "adjective", visual_query: "good" },
  { term: "나쁘다", translations: ["лош", "лоша", "лошо"], romanization: "nappeuda", category: "adjective", visual_query: "bad" },
  { term: "새롭다", translations: ["нов", "нова", "ново"], romanization: "saeropda", category: "adjective", visual_query: "new" },
  { term: "오래되다", translations: ["стар", "стара", "старо"], romanization: "oraedoeda", category: "adjective", visual_query: "old" },
  { term: "빠르다", translations: ["бърз", "бърза", "бързо"], romanization: "ppareuda", category: "adjective", visual_query: "fast" },
  { term: "느리다", translations: ["бавен", "бавна", "бавно"], romanization: "neurida", category: "adjective", visual_query: "slow" },
  { term: "많다", translations: ["много"], romanization: "manta", category: "adjective", visual_query: "many" },
  { term: "적다", translations: ["малко"], romanization: "jeokda", category: "adjective", visual_query: "few" },
  { term: "가다", translations: ["отивам"], romanization: "gada", category: "verb", visual_query: "go" },
  { term: "오다", translations: ["идвам"], romanization: "oda", category: "verb", visual_query: "come" },
  { term: "보다", translations: ["виждам", "гледам"], romanization: "boda", category: "verb", visual_query: "see" },
  { term: "듣다", translations: ["слушам", "чувам"], romanization: "deutda", category: "verb", visual_query: "listen" },
  { term: "말하다", translations: ["говоря", "казвам"], romanization: "malhada", category: "verb", visual_query: "speak" },
  { term: "먹다", translations: ["ям"], romanization: "meokda", category: "verb", visual_query: "eat" },
  { term: "마시다", translations: ["пия"], romanization: "masida", category: "verb", visual_query: "drink" },
  { term: "자다", translations: ["спя"], romanization: "jada", category: "verb", visual_query: "sleep" },
  { term: "일하다", translations: ["работя"], romanization: "ilhada", category: "verb", visual_query: "work" },
  { term: "공부하다", translations: ["уча"], romanization: "gongbuhada", category: "verb", visual_query: "study" },
  { term: "읽다", translations: ["чета"], romanization: "ikda", category: "verb", visual_query: "read" },
  { term: "쓰다", translations: ["пиша", "използвам"], romanization: "sseuda", category: "verb", visual_query: "write" },
  { term: "만들다", translations: ["правя", "създавам"], romanization: "mandeulda", category: "verb", visual_query: "make" },
  { term: "사다", translations: ["купувам"], romanization: "sada", category: "verb", visual_query: "buy" },
  { term: "알다", translations: ["знам"], romanization: "alda", category: "verb", visual_query: "know" },
  { term: "모르다", translations: ["не знам"], romanization: "moreuda", category: "verb", visual_query: "unknown" },
  { term: "사랑하다", translations: ["обичам"], romanization: "saranghada", category: "verb", visual_query: "love" },
  { term: "기다리다", translations: ["чакам"], romanization: "gidarida", category: "verb", visual_query: "wait" },
  { term: "찾다", translations: ["търся", "намирам"], romanization: "chatda", category: "verb", visual_query: "search" },
  { term: "주다", translations: ["давам"], romanization: "juda", category: "verb", visual_query: "give" },
];

async function seedKoreanPack() {
  const existing = await pool.query(`select id from language_packs where slug = 'ko-bg'`);
  if (existing.rows[0]) return existing.rows[0].id;

  const pack = await pool.query(
    `insert into language_packs (slug, name, from_lang, to_lang, description)
     values ('ko-bg', 'Корейски → Български', 'ko', 'bg', '100 стартови думи — корейски на български')
     returning id`,
  );
  const packId = pack.rows[0].id;

  for (let i = 0; i < KOREAN_WORDS.length; i++) {
    const w = KOREAN_WORDS[i];
    await pool.query(
      `insert into words (pack_id, term, translations, romanization, category, visual_query, sort_order)
       values ($1, $2, $3::jsonb, $4, $5, $6, $7)
       on conflict (pack_id, term) do nothing`,
      [packId, w.term, JSON.stringify(w.translations), w.romanization, w.category, w.visual_query, i],
    );
  }
  console.log(`Seeded Korean pack (${KOREAN_WORDS.length} words).`);
  return packId;
}

// ── HTTP server ────────────────────────────────────────────
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }
    serveStatic(url, response);
  } catch (error) {
    const status = error.status || 500;
    const message = status < 500 ? error.message : "Server error";
    sendJson(response, status, { error: message });
  }
});

async function handleApi(request, response, url) {
  if (url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, database: HAS_DATABASE });
    return;
  }

  if (!HAS_DATABASE) {
    sendJson(response, 503, { error: "DATABASE_URL is not configured." });
    return;
  }

  // ── Auth endpoints (no token required) ──────────────────
  if (request.method === "POST" && url.pathname === "/api/register") {
    const body = await readJson(request);
    const displayName = normalizeDisplayName(body.displayName || "");
    const pin = String(body.pin || "");
    if (!displayName || displayName === "Default user") throwHttp(400, "Въведи име.");
    if (!/^\d{4,6}$/.test(pin)) throwHttp(400, "PIN кодът трябва да е 4–6 цифри.");
    checkRateLimit(`reg:${toHandle(displayName)}`);
    const handle = toHandle(displayName);
    const existing = await pool.query(`select id from app_users where handle = $1`, [handle]);
    if (existing.rows[0]) throwHttp(409, "Потребител с това име вече съществува.");
    const user = await createUser(displayName, pin);
    clearRateLimit(`reg:${handle}`);
    const token = await createSession(user.id);
    const state = await getState(user.id);
    sendJson(response, 200, { user, state, token });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    const body = await readJson(request);
    const displayName = normalizeDisplayName(body.displayName || "");
    const pin = String(body.pin || "");
    if (!displayName || displayName === "Default user") throwHttp(400, "Въведи име.");
    if (!pin) throwHttp(400, "Въведи PIN код.");
    const handle = toHandle(displayName);
    checkRateLimit(`login:${handle}`);
    const result = await pool.query(
      `select id, handle, display_name as "displayName", pin_hash from app_users where handle = $1`,
      [handle],
    );
    const row = result.rows[0];
    if (!row || !row.pin_hash) throwHttp(401, "Грешно име или PIN.");
    const verify = await pool.query(
      `select (pin_hash = crypt($1, pin_hash)) as ok from app_users where id = $2`,
      [pin, row.id],
    );
    if (!verify.rows[0]?.ok) throwHttp(401, "Грешно име или PIN.");
    clearRateLimit(`login:${handle}`);
    const token = await createSession(row.id);
    const user = { id: row.id, handle: row.handle, displayName: row.displayName };
    const state = await getState(user.id);
    sendJson(response, 200, { user, state, token });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/logout") {
    const token = extractToken(request);
    if (token) await pool.query(`delete from user_sessions where id = $1`, [token]);
    sendJson(response, 200, { ok: true });
    return;
  }

  // ── Public pack endpoints ────────────────────────────────
  if (request.method === "GET" && url.pathname === "/api/packs") {
    const packs = await pool.query(
      `select id, slug, name, from_lang, to_lang, description,
              (select count(*) from words where pack_id = language_packs.id) as word_count
       from language_packs where is_public = true order by created_at`,
    );
    sendJson(response, 200, { packs: packs.rows });
    return;
  }

  const packsWordsMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/words$/);
  if (request.method === "GET" && packsWordsMatch) {
    const packId = packsWordsMatch[1];
    const words = await pool.query(
      `select id, term, translations, romanization, category, visual_query
       from words where pack_id = $1 order by sort_order, id`,
      [packId],
    );
    sendJson(response, 200, { words: words.rows });
    return;
  }

  // ── Authenticated endpoints ──────────────────────────────
  const userId = await requireSession(request);

  if (request.method === "GET" && url.pathname === "/api/state") {
    const user = await getUser(userId);
    const state = await getState(userId);
    sendJson(response, 200, { user, state });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sync") {
    const body = await readJson(request);
    const state = await saveState(userId, body.state || {});
    sendJson(response, 200, { state });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/log") {
    const body = await readJson(request);
    await logActivity(userId, body);
    sendJson(response, 200, { ok: true });
    return;
  }

  // ── Create pack (authenticated) ──────────────────────────
  if (request.method === "POST" && url.pathname === "/api/packs") {
    const body = await readJson(request);
    const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const name = String(body.name || "").trim();
    const fromLang = String(body.from_lang || "").trim().toLowerCase().slice(0, 10);
    const toLang = String(body.to_lang || "").trim().toLowerCase().slice(0, 10);
    if (!slug || !name || !fromLang || !toLang) throwHttp(400, "Полетата slug, name, from_lang, to_lang са задължителни.");
    const existing = await pool.query(`select id from language_packs where slug = $1`, [slug]);
    if (existing.rows[0]) throwHttp(409, "Пакет с този slug вече съществува.");
    const pack = await pool.query(
      `insert into language_packs (slug, name, from_lang, to_lang, description, created_by)
       values ($1, $2, $3, $4, $5, $6) returning id, slug, name, from_lang, to_lang, description`,
      [slug, name, fromLang, toLang, body.description || null, userId],
    );
    sendJson(response, 200, { pack: pack.rows[0] });
    return;
  }

  // ── Add word to pack (authenticated) ────────────────────
  const addWordMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/words$/);
  if (request.method === "POST" && addWordMatch) {
    const packId = addWordMatch[1];
    const pack = await pool.query(`select id, created_by from language_packs where id = $1`, [packId]);
    if (!pack.rows[0]) throwHttp(404, "Пакетът не е намерен.");
    if (pack.rows[0].created_by !== userId) throwHttp(403, "Нямаш достъп до този пакет.");
    const body = await readJson(request);
    const term = String(body.term || "").trim();
    const translations = Array.isArray(body.translations) ? body.translations.filter(String) : [];
    if (!term || !translations.length) throwHttp(400, "term и translations са задължителни.");
    const countRes = await pool.query(`select count(*) as n from words where pack_id = $1`, [packId]);
    const sortOrder = parseInt(countRes.rows[0].n, 10);
    const word = await pool.query(
      `insert into words (pack_id, term, translations, romanization, category, visual_query, sort_order)
       values ($1, $2, $3::jsonb, $4, $5, $6, $7)
       on conflict (pack_id, term) do update set translations = excluded.translations, romanization = excluded.romanization
       returning id, term, translations, romanization, category, visual_query`,
      [packId, term, JSON.stringify(translations), body.romanization || null, body.category || null, body.visual_query || null, sortOrder],
    );
    sendJson(response, 200, { word: word.rows[0] });
    return;
  }

  sendJson(response, 404, { error: "API route not found." });
}

// ── DB helpers ─────────────────────────────────────────────
async function createUser(displayName, pin) {
  const handle = toHandle(displayName);
  const result = await pool.query(
    `insert into app_users (handle, display_name, pin_hash)
     values ($1, $2, crypt($3, gen_salt('bf')))
     returning id, handle, display_name as "displayName"`,
    [handle, displayName, pin],
  );
  const user = result.rows[0];
  await pool.query(
    `insert into user_dictionary_state (user_id) values ($1) on conflict do nothing`,
    [user.id],
  );
  return user;
}

async function getUser(userId) {
  const result = await pool.query(
    `select id, handle, display_name as "displayName" from app_users where id = $1`,
    [userId],
  );
  if (!result.rows[0]) throwHttp(404, "Потребителят не е намерен.");
  return result.rows[0];
}

async function getState(userId) {
  const result = await pool.query(
    `select progress, sessions, ui from user_dictionary_state where user_id = $1`,
    [userId],
  );
  if (result.rows[0]) return normalizeState(result.rows[0]);
  await pool.query(`insert into user_dictionary_state (user_id) values ($1)`, [userId]);
  return { progress: { learned: {} }, sessions: {}, ui: defaultUi() };
}

async function saveState(userId, state) {
  const normalized = normalizeState(state);
  const result = await pool.query(
    `insert into user_dictionary_state (user_id, progress, sessions, ui, updated_at)
     values ($1, $2::jsonb, $3::jsonb, $4::jsonb, now())
     on conflict (user_id) do update set
       progress = excluded.progress, sessions = excluded.sessions,
       ui = excluded.ui, updated_at = now()
     returning progress, sessions, ui`,
    [userId, JSON.stringify(normalized.progress), JSON.stringify(normalized.sessions), JSON.stringify(normalized.ui)],
  );
  return normalizeState(result.rows[0]);
}

async function logActivity(userId, body) {
  const allowed = ["session_start", "session_complete", "session_cancel", "section_visit", "word_known", "quiz_answer"];
  const eventType = allowed.includes(body.event_type) ? body.event_type : null;
  if (!eventType) return;
  await pool.query(
    `insert into activity_log (user_id, event_type, category, mode, duration_seconds, metadata)
     values ($1, $2, $3, $4, $5, $6::jsonb)`,
    [userId, eventType, body.category || null, body.mode || null,
      Number.isFinite(body.duration_seconds) ? body.duration_seconds : null,
      JSON.stringify(body.metadata || {})],
  );
}

function normalizeState(state) {
  return {
    progress: state.progress && typeof state.progress === "object" ? state.progress : { learned: {} },
    sessions: state.sessions && typeof state.sessions === "object" ? state.sessions : {},
    ui: { ...defaultUi(), ...(state.ui && typeof state.ui === "object" ? state.ui : {}) },
  };
}

function defaultUi() {
  return { category: "all", mode: "learn", activeIndex: 0, focused: false };
}

// ── Static file server ─────────────────────────────────────
function serveStatic(url, response) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(ROOT, path.normalize(requestedPath));
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) { response.writeHead(404); response.end("Not found"); return; }
    response.writeHead(200, {
      "content-type": TYPES[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "public, max-age=300",
    });
    response.end(content);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) { request.destroy(); reject(new Error("Request body is too large.")); }
    });
    request.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error("Invalid JSON.")); }
    });
    request.on("error", reject);
  });
}

function normalizeDisplayName(value) {
  return String(value).trim().replace(/\s+/g, " ") || "Default user";
}

function toHandle(displayName) {
  return displayName.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "") || "default-user";
}

async function start() {
  if (HAS_DATABASE) {
    await pool.query(migrations);
    await seedKoreanPack();
    console.log("Postgres connected, schema and seed ready.");
  } else {
    console.log("DATABASE_URL not configured. Local fallback only.");
  }
  server.listen(PORT, () => console.log(`Dictionary listening on ${PORT}`));
}

start().catch((error) => { console.error(error); process.exit(1); });
