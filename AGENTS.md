# AGENTS.md

## Layout
- `backend/` — Express API (CommonJS, `src/index.ts` listens, `src/app.ts` exports `createApp()` for tests). Only route: `GET /api/health`.
- `frontend/` — Vite + React + Tailwind 3 + shadcn-style `src/components/ui/`. Alias `@` → `src/` (set in both `vite.config.ts` and `tsconfig.app.json`). Depends on the generated SDK via `"@booking/client": "file:../spec/client"`; thin wrapper in `src/api/client.ts`.
- `spec/` — TypeSpec sources for the API contract (`main.tsp`, `models.tsp`, `routes/*.tsp`). `make openapi` compiles them to `docs/openapi.yaml` **and** to a TypeScript SDK in `spec/client/` (`@typespec/http-client-js` emitter) — never edit either output by hand. Contract source of truth for intent is `docs/spec.md` §3; the `.tsp` files describe the whole contract, not just implemented routes.
- `spec/client/` — generated SDK package (own lockfile, `dist/` gitignored). `spec/scripts/patch-client-package.mjs` post-processes the emitter-written `package.json` on every compile (`private`, `types` conditions in `exports`, `files`) — never hand-edit it; extend the patch script instead.
- Root has no `package.json`; each package has its own lockfile and scripts. Use `make` targets or `npm --prefix <pkg>`.

## Verification
- Full local mirror of CI: `make ci` (= `openapi` + `lint` + `format-check` + `test` + `build` + `openapi-check`). `openapi` must run first — frontend tests/build need the SDK in `spec/client/dist`.
- Single checks: `make lint`, `make format-check` (backend + frontend + spec Prettier), `make test` (backend + frontend Vitest), `make build` (npm builds, no Docker), `make openapi` (TypeSpec → `docs/openapi.yaml` + SDK), `make openapi-check` (regenerate + fail on git drift of `docs/openapi.yaml`, `spec/client/src`, `spec/client/package.json`, `spec/client/package-lock.json`).
- Docker: `make up` / `make health` (`:3000/api/health` → `{"status":"ok"}`, `:5173/` → 200). `build-api`/`build-web` build images only. The web image builds from the **repo root** context (`docker-compose.yml` sets `context: .`, `dockerfile: frontend/Dockerfile`) because it must copy and build `spec/client` before `npm ci` in `frontend/`.
- CI (`.github/workflows/ci.yml`, Node 24) runs the same on every push/PR, plus `docker compose build`. Don't touch `hexlet-check.yml`.

## Gotchas
- Frontend `/api` proxy points to `http://api:3000` (compose service name) — works in Docker; locally use `make up`, not bare `npm run dev` against localhost:3000.
- Vitest config excludes `dist/` (`backend/vitest.config.ts`) — never remove; otherwise the compiled `dist/*.test.js` fails under Vitest (CJS `require` of ESM).
- Backend TS is pinned to `^5.9` — `typescript-eslint@8` doesn't support TS 7. Don't upgrade without checking the peer range.
- Strict ESLint (`typescript-eslint strict`): no `!` non-null assertions (`frontend/src/main.tsx` shows the guard-throw pattern); `react-hooks/set-state-in-effect` fires on synchronous setState in an effect — async `.then` callbacks (as in `HomePage.tsx`) are fine.
- `react-refresh/only-export-components` warning on `button.tsx` (`buttonVariants` export) is an accepted shadcn pattern — leave it.
- Prettier: shared root `.prettierrc`, but each package needs its own `.prettierignore` (must list `dist`) or `format-check` fails on build output. `spec/.prettierignore` must also list `client` — the emitter formats with its own defaults, not the repo style.
- `spec/` compiles with `@typespec/compiler@1.17`: decorator object args use the value syntax `#{ ... }`, not `{ ... }`; timestamps are `utcDateTime` (camelCase); `docs/openapi.yaml` output path is set in `spec/tspconfig.yaml`. After changing `.tsp` files always run `make openapi` and commit the regenerated YAML together with the sources — CI fails on drift.
- `@typespec/http-client-js` is pinned to `0.16.0`: `0.16.3` pulls `@alloy-js/*@0.25` while its own deps (`emitter-framework`, `http-client`) need `0.24`, and compilation dies with "Multiple versions of Alloy are loaded". `@typespec/rest@0.84` is a required peer of the emitter — keep both in `spec/package.json` devDependencies.
- The emitter's `ts-http-runtime` retry policy retries 5xx with backoff — in tests either use 4xx statuses or pass `retryOptions: { maxRetries: 0 }` (`frontend/src/api/client.test.ts`), or the test times out at 5s.
- `spec/` is not in `release-please-config.json` (private, unversioned): `feat(spec): ...` commits do not cut a release.

## Commits (Conventional Commits — required by release-please)
- Format: `<type>[optional scope]: <subject>` in imperative, lowercase subject, no trailing period. Max ~72 chars for subject.
- Types that trigger a release: `feat:` (minor bump), `fix:` (patch bump). Breaking: `feat!:` / `fix!:` or `BREAKING CHANGE:` footer (major bump).
- Non-release types (no version bump, still use them): `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `style:`, `perf:`.
- Scope: optional, use package name for package-local changes — `feat(backend): ...`, `fix(frontend): ...`. Omit scope for repo-wide changes (`Makefile`, `ci.yml`, `AGENTS.md`).
- Breaking changes: `feat(api)!: drop ...` with footer `BREAKING CHANGE: ... describes migration`. Major bump applies to the touched package only.
- Forbidden: typeless messages (`update`, `wip`, `fix bug`), Russian text without prefix, multiple types in one commit. release-please ignores non-conforming commits — changelog stays empty, no release-PR.
- Examples:
  - `feat(backend): add calls list endpoint`
  - `fix(frontend): handle empty health response`
  - `feat(backend)!: change health response shape`
  - `chore: update ci node version`
- Mechanics: release-please (manifest mode, `backend` + `frontend` in `release-please-config.json`, versions in `.release-please-manifest.json`) reads history of `main`; release workflow runs only on push to `main`. Don't edit release tags/CHANGELOGs by hand.

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.
