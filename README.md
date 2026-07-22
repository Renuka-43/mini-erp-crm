# Mini ERP + CRM Operations Portal

> **Full Stack Developer Case Study Submission**  
> *Target Domain*: Wholesale & Distribution Operations Management  
> *Architecture*: React (Vite + TypeScript + Tailwind CSS) + Express.js (TypeScript + Prisma ORM + JWT + Zod + PDFKit)

---

## 🌟 Overview & Highlights

This repository contains a full-stack Mini ERP & CRM system built for wholesale and distribution companies. It addresses customer lifecycle management, product cataloging, stock control, sales challan generation, stock movement audit logging, and PDF invoice generation.

### Key Capabilities

1. **Role-Based Access Control (RBAC)**:
   - `Admin`: Full system access across all modules.
   - `Sales`: Customer CRM management, sales challan generation (Draft/Confirm), stock view.
   - `Warehouse`: Product catalog editing, manual stock adjustments (IN/OUT), low-stock alert monitoring.
   - `Accounts`: View sales challans, customer billing history, PDF invoice downloads.
   - **Interactive Role Switcher Banner**: Switch between roles in 1 click in the top navbar.

2. **Customer CRM Module**:
   - Customer status tracking (`LEAD`, `ACTIVE`, `INACTIVE`) & customer type classification (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
   - Paginated table search by name, email, mobile, or business name.
   - Complete follow-up note activity log with automated next follow-up date scheduling.

3. **Product & Inventory Module**:
   - SKU management, category tagging, unit pricing, warehouse bin locations, min-stock threshold alerts.
   - **Manual Stock Adjustments**: Instant stock IN/OUT adjustments with audit reason tracking.
   - **Stock Movement Log**: Comprehensive, immutable audit trail tracking product SKU, quantity change, movement type, reason, created by user, and timestamp.

4. **Sales Challan & Invoice Flow**:
   - Auto-generated challan numbers (e.g. `CH-20260721-0001`).
   - Create as **Draft** or **Confirmed**.
   - **Atomic Database Transaction**: When confirmed, checks stock sufficiency. If stock is insufficient, returns an itemized `400 Bad Request` error. If valid, atomically decrements product inventory and logs `OUT` stock movement records.
   - **Historical Snapshotting**: Stores JSON snapshots of customer and product details at creation time to protect historical records against future master data changes.
   - **PDF Invoice Download**: Built-in backend PDFKit engine producing crisp, downloadable sales dockets.

5. **DevOps & Containers**:
   - Dual-database strategy: SQLite out-of-the-box for instant zero-dependency local running + PostgreSQL ready for cloud/containerized environments.
   - `docker-compose.yml` for single-command deployment.
   - `mini-erp-crm.postman_collection.json` containing pre-configured, ready-to-test API calls.

---

## 🔑 Test Credentials Table

| Role | Email | Password | Allowed Access Summary |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@minierp.com` | `password123` | Full privileges across all modules |
| **Sales** | `sales@minierp.com` | `password123` | Customers CRM, Create Challans, View Products |
| **Warehouse** | `warehouse@minierp.com` | `password123` | Inventory, Stock Adjustments, Low Stock Alerts |
| **Accounts** | `accounts@minierp.com` | `password123` | View Sales Challans, Customer Billing, PDF Export |

---

## 🚀 Local Setup Instructions

### Prerequisites
- **Node.js** (v18+)
- **npm** or **yarn**

### 1. Clone & Setup Backend

```bash
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
```
*Backend API will run at `http://localhost:5000`.*

### 2. Setup & Run Frontend

```bash
cd frontend
npm install
npm run dev
```
*Frontend web application will run at `http://localhost:5173`.*

---

## 🐳 Docker Deployment (1-Command Launch)

Ensure Docker Desktop is running, then execute from the project root:

```bash
docker-compose up --build -d
```

- **Frontend App**: `http://localhost`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## ☁️ Deployment Guide (Free Hosting Providers)

### Frontend Deployment (Vercel / Netlify)
1. Push code to GitHub repository.
2. Link the `frontend/` directory in Vercel or Netlify.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Set Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Backend Deployment (Render / Railway / Fly.io)
1. Link `backend/` root in Render Web Service.
2. Build Command: `npm install && npx prisma generate && npm run build`
3. Start Command: `npm run start`
4. Set Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string (Supabase / Neon / Render Postgres)
   - `JWT_SECRET`: `your_secure_jwt_secret`
   - `PORT`: `5000`

---

## 📡 REST API Overview & Endpoints

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
- `PATCH /api/challans/:id/status` - Transition status (`DRAFT` ➔ `CONFIRMED` / `CONFIRMED` ➔ `CANCELLED`)
- `GET /api/challans/:id/pdf` - Download PDF Invoice / Sales Docket

---

## 📽️ Submission Checklist & Artifacts

- [x] **GitHub Repository Link**: Clean commit history
- [x] **Postman Collection**: `mini-erp-crm.postman_collection.json` included in root
- [x] **Database Seeding**: `npm run seed` sets up test accounts & sample records
- [x] **Docker Setup**: `docker-compose.yml` included
- [x] **PDF Invoice Generation**: PDFKit integration on backend
