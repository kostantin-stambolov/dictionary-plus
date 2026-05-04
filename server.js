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

const migrations = `
create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_dictionary_state (
  user_id uuid primary key references app_users(id) on delete cascade,
  progress jsonb not null default '{"learned": {}}'::jsonb,
  sessions jsonb not null default '{}'::jsonb,
  ui jsonb not null default '{"category": "all", "mode": "learn", "activeIndex": 0, "focused": false}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists app_users_handle_idx on app_users (handle);
`;

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    serveStatic(url, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
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

  if (request.method === "POST" && url.pathname === "/api/login") {
    const body = await readJson(request);
    const displayName = normalizeDisplayName(body.displayName || body.name || "Default user");
    const user = await upsertUser(displayName);
    const state = await getState(user.id);
    sendJson(response, 200, { user, state });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    const userId = url.searchParams.get("userId");
    requireUserId(userId);
    const user = await getUser(userId);
    const state = await getState(userId);
    sendJson(response, 200, { user, state });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sync") {
    const body = await readJson(request);
    requireUserId(body.userId);
    const state = await saveState(body.userId, body.state || {});
    sendJson(response, 200, { state });
    return;
  }

  sendJson(response, 404, { error: "API route not found." });
}

async function upsertUser(displayName) {
  const handle = toHandle(displayName);
  const result = await pool.query(
    `
      insert into app_users (handle, display_name)
      values ($1, $2)
      on conflict (handle)
      do update set display_name = excluded.display_name, updated_at = now()
      returning id, handle, display_name as "displayName"
    `,
    [handle, displayName],
  );

  const user = result.rows[0];
  await pool.query(
    `
      insert into user_dictionary_state (user_id)
      values ($1)
      on conflict (user_id) do nothing
    `,
    [user.id],
  );
  return user;
}

async function getUser(userId) {
  const result = await pool.query(
    `select id, handle, display_name as "displayName" from app_users where id = $1`,
    [userId],
  );
  if (!result.rows[0]) throw new Error("User not found.");
  return result.rows[0];
}

async function getState(userId) {
  const result = await pool.query(
    `
      select progress, sessions, ui
      from user_dictionary_state
      where user_id = $1
    `,
    [userId],
  );

  if (result.rows[0]) return normalizeState(result.rows[0]);

  await pool.query(`insert into user_dictionary_state (user_id) values ($1)`, [userId]);
  return { progress: { learned: {} }, sessions: {}, ui: defaultUi() };
}

async function saveState(userId, state) {
  const normalized = normalizeState(state);
  const result = await pool.query(
    `
      insert into user_dictionary_state (user_id, progress, sessions, ui, updated_at)
      values ($1, $2::jsonb, $3::jsonb, $4::jsonb, now())
      on conflict (user_id)
      do update set
        progress = excluded.progress,
        sessions = excluded.sessions,
        ui = excluded.ui,
        updated_at = now()
      returning progress, sessions, ui
    `,
    [userId, JSON.stringify(normalized.progress), JSON.stringify(normalized.sessions), JSON.stringify(normalized.ui)],
  );
  return normalizeState(result.rows[0]);
}

function normalizeState(state) {
  return {
    progress: state.progress && typeof state.progress === "object" ? state.progress : { learned: {} },
    sessions: state.sessions && typeof state.sessions === "object" ? state.sessions : {},
    ui: {
      ...defaultUi(),
      ...(state.ui && typeof state.ui === "object" ? state.ui : {}),
    },
  };
}

function defaultUi() {
  return { category: "all", mode: "learn", activeIndex: 0, focused: false };
}

function serveStatic(url, response) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(ROOT, path.normalize(requestedPath));

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

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
      if (raw.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function normalizeDisplayName(value) {
  const displayName = String(value).trim().replace(/\s+/g, " ");
  return displayName || "Default user";
}

function toHandle(displayName) {
  return displayName.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "") || "default-user";
}

function requireUserId(userId) {
  if (!userId || typeof userId !== "string") throw new Error("Missing userId.");
}

async function start() {
  if (HAS_DATABASE) {
    await pool.query(migrations);
    console.log("Postgres connected and schema ready.");
  } else {
    console.log("DATABASE_URL is not configured. Running with browser-local fallback only.");
  }

  server.listen(PORT, () => {
    console.log(`Dictionary listening on ${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
