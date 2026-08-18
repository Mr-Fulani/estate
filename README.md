# Estate — Сайт агентства недвижимости

Проект для агентства недвижимости, включающий бэкенд на FastAPI и (планируемый) фронтенд на Next.js.

## Технологический стек

| Компонент | Технологии |
|-----------|------------|
| Backend   | FastAPI, SQLAlchemy (Async), Alembic, Pydantic, PostgreSQL |
| Frontend  | Next.js, React, TailwindCSS |
| Деплой    | Docker, Docker Compose |

## Быстрый старт

### Требования
- Docker
- Docker Compose
- Node.js (для локальной разработки фронтенда)
- Python 3.12+ (для локальной разработки бэкенда)

### Инструкция

1. Клонируйте репозиторий:
   ```bash
   git clone <repo_url> estate
   cd estate
   ```

2. Настройте переменные окружения:
   ```bash
   cp .env.example .env
   cp .env.example backend/.env
   cp .env.example frontend/.env
   ```
   *(При необходимости отредактируйте файлы .env)*

3. Запустите проект через Docker Compose:
   ```bash
   make dev
   # или
   docker-compose up --build
   ```

## Документация API

После запуска бэкенда интерактивная документация API доступна по адресу:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Локальная разработка

### Бэкенд
```bash
make install
make backend
```

Миграции БД:
```bash
make makemigrations msg="описание"
make migrate
```

Сидирование БД:
```bash
make seed
```

### Фронтенд
```bash
make frontend
```

## Структура проекта
- `/backend` - FastAPI приложение (API, модели, схемы)
- `/frontend` - Next.js приложение
- `docker-compose.yml` - Конфигурация контейнеров
