# Mini ERP + CRM Operations Portal

A lightweight ERP and CRM system built for wholesale and distribution businesses. It brings together customer relationship management, product and inventory tracking, and sales challan generation in one place, so sales, warehouse, and accounts teams can work from a single system instead of scattered spreadsheets.

## Overview & Highlights

- Role-based access for four user types — Admin, Sales, Warehouse, Accounts — each seeing only the modules relevant to their work.
- Customer records with status tracking (Lead, Active, Inactive), customer type classification, search, and a follow-up log for CRM activity.
- Product and inventory management with low-stock thresholds and a full stock movement history (what changed, why, and who made the change).
- Sales challans that can be saved as Draft or Confirmed, with automatic challan numbering, stock validation on confirmation, and downloadable PDF invoices.
- Historical accuracy: challans store a snapshot of customer and product details at the time of creation, so later edits to master data don't alter past records.
- Runs locally, in Docker, or deployed to Render (backend + PostgreSQL) and Vercel (frontend).

## Live Deployment

- Frontend: https://mini-erp-crm-pi.vercel.app
- Backend API: https://mini-erp-crm-1-ikjy.onrender.com
- GitHub Repository: https://github.com/Renuka-43/mini-erp-crm

## Test Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@minierp.com | password123 |
| Sales | sales@minierp.com | password123 |
| Warehouse | warehouse@minierp.com | password123 |
| Accounts | accounts@minierp.com | password123 |

## Tech Stack

**Frontend**: React, TypeScript, Vite, Tailwind CSS

**Backend**: Node.js, TypeScript, Express.js, Prisma ORM, JWT authentication, Zod validation, PDFKit

**Database**: PostgreSQL

**Deployment**: Vercel (frontend), Render (backend + PostgreSQL)

## Architecture Overview

The system is split into two independently deployed applications that communicate over REST:

- **Frontend (React SPA)**: handles routing, forms, and state. Calls the backend API using a base URL configured through an environment variable (`VITE_API_URL`), so the same build can point at different backend environments without code changes.
- **Backend (Express API)**: exposes REST endpoints grouped by domain (auth, customers, products, challans). Each request is validated with Zod before touching the database, and protected routes are guarded by JWT middleware that also enforces role-based access (Admin, Sales, Warehouse, Accounts).
- **Database (PostgreSQL via Prisma)**: schema is defined in `prisma/schema.prisma` with seven core models — `User`, `Customer`, `CustomerFollowUp`, `Product`, `StockMovement`, `SalesChallan`, `SalesChallanItem`. Prisma migrations version the schema; `prisma/seed.ts` populates test users and sample data.
- **Sales challan business logic**: when a challan is confirmed, stock sufficiency is checked and inventory is decremented inside a single database transaction, so a failed check never leaves partial stock changes. Product and customer details are snapshotted onto the challan at creation time, so later edits to a product or customer don't rewrite historical challan records.

## Core Modules Implemented

**1. Authentication and Roles**
Login with JWT-based authentication. Four roles supported: Admin, Sales, Warehouse, Accounts, each with different access to the modules below.

**2. Customer CRM Module**
Add, edit, and search customers. Each customer record includes name, mobile, email, business name, optional GST number, customer type (Retail/Wholesale/Distributor), address, status (Lead/Active/Inactive), follow-up date, and notes. Customer detail page shows full follow-up history, and new follow-up notes can be added from there.

**3. Product and Inventory Module**
Add and edit products with name, SKU, category, unit price, current stock, minimum stock alert threshold, and warehouse location. Every stock change is written to a stock movement log recording product, quantity changed, movement type (IN/OUT), reason, the user who made the change, and a timestamp.

**4. Sales Challan Module**
Create a challan by selecting a customer, adding multiple products with quantities, and saving as Draft or Confirmed. Challan numbers are generated automatically. Confirming a challan reduces stock inside a transaction; if stock is insufficient, the API returns an error and no partial update occurs. Each challan stores a snapshot of product and customer data at creation time, not just their IDs, so later edits to master data don't change historical challans.

## Bonus Features

| Feature | Status |
| --- | --- |
| Docker setup | Implemented — `docker-compose.yml` runs frontend, backend, and PostgreSQL together |
| Export invoice as PDF | Implemented — `GET /api/challans/:id/pdf` |
| GitHub Actions deployment | Not implemented |
| Upload product image to AWS S3 | Not implemented |

## Local Setup

### Prerequisites
- Node.js v18+
- npm
- A PostgreSQL database (local or hosted)

### Backend

```bash
cd backend
cp .env.example .env
# edit .env and set DATABASE_URL to your PostgreSQL connection string
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Docker (alternative, runs both services + Postgres together)

```bash
docker-compose up --build -d
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret used to sign JWTs | any long random string |
| `JWT_EXPIRES_IN` | Token expiry | `1d` |
| `PORT` | Port the server listens on | `5000` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://mini-erp-crm-pi.vercel.app` |

On Render, these are set under the backend service's Environment tab rather than a committed `.env` file.

### Frontend

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | Base URL the frontend calls | `https://mini-erp-crm-1-ikjy.onrender.com/api` |

## Deployment Steps (as actually used for this submission)

### Database — Render PostgreSQL
1. Render Dashboard → New → PostgreSQL → create instance.
2. Copy the Internal Database URL.

### Backend — Render Web Service
1. Connect the GitHub repository, root directory `backend/`.
2. Build Command:
   ```
   npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run seed && npm run build
   ```
3. Start Command: `npm run start`
4. Environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN` (see table above).

Note: `npm run seed` is included in the build command for this submission so the reviewer's environment is guaranteed to have test data. In a real production setup this should be removed after the first deploy, since it currently clears and recreates seed data on every build (see Known Limitations).

### Frontend — Vercel
1. Connect the GitHub repository, root directory `frontend/`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment variable: `VITE_API_URL` pointing at the deployed backend's `/api` path.

## API Endpoints

### Auth
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `GET /api/auth/me` - Retrieve active user payload

### Customer CRM
- `GET /api/customers` - List customers (supports `page`, `limit`, `search`, `status`, `customerType`)
- `GET /api/customers/:id` - Customer detail with follow-up history
- `POST /api/customers` - Create customer record
- `PUT /api/customers/:id` - Edit customer
- `POST /api/customers/:id/follow-up` - Append CRM follow-up note

### Products & Inventory
- `GET /api/products` - Product list (supports `lowStock=true`, `search`)
- `POST /api/products` - Create product SKU
- `PUT /api/products/:id` - Edit product
- `POST /api/products/:id/stock-adjustment` - Manual stock IN / OUT adjustment
- `GET /api/products/movements/log` - Historical stock movement log

### Sales Challans
- `GET /api/challans` - List sales challans
- `GET /api/challans/:id` - Challan details & snapshots
- `POST /api/challans` - Create sales challan (Draft or Confirmed)
- `PATCH /api/challans/:id/status` - Transition status (`DRAFT` → `CONFIRMED` / `CONFIRMED` → `CANCELLED`)
- `GET /api/challans/:id/pdf` - Download PDF invoice / sales docket

A Postman collection is included at `mini-erp-crm.postman_collection.json` in the repository root.
