# CoreChain

## Description
CoreChain is a centralized B2B Inventory and Supply Chain Management platform built to optimize warehouse operations, track product lifecycles, and automate order processing. Sprint 1 covers the foundational architecture including a complete 20-table database schema with ERD, and three fully implemented modules — User Authentication, Business Management, and Supplier Management — with both backend APIs and frontend interfaces.

## Team Members
- Muhammad Asjad (L24-2570)
- Hamza Sheikh (L24-2500)
- M. Abuzar Rizwan (L24-2535)

## Tech Stack
- Backend: Node.js (Express, MVC pattern)
- Frontend: React (React Router, Axios)
- Database: MySQL

## How to Run

### Backend
```bash
cd backend
npm install
# Create a .env file with your DB credentials and JWT secret
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Auth (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT |
| GET | `/verify-email` | Verify email from token |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Reset password with token |

### Business (`/business`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Register a new business |
| PUT | `/update` | Update business profile |
| POST | `/join-request` | Submit a join request |
| PATCH | `/join-request/:id` | Approve or reject join request |

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Sign Up | `/register` | Registration form with validation |
| Login | `/login` | Email & password login, JWT stored on success |
| Verify Email | `/verify-email` | Email verification via URL token |
| Forgot Password | `/forgot-password` | Triggers password reset email |
| Reset Password | `/reset-password` | Token-secured new password form |
| Onboarding | `/onboarding` | Create or join a business |
| Dashboard | `/dashboard` | Main page for active staff |

## Database
The full CoreChain schema consists of **20 relational tables** deployed to MySQL, enforcing foreign key constraints, ENUM status fields, and soft-delete patterns via `IsActive` flags. Three SQL views are also included:
- `vw_CurrentStock` — real-time stock dashboard
- `vw_LowStockAlerts` — low-stock filter
- `vw_ProfitLoss` — revenue vs COGS per product

Key tables: `Users`, `Business`, `Staff`, `Roles`, `Supplier`, `Product`, `Inventory`, `PurchaseOrder`, `SaleOrder`, `AuditLog`, and more.

## Sprint 1 Modules Completed
- User Authentication (Sign Up, Login, Email Verification, Password Reset)
- Business Management & Onboarding (Create, Update, Join Request, Approval)
- Supplier & Vendor Management (Register, Update, Soft-Delete, Search)
