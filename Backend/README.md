# Pharmacy Backend API (Node.js + Express + MongoDB + Mongoose)

REST API for the Pharmacy Stock & Expiry Tracker. Implements CRUD for medicines, with filters, pagination, and specialized endpoints for low stock and soon-to-expire items.

## Features

- Express server with CORS, logging, and error handling
- MongoDB via Mongoose ORM
- Simple seeding script (`npm run seed`)
- `Medicine` model with UUID PK, validation, and defaults
- Endpoints:
  - `GET /api/medicines` — list with search/category/sort/page/limit
  - `GET /api/medicines/:id` — fetch by id
  - `POST /api/medicines` — create
  - `PUT /api/medicines/:id` — update
  - `DELETE /api/medicines/:id` — delete
  - `GET /api/medicines/expiry/soon?days=30` — expiring within X days
  - `GET /api/medicines/stock/low?threshold=10` — low-stock below threshold

## Quick Start

1. Install dependencies

```bash
cd backend
npm install
```

2. Configure environment variables

```bash
cp .env.example .env
# Edit .env to match your local Postgres
```

Supported env vars:

- `MONGO_URL` — e.g. `mongodb://localhost:27017/pharmacy_db`
- `PORT` — server port (default 4000)
- `CORS_ORIGINS` — comma-separated origins (default `http://localhost:3000,http://localhost:5173`)

3. Seed demo data

```bash
npm run seed
```

4. Start the server

```bash
npm run dev
# Server: http://localhost:4000
# Health:  http://localhost:4000/health
```

## API Examples

- List with search and pagination

```
GET /api/medicines?search=para&category=Analgesic&sort=name:asc&page=1&limit=20
```

- Expiring soon within 30 days

```
GET /api/medicines/expiry/soon?days=30
```

- Low stock below threshold 10

```
GET /api/medicines/stock/low?threshold=10
```

- Create a medicine

```json
POST /api/medicines
{
  "name": "Paracetamol 500mg",
  "category": "Analgesic",
  "quantity": 150,
  "unit": "pcs",
  "batchNumber": "PCM-500-2025A",
  "expiryDate": "2026-11-16",
  "price": 1.5
}
```

## Project Structure

```
backend/
├─ app.js                 # Express app & middleware
├─ server.js              # Bootstraps server and DB connection
├─ config/
│  └─ config.js          # Sequelize config (reads .env)
├─ controllers/
│  └─ medicineController.js
├─ middleware/
│  └─ errorHandler.js
├─ migrations/
│  ├─ 20251116000100-enable-uuid-ossp.js
│  └─ 20251116000200-create-medicines.js
├─ models/
│  ├─ index.js
│  └─ medicine.js
├─ routes/
│  └─ medicineRoutes.js
├─ seeders/
│  └─ 01-demo-medicines.js
├─ .env.example
├─ package.json
└─ README.md
```

## CORS

CORS is enabled for `http://localhost:3000` and `http://localhost:5173` by default. Adjust `CORS_ORIGINS` in `.env` if needed.

## Notes

- MongoDB used via Mongoose; documents expose `id` (string) mapped from `_id`.
- Error responses follow `{ success: false, message }`; validation errors return `{ success: false, errors: [...] }`.

## Scripts

- `npm start` — start server
- `npm run dev` — start with nodemon
- `npm run seed` — seed demo data into MongoDB

## Troubleshooting

- Ensure MongoDB is running locally: `brew services start mongodb-community` (or use Docker). Default URL is `mongodb://localhost:27017/pharmacy_db`.
- Connection errors: verify `MONGO_URL` and network access.
