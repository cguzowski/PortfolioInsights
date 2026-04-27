# Live Data Integration Notes

This codebase currently mixes live database portfolio data with frontend mock portfolios for product exploration. Keep that split intentional while adding real external APIs.

## Ownership Boundaries

- Backend owns persistence, external provider calls, provider credentials, caching, retries, and data normalization.
- Frontend owns presentation state, view composition, user input, and graceful fallback messaging.
- Angular components should call feature services, not external APIs directly.
- Spring controllers should expose app-shaped DTOs, not raw provider responses.

## Current Integration Seams

- Frontend API base and route paths live in `frontend/src/app/core/config/api.config.ts`.
- Backend CORS origin configuration lives under `atlas.api.cors.allowed-origins` in `backend/src/main/resources/application.yml`.
- Workspace overview types live in `frontend/src/app/features/workspace/models`.
- Workspace database-to-view adapters live in `frontend/src/app/features/workspace/mappers`.
- Workspace mock portfolio seeds live in `frontend/src/app/features/workspace/data`.

## Endpoint Contract

Current portfolio endpoints are intentionally preserved:

- `GET /api/portfolio`
- `GET /api/portfolio/all`
- `POST /api/portfolio`
- `PUT /api/portfolio/{portfolioId}`
- `DELETE /api/portfolio/{portfolioId}`
- `POST /api/portfolio/holdings`
- `PUT /api/portfolio/holdings/{id}`
- `DELETE /api/portfolio/holdings/{id}`

When introducing new live-data capabilities, prefer adding focused backend resources such as `/api/market-data`, `/api/insights`, `/api/risk`, or `/api/scenarios` instead of extending portfolio endpoints with unrelated provider concerns.

## Mock-To-Live Migration Guidance

- Keep mock data deterministic and isolated under `data/`.
- Add mappers for each new API response shape before exposing it to components.
- If a backend DTO changes, update the TypeScript model in the matching feature folder in the same change.
- Preserve mock fallback paths until the live endpoint has loading, error, and empty states in the UI.
- Keep API credentials out of Angular and local docs; backend configuration should receive them through environment variables.
