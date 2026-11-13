# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| API discovery | `GET /` | Return a short status message and the `/api/activities` entry point. |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Implementation plan:

- Presentation tier decision: Use the shared API client and a reusable capability view for loading, empty, error, and result states.
- Logic tier decision: Keep request validation and domain behavior in the service layer, returning deliberate 4xx errors for invalid input.
- Data tier decision: Require the documented fields in Mongoose schemas and retain the idempotent, non-destructive seed behavior.
- Activity tracking approach: Validate input and existing references, then store the submitted activity with points based on minutes and a creation timestamp.
- Team management approach: Require a name and mascot, validate member references, and preserve the submitted team fields.
- Leaderboard approach: Sum activity points per team and return a stable descending ranking with 1-based ranks.
- Workout suggestions approach: Match a user's recent activity or goal to workout focus and explain the recommendation; return 404 for an unknown email.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — failures indicate schema validation or seed regressions.
- API command: `npm run test:api --prefix octofit-tracker/backend` — failures indicate request validation, persistence, leaderboard, or suggestion contract regressions.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — failures indicate API rendering or loading, empty, and error state regressions.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — failures indicate backend TypeScript errors.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — failures indicate frontend TypeScript or production bundling errors.

Latest verification: all three test commands and both build commands passed.
