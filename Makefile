.PHONY: help docker-up docker-down docker-logs docker-reset \
        db-generate db-migrate db-migrate-test db-seed db-reset \
        install dev-backend dev-web dev \
        test test-backend test-watch test-coverage \
        lint type-check format build-backend build-web

# Default target
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-up: ## Start postgres + redis containers
	docker compose up -d postgres postgres_test redis
	@echo "Waiting for postgres to be ready..."
	@docker compose exec postgres sh -c 'until pg_isready -U riya -d riya_dev; do sleep 1; done'
	@echo "Postgres is ready."

docker-down: ## Stop and remove containers
	docker compose down

docker-logs: ## Tail container logs
	docker compose logs -f

docker-reset: ## Stop containers and remove volumes (DESTROYS ALL DATA)
	docker compose down -v
	@echo "All volumes removed."

docker-up-dev: ## Start all services including pgadmin
	docker compose --profile dev up -d

# ─── Database ─────────────────────────────────────────────────────────────────

db-generate: ## Generate new Drizzle migration from schema changes
	npm run db:generate --workspace=backend

db-migrate: ## Apply pending migrations to dev database
	npm run db:migrate --workspace=backend

db-migrate-test: ## Apply pending migrations to test database
	npm run db:migrate:test --workspace=backend

db-seed: ## Seed roles, features, permissions, and admin user
	npm run db:seed --workspace=backend

db-reset: ## Drop + recreate dev DB, run migrations, seed
	npm run db:reset --workspace=backend

db-studio: ## Open Drizzle Studio (browser-based DB explorer)
	npm run db:studio --workspace=backend

# ─── Development ──────────────────────────────────────────────────────────────

install: ## Install all npm dependencies across workspaces
	npm install

dev-backend: ## Start backend in watch mode
	npm run dev --workspace=backend

dev-web: ## Start Next.js dev server
	npm run dev --workspace=web

dev: ## Start both backend and web concurrently
	npm run dev

# ─── Testing ──────────────────────────────────────────────────────────────────

test: ## Run all tests across workspaces
	npm run test --workspaces --if-present

test-backend: ## Run backend tests with Vitest
	npm run test --workspace=backend

test-watch: ## Run backend tests in watch mode
	npm run test:watch --workspace=backend

test-coverage: ## Run tests with coverage report
	npm run test:coverage --workspace=backend

# ─── Quality ──────────────────────────────────────────────────────────────────

lint: ## Run ESLint across all workspaces
	npm run lint --workspaces --if-present

type-check: ## Run TypeScript type checking across all workspaces
	npm run type-check --workspaces --if-present

format: ## Run Prettier formatter
	npm run format --workspaces --if-present

format-check: ## Run Prettier check (for CI)
	npm run format:check --workspaces --if-present

# ─── Build ────────────────────────────────────────────────────────────────────

build-backend: ## Compile TypeScript backend for production
	npm run build --workspace=backend

build-web: ## Build Next.js for production
	npm run build --workspace=web
