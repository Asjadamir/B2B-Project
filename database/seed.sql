-- ============================================================
--  CORECHAIN — B2B Inventory & Supply Chain Management System
-- ============================================================

USE corechain;

-- ============================================================
--  Users
--  Passwords below are bcrypt hashes of the plain-text shown
--  Plain-text passwords (for testing login):
--    abuzar@corechain.com  → Password@123
--    hamza@corechain.com   → Password@123
--    asjad@corechain.com   → Password@123
--    sara@techmart.com     → Password@123
--    ali@techmart.com      → Password@123
--    zara@swiftgoods.com   → Password@123
--    usman@swiftgoods.com  → Password@123
-- ============================================================
INSERT INTO Users (FullName, Email, PasswordHash, IsVerified) VALUES
('Abuzar Rizwan',  'abuzar@corechain.com',  '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', TRUE),
('Hamza Sheikh',   'hamza@corechain.com',   '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', TRUE),
('Asjad Amir',     'asjad@corechain.com',   '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', TRUE),
('Sara Khan',      'sara@techmart.com',     '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', TRUE),
('Ali Raza',       'ali@techmart.com',      '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', FALSE),
('Zara Malik',     'zara@swiftgoods.com',   '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', TRUE),
('Usman Tariq',    'usman@swiftgoods.com',  '$2b$12$eImiTXuWVxfM37uY4JANjO7HS04aLp0oYCdGIHHVpXfXmU/Kq5gDG', FALSE);

-- ============================================================
--  Roles  (must exist before Staff inserts)
-- ============================================================
INSERT INTO Roles (RoleName) VALUES
('Owner'),              -- RoleID 1
('Manager'),            -- RoleID 2
('Warehouse Staff'),    -- RoleID 3
('Procurement Officer');-- RoleID 4

-- ============================================================
--  Business
-- ============================================================
INSERT INTO Business (BusinessName, Description, OwnerID) VALUES
('TechMart Pvt Ltd',   'Electronics wholesale distributor',    1),  -- BusinessID 1
('SwiftGoods Co.',     'FMCG supply chain operator',           4),  -- BusinessID 2
('BuildCore Supplies', 'Construction material B2B supplier',   6);  -- BusinessID 3

-- ============================================================
--  Staff
-- ============================================================
INSERT INTO Staff (UserID, BusinessID, RoleID, IsActive) VALUES
(1, 1, 1, TRUE),   -- Abuzar  = Owner at TechMart
(2, 1, 2, TRUE),   -- Hamza   = Manager at TechMart
(3, 1, 4, TRUE),   -- Asjad   = Procurement Officer at TechMart
(4, 2, 1, TRUE),   -- Sara    = Owner at SwiftGoods
(5, 2, 2, TRUE),   -- Ali     = Manager at SwiftGoods
(6, 3, 1, TRUE),   -- Zara    = Owner at BuildCore
(7, 2, 3, FALSE);  -- Usman   = Warehouse Staff at SwiftGoods (inactive)

-- ============================================================
--  JoiningRequest
-- ============================================================
INSERT INTO JoiningRequest (UserID, BusinessID, Status, ValidTill) VALUES
(5, 1, 'Pending',  '2025-06-30'),
(7, 1, 'Rejected', '2025-05-01'),
(3, 2, 'Approved', '2025-07-15');

-- ============================================================
--  Warehouse
-- ============================================================
INSERT INTO Warehouse (WarehouseName, Address, City, BusinessID, IsActive) VALUES
('TechMart Lahore Hub',    '12 Ferozepur Road',   'Lahore',    1, TRUE),   -- WarehouseID 1
('TechMart Karachi Store', '88 Shahrah-e-Faisal', 'Karachi',   1, TRUE),   -- WarehouseID 2
('SwiftGoods Central',     '5 Main Boulevard',    'Islamabad', 2, TRUE),   -- WarehouseID 3
('BuildCore Depot',        '33 Industrial Zone',  'Lahore',    3, FALSE);  -- WarehouseID 4 (inactive)

-- ============================================================
--  Staff_Warehouse
-- ============================================================
INSERT INTO Staff_Warehouse (StaffID, WarehouseID, RoleID) VALUES
(2, 1, 2),  -- Hamza manages TechMart Lahore
(3, 1, 4),  -- Asjad is procurement at TechMart Lahore
(3, 2, 4),  -- Asjad is procurement at TechMart Karachi
(5, 3, 2),  -- Ali manages SwiftGoods Central
(7, 3, 3);  -- Usman is warehouse staff at SwiftGoods Central

-- ============================================================
--  Category
-- ============================================================
INSERT INTO Category (CategoryName, ParentCategoryID) VALUES
('Electronics',    NULL),  -- CategoryID 1
('Laptops',        1),     -- CategoryID 2
('Smartphones',    1),     -- CategoryID 3
('FMCG',           NULL),  -- CategoryID 4
('Beverages',      4),     -- CategoryID 5
('Construction',   NULL),  -- CategoryID 6
('Cement & Steel', 6);     -- CategoryID 7

-- ============================================================
--  Product
-- ============================================================
INSERT INTO Product (ProductName, SKU, CategoryID, UnitOfMeasure, SellingPrice, BusinessID) VALUES
('Dell Laptop 15',       'SKU-LAP-001', 2, 'Unit',    95000.00, 1),
('Samsung Galaxy S24',   'SKU-PHN-001', 3, 'Unit',    75000.00, 1),
('HP Pavilion 14',       'SKU-LAP-002', 2, 'Unit',    82000.00, 1),
('Pepsi 1.5L Bottle',    'SKU-BEV-001', 5, 'Crate',   1200.00,  2),
('Nestle Water 500ml',   'SKU-BEV-002', 5, 'Carton',  650.00,   2),
('OPC Cement 50kg Bag',  'SKU-CMT-001', 7, 'Bag',     950.00,   3),
('TMT Steel Rebar 12mm', 'SKU-STL-001', 7, 'Ton',     145000.00,3);

-- ============================================================
--  Supplier
-- ============================================================
INSERT INTO Supplier (SupplierName, ContactNumber, Email, Description, BusinessID) VALUES
('Tech Distributors PK', '0300-1234567', 'sales@techdist.pk',    'Official Dell & HP distributor',    1),
('Mobile World Pvt',     '0321-9876543', 'orders@mobileworld.pk','Samsung authorized reseller',        1),
('FoodLine Supplies',    '0311-5556677', 'supply@foodline.pk',   'FMCG bulk supplier',                 2),
('CivilMart Corp',       '0333-1122334', 'bulk@civilmart.pk',    'Construction materials wholesaler',  3);

-- ============================================================
--  Product_Supplier
-- ============================================================
INSERT INTO Product_Supplier (ProductID, SupplierID) VALUES
(1, 1),  -- Dell Laptop   ← Tech Distributors
(3, 1),  -- HP Pavilion   ← Tech Distributors
(2, 2),  -- Samsung       ← Mobile World
(4, 3),  -- Pepsi         ← FoodLine
(5, 3),  -- Nestle        ← FoodLine
(6, 4),  -- Cement        ← CivilMart
(7, 4);  -- Steel         ← CivilMart

-- ============================================================
--  Inventory
-- ============================================================
INSERT INTO Inventory (WarehouseID, ProductID, Quantity, LowStockThreshold) VALUES
(1, 1,  45, 10),  -- Dell Laptop    @ Lahore      — OK
(1, 2,  30, 10),  -- Samsung        @ Lahore      — OK
(1, 3,   8, 10),  -- HP Pavilion    @ Lahore      — LOW STOCK
(2, 1,  20, 10),  -- Dell Laptop    @ Karachi     — OK
(2, 2,   5, 10),  -- Samsung        @ Karachi     — LOW STOCK
(3, 4, 200, 50),  -- Pepsi          @ SwiftGoods  — OK
(3, 5, 150, 50),  -- Nestle         @ SwiftGoods  — OK
(4, 6,  80, 20),  -- Cement         @ BuildCore   — OK
(4, 7,   0,  5);  -- Steel          @ BuildCore   — OUT OF STOCK

-- ============================================================
--  PurchaseOrder
-- ============================================================
INSERT INTO PurchaseOrder (SupplierID, WarehouseID, OrderDate, Status, CreatedBy) VALUES
(1, 1, '2025-03-01 09:00:00', 'Received',  2),  -- POID 1
(2, 1, '2025-03-05 10:30:00', 'Received',  2),  -- POID 2
(3, 3, '2025-03-08 11:00:00', 'Pending',   5),  -- POID 3
(1, 2, '2025-03-10 14:00:00', 'Cancelled', 2);  -- POID 4

-- ============================================================
--  PurchaseOrderItem
-- ============================================================
INSERT INTO PurchaseOrderItem (POID, ProductID, Quantity, UnitCost) VALUES
(1, 1,  20, 72000.00),  -- 20 Dell Laptops
(1, 3,  15, 60000.00),  -- 15 HP Pavilions
(2, 2,  25, 55000.00),  -- 25 Samsung phones
(3, 4, 100,   900.00),  -- 100 Pepsi crates (Pending PO)
(3, 5,  80,   480.00),  -- 80 Nestle cartons (Pending PO)
(4, 1,  10, 72000.00);  -- Cancelled PO item

-- ============================================================
--  SaleOrder
-- ============================================================
INSERT INTO SaleOrder (BusinessID, WarehouseID, CustomerName, CustomerContact, CustomerAddress, OrderDate, Status, CreatedBy) VALUES
(1, 1, 'Alpha Tech Store', '0311-0001111', 'Gulberg, Lahore',     '2025-03-03 10:00:00', 'Fulfilled', 2),
(1, 1, 'Beta Electronics', '0322-2223333', 'DHA Phase 5, Lahore', '2025-03-06 13:00:00', 'Fulfilled', 3),
(1, 2, 'Gamma Mobile Hub', '0333-4445555', 'Saddar, Karachi',     '2025-03-09 09:30:00', 'Pending',   2),
(2, 3, 'QuickMart Stores', '0344-6667777', 'F-7, Islamabad',      '2025-03-10 15:00:00', 'Fulfilled', 5);

-- ============================================================
--  SaleOrderItem
-- ============================================================
INSERT INTO SaleOrderItem (SOID, ProductID, Quantity, UnitPrice) VALUES
(1, 1,  5, 95000.00),  -- 5 Dell Laptops to Alpha Tech
(1, 3,  3, 82000.00),  -- 3 HP Pavilions to Alpha Tech
(2, 2,  8, 75000.00),  -- 8 Samsung phones to Beta Electronics
(3, 1,  4, 95000.00),  -- 4 Dell Laptops to Gamma (Pending)
(4, 4, 50,  1200.00),  -- 50 Pepsi crates to QuickMart
(4, 5, 40,   650.00);  -- 40 Nestle cartons to QuickMart

-- ============================================================
--  ProductReturn
-- ============================================================
INSERT INTO ProductReturn (SOID, ProductID, Quantity, Reason, Status) VALUES
(1, 3, 1, 'Screen defect reported by customer', 'Processed'),
(2, 2, 2, 'Wrong model delivered',              'Pending');

-- ============================================================
--  AuditLog
-- ============================================================
INSERT INTO AuditLog (TableName, ActionType, RecordID, ChangedBy, LogMessage) VALUES
('SaleOrder',    'INSERT', 1, 2, 'New sale order created for Alpha Tech Store'),
('Inventory',    'UPDATE', 1, 2, 'Stock reduced after SO-1 fulfillment'),
('PurchaseOrder','UPDATE', 4, 2, 'PO-4 cancelled due to supplier delay'),
('Staff',        'UPDATE', 7, 1, 'Usman Tariq set to inactive');
