# Telecom Inventory Management System — Backend API

A REST API for tracking stock of telecom products (devices, equipment, parts). It handles users and roles, product/category/supplier catalogues, stock-in / stock-out transactions, automatic low-stock notifications and a simple demand forecast.

This repository contains the **backend only** (Node.js + Express + MySQL). There is no frontend in this repo.

## Features

- **Auth:** register and log in with username/password (bcrypt-hashed); JWT bearer tokens. Roles: `Admin`, `Manager`, `Staff`.
- **Products:** list, get by id, search (name, description, category), create, update, delete.
- **Categories & suppliers:** CRUD (duplicate supplier name + email is rejected with `409`).
- **Transactions:** record `Stock In` / `Stock Out` inside a DB transaction; updates the product's stock level and rejects stock-outs larger than the current stock.
- **Notifications:** a `Low Stock` notification is created when stock drops to or below the product's reorder point (at most one per product per hour); list all / unread, mark as read.
- **Demand forecast** (`Admin` / `Manager` only): average monthly `Stock Out` quantity per product over the last 6 months, stored per day in `demand_forecast`.

## Tech stack

Node.js, Express 4, MySQL (`mysql2` promise pool), `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`, `lodash`; `nodemon` for development.

## Setup

Requirements: Node.js 18+ and a MySQL 8 server.

```bash
git clone https://github.com/SAMARTHJAISWAL/telecom-stock-tracker.git
cd telecom-stock-tracker
npm install

# create the database and tables
mysql -u root -p < schema.sql

# configure environment
cp .env.example .env   # then edit DB_* and JWT_SECRET

npm run dev            # or: npm start
```

The server listens on `http://localhost:5005` by default. `GET /api/health` returns `{"status":"ok"}` without touching the database.

> `schema.sql` was reconstructed from the queries in the controllers (the original schema was not committed). It creates the `telecom_inventory` database.

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `5005` |
| `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` | MySQL connection | — |
| `JWT_SECRET` | Secret used to sign tokens (**required**; server exits if missing) | — |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d`, `12h` | `1d` |

## API

All routes except `/api/auth/*` and `/api/health` require `Authorization: Bearer <token>`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | body: `username`, `password` (≥ 6 chars), `email`, `type` (`Admin`\|`Manager`\|`Staff`), optional `f_name`, `l_name`, `phone` |
| POST | `/api/auth/login` | body: `username`, `password` → `{ token, user }` |
| GET | `/api/products` | all products with category and supplier names |
| GET | `/api/products/search?query=…` | search by name / description / category |
| GET | `/api/products/:id` | one product |
| POST / PUT | `/api/products`, `/api/products/:id` | body: `p_name` (required), `description`, `category_id`, `model_number`, `stock_level`, `reorder_point`, `s_id`, `order_date`, `order_status` |
| DELETE | `/api/products/:id` | |
| GET / POST | `/api/categories` | body: `category_name` |
| PUT / DELETE | `/api/categories/:id` | |
| GET / POST | `/api/suppliers` | body: `s_name`, `contact_email`, `contact_phone` |
| PUT / DELETE | `/api/suppliers/:id` | |
| GET | `/api/transactions?productId=…` | newest first |
| POST | `/api/transactions` | body: `p_id`, `transaction_type` (`Stock In`\|`Stock Out`), `quantity` (> 0), optional `notes` |
| GET | `/api/notifications?type=…` | |
| GET | `/api/notifications/unread` | |
| PUT | `/api/notifications/:id/read` | |
| POST | `/api/demand-forecast/calculate` | Admin/Manager |
| GET | `/api/demand-forecast?p_id=…` | Admin/Manager |

Example:

```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"secret123"}'
```

## Project structure

```
server.js                 Express app, route mounting, 404 + error handlers
schema.sql                MySQL tables
src/config/db.js          mysql2 connection pool
src/middleware/auth.js    JWT verification
src/routes/               route definitions per resource
src/controllers/          request handlers / SQL
src/utils/validation.js   request validation middleware
```

## Known limitations

- `POST /api/auth/register` is open: anyone can create an account with any role, including `Admin`. Restrict it before any real deployment.
- Role checks are only applied to the demand-forecast routes; every other route only requires a valid token.
