.PHONY: help up down restart rebuild logs ps build-api build-web health up-prod down-prod health-prod test lint lint-fix format-check build openapi openapi-check ci

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  up         Build and start all services (detached, live reload: frontend/ + backend/src mounted)"
	@echo "  down       Stop and remove containers"
	@echo "  restart    Restart all services (down + up)"
	@echo "  rebuild    Rebuild images without cache and start"
	@echo "  logs       Follow logs of all services"
	@echo "  ps         Show containers status"
	@echo "  build-api  Build backend image only"
	@echo "  build-web  Build frontend image only"
	@echo "  health     Check backend (/api/health) and frontend (/)"
	@echo "  up-prod    Build and start prod stack (nginx :8080, api not published)"
	@echo "  down-prod  Stop and remove prod containers"
	@echo "  health-prod  Check prod (nginx :8080 → /api/health and /)"
	@echo "  test       Run backend and frontend tests (vitest)"
	@echo "  lint       Run ESLint in backend and frontend"
	@echo "  lint-fix   Auto-fix ESLint issues in backend and frontend"
	@echo "  format-check  Check Prettier formatting"
	@echo "  build      Build backend and frontend (npm, no Docker)"
	@echo "  openapi    Compile TypeSpec: docs/openapi.yaml + SDK in spec/client + backend artifacts (npm --prefix spec run gen)"
	@echo "  openapi-check  Regenerate contract artifacts and fail if git drifts"
	@echo "  ci         Run openapi + lint + format-check + test + build + openapi-check (mirror of CI)"

up:
	docker compose up --build -d

down:
	docker compose down

restart: down up

rebuild:
	docker compose build --no-cache
	docker compose up -d

logs:
	docker compose logs -f

ps:
	docker compose ps

build-api:
	docker compose build api

build-web:
	docker compose build web

health:
	@curl -s http://localhost:3000/api/health; echo
	@curl -s -o /dev/null -w "web:%{http_code}\n" http://localhost:5173/

up-prod:
	docker compose -f docker-compose.prod.yml up --build -d

down-prod:
	docker compose -f docker-compose.prod.yml down

health-prod:
	@curl -s http://localhost:8080/api/health; echo
	@curl -s -o /dev/null -w "web:%{http_code}\n" http://localhost:8080/

test:
	npm --prefix backend test
	npm --prefix frontend test

lint:
	npm --prefix backend run lint
	npm --prefix frontend run lint

lint-fix:
	npm --prefix backend run lint:fix
	npm --prefix frontend run lint:fix

format-check:
	npm --prefix backend run format:check
	npm --prefix frontend run format:check
	npm --prefix spec run format:check

build:
	npm --prefix backend run build
	npm --prefix frontend run build

openapi:
	npm --prefix spec run gen

openapi-check: openapi
	@git ls-files --error-unmatch docs/openapi.yaml spec/client/src/index.ts \
		backend/src/generated/contracts.gen.ts backend/src/routes/admin backend/src/routes/guest >/dev/null 2>&1 || \
		(echo "контракт не отслеживается git: запусти 'make openapi' и закоммить артефакты" && exit 1)
	@git diff --exit-code -- docs/openapi.yaml spec/client/src spec/client/package.json spec/client/package-lock.json \
		backend/src/generated backend/src/routes/admin backend/src/routes/guest || \
		(echo "контракт разошёлся с git: запусти 'make openapi' и закоммить результат" && exit 1)

ci: openapi lint format-check test build openapi-check
