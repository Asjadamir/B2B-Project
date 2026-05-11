# CoreChain

## Description

CoreChain is a centralized B2B Inventory and Supply Chain Management platform built to optimize warehouse operations, track product lifecycles, and automate order processing. The platform supports multi-business environments with role-based access control, email-based staff invitations, and full audit trail logging.
CoreChain is a centralized B2B Inventory and Supply Chain Management platform built to optimize warehouse operations, track product lifecycles, and automate order processing. The platform supports multi-business environments with role-based access control, email-based staff invitations, and full audit trail logging.

## Team Members

- Muhammad Asjad (L24-2570)
- Hamza Sheikh (L24-2500)
- M. Abuzar Rizwan (L24-2535)

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Backend  | Node.js, Express (ESM, MVC pattern)                    |
| Database | Microsoft SQL Server (MSSQL via `mssql`)               |
| Auth     | JWT stored in HttpOnly cookie, bcryptjs, nodemailer    |
| Frontend | React 18, React Router v6, Redux Toolkit               |
| Forms    | React Hook Form + Zod validation                       |
| UI       | Shadcn/ui, Tailwind CSS, Lucide React, Sonner (toasts) |

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Backend  | Node.js, Express (ESM, MVC pattern)                    |
| Database | Microsoft SQL Server (MSSQL via `mssql`)               |
| Auth     | JWT stored in HttpOnly cookie, bcryptjs, nodemailer    |
| Frontend | React 18, React Router v6, Redux Toolkit               |
| Forms    | React Hook Form + Zod validation                       |
| UI       | Shadcn/ui, Tailwind CSS, Lucide React, Sonner (toasts) |

## How to Run

### Prerequisites

- Node.js 18+
- Microsoft SQL Server instance
- Gmail account (for invite/email features)

### Prerequisites

- Node.js 18+
- Microsoft SQL Server instance
- Gmail account (for invite/email features)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
DB_SERVER=localhost
DB_NAME=testDB
DB_USER=your_sql_user
DB_PASSWORD=your_sql_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev
```

### Database

Run `database/schema.sql` in SQL Server Management Studio (or Azure Data Studio) to create all tables and stored procedures. Optionally run `database/seed.sql` to populate roles and sample data.

````

Create a `.env` file in `backend/`:
```env
PORT=5000
DB_SERVER=localhost
DB_NAME=testDB
DB_USER=your_sql_user
DB_PASSWORD=your_sql_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
````

```bash
npm run dev
```

### Database

Run `database/schema.sql` in SQL Server Management Studio (or Azure Data Studio) to create all tables and stored procedures. Optionally run `database/seed.sql` to populate roles and sample data.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Modules & Features

### Authentication

- Sign up with email verification
- Login / Logout (HttpOnly JWT cookie)
- Forgot password / Reset password via email token
- Session persistence on page refresh via `GET /api/auth/me`

### Business Management

- Create and manage multiple businesses per user
- Update business name and description
- Soft delete (IsActive flag) — preserves all historical data and FK references

### Role-Based Access Control

Four roles with distinct permissions:

| Feature                     | Owner | Manager | Warehouse Staff | Procurement Officer |
| --------------------------- | ----- | ------- | --------------- | ------------------- |
| Suppliers — view            | ✅    | ✅      | ❌              | ✅                  |
| Suppliers — add             | ✅    | ✅      | ❌              | ✅                  |
| Suppliers — edit/delete     | ✅    | ✅      | ❌              | ❌                  |
| Products — view             | ✅    | ✅      | ✅              | ✅                  |
| Products — add/edit/delete  | ✅    | ✅      | ❌              | ❌                  |
| Purchase Orders             | ✅    | ✅      | view + receive  | ✅ full             |
| Sale Orders                 | ✅    | ✅      | view + fulfill  | ❌                  |
| Warehouses                  | ✅    | ✅      | view            | ❌                  |
| Inventory — view            | ✅    | ✅      | ✅              | ✅                  |
| Inventory — adjust/transfer | ✅    | ✅      | ❌              | ❌                  |
| Employees                   | ✅    | ✅      | ❌              | ❌                  |
| Audit Logs                  | ✅    | ✅      | ❌              | ❌                  |

### Employee Management

- Invite staff by email (with role assignment) — sends a tokenized invite link
- Invite acceptance creates a new account or logs into an existing one
- Role management: Owner can change any role; Manager cannot change another Manager
- Remove staff members; staff can leave a business via the user dropdown
- Pending invitations dashboard

### Supplier Management

- Full CRUD for suppliers
- Link/unlink products to suppliers (many-to-many)
- Supplier detail page: view linked products, attach/detach products from that supplier

### Product & Category Management

- Full CRUD for products with SKU, category, unit of measure, selling price
- Full CRUD for categories
- Multi-supplier linking per product (from both the product and supplier side)

### Warehouse Management

- Full CRUD for warehouses
- Assign staff to warehouses with warehouse-level roles

### Purchase Orders

- Create POs by selecting a supplier, destination warehouse, and products (only products linked to that supplier are shown)
- Mark as Received → automatically increments inventory per item
- Cancel POs (Owner/Manager only)
- Add, edit, remove line items on Pending orders

### Sale Orders

- Create SOs by selecting a source warehouse and products with available stock
- Selling price auto-filled from product catalog (overridable)
- Stock validation at creation time
- Mark as Fulfilled → automatically decrements inventory
- Cancel SOs (Owner/Manager only)

### Inventory

- **All Warehouses view**: grouped by product, shows total stock with per-warehouse distribution; multi-warehouse products expand to show individual rows with status badges
- **Per-Warehouse view**: flat table with individual stock counts, thresholds, and status (In Stock / Low Stock / Out of Stock)
- Manual stock adjustment (Owner/Manager) — set absolute quantity
- Stock transfer between warehouses (Owner/Manager) — validates available stock
- All inventory changes are audit-logged

### Audit Logs

- Full activity log per business (paginated, filterable)
- Covers: auth events, CRUD on all entities, PO/SO status changes, inventory adjustments and transfers

---

## API Reference

All endpoints are prefixed with `/api`. Authentication uses an HttpOnly cookie (`token`).

### Auth `/api/auth`

| Method | Endpoint                 | Description                                                 |
| ------ | ------------------------ | ----------------------------------------------------------- |
| POST   | `/signup`                | Register a new user (sends verification email)              |
| POST   | `/login`                 | Login, sets JWT cookie                                      |
| POST   | `/logout`                | Clears JWT cookie                                           |
| GET    | `/me`                    | Returns current user from cookie (used for session restore) |
| GET    | `/verify-email/:token`   | Verify email address                                        |
| POST   | `/forgot-password`       | Send password reset email                                   |
| POST   | `/reset-password/:token` | Reset password with token                                   |

### Business `/api/business`

| Method | Endpoint | Description                             |
| ------ | -------- | --------------------------------------- |
| POST   | `/`      | Create a new business                   |
| GET    | `/my`    | Get all businesses for the current user |
| GET    | `/:id`   | Get a business by ID                    |
| PUT    | `/:id`   | Update business                         |
| DELETE | `/:id`   | Soft-delete business (Owner only)       |

### Supplier `/api/supplier`

| Method | Endpoint                 | Description                              |
| ------ | ------------------------ | ---------------------------------------- |
| GET    | `/`                      | List all suppliers for a business        |
| GET    | `/:id`                   | Get supplier by ID                       |
| GET    | `/:id/products`          | Products linked to this supplier         |
| GET    | `/:id/unlinked-products` | Products not yet linked to this supplier |
| POST   | `/`                      | Create supplier                          |
| PUT    | `/:id`                   | Update supplier                          |
| DELETE | `/:id`                   | Soft-delete supplier                     |

### Category `/api/category`

| Method | Endpoint | Description                    |
| ------ | -------- | ------------------------------ |
| GET    | `/`      | List categories for a business |
| POST   | `/`      | Create category                |
| PUT    | `/:id`   | Update category                |
| DELETE | `/:id`   | Delete category                |

### Product `/api/product`

| Method | Endpoint                     | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| GET    | `/`                          | List products for a business      |
| GET    | `/:id`                       | Get product with linked suppliers |
| POST   | `/`                          | Create product                    |
| PUT    | `/:id`                       | Update product                    |
| DELETE | `/:id`                       | Soft-delete product               |
| POST   | `/:id/suppliers`             | Link a supplier to a product      |
| DELETE | `/:id/suppliers/:supplierId` | Unlink a supplier from a product  |

### Employee `/api/employee`

| Method | Endpoint                | Description                                          |
| ------ | ----------------------- | ---------------------------------------------------- |
| GET    | `/my-role`              | Get the current user's role in a business            |
| GET    | `/`                     | List all staff for a business                        |
| GET    | `/invites`              | List pending invitations (Manager/Owner)             |
| GET    | `/invite/:token`        | Get invite info by token                             |
| POST   | `/invite`               | Send an invitation email                             |
| POST   | `/invite/:token/accept` | Accept an invitation (creates or authenticates user) |
| PATCH  | `/:staffId/role`        | Update a staff member's role                         |
| DELETE | `/:staffId`             | Remove (expel) a staff member                        |
| POST   | `/leave`                | Leave a business                                     |

### Warehouse `/api/warehouse`

| Method | Endpoint              | Description                      |
| ------ | --------------------- | -------------------------------- |
| GET    | `/`                   | List warehouses for a business   |
| GET    | `/:id`                | Get warehouse by ID              |
| POST   | `/`                   | Create warehouse                 |
| PUT    | `/:id`                | Update warehouse                 |
| DELETE | `/:id`                | Soft-delete warehouse            |
| GET    | `/:id/staff`          | List staff assigned to warehouse |
| POST   | `/:id/staff`          | Assign staff to warehouse        |
| PATCH  | `/:id/staff/:staffId` | Update warehouse staff role      |
| DELETE | `/:id/staff/:staffId` | Remove staff from warehouse      |

### Purchase Order `/api/purchaseorder`

| Method | Endpoint                         | Description                               |
| ------ | -------------------------------- | ----------------------------------------- |
| GET    | `/`                              | List POs for a business                   |
| GET    | `/:id`                           | Get PO with line items                    |
| POST   | `/`                              | Create PO                                 |
| PATCH  | `/:id/status`                    | Update status (Received / Cancelled)      |
| POST   | `/:id/items`                     | Add line item to pending PO               |
| PATCH  | `/:id/items/:itemId`             | Update line item                          |
| DELETE | `/:id/items/:itemId`             | Remove line item                          |
| GET    | `/supplier/:supplierId/products` | Products linked to supplier (for PO form) |

### Sale Order `/api/saleorder`

| Method | Endpoint                           | Description                                    |
| ------ | ---------------------------------- | ---------------------------------------------- |
| GET    | `/`                                | List SOs for a business                        |
| GET    | `/:id`                             | Get SO with line items                         |
| POST   | `/`                                | Create SO (validates stock)                    |
| PATCH  | `/:id/status`                      | Update status (Fulfilled / Cancelled)          |
| GET    | `/warehouse/:warehouseId/products` | Products with stock in warehouse (for SO form) |

### Inventory `/api/inventory`

npm run dev

```

---

## Modules & Features

### Authentication
- Sign up with email verification
- Login / Logout (HttpOnly JWT cookie)
- Forgot password / Reset password via email token
- Session persistence on page refresh via `GET /api/auth/me`

### Business Management
- Create and manage multiple businesses per user
- Update business name and description
- Soft delete (IsActive flag) — preserves all historical data and FK references

### Role-Based Access Control
Four roles with distinct permissions:

| Feature | Owner | Manager | Warehouse Staff | Procurement Officer |
|---------|-------|---------|-----------------|---------------------|
| Suppliers — view | ✅ | ✅ | ❌ | ✅ |
| Suppliers — add | ✅ | ✅ | ❌ | ✅ |
| Suppliers — edit/delete | ✅ | ✅ | ❌ | ❌ |
| Products — view | ✅ | ✅ | ✅ | ✅ |
| Products — add/edit/delete | ✅ | ✅ | ❌ | ❌ |
| Purchase Orders | ✅ | ✅ | view + receive | ✅ full |
| Sale Orders | ✅ | ✅ | view + fulfill | ❌ |
| Warehouses | ✅ | ✅ | view | ❌ |
| Inventory — view | ✅ | ✅ | ✅ | ✅ |
| Inventory — adjust/transfer | ✅ | ✅ | ❌ | ❌ |
| Employees | ✅ | ✅ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ |

### Employee Management
- Invite staff by email (with role assignment) — sends a tokenized invite link
- Invite acceptance creates a new account or logs into an existing one
- Role management: Owner can change any role; Manager cannot change another Manager
- Remove staff members; staff can leave a business via the user dropdown
- Pending invitations dashboard

### Supplier Management
- Full CRUD for suppliers
- Link/unlink products to suppliers (many-to-many)
- Supplier detail page: view linked products, attach/detach products from that supplier

### Product & Category Management
- Full CRUD for products with SKU, category, unit of measure, selling price
- Full CRUD for categories
- Multi-supplier linking per product (from both the product and supplier side)

### Warehouse Management
- Full CRUD for warehouses
- Assign staff to warehouses with warehouse-level roles

### Purchase Orders
- Create POs by selecting a supplier, destination warehouse, and products (only products linked to that supplier are shown)
- Mark as Received → automatically increments inventory per item
- Cancel POs (Owner/Manager only)
- Add, edit, remove line items on Pending orders

### Sale Orders
- Create SOs by selecting a source warehouse and products with available stock
- Selling price auto-filled from product catalog (overridable)
- Stock validation at creation time
- Mark as Fulfilled → automatically decrements inventory
- Cancel SOs (Owner/Manager only)

### Inventory
- **All Warehouses view**: grouped by product, shows total stock with per-warehouse distribution; multi-warehouse products expand to show individual rows with status badges
- **Per-Warehouse view**: flat table with individual stock counts, thresholds, and status (In Stock / Low Stock / Out of Stock)
- Manual stock adjustment (Owner/Manager) — set absolute quantity
- Stock transfer between warehouses (Owner/Manager) — validates available stock
- All inventory changes are audit-logged

### Audit Logs
- Full activity log per business (paginated, filterable)
- Covers: auth events, CRUD on all entities, PO/SO status changes, inventory adjustments and transfers

---

## API Reference

All endpoints are prefixed with `/api`. Authentication uses an HttpOnly cookie (`token`).

### Auth `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register a new user (sends verification email) |
| POST | `/login` | Login, sets JWT cookie |
| POST | `/logout` | Clears JWT cookie |
| GET | `/me` | Returns current user from cookie (used for session restore) |
| GET | `/verify-email/:token` | Verify email address |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password/:token` | Reset password with token |

### Business `/api/business`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create a new business |
| GET | `/my` | Get all businesses for the current user |
| GET | `/:id` | Get a business by ID |
| PUT | `/:id` | Update business |
| DELETE | `/:id` | Soft-delete business (Owner only) |

### Supplier `/api/supplier`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all suppliers for a business |
| GET | `/:id` | Get supplier by ID |
| GET | `/:id/products` | Products linked to this supplier |
| GET | `/:id/unlinked-products` | Products not yet linked to this supplier |
| POST | `/` | Create supplier |
| PUT | `/:id` | Update supplier |
| DELETE | `/:id` | Soft-delete supplier |

### Category `/api/category`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List categories for a business |
| POST | `/` | Create category |
| PUT | `/:id` | Update category |
| DELETE | `/:id` | Delete category |

### Product `/api/product`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List products for a business |
| GET | `/:id` | Get product with linked suppliers |
| POST | `/` | Create product |
| PUT | `/:id` | Update product |
| DELETE | `/:id` | Soft-delete product |
| POST | `/:id/suppliers` | Link a supplier to a product |
| DELETE | `/:id/suppliers/:supplierId` | Unlink a supplier from a product |

### Employee `/api/employee`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-role` | Get the current user's role in a business |
| GET | `/` | List all staff for a business |
| GET | `/invites` | List pending invitations (Manager/Owner) |
| GET | `/invite/:token` | Get invite info by token |
| POST | `/invite` | Send an invitation email |
| POST | `/invite/:token/accept` | Accept an invitation (creates or authenticates user) |
| PATCH | `/:staffId/role` | Update a staff member's role |
| DELETE | `/:staffId` | Remove (expel) a staff member |
| POST | `/leave` | Leave a business |

### Warehouse `/api/warehouse`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List warehouses for a business |
| GET | `/:id` | Get warehouse by ID |
| POST | `/` | Create warehouse |
| PUT | `/:id` | Update warehouse |
| DELETE | `/:id` | Soft-delete warehouse |
| GET | `/:id/staff` | List staff assigned to warehouse |
| POST | `/:id/staff` | Assign staff to warehouse |
| PATCH | `/:id/staff/:staffId` | Update warehouse staff role |
| DELETE | `/:id/staff/:staffId` | Remove staff from warehouse |

### Purchase Order `/api/purchaseorder`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List POs for a business |
| GET | `/:id` | Get PO with line items |
| POST | `/` | Create PO |
| PATCH | `/:id/status` | Update status (Received / Cancelled) |
| POST | `/:id/items` | Add line item to pending PO |
| PATCH | `/:id/items/:itemId` | Update line item |
| DELETE | `/:id/items/:itemId` | Remove line item |
| GET | `/supplier/:supplierId/products` | Products linked to supplier (for PO form) |

### Sale Order `/api/saleorder`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List SOs for a business |
| GET | `/:id` | Get SO with line items |
| POST | `/` | Create SO (validates stock) |
| PATCH | `/:id/status` | Update status (Fulfilled / Cancelled) |
| GET | `/warehouse/:warehouseId/products` | Products with stock in warehouse (for SO form) |

### Inventory `/api/inventory`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all inventory rows for a business |
| POST | `/adjust` | Manually set stock quantity (Owner/Manager) |
| POST | `/transfer` | Transfer stock between warehouses (Owner/Manager) |
| GET | `/` | Get all inventory rows for a business |
| POST | `/adjust` | Manually set stock quantity (Owner/Manager) |
| POST | `/transfer` | Transfer stock between warehouses (Owner/Manager) |

### Audit Log `/api/auditlog`
### Audit Log `/api/auditlog`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get audit log entries for a business |

---

## Frontend Routes

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Sign up |
| `/forgot-password` | Forgot password |
| `/reset-password/:token` | Reset password |
| `/verify-email/:token` | Email verification |
| `/invite/:token` | Invite acceptance |
| `/dashboard` | Business selector dashboard |
| `/business/:id/overview` | Business overview |
| `/business/:id/suppliers` | Suppliers list |
| `/business/:id/suppliers/:supplierId` | Supplier detail + linked products |
| `/business/:id/products` | Products & categories |
| `/business/:id/purchase-orders` | Purchase orders list |
| `/business/:id/purchase-orders/new` | Create purchase order |
| `/business/:id/purchase-orders/:poId` | Purchase order detail |
| `/business/:id/sale-orders` | Sale orders list |
| `/business/:id/sale-orders/new` | Create sale order |
| `/business/:id/sale-orders/:soId` | Sale order detail |
| `/business/:id/inventory` | Inventory overview |
| `/business/:id/employees` | Team & pending invites |
| `/business/:id/warehouses` | Warehouses list |
| `/business/:id/warehouses/:wId` | Warehouse detail + staff |
| `/business/:id/audit-logs` | Audit log |
| GET | `/` | Get audit log entries for a business |

---

## Frontend Routes

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Sign up |
| `/forgot-password` | Forgot password |
| `/reset-password/:token` | Reset password |
| `/verify-email/:token` | Email verification |
| `/invite/:token` | Invite acceptance |
| `/dashboard` | Business selector dashboard |
| `/business/:id/overview` | Business overview |
| `/business/:id/suppliers` | Suppliers list |
| `/business/:id/suppliers/:supplierId` | Supplier detail + linked products |
| `/business/:id/products` | Products & categories |
| `/business/:id/purchase-orders` | Purchase orders list |
| `/business/:id/purchase-orders/new` | Create purchase order |
| `/business/:id/purchase-orders/:poId` | Purchase order detail |
| `/business/:id/sale-orders` | Sale orders list |
| `/business/:id/sale-orders/new` | Create sale order |
| `/business/:id/sale-orders/:soId` | Sale order detail |
| `/business/:id/inventory` | Inventory overview |
| `/business/:id/employees` | Team & pending invites |
| `/business/:id/warehouses` | Warehouses list |
| `/business/:id/warehouses/:wId` | Warehouse detail + staff |
| `/business/:id/audit-logs` | Audit log |

## Database
The CoreChain schema consists of **20 relational tables** deployed to Microsoft SQL Server, enforcing foreign key constraints, CHECK constraints on status fields, and soft-delete patterns via `IsActive` flags.

Key tables: `Users`, `Business`, `Roles`, `Staff`, `Staff_Warehouse`, `JoiningRequest`, `Warehouse`, `Category`, `Product`, `Supplier`, `Product_Supplier`, `Inventory`, `PurchaseOrder`, `PurchaseOrderItem`, `SaleOrder`, `SaleOrderItem`, `ProductReturn`, `VerifyTokens`, `ResetTokens`, `AuditLog`.
```
