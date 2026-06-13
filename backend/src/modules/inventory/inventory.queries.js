import sql from "mssql";

const inventoryQueries = {
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
            "SELECT * FROM Warehouse WHERE WarehouseID = @WarehouseID AND IsActive = 1"
        );
        return result.recordset[0];
    },

    getProductById: async (productId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT * FROM Product WHERE ProductID = @ProductID AND IsActive = 1"
        );
        return result.recordset[0];
    },

    getInventoryByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                   c.CategoryName,
                   i.WarehouseID, w.WarehouseName,
                   i.Quantity, i.LowStockThreshold, i.LastUpdated
            FROM Inventory i
            JOIN Product   p ON i.ProductID  = p.ProductID
            JOIN Category  c ON p.CategoryID = c.CategoryID
            JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
            WHERE w.BusinessID = @BusinessID AND p.BusinessID = @BusinessID
              AND p.IsActive = 1 AND w.IsActive = 1
            ORDER BY p.ProductName, w.WarehouseName
        `);
        return result.recordset;
    },

    getInventoryItem: async (warehouseId, productId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT * FROM Inventory WHERE WarehouseID = @WarehouseID AND ProductID = @ProductID"
        );
        return result.recordset[0];
    },

    adjustStock: async (warehouseId, productId, newQuantity) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        request.input("Quantity", sql.Int, newQuantity);
        const result = await request.execute("sp_SetInventory");
        return result.recordset[0]?.NewQuantity;
    },

    decrementStock: async (warehouseId, productId, quantity) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        request.input("QuantityChange", sql.Int, -quantity);
        const result = await request.execute("sp_UpsertInventory");
        return result.recordset[0]?.NewQuantity;
    },

    incrementStock: async (warehouseId, productId, quantity) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        request.input("QuantityChange", sql.Int, quantity);
        const result = await request.execute("sp_UpsertInventory");
        return result.recordset[0]?.NewQuantity;
    },
};

export default inventoryQueries;
