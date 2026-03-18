# CLAUDE.md — AI Assistant Instructions for DPDC AMI Dashboard

## Project Context

This is the **DPDC AMI Dashboard** — a Node.js + Vue 3 full-stack application for DPDC's Advanced Metering Infrastructure management.

- **Backend**: Express 4, port 3000, PostgreSQL (Sequelize) + Oracle (oracledb v6)
- **Frontend**: Vue 3 + Vite + Tailwind CSS + Pinia
- **Remote**: https://github.com/oculin/dpdc-dashboard.git
- **Branch**: main

## Mandatory: Commit and Push After Every Feature

After completing any new feature, bug fix, or meaningful change, you MUST:

1. Stage the relevant files
2. Create a descriptive commit with the format below
3. Push to `origin main`

```bash
git add <specific files>
git commit -m "$(cat <<'EOF'
<type>: <concise description>

<optional body if needed>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push origin main
```

**Commit types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `perf`

**Examples:**
```
feat: add Excel export for CRP/CPC customer list
fix: resolve Oracle pool timeout on idle connections
refactor: extract bill stop analysis into service layer
docs: update API.md with new bill-stop endpoints
```

Do NOT skip this step. Every completed feature must be committed and pushed.

## Code Conventions

### Backend
- Controllers handle HTTP in/out only — business logic belongs in services
- All Oracle queries go through `oracle.service.js` (validates SELECT-only)
- SQL files live in `backend/reports/` — never inline long SQL in JS files
- Use `logger` (Winston) for logging, not `console.log`
- Always handle Oracle connection release in `finally` blocks

### Frontend
- Use Composition API (`<script setup>`) for all new components
- State management via Pinia stores in `frontend/src/stores/`
- API calls via the configured Axios instance in `frontend/src/services/api.js`
- Tailwind utility classes only — no custom CSS unless strictly necessary
- Use Heroicons (`@heroicons/vue`) for icons

### Database
- PostgreSQL: application data (users, logs, cache, batch results)
- Oracle: read-only data source (CISADM schema) — no writes to Oracle
- New PostgreSQL tables require a Sequelize model in `backend/src/models/`

## Security Rules

- Oracle queries: SELECT and WITH only — never allow DML
- Never expose `.env` values in responses or logs
- JWT secret and DB credentials stay in environment variables only
- Do not bypass Helmet, CORS, or rate-limiter middleware

## Project File Map

```
backend/src/server.js          — Entry point
backend/src/config/oracle.js   — Oracle pool (min:5, max:30)
backend/src/routes/index.js    — All API routes mounted here
backend/src/services/          — Business logic layer
backend/reports/               — Oracle SQL files (60+)
frontend/src/router/index.js   — 24 Vue routes
frontend/src/components/layout/Sidebar.vue — Navigation
frontend/src/stores/auth.js    — Auth state (JWT, user, permissions)
```

## Scheduled Jobs

- NOCS Balance Refresh — hourly (all environments)
- Batch Monitoring — every 30 min (production only)
- Teams Reports — every 60 min (production only)
- Bill Stop Analysis — daily 2 AM Asia/Dhaka (via PM2/cron, NOT node-cron)

## What NOT to Do

- Do not commit `.env` files — use `.env.example` only
- Do not write to Oracle — it is a read-only data source
- Do not add `console.log` statements — use the Winston logger
- Do not use `git add -A` or `git add .` — stage specific files only
- Do not inline multi-line SQL in JavaScript — use the `backend/reports/` directory
- Do not create new files unless strictly necessary
