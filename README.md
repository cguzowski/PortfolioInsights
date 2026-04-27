# Atlas Capital Intelligence

This repository now includes the first end-to-end feature slice for a portfolio dashboard:

- `frontend`: Angular standalone dashboard UI with live portfolio summary, allocation view, and holding CRUD form.
- `backend`: Spring Boot REST API exposing portfolio endpoints backed by Spring Data JPA and PostgreSQL.
- `database`: PostgreSQL schema and seed script matching the Flyway-managed backend persistence layer.

## Frontend

Run from `frontend`:

```bash
npm install
npm start
```

The Angular app reads API paths from `frontend/src/app/core/config/api.config.ts`.

## Backend

Run from `backend`:

```bash
gradlew.bat bootRun
```

Default datasource settings target a local PostgreSQL server on `localhost:5432`, using the `postgres` database and the `atlas_capital_intelligence` schema.

Override credentials when needed:

```bash
set DATABASE_USERNAME=postgres
set DATABASE_PASSWORD=your-password
set DATABASE_URL=jdbc:postgresql://localhost:5432/postgres?currentSchema=atlas_capital_intelligence
```

Allow a different frontend origin for local CORS:

```bash
set FRONTEND_ORIGIN=http://localhost:4200
```

## API Endpoints

- `GET /api/portfolio`
- `GET /api/portfolio/all`
- `POST /api/portfolio`
- `PUT /api/portfolio/{portfolioId}`
- `DELETE /api/portfolio/{portfolioId}`
- `POST /api/portfolio/holdings`
- `PUT /api/portfolio/holdings/{id}`
- `DELETE /api/portfolio/holdings/{id}`

See `docs/live-data-integration.md` before adding external market, insight, risk, or scenario APIs.

## Database

Flyway migrations live in `backend/src/main/resources/db/migration`.

`database/portfolio_schema.sql` mirrors the same schema and seed data for manual database inspection or bootstrapping.
