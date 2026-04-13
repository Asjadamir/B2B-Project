-- ============================================================
--  CORECHAIN — B2B Inventory & Supply Chain Management System
-- ============================================================

CREATE DATABASE IF NOT EXISTS corechain;
USE corechain;

-- ============================================================
--  1. Users
-- ============================================================
CREATE TABLE Users (
    UserID       INT          PRIMARY KEY AUTO_INCREMENT,
    FullName     VARCHAR(100) NOT NULL,
    Email        VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsVerified   BOOLEAN      NOT NULL DEFAULT FALSE,
    CreatedAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  2. VerifyTokens
-- ============================================================
CREATE TABLE VerifyTokens (
    UserID    INT         NOT NULL,
    Token     VARCHAR(64) NOT NULL,
    ValidTill DATETIME    NOT NULL,

    CONSTRAINT fk_vt_user
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
--  3. ResetTokens
-- ============================================================
CREATE TABLE ResetTokens (
    UserID    INT         NOT NULL,
    Token     VARCHAR(64) NOT NULL,
    ValidTill DATETIME    NOT NULL,

    CONSTRAINT fk_rt_user
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
--  4. Business
-- ============================================================
CREATE TABLE Business (
    BusinessID   INT          PRIMARY KEY AUTO_INCREMENT,
    BusinessName VARCHAR(150) NOT NULL,
    Description  TEXT,
    OwnerID      INT          NOT NULL,
    CreatedAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_business_owner
        FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  5. Roles
-- ============================================================
CREATE TABLE Roles (
    RoleID   INT         PRIMARY KEY AUTO_INCREMENT,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================================
--  6. Staff
-- ============================================================
CREATE TABLE Staff (
    StaffID    INT      PRIMARY KEY AUTO_INCREMENT,
    UserID     INT      NOT NULL,
    BusinessID INT      NOT NULL,
    RoleID     INT      NOT NULL,
    JoinedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IsActive   BOOLEAN  NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_staff_user
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_staff_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_staff_role
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  7. JoiningRequest
-- ============================================================
CREATE TABLE JoiningRequest (
    RequestID   INT          PRIMARY KEY AUTO_INCREMENT,
    Email       VARCHAR(150) NOT NULL,
    BusinessID  INT          NOT NULL,
    RoleID      INT          NOT NULL,
    InvitedBy   INT          NOT NULL,
    Token       VARCHAR(64)  NOT NULL UNIQUE,
    Status      ENUM('Pending', 'Accepted', 'Expired') NOT NULL DEFAULT 'Pending',
    ValidTill   DATETIME     NOT NULL,
    InvitedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jr_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_jr_role
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_jr_invitedby
        FOREIGN KEY (InvitedBy) REFERENCES Users(UserID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  8. Warehouse
-- ============================================================
CREATE TABLE Warehouse (
    WarehouseID   INT          PRIMARY KEY AUTO_INCREMENT,
    WarehouseName VARCHAR(150) NOT NULL,
    Address       VARCHAR(255),
    City          VARCHAR(100),
    BusinessID    INT          NOT NULL,
    IsActive      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_warehouse_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  9. Staff_Warehouse
-- ============================================================
CREATE TABLE Staff_Warehouse (
    StaffID     INT      NOT NULL,
    WarehouseID INT      NOT NULL,
    RoleID      INT      NOT NULL,
    AssignedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (StaffID, WarehouseID),

    CONSTRAINT fk_sw_staff
        FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sw_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sw_role
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  10. Category
-- ============================================================
CREATE TABLE Category (
    CategoryID   INT          PRIMARY KEY AUTO_INCREMENT,
    CategoryName VARCHAR(100) NOT NULL,
    BusinessID   INT          NOT NULL,

    CONSTRAINT fk_category_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT uq_category_per_business
        UNIQUE (CategoryName, BusinessID)
);

-- ============================================================
--  11. Product
-- ============================================================
CREATE TABLE Product (
    ProductID     INT           PRIMARY KEY AUTO_INCREMENT,
    ProductName   VARCHAR(150)  NOT NULL,
    SKU           VARCHAR(100)  NOT NULL UNIQUE,
    CategoryID    INT           NOT NULL,
    UnitOfMeasure VARCHAR(50)   NOT NULL,
    SellingPrice  DECIMAL(12,2) NOT NULL CHECK (SellingPrice >= 0),
    BusinessID    INT           NOT NULL,
    IsActive      BOOLEAN       NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_product_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  12. Supplier
-- ============================================================
CREATE TABLE Supplier (
    SupplierID    INT          PRIMARY KEY AUTO_INCREMENT,
    SupplierName  VARCHAR(150) NOT NULL,
    ContactNumber VARCHAR(20),
    Email         VARCHAR(150),
    Description   TEXT,
    BusinessID    INT          NOT NULL,
    IsActive      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_supplier_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  13. Product_Supplier
-- ============================================================
CREATE TABLE Product_Supplier (
    ProductID  INT NOT NULL,
    SupplierID INT NOT NULL,

    PRIMARY KEY (ProductID, SupplierID),

    CONSTRAINT fk_ps_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ps_supplier
        FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
--  14. Inventory
-- ============================================================
CREATE TABLE Inventory (
    WarehouseID       INT      NOT NULL,
    ProductID         INT      NOT NULL,
    Quantity          INT      NOT NULL DEFAULT 0 CHECK (Quantity >= 0),
    LowStockThreshold INT      NOT NULL DEFAULT 10,
    LastUpdated       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (WarehouseID, ProductID),

    CONSTRAINT fk_inv_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inv_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  15. PurchaseOrder
-- ============================================================
CREATE TABLE PurchaseOrder (
    POID        INT      PRIMARY KEY AUTO_INCREMENT,
    SupplierID  INT      NOT NULL,
    WarehouseID INT      NOT NULL,
    OrderDate   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status      ENUM('Pending', 'Received', 'Cancelled') NOT NULL DEFAULT 'Pending',
    CreatedBy   INT      NOT NULL,

    CONSTRAINT fk_po_supplier
        FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_po_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_po_createdby
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  16. PurchaseOrderItem
-- ============================================================
CREATE TABLE PurchaseOrderItem (
    POItemID  INT           PRIMARY KEY AUTO_INCREMENT,
    POID      INT           NOT NULL,
    ProductID INT           NOT NULL,
    Quantity  INT           NOT NULL CHECK (Quantity > 0),
    UnitCost  DECIMAL(12,2) NOT NULL CHECK (UnitCost >= 0),
    TotalCost DECIMAL(14,2) GENERATED ALWAYS AS (Quantity * UnitCost) STORED,

    CONSTRAINT fk_poi_po
        FOREIGN KEY (POID) REFERENCES PurchaseOrder(POID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_poi_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  17. SaleOrder
-- ============================================================
CREATE TABLE SaleOrder (
    SOID            INT          PRIMARY KEY AUTO_INCREMENT,
    BusinessID      INT          NOT NULL,
    WarehouseID     INT          NOT NULL,
    CustomerName    VARCHAR(150) NOT NULL,
    CustomerContact VARCHAR(20),
    CustomerAddress VARCHAR(255),
    OrderDate       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status          ENUM('Pending', 'Fulfilled', 'Cancelled') NOT NULL DEFAULT 'Pending',
    CreatedBy       INT          NOT NULL,

    CONSTRAINT fk_so_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_so_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_so_createdby
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  18. SaleOrderItem
-- ============================================================
CREATE TABLE SaleOrderItem (
    SOItemID   INT           PRIMARY KEY AUTO_INCREMENT,
    SOID       INT           NOT NULL,
    ProductID  INT           NOT NULL,
    Quantity   INT           NOT NULL CHECK (Quantity > 0),
    UnitPrice  DECIMAL(12,2) NOT NULL CHECK (UnitPrice >= 0),
    TotalPrice DECIMAL(14,2) GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,

    CONSTRAINT fk_soi_so
        FOREIGN KEY (SOID) REFERENCES SaleOrder(SOID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_soi_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  19. ProductReturn
-- ============================================================
CREATE TABLE ProductReturn (
    ReturnID   INT      PRIMARY KEY AUTO_INCREMENT,
    SOID       INT      NOT NULL,
    ProductID  INT      NOT NULL,
    Quantity   INT      NOT NULL CHECK (Quantity > 0),
    Reason     TEXT,
    ReturnDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status     ENUM('Pending', 'Processed') NOT NULL DEFAULT 'Pending',

    CONSTRAINT fk_pr_so
        FOREIGN KEY (SOID) REFERENCES SaleOrder(SOID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pr_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  20. AuditLog
-- ============================================================
CREATE TABLE AuditLog (
    LogID      INT          PRIMARY KEY AUTO_INCREMENT,
    BusinessID INT          NOT NULL,
    ActorID    INT          NOT NULL,
    Action     VARCHAR(100) NOT NULL,
    EntityType VARCHAR(50)  NOT NULL,
    EntityID   INT,
    Details    TEXT,
    CreatedAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_al_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_al_actor
        FOREIGN KEY (ActorID) REFERENCES Users(UserID)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
--  VIEWS
-- ============================================================

-- Real-time stock dashboard with alert status (Feature 5)
CREATE OR REPLACE VIEW vw_CurrentStock AS
SELECT
    w.WarehouseName,
    p.ProductName,
    p.SKU,
    i.Quantity,
    i.LowStockThreshold,
    CASE
        WHEN i.Quantity = 0                        THEN 'OUT OF STOCK'
        WHEN i.Quantity <= i.LowStockThreshold     THEN 'LOW STOCK'
        ELSE                                            'OK'
    END AS StockStatus
FROM Inventory i
JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
JOIN Product   p ON i.ProductID   = p.ProductID;

-- Low stock alerts only (Feature 7)
CREATE OR REPLACE VIEW vw_LowStockAlerts AS
SELECT
    w.WarehouseName,
    p.ProductName,
    p.SKU,
    i.Quantity          AS CurrentStock,
    i.LowStockThreshold AS MinRequired
FROM Inventory i
JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
JOIN Product   p ON i.ProductID   = p.ProductID
WHERE i.Quantity <= i.LowStockThreshold;

-- Profit & Loss per product (Feature 8)
CREATE OR REPLACE VIEW vw_ProfitLoss AS
SELECT
    p.ProductID,
    p.ProductName,
    p.SKU,
    COALESCE(SUM(soi.TotalPrice), 0)                    AS TotalRevenue,
    COALESCE(SUM(poi.UnitCost * soi.Quantity), 0)       AS TotalCOGS,
    COALESCE(SUM(soi.TotalPrice), 0)
        - COALESCE(SUM(poi.UnitCost * soi.Quantity), 0) AS GrossProfit
FROM Product p
LEFT JOIN SaleOrderItem     soi ON p.ProductID = soi.ProductID
LEFT JOIN PurchaseOrderItem poi ON p.ProductID = poi.ProductID
GROUP BY p.ProductID, p.ProductName, p.SKU;
