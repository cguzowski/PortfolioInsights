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

The Angular app expects the API at `http://localhost:8080/api/portfolio`.

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

## API Endpoints

- `GET /api/portfolio`
- `POST /api/portfolio/holdings`
- `PUT /api/portfolio/holdings/{id}`
- `DELETE /api/portfolio/holdings/{id}`

## Database

Flyway migrations live in `backend/src/main/resources/db/migration`.

`database/portfolio_schema.sql` mirrors the same schema and seed data for manual database inspection or bootstrapping.
