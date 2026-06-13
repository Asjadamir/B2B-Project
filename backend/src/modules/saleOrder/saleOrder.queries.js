import sql from "mssql";

const saleOrderQueries = {
    getStaffRecord: async (userId, businessId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT s.*, r.RoleName FROM Staff s
            JOIN Roles r ON s.RoleID = r.RoleID
            WHERE s.UserID = @UserID AND s.BusinessID = @BusinessID AND s.IsActive = 1
        `);
        return result.recordset[0];
    },

    getWarehouseById: async (warehouseId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        const result = await request.query(
            "SELECT * FROM Warehouse WHERE WarehouseID = @WarehouseID AND IsActive = 1",
        );
        return result.recordset[0];
    },

    getProductsByWarehouse: async (warehouseId, businessId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                   p.SellingPrice, c.CategoryName,
                   i.Quantity AS AvailableStock
            FROM Inventory i
            JOIN Product  p ON i.ProductID  = p.ProductID
            JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE i.WarehouseID = @WarehouseID AND p.BusinessID = @BusinessID
              AND p.IsActive = 1 AND i.Quantity > 0
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    getInventoryItem: async (warehouseId, productId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT * FROM Inventory WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID",
        );
        return result.recordset[0];
    },

    getProductById: async (productId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT * FROM Product WHERE ProductID = @ProductID AND IsActive = 1",
        );
        return result.recordset[0];
    },

    getSOsByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT so.SOID, so.OrderDate, so.Status,
                   so.CustomerName, so.CustomerContact, so.CustomerAddress,
                   w.WarehouseName,
                   u.FullName AS CreatedByName,
                   COUNT(soi.SOItemID)               AS ItemCount,
                   COALESCE(SUM(soi.TotalPrice), 0)  AS TotalValue
            FROM SaleOrder so
            JOIN Warehouse w ON so.WarehouseID = w.WarehouseID
            JOIN Users     u ON so.CreatedBy   = u.UserID
            LEFT JOIN SaleOrderItem soi ON so.SOID = soi.SOID
            WHERE so.BusinessID = @BusinessID
            GROUP BY so.SOID, so.OrderDate, so.Status,
                     so.CustomerName, so.CustomerContact, so.CustomerAddress,
                     w.WarehouseName, u.FullName
            ORDER BY so.OrderDate DESC
        `);
        return result.recordset;
    },

    getSOById: async (soId) => {
        const request = new sql.Request();
        request.input("SOID", sql.Int, soId);
        const result = await request.query(`
            SELECT so.*,
                   w.WarehouseName,
                   u.FullName AS CreatedByName
            FROM SaleOrder so
            JOIN Warehouse w ON so.WarehouseID = w.WarehouseID
            JOIN Users     u ON so.CreatedBy   = u.UserID
            WHERE so.SOID = @SOID
        `);
        return result.recordset[0];
    },

    getSOItems: async (soId) => {
        const request = new sql.Request();
        request.input("SOID", sql.Int, soId);
        const result = await request.query(`
            SELECT soi.SOItemID, soi.ProductID, soi.Quantity,
                   soi.UnitPrice, soi.TotalPrice,
                   p.ProductName, p.SKU, p.UnitOfMeasure
            FROM SaleOrderItem soi
            JOIN Product p ON soi.ProductID = p.ProductID
            WHERE soi.SOID = @SOID
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    getSOItemById: async (itemId) => {
        const request = new sql.Request();
        request.input("SOItemID", sql.Int, itemId);
        const result = await request.query(
            "SELECT * FROM SaleOrderItem WHERE SOItemID = @SOItemID",
        );
        return result.recordset[0];
    },

    isSOItemDuplicate: async (soId, productId) => {
        const request = new sql.Request();
        request.input("SOID", sql.Int, soId);
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM SaleOrderItem WHERE SOID = @SOID AND ProductID = @ProductID",
        );
        return result.recordset.length > 0;
    },

    createSO: async (
        businessId,
        warehouseId,
        customerName,
        customerContact,
        customerAddress,
        createdBy,
    ) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("CustomerName", sql.NVarChar(255), customerName);
        request.input(
            "CustomerContact",
            sql.VarChar(50),
            customerContact ?? null,
        );
        request.input(
            "CustomerAddress",
            sql.NVarChar(500),
            customerAddress ?? null,
        );
        request.input("CreatedBy", sql.Int, createdBy);
        const result = await request.execute("sp_CreateSO");
        return result.recordset[0].SOID;
    },

    addSOItem: async (soId, productId, quantity, unitPrice) => {
        const request = new sql.Request();
        request.input("SOID", sql.Int, soId);
        request.input("ProductID", sql.Int, productId);
        request.input("Quantity", sql.Int, quantity);
        request.input("UnitPrice", sql.Decimal(10, 2), unitPrice);
        const result = await request.execute("sp_AddSOItem");
        return result.recordset[0].SOItemID;
    },

    updateSOItem: async (itemId, quantity, unitPrice) => {
        const request = new sql.Request();
        request.input("SOItemID", sql.Int, itemId);
        request.input("Quantity", sql.Int, quantity);
        request.input("UnitPrice", sql.Decimal(10, 2), unitPrice);
        await request.query(
            "UPDATE SaleOrderItem SET Quantity = @Quantity, UnitPrice = @UnitPrice WHERE SOItemID = @SOItemID",
        );
    },

    deleteSOItem: async (itemId) => {
        const request = new sql.Request();
        request.input("SOItemID", sql.Int, itemId);
        await request.query(
            "DELETE FROM SaleOrderItem WHERE SOItemID = @SOItemID",
        );
    },

    updateSOStatus: async (soId, status) => {
        const request = new sql.Request();
        request.input("SOID", sql.Int, soId);
        request.input("Status", sql.VarChar(20), status);
        await request.query(
            "UPDATE SaleOrder SET Status = @Status WHERE SOID = @SOID",
        );
    },

    decrementInventory: async (warehouseId, productId, quantity) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        // use sp_UpsertInventory with a negative quantity to safely decrement
        request.input("QuantityChange", sql.Int, -quantity);
        await request.execute("sp_UpsertInventory");
    },
};

export default saleOrderQueries;
