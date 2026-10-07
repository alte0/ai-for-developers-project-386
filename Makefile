.PHONY: help up down restart rebuild logs ps build-api build-web health test lint lint-fix format-check build ci

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  up         Build and start all services (detached)"
	@echo "  down       Stop and remove containers"
	@echo "  restart    Restart all services (down + up)"
	@echo "  rebuild    Rebuild images without cache and start"
	@echo "  logs       Follow logs of all services"
	@echo "  ps         Show containers status"
	@echo "  build-api  Build backend image only"
	@echo "  build-web  Build frontend image only"
	@echo "  health     Check backend (/api/health) and frontend (/)"
	@echo "  test       Run backend and frontend tests (vitest)"
	@echo "  lint       Run ESLint in backend and frontend"
	@echo "  lint-fix   Auto-fix ESLint issues in backend and frontend"
	@echo "  format-check  Check Prettier formatting"
	@echo "  build      Build backend and frontend (npm, no Docker)"
	@echo "  ci         Run lint + format-check + test + build (mirror of CI)"

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

build:
	npm --prefix backend run build
	npm --prefix frontend run build

ci: lint format-check test build
