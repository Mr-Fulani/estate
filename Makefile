.PHONY: dev down backend frontend migrate makemigrations seed create-founder install

dev:
	docker compose up --build

down:
	docker compose down

backend:
	cd backend && uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

migrate:
	cd backend && alembic upgrade head

makemigrations:
	cd backend && alembic revision --autogenerate -m "$(msg)"

seed:
	cd backend && python -m app.seed

create-founder:
	docker compose exec api python -m app.cli create-founder --username "$(username)" --email "$(email)" --name "$(name)"

install:
	pip install -r backend/requirements.txt && cd frontend && npm install
