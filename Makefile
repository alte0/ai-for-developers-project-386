.PHONY: help up down restart rebuild logs ps build-api build-web health build-app up-app down-app logs-app health-app test lint lint-fix format-check build openapi openapi-check ci

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  up         Build and start dev stack (api + web, live reload)"
	@echo "  down       Stop and remove dev containers"
	@echo "  restart    Restart dev stack (down + up)"
	@echo "  rebuild    Rebuild dev images without cache and start"
	@echo "  logs       Follow logs of dev services"
	@echo "  ps         Show dev containers status"
	@echo "  build-api  Build dev api image only"
	@echo "  build-web  Build dev web image only"
	@echo "  health     Check dev api (PORT from .env) and web (:5173)"
	@echo "  build-app  Build single-container production image from root Dockerfile"
	@echo "  up-app     Build and run single container (PORT from .env)"
	@echo "  down-app   Stop and remove the single container"
	@echo "  logs-app   Follow logs of the single container"
	@echo "  health-app Check single container (PORT from .env)"
	@echo "  test       Run backend and frontend tests (vitest)"
	@echo "  lint       Run ESLint in backend and frontend"
	@echo "  lint-fix   Auto-fix ESLint issues in backend and frontend"
	@echo "  format-check  Check Prettier formatting"
	@echo "  build      Build backend and frontend (npm, no Docker)"
	@echo "  openapi    Compile TypeSpec: docs/openapi.yaml + SDK in spec/client + backend artifacts (npm --prefix spec run gen)"
	@echo "  openapi-check  Regenerate contract artifacts and fail if git drifts"
	@echo "  ci         Run openapi + lint + format-check + test + build + openapi-check (mirror of CI)"

.env:
	cp .env.example .env

up: .env
	docker compose up --build -d

down:
	docker compose down

restart: down up

rebuild: .env
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
	@port=$$(sed -n 's/^PORT=//p' .env 2>/dev/null | tail -1); port=$${port:-3000}; \
	curl -s "http://localhost:$$port/api/health"; echo; \
	curl -s -o /dev/null -w "web:%{http_code}\n" http://localhost:5173/

build-app:
	docker build -t booking-app .

up-app: .env build-app
	@docker rm -f booking-app >/dev/null 2>&1 || true
	@port=$$(sed -n 's/^PORT=//p' .env | tail -1); \
	docker run --rm -d --name booking-app --env-file .env -p "$$port:$$port" booking-app

down-app:
	@docker rm -f booking-app >/dev/null 2>&1 || true

logs-app:
	docker logs -f booking-app

health-app:
	@port=$$(sed -n 's/^PORT=//p' .env 2>/dev/null | tail -1); port=$${port:-3000}; \
	curl -s "http://localhost:$$port/api/health"; echo; \
	curl -s -o /dev/null -w "web:%{http_code}\n" "http://localhost:$$port/"

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
