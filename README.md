# Flipmart E-commerce Platform

This repository contains a complete e-commerce starter with:

- `backend/`: Django + Django REST Framework + JWT + Django Admin
- `frontend/`: React + Vite storefront

## Database Used

This project is configured to use **SQLite** by default for local development.

- Engine: `django.db.backends.sqlite3`
- File: `backend/db.sqlite3`

You can switch to PostgreSQL later, but SQLite is what the current codebase is set up to use out of the box.

## Features Included

- JWT authentication: register, login, token refresh, session/profile
- Product catalog with search, filtering, sorting, and pagination
- Product detail pages
- Cart management with one active cart per user
- Checkout with stock validation and order creation
- Stored order totals and line-item snapshots
- Address management
- Order history and status tracking
- Contact form API
- Django Admin for products, categories, orders, users, addresses, and contact messages
- Admin dashboard cards for total sales, orders, low stock alerts, revenue over time, and top-selling products
- Seed command with demo users, categories, products, a sample order, and an active cart

## Backend Setup

From the repo root:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend\requirements.txt
cd backend
python manage.py makemigrations core
python manage.py migrate
python manage.py seed_store
python manage.py runserver
```

Backend will run at:

- `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`
- API root prefix: `http://127.0.0.1:8000/api/`

## Frontend Setup

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend will run at:

- `http://127.0.0.1:5173/`

## Seeder

The seeder is:

- `backend/core/management/commands/seed_store.py`

Run it with:

```powershell
cd backend
python manage.py seed_store
```

To reset demo store data first:

```powershell
python manage.py seed_store --reset
```

## Demo Credentials

After running the seeder:

- Admin: `admin@flipmart.local` / `Admin123!`
- Customer: `customer@flipmart.local` / `Demo12345!`

## Important Notes

- Checkout requires authentication.
- Cart stock is validated before order creation.
- Order totals are stored directly on the `Order` model.
- A new active cart is created automatically after checkout.
- Guest cart behavior is handled in the frontend with local storage until login.

## Main API Endpoints

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/session/`
- `GET /api/home/`
- `GET /api/categories/`
- `GET /api/products/`
- `GET /api/products/<slug>/`
- `GET /api/cart/`
- `POST /api/cart/items/`
- `PATCH /api/cart/items/<id>/`
- `DELETE /api/cart/items/<id>/`
- `POST /api/orders/checkout/`
- `GET /api/orders/`
- `GET /api/orders/<order_number>/`
- `GET/PATCH /api/profile/`
- `GET/POST /api/addresses/`
- `PATCH/DELETE /api/addresses/<id>/`
- `POST /api/contact/`
