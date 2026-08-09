# Client Project Tracker

A CRUD application for a digital agency to track client projects — status, priority, timelines — built for the Full Stack Developer Technical Assessment (see `REQUIREMENTS.md` / `SUBMISSION.md`).

## Features Implemented

**Required (`REQUIREMENTS.md`):**
- Project list, create, edit, and delete — both as a web UI (`/projects`) and a standalone REST API (`/api/projects`)
- REST API: `GET /projects`, `GET /projects/:id`, `POST /projects`, `PUT /projects/:id`, `DELETE /projects/:id`
- Validation: Client Name and Project Name required, Status/Priority must be one of the defined values, Due Date can't be earlier than Start Date, invalid requests return field-level error messages (422)

**Bonus (optional, all implemented except Auth/Docker/Deployment):**
- Search (client, project name, description) — server-side
- Filter by Status and by Priority — server-side
- Sorting (any column, either direction) — server-side
- Automated tests at three levels: Pest (backend API + Inertia controllers), Vitest + React Testing Library (components), Laravel Dusk (full CRUD flow in a real browser)
- *Not implemented, by design — see Assumptions:* Authentication, Docker, Deployment

**Beyond the brief:**
- Real pagination controls, toast notifications on create/update/delete, optimistic UI updates with automatic rollback on failure, ESLint + Prettier + Pint code-style enforcement, Wayfinder typed routes

## Tech Stack

- **Laravel 13** (PHP 8.4) — application framework
- **Inertia.js v2 + React 19 + TypeScript** — server-driven SPA, no separate frontend API client
- **MySQL 8** — persistence
- **Tailwind CSS v4 + shadcn/ui (new-york style) + Radix UI** — styling and accessible primitives
- **sonner** — toast notifications for create/update/delete success and failure, themed via `components/ui/sonner.tsx`
- **Laravel Wayfinder** — typed route/action generation; components import `ProjectController.index.url()` etc. instead of hardcoded route strings
- **Pest** (backend feature tests) + **Vitest + React Testing Library** (component tests) + **Laravel Dusk** (real-browser CRUD test) — automated tests at three levels
- **Laravel Pint** (PHP) + **ESLint + Prettier** (TypeScript/React) — code style, enforced on both sides of the stack

### Why this stack

A single Laravel + Inertia repo was chosen over a separate SPA + API client: one dev server, one deploy target, one request/response model. `resources/js/` holds Inertia page components, tables are hand-rolled rather than pulled from a generic data-table library, shadcn `Dialog` modals handle create/edit/delete, and `router.get()` with `preserveState`/`only` drives debounced server-side search/filter/sort — fewer moving parts than wiring up a separate fetch-based client and keeping two apps' routing/state in sync.

## Setup & Run

Prerequisites: PHP 8.3+, Composer, Node 20+, MySQL.

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Create the database (defaults in `.env.example` assume a local MySQL with an empty `root` password — edit `DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` in `.env` if yours differs):

```sql
CREATE DATABASE fullstack_assessment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run that via your MySQL client of choice (`mysql -u root -e "..."`, phpMyAdmin, HeidiSQL, TablePlus, etc.). On WAMP, the `mysql` CLI isn't on `PATH` by default — it's under `wamp64\bin\mysql\<version>\bin\mysql.exe`, or use phpMyAdmin from the WAMP tray menu instead.

```bash
php artisan migrate --seed   # creates the projects table and seeds it from test_data.json
composer dev                 # runs `artisan serve` + Vite dev server concurrently
```

- UI: `http://localhost:8000/projects`
- REST API: `http://localhost:8000/api/projects` (see Architecture below — independently testable with `curl`/Postman, no UI required)

If your MySQL's default storage engine isn't InnoDB, note that `config/database.php` already forces `'engine' => 'InnoDB'` for the `mysql` connection — no extra setup needed there.

### Running tests

```bash
php artisan test      # Pest: REST API + Inertia controller feature tests
npm run test          # Vitest + React Testing Library: component tests (regenerates Wayfinder actions first)
npm run types:check   # tsc --noEmit (regenerates Wayfinder actions first)
./vendor/bin/pint      # PHP code style (check + auto-fix)
npm run lint:check    # ESLint, TS/React rules (npm run lint to auto-fix what's fixable)
npm run format:check  # Prettier formatting check (npm run format to auto-fix)
php artisan dusk       # Real-browser CRUD test (Chrome + ChromeDriver, headless) — requires the
                       # app already served: run `composer dev` or `php artisan serve` first
```

## Architecture

- `app/Http/Controllers/ProjectController.php` — Inertia-driven web controller (`routes/web.php`): renders `resources/js/pages/projects/index.tsx`, handles create/update/delete as redirect-based form submissions with validation errors surfaced through Inertia's shared error bag.
- `app/Http/Controllers/Api/ProjectController.php` — a standalone JSON REST API (`routes/api.php`) implementing the exact `GET/POST/PUT/DELETE /api/projects` contract from `REQUIREMENTS.md`, independently testable with `curl`/Postman.
- Both controllers share validation (`app/Http/Requests/{Store,Update}ProjectRequest.php`) and query logic (`Project::scopeFilter()` on the model) — no duplicated business rules.
- `app/Enums/{ProjectStatus,ProjectPriority}.php` — PHP backed enums are the single source of truth for valid Status/Priority values, enforced via `Rule::enum()` in both controllers.
- `resources/js/components/projects/projects-content.tsx` — owns the list, filters, and all mutations. Create/edit/delete update local state optimistically (instant UI feedback) before the network round-trip, then confirm or roll back with a [sonner](https://sonner.emilkowal.ski/) toast once the server responds; see the Technical Reflection for how that's tested.
- `resources/js/components/ui/pagination.tsx` — real Previous/Next + page-number controls (not a raw dump of Laravel's paginator link array) driven by the paginator's own `links`/`current_page`/`total` metadata.
- `resources/js/components/projects/badge-tokens.ts` + the `--status-*`/`--priority-*` custom properties in `resources/css/app.css` — status/priority badge colors are Tailwind v4 design tokens (light/dark pairs), not hardcoded per-component Tailwind classes.

## Notable Design Choices

1. **A parallel REST API alongside the Inertia UI.** `REQUIREMENTS.md` explicitly requires a standalone REST API (`GET/POST/PUT/DELETE /projects`) that must be testable independently of the UI, so `Api\ProjectController` + `ProjectResource` (camelCase JSON) exist specifically to satisfy that contract, while the Inertia pages get raw snake_case data straight from the paginator/model.
2. **One shared form modal, not two.** `ProjectFormModal` handles both create and edit (parameterized by `project: Project | null`), avoiding duplicating the entire field layout for a form that's identical except for its submit target. It owns only field state and client-side validation; the actual mutation (and its optimistic update/rollback) lives in the parent, so the same modal works unchanged for both actions.
3. **Wayfinder's generated actions are consumed directly** (`ProjectController.store.url()`, `.update.url({ project: id })`, etc.) instead of hardcoded route strings, so a route change fails at compile time (`tsc`) rather than silently 404ing at runtime. `npm run test` / `npm run types:check` regenerate them first, so neither depends on `npm run dev` having run beforehand.
4. **Vitest + React Testing Library cover the interactive components** (form validation, list rendering, edit/delete triggers, optimistic add/remove + rollback) alongside Pest on the backend and a Dusk test driving the full flow in a real browser, via a separate `vitest.config.ts` so Vitest doesn't interfere with the Laravel-integrated `vite.config.ts`.

## Assumptions

- `description` is optional (only Client Name, Project Name, Status, and Priority are marked required in `REQUIREMENTS.md`).
- No authentication — not required by the spec, and out of scope for a 2-4 hour assessment.
- "Due date cannot be earlier than start date" is enforced as `due_date >= start_date` (same-day projects are valid).
- Search/filter/sort (bonus) are implemented server-side via query params on both the Inertia route and the REST API, not client-side filtering of an already-fetched list.
- Default local MySQL credentials (`root` / no password) — adjust `.env` for a different setup.

## Technical Reflection

**1. Why did you choose this implementation approach?**
The assessment started as a two-repo build (Laravel REST API + standalone Vite React SPA), which is a reasonable default for an unconstrained "any framework" brief. Partway through, the direction shifted toward a single-repo Laravel + Inertia monolith instead. Rather than layering Inertia on top of the existing SPA, the frontend was rebuilt against that pattern directly (Inertia pages, shared layout, `router.get()` partial reloads) because a structurally-inconsistent submission would cost more to untangle later than a clean rebuild costs now.

**2. What tradeoffs did you make?**
Keeping a full parallel REST API means the search/filter/sort logic has to stay generic enough for two different consumers — solved with a single `Project::scopeFilter()` model scope rather than duplicating query logic per controller. Using one form modal instead of two separate create/edit components trades a bit of file-per-concern separation for less duplicated JSX; given the form is identical between create and edit, the DRY version seemed like the better call. Optimistic updates trade a bit of complexity (a local state mirror, snapshot/rollback per mutation, and a "pending" row state to guard against acting on an item before its real id is known) for a UI that doesn't wait on the network for every action — worth it here since create/edit/delete are the core of a CRUD app and users feel that latency directly.

**3. What would you improve with more time?**
Everything originally listed here (real pagination controls, optimistic UI updates, Wayfinder's typed actions, a Dusk browser test, design-token-based badge colors) ended up getting done. With more time beyond that: retry-on-failure for rolled-back optimistic mutations instead of just an error banner; a `role`-based `<select>` fallback so the Radix `Select` degrades gracefully without JS; and extending the Dusk suite to cover search/filter/sort and validation-error paths, not just the happy-path CRUD flow.

**4. What was the most challenging part?**
Two separate issues, both found by actually driving the app end-to-end rather than trusting the code by inspection:

- A subtle React race condition in the original SPA build: rapid successive filter changes could let an older, slower fetch's response land after a newer one and silently leave the UI stuck on a loading state, because the abort logic was gating `setLoading(false)` on `AbortSignal.aborted`, which is racy against React's own effect-cleanup timing. Fixed with a monotonic request-id ref instead of relying on abort-signal timing — and sidestepped entirely after the Inertia rebuild, since `router.get({ preserveState: true })` owns request sequencing itself.
- Writing the Dusk test surfaced a real bug in the optimistic-update code, not a test artifact: editing/deleting a row created moments earlier could target its temporary (client-only) id if the real creation hadn't reconciled yet, 404ing against the server. Fixed by disabling a row's actions and showing "Saving…" while its id is still temporary. The same Dusk work also hit — and worked around — two well-known Selenium/React quirks unrelated to app code: native `<input type="date">` corrupts values typed character-by-character via `sendKeys()`, and React's internal value-tracker ignores a plain `element.value = x` assignment unless it's set through the native property setter first.

**5. Did you use AI tools during development?**
Yes — Claude (Claude Code) was used throughout: scaffolding the initial Laravel API + React SPA build and the subsequent migration to the Inertia.js monolith, adding the pagination/design-token/Wayfinder/optimistic-UI/Dusk enhancements, writing the Pest/Vitest/Dusk test suites, debugging the issues described above, and driving real headless-browser (Playwright, then Dusk) passes to verify CRUD, validation, search/filter/sort, optimistic rollback, and the delete-confirmation flow end-to-end before considering the work done.
