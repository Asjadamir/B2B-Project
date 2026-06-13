CREATE DATABASE testDB;

USE testDB;


-- ============================================================
--  1. Users
-- ============================================================
CREATE TABLE Users (
    UserID       INT PRIMARY KEY IDENTITY(1,1),
    FullName     VARCHAR(100) NOT NULL,
    Email        VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsVerified   BIT NOT NULL DEFAULT 0,
    CreatedAt    DATETIME NOT NULL DEFAULT GETDATE()
);

-- ============================================================
--  2. VerifyTokens
-- ============================================================
CREATE TABLE VerifyTokens (
    UserID    INT NOT NULL,
    Token     VARCHAR(64) NOT NULL,
    ValidTill DATETIME NOT NULL,

    CONSTRAINT fk_vt_user
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE
);

-- ============================================================
--  3. ResetTokens
-- ============================================================
CREATE TABLE ResetTokens (
    UserID    INT NOT NULL,
    Token     VARCHAR(64) NOT NULL,
    ValidTill DATETIME NOT NULL,

    CONSTRAINT fk_rt_user
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE
);

-- ============================================================
--  4. Business
-- ============================================================
CREATE TABLE Business (
    BusinessID   INT PRIMARY KEY IDENTITY(1,1),
    BusinessName VARCHAR(150) NOT NULL,
    Description  VARCHAR(MAX),
    OwnerID      INT NOT NULL,
    IsActive     BIT NOT NULL DEFAULT 1,
    CreatedAt    DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_business_owner
        FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
);

-- ============================================================
--  5. Roles
-- ============================================================
CREATE TABLE Roles (
    RoleID   INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================================
--  6. Staff
-- ============================================================
CREATE TABLE Staff (
    StaffID    INT PRIMARY KEY IDENTITY(1,1),
    UserID     INT NOT NULL,
    BusinessID INT NOT NULL,
    RoleID     INT NOT NULL,
    JoinedAt   DATETIME NOT NULL DEFAULT GETDATE(),
    IsActive   BIT NOT NULL DEFAULT 1,

    CONSTRAINT fk_staff_user
        FOREIGN KEY (UserID) REFERENCES Users(UserID),

    CONSTRAINT fk_staff_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID),

    CONSTRAINT fk_staff_role
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- ============================================================
--  7. JoiningRequest
-- ============================================================
CREATE TABLE JoiningRequest (
    RequestID   INT PRIMARY KEY IDENTITY(1,1),
    Email       VARCHAR(150) NOT NULL,
    BusinessID  INT NOT NULL,
    RoleID      INT NOT NULL,
    InvitedBy   INT NOT NULL,
    Token       VARCHAR(64) NOT NULL UNIQUE,

    Status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Accepted', 'Expired')),

    ValidTill   DATETIME NOT NULL,
    InvitedAt   DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_jr_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE CASCADE,

    CONSTRAINT fk_jr_role
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),

    CONSTRAINT fk_jr_invitedby
        FOREIGN KEY (InvitedBy) REFERENCES Users(UserID)
);

-- ============================================================
--  8. Warehouse
-- ============================================================
CREATE TABLE Warehouse (
    WarehouseID   INT PRIMARY KEY IDENTITY(1,1),
    WarehouseName VARCHAR(150) NOT NULL,
    Address       VARCHAR(255),
    City          VARCHAR(100),
    BusinessID    INT NOT NULL,
    IsActive      BIT NOT NULL DEFAULT 1,

    CONSTRAINT fk_warehouse_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
);

-- ============================================================
--  9. Staff_Warehouse
-- ============================================================
CREATE TABLE Staff_Warehouse (
    StaffID     INT NOT NULL,
    WarehouseID INT NOT NULL,
    RoleID      INT NOT NULL,
    AssignedAt  DATETIME NOT NULL DEFAULT GETDATE(),

    PRIMARY KEY (StaffID, WarehouseID),

    CONSTRAINT fk_sw_staff
        FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
        ON DELETE CASCADE,

    CONSTRAINT fk_sw_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
        ON DELETE CASCADE,

    CONSTRAINT fk_sw_role
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- ============================================================
--  10. Category
-- ============================================================
CREATE TABLE Category (
    CategoryID   INT PRIMARY KEY IDENTITY(1,1),
    CategoryName VARCHAR(100) NOT NULL,
    BusinessID   INT NOT NULL,

    CONSTRAINT fk_category_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID),

    CONSTRAINT uq_category_per_business
        UNIQUE (CategoryName, BusinessID)
);

-- ============================================================
--  11. Product
-- ============================================================
CREATE TABLE Product (
    ProductID     INT PRIMARY KEY IDENTITY(1,1),
    ProductName   VARCHAR(150) NOT NULL,
    SKU           VARCHAR(100) NOT NULL,
    CategoryID    INT NOT NULL,
    UnitOfMeasure VARCHAR(50) NOT NULL,
    SellingPrice  DECIMAL(12,2) NOT NULL CHECK (SellingPrice >= 0),
    BusinessID    INT NOT NULL,
    IsActive      BIT NOT NULL DEFAULT 1,

    CONSTRAINT fk_product_category
        FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID),

    CONSTRAINT fk_product_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
);

-- ============================================================
--  12. Supplier
-- ============================================================
CREATE TABLE Supplier (
    SupplierID    INT PRIMARY KEY IDENTITY(1,1),
    SupplierName  VARCHAR(150) NOT NULL,
    ContactNumber VARCHAR(20),
    Email         VARCHAR(150),
    Description   VARCHAR(MAX),
    BusinessID    INT NOT NULL,
    IsActive      BIT NOT NULL DEFAULT 1,

    CONSTRAINT fk_supplier_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
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
        ON DELETE CASCADE,

    CONSTRAINT fk_ps_supplier
        FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID)
        ON DELETE CASCADE
);

-- ============================================================
--  14. Inventory
-- ============================================================
CREATE TABLE Inventory (
    WarehouseID       INT NOT NULL,
    ProductID         INT NOT NULL,
    Quantity          INT NOT NULL DEFAULT 0 CHECK (Quantity >= 0),
    LowStockThreshold INT NOT NULL DEFAULT 10,
    LastUpdated       DATETIME NOT NULL DEFAULT GETDATE(),

    PRIMARY KEY (WarehouseID, ProductID),

    CONSTRAINT fk_inv_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),

    CONSTRAINT fk_inv_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

-- ============================================================
--  15. PurchaseOrder
-- ============================================================
CREATE TABLE PurchaseOrder (
    POID        INT PRIMARY KEY IDENTITY(1,1),
    SupplierID  INT NOT NULL,
    WarehouseID INT NOT NULL,
    OrderDate   DATETIME NOT NULL DEFAULT GETDATE(),

    Status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Received', 'Cancelled')),

    CreatedBy   INT NOT NULL,

    CONSTRAINT fk_po_supplier
        FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),

    CONSTRAINT fk_po_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),

    CONSTRAINT fk_po_createdby
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- ============================================================
--  16. PurchaseOrderItem
-- ============================================================
CREATE TABLE PurchaseOrderItem (
    POItemID  INT PRIMARY KEY IDENTITY(1,1),
    POID      INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity  INT NOT NULL CHECK (Quantity > 0),
    UnitCost  DECIMAL(12,2) NOT NULL CHECK (UnitCost >= 0),

    TotalCost AS (Quantity * UnitCost) PERSISTED,

    CONSTRAINT fk_poi_po
        FOREIGN KEY (POID) REFERENCES PurchaseOrder(POID)
        ON DELETE CASCADE,

    CONSTRAINT fk_poi_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

-- ============================================================
--  17. SaleOrder
-- ============================================================
CREATE TABLE SaleOrder (
    SOID            INT PRIMARY KEY IDENTITY(1,1),
    BusinessID      INT NOT NULL,
    WarehouseID     INT NOT NULL,
    CustomerName    VARCHAR(150) NOT NULL,
    CustomerContact VARCHAR(20),
    CustomerAddress VARCHAR(255),
    OrderDate       DATETIME NOT NULL DEFAULT GETDATE(),

    Status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Fulfilled', 'Cancelled')),

    CreatedBy       INT NOT NULL,

    CONSTRAINT fk_so_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID),

    CONSTRAINT fk_so_warehouse
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),

    CONSTRAINT fk_so_createdby
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- ============================================================
--  18. SaleOrderItem
-- ============================================================
CREATE TABLE SaleOrderItem (
    SOItemID   INT PRIMARY KEY IDENTITY(1,1),
    SOID       INT NOT NULL,
    ProductID  INT NOT NULL,
    Quantity   INT NOT NULL CHECK (Quantity > 0),
    UnitPrice  DECIMAL(12,2) NOT NULL CHECK (UnitPrice >= 0),

    TotalPrice AS (Quantity * UnitPrice) PERSISTED,

    CONSTRAINT fk_soi_so
        FOREIGN KEY (SOID) REFERENCES SaleOrder(SOID)
        ON DELETE CASCADE,

    CONSTRAINT fk_soi_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

-- ============================================================
--  19. ProductReturn
-- ============================================================
CREATE TABLE ProductReturn (
    ReturnID   INT PRIMARY KEY IDENTITY(1,1),
    SOID       INT NOT NULL,
    ProductID  INT NOT NULL,
    Quantity   INT NOT NULL CHECK (Quantity > 0),
    Reason     VARCHAR(MAX),
    ReturnDate DATETIME NOT NULL DEFAULT GETDATE(),

    Status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Processed')),

    CONSTRAINT fk_pr_so
        FOREIGN KEY (SOID) REFERENCES SaleOrder(SOID),

    CONSTRAINT fk_pr_product
        FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

-- ============================================================
--  20. AuditLog
-- ============================================================
CREATE TABLE AuditLog (
    LogID      INT PRIMARY KEY IDENTITY(1,1),
    BusinessID INT NOT NULL,
    ActorID    INT NOT NULL,
    Action     VARCHAR(100) NOT NULL,
    EntityType VARCHAR(50) NOT NULL,
    EntityID   INT,
    Details    VARCHAR(MAX),
    CreatedAt  DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_al_business
        FOREIGN KEY (BusinessID) REFERENCES Business(BusinessID)
        ON DELETE CASCADE,

    CONSTRAINT fk_al_actor
        FOREIGN KEY (ActorID) REFERENCES Users(UserID)
);


-- ============================================================
-- STORED PROCEDURES
-- ============================================================

GO
CREATE PROCEDURE sp_CreateUser
    @FullName VARCHAR(100),
    @Email VARCHAR(150),
    @PasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Users (FullName, Email, PasswordHash)
    VALUES (@FullName, @Email, @PasswordHash);
    SELECT SCOPE_IDENTITY() AS UserID;
END;
GO

CREATE PROCEDURE sp_GetUserByEmail
    @Email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Users WHERE Email = @Email;
END;
GO

CREATE PROCEDURE sp_GetUserById
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Users WHERE UserID = @UserID;
END;
GO

CREATE PROCEDURE sp_CreateVerifyToken
    @UserID INT,
    @Token VARCHAR(64),
    @ValidTill DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO VerifyTokens (UserID, Token, ValidTill)
    VALUES (@UserID, @Token, @ValidTill);
END;
GO

CREATE PROCEDURE sp_GetVerifyToken
    @Token VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM VerifyTokens WHERE Token = @Token;
END;
GO

CREATE PROCEDURE sp_DeleteVerifyTokenByUserId
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM VerifyTokens WHERE UserID = @UserID;
END;
GO

CREATE PROCEDURE sp_CreateResetToken
    @UserID INT,
    @Token VARCHAR(64),
    @ValidTill DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ResetTokens (UserID, Token, ValidTill)
    VALUES (@UserID, @Token, @ValidTill);
END;
GO

CREATE PROCEDURE sp_GetResetToken
    @Token VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM ResetTokens WHERE Token = @Token;
END;
GO

CREATE PROCEDURE sp_CreateBusiness
    @BusinessName VARCHAR(150),
    @Description VARCHAR(MAX),
    @OwnerID INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Business (BusinessName, Description, OwnerID)
    VALUES (@BusinessName, @Description, @OwnerID);
    SELECT SCOPE_IDENTITY() AS BusinessID;
END;
GO

-- ============================================================
--  Additional stored procedures, functions and triggers
-- ============================================================

-- Create Product
CREATE PROCEDURE sp_CreateProduct
    @ProductName VARCHAR(150),
    @SKU VARCHAR(100),
    @CategoryID INT,
    @UnitOfMeasure VARCHAR(50),
    @SellingPrice DECIMAL(12,2),
    @BusinessID INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Product (ProductName, SKU, CategoryID, UnitOfMeasure, SellingPrice, BusinessID)
    OUTPUT INSERTED.ProductID
    VALUES (@ProductName, @SKU, @CategoryID, @UnitOfMeasure, @SellingPrice, @BusinessID);
END;
GO

-- Update Product
CREATE PROCEDURE sp_UpdateProduct
    @ProductID INT,
    @ProductName VARCHAR(150),
    @SKU VARCHAR(100),
    @CategoryID INT,
    @UnitOfMeasure VARCHAR(50),
    @SellingPrice DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Product
    SET ProductName = @ProductName,
        SKU = @SKU,
        CategoryID = @CategoryID,
        UnitOfMeasure = @UnitOfMeasure,
        SellingPrice = @SellingPrice
    WHERE ProductID = @ProductID;
END;
GO

-- Link / Unlink supplier
CREATE PROCEDURE sp_LinkSupplier
    @ProductID INT,
    @SupplierID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Product_Supplier WHERE ProductID = @ProductID AND SupplierID = @SupplierID)
    BEGIN
        INSERT INTO Product_Supplier (ProductID, SupplierID)
        VALUES (@ProductID, @SupplierID);
    END
END;
GO

CREATE PROCEDURE sp_UnlinkSupplier
    @ProductID INT,
    @SupplierID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Product_Supplier WHERE ProductID = @ProductID AND SupplierID = @SupplierID;
END;
GO

-- Upsert inventory by change amount. Prevents negative stock.
CREATE PROCEDURE sp_UpsertInventory
    @WarehouseID INT,
    @ProductID INT,
    @QuantityChange INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM Inventory WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID)
        BEGIN
            UPDATE Inventory
            SET Quantity = Quantity + @QuantityChange,
                LastUpdated = GETDATE()
            WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID;
        END
        ELSE
        BEGIN
            INSERT INTO Inventory (WarehouseID, ProductID, Quantity, LowStockThreshold, LastUpdated)
            VALUES (@WarehouseID, @ProductID, @QuantityChange, 10, GETDATE());
        END;

        DECLARE @NewQuantity INT = (SELECT Quantity FROM Inventory WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID);
        IF @NewQuantity < 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('Operation would result in negative stock', 16, 1);
            RETURN;
        END;

        COMMIT TRANSACTION;
        SELECT @NewQuantity AS NewQuantity;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- Set inventory to an absolute value
CREATE PROCEDURE sp_SetInventory
    @WarehouseID INT,
    @ProductID INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Inventory WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID)
    BEGIN
        UPDATE Inventory
        SET Quantity = @Quantity, LastUpdated = GETDATE()
        WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID;
    END
    ELSE
    BEGIN
        INSERT INTO Inventory (WarehouseID, ProductID, Quantity, LowStockThreshold, LastUpdated)
        VALUES (@WarehouseID, @ProductID, @Quantity, 10, GETDATE());
    END
    SELECT (SELECT Quantity FROM Inventory WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID) AS NewQuantity;
END;
GO

-- Purchase order helpers
CREATE PROCEDURE sp_CreatePO
    @SupplierID INT,
    @WarehouseID INT,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO PurchaseOrder (SupplierID, WarehouseID, CreatedBy)
    OUTPUT INSERTED.POID
    VALUES (@SupplierID, @WarehouseID, @CreatedBy);
END;
GO

CREATE PROCEDURE sp_AddPOItem
    @POID INT,
    @ProductID INT,
    @Quantity INT,
    @UnitCost DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO PurchaseOrderItem (POID, ProductID, Quantity, UnitCost)
    OUTPUT INSERTED.POItemID
    VALUES (@POID, @ProductID, @Quantity, @UnitCost);
END;
GO

-- Sale order helpers
CREATE PROCEDURE sp_CreateSO
    @BusinessID INT,
    @WarehouseID INT,
    @CustomerName VARCHAR(150),
    @CustomerContact VARCHAR(20),
    @CustomerAddress VARCHAR(255),
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO SaleOrder (BusinessID, WarehouseID, CustomerName, CustomerContact, CustomerAddress, CreatedBy)
    OUTPUT INSERTED.SOID
    VALUES (@BusinessID, @WarehouseID, @CustomerName, @CustomerContact, @CustomerAddress, @CreatedBy);
END;
GO

CREATE PROCEDURE sp_AddSOItem
    @SOID INT,
    @ProductID INT,
    @Quantity INT,
    @UnitPrice DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO SaleOrderItem (SOID, ProductID, Quantity, UnitPrice)
    OUTPUT INSERTED.SOItemID
    VALUES (@SOID, @ProductID, @Quantity, @UnitPrice);
END;
GO

-- Audit triggers: record CRUD on important tables
CREATE TRIGGER tr_Audit_Product
ON Product
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Action VARCHAR(10);
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) SET @Action = 'Update';
    ELSE IF EXISTS(SELECT 1 FROM inserted) SET @Action = 'Insert';
    ELSE SET @Action = 'Delete';

    INSERT INTO AuditLog (BusinessID, ActorID, Action, EntityType, EntityID, Details)
    SELECT
        i.BusinessID,
        CAST(SESSION_CONTEXT(N'actor_id') AS INT),
        @Action,
        'Product',
        COALESCE(i.ProductID, d.ProductID),
        CASE WHEN @Action = 'Delete' THEN CONCAT('Deleted product ', d.ProductName)
             WHEN @Action = 'Insert' THEN CONCAT('Inserted product ', i.ProductName)
             ELSE CONCAT('Updated from ', d.ProductName, ' to ', i.ProductName)
        END
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.ProductID = d.ProductID;
END;
GO

CREATE TRIGGER tr_Audit_Inventory
ON Inventory
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Action VARCHAR(10);
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) SET @Action = 'Update';
    ELSE IF EXISTS(SELECT 1 FROM inserted) SET @Action = 'Insert';
    ELSE SET @Action = 'Delete';

    INSERT INTO AuditLog (BusinessID, ActorID, Action, EntityType, EntityID, Details)
    SELECT
        b.BusinessID,
        CAST(SESSION_CONTEXT(N'actor_id') AS INT),
        @Action,
        'Inventory',
        COALESCE(i.ProductID, d.ProductID),
        CONCAT('Warehouse=', COALESCE(CAST(COALESCE(i.WarehouseID, d.WarehouseID) AS VARCHAR(10)),''), ', Qty=', COALESCE(CAST(COALESCE(i.Quantity, d.Quantity) AS VARCHAR(20)),''))
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.WarehouseID = d.WarehouseID AND i.ProductID = d.ProductID
    LEFT JOIN Warehouse w ON COALESCE(i.WarehouseID, d.WarehouseID) = w.WarehouseID
    LEFT JOIN Business b ON w.BusinessID = b.BusinessID;
END;
GO

CREATE TRIGGER tr_Audit_PurchaseOrder
ON PurchaseOrder
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Action VARCHAR(10);
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) SET @Action = 'Update';
    ELSE IF EXISTS(SELECT 1 FROM inserted) SET @Action = 'Insert';
    ELSE SET @Action = 'Delete';

    INSERT INTO AuditLog (BusinessID, ActorID, Action, EntityType, EntityID, Details)
    SELECT
        s.BusinessID,
        CAST(SESSION_CONTEXT(N'actor_id') AS INT),
        @Action,
        'PurchaseOrder',
        COALESCE(i.POID, d.POID),
        CONCAT('Status=', COALESCE(i.Status,d.Status))
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.POID = d.POID
    LEFT JOIN Supplier s ON COALESCE(i.SupplierID, d.SupplierID) = s.SupplierID;
END;
GO

CREATE TRIGGER tr_Audit_SaleOrder
ON SaleOrder
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Action VARCHAR(10);
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) SET @Action = 'Update';
    ELSE IF EXISTS(SELECT 1 FROM inserted) SET @Action = 'Insert';
    ELSE SET @Action = 'Delete';

    INSERT INTO AuditLog (BusinessID, ActorID, Action, EntityType, EntityID, Details)
    SELECT
        so.BusinessID,
        CAST(SESSION_CONTEXT(N'actor_id') AS INT),
        @Action,
        'SaleOrder',
        COALESCE(i.SOID, d.SOID),
        CONCAT('Status=', COALESCE(i.Status,d.Status))
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.SOID = d.SOID
    LEFT JOIN SaleOrder so ON COALESCE(i.SOID, d.SOID) = so.SOID;
END;
GO
