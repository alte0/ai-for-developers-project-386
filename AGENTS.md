# AGENTS.md

## Layout
- `backend/` — Express API (CommonJS, `src/index.ts` listens, `src/app.ts` exports `createApp()` for tests). Only route: `GET /api/health`.
- `frontend/` — Vite + React + Tailwind 3 + shadcn-style `src/components/ui/`. Alias `@` → `src/` (set in both `vite.config.ts` and `tsconfig.app.json`).
- Root has no `package.json`; each package has its own lockfile and scripts. Use `make` targets or `npm --prefix <pkg>`.

## Verification
- Full local mirror of CI: `make ci` (= `lint` + `format-check` + `test` + `build`).
- Single checks: `make lint`, `make format-check`, `make test` (backend Vitest only), `make build` (npm builds, no Docker).
- Docker: `make up` / `make health` (`:3000/api/health` → `{"status":"ok"}`, `:5173/` → 200). `build-api`/`build-web` build images only.
- CI (`.github/workflows/ci.yml`, Node 24) runs the same on every push/PR, plus `docker compose build`. Don't touch `hexlet-check.yml`.

## Gotchas
- Frontend `/api` proxy points to `http://api:3000` (compose service name) — works in Docker; locally use `make up`, not bare `npm run dev` against localhost:3000.
- Vitest config excludes `dist/` (`backend/vitest.config.ts`) — never remove; otherwise the compiled `dist/*.test.js` fails under Vitest (CJS `require` of ESM).
- Backend TS is pinned to `^5.9` — `typescript-eslint@8` doesn't support TS 7. Don't upgrade without checking the peer range.
- Strict ESLint (`typescript-eslint strict`): no `!` non-null assertions (`frontend/src/main.tsx` shows the guard-throw pattern); `react-hooks/set-state-in-effect` fires on fetch-in-`useEffect` — existing `App.tsx` uses a targeted disable, follow that.
- `react-refresh/only-export-components` warning on `button.tsx` (`buttonVariants` export) is an accepted shadcn pattern — leave it.
- Prettier: shared root `.prettierrc`, but each package needs its own `.prettierignore` (must list `dist`) or `format-check` fails on build output.

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
