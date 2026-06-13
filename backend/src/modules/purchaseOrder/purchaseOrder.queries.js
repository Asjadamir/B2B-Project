import sql from "mssql";

const purchaseOrderQueries = {
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

    getSupplierById: async (supplierId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        const result = await request.query(
            "SELECT * FROM Supplier WHERE SupplierID = @SupplierID AND IsActive = 1",
        );
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

    getProductsBySupplier: async (supplierId, businessId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                   p.SellingPrice, c.CategoryName
            FROM Product p
            JOIN Category c          ON p.CategoryID  = c.CategoryID
            JOIN Product_Supplier ps ON p.ProductID   = ps.ProductID
            WHERE ps.SupplierID = @SupplierID AND p.BusinessID = @BusinessID AND p.IsActive = 1
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    isProductLinkedToSupplier: async (productId, supplierId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        request.input("SupplierID", sql.Int, supplierId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM Product_Supplier WHERE ProductID = @ProductID AND SupplierID = @SupplierID",
        );
        return result.recordset.length > 0;
    },

    getProductById: async (productId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT * FROM Product WHERE ProductID = @ProductID AND IsActive = 1",
        );
        return result.recordset[0];
    },

    getPOsByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT po.POID, po.OrderDate, po.Status,
                   s.SupplierName, w.WarehouseName,
                   u.FullName AS CreatedByName,
                   COUNT(poi.POItemID)             AS ItemCount,
                   COALESCE(SUM(poi.TotalCost), 0) AS TotalValue
            FROM PurchaseOrder po
            JOIN Supplier  s   ON po.SupplierID  = s.SupplierID
            JOIN Warehouse w   ON po.WarehouseID = w.WarehouseID
            JOIN Users     u   ON po.CreatedBy   = u.UserID
            LEFT JOIN PurchaseOrderItem poi ON po.POID = poi.POID
            WHERE s.BusinessID = @BusinessID
            GROUP BY po.POID, po.OrderDate, po.Status,
                     s.SupplierName, w.WarehouseName, u.FullName
            ORDER BY po.OrderDate DESC
        `);
        return result.recordset;
    },

    getPOById: async (poId) => {
        const request = new sql.Request();
        request.input("POID", sql.Int, poId);
        const result = await request.query(`
            SELECT po.*,
                   s.SupplierName, s.BusinessID,
                   w.WarehouseName,
                   u.FullName AS CreatedByName
            FROM PurchaseOrder po
            JOIN Supplier  s ON po.SupplierID  = s.SupplierID
            JOIN Warehouse w ON po.WarehouseID = w.WarehouseID
            JOIN Users     u ON po.CreatedBy   = u.UserID
            WHERE po.POID = @POID
        `);
        return result.recordset[0];
    },

    getPOItems: async (poId) => {
        const request = new sql.Request();
        request.input("POID", sql.Int, poId);
        const result = await request.query(`
            SELECT poi.POItemID, poi.ProductID, poi.Quantity,
                   poi.UnitCost, poi.TotalCost,
                   p.ProductName, p.SKU, p.UnitOfMeasure
            FROM PurchaseOrderItem poi
            JOIN Product p ON poi.ProductID = p.ProductID
            WHERE poi.POID = @POID
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    getPOItemById: async (itemId) => {
        const request = new sql.Request();
        request.input("POItemID", sql.Int, itemId);
        const result = await request.query(
            "SELECT * FROM PurchaseOrderItem WHERE POItemID = @POItemID",
        );
        return result.recordset[0];
    },

    isPOItemDuplicate: async (poId, productId) => {
        const request = new sql.Request();
        request.input("POID", sql.Int, poId);
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM PurchaseOrderItem WHERE POID = @POID AND ProductID = @ProductID",
        );
        return result.recordset.length > 0;
    },

    createPO: async (supplierId, warehouseId, createdBy) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("CreatedBy", sql.Int, createdBy);
        const result = await request.execute("sp_CreatePO");
        return result.recordset[0].POID;
    },

    addPOItem: async (poId, productId, quantity, unitCost) => {
        const request = new sql.Request();
        request.input("POID", sql.Int, poId);
        request.input("ProductID", sql.Int, productId);
        request.input("Quantity", sql.Int, quantity);
        request.input("UnitCost", sql.Decimal(10, 2), unitCost);
        const result = await request.execute("sp_AddPOItem");
        return result.recordset[0].POItemID;
    },

    updatePOItem: async (itemId, quantity, unitCost) => {
        const request = new sql.Request();
        request.input("POItemID", sql.Int, itemId);
        request.input("Quantity", sql.Int, quantity);
        request.input("UnitCost", sql.Decimal(10, 2), unitCost);
        await request.query(`
            UPDATE PurchaseOrderItem
            SET Quantity = @Quantity, UnitCost = @UnitCost
            WHERE POItemID = @POItemID
        `);
    },

    deletePOItem: async (itemId) => {
        const request = new sql.Request();
        request.input("POItemID", sql.Int, itemId);
        await request.query(
            "DELETE FROM PurchaseOrderItem WHERE POItemID = @POItemID",
        );
    },

    updatePOStatus: async (poId, status) => {
        const request = new sql.Request();
        request.input("POID", sql.Int, poId);
        request.input("Status", sql.VarChar(20), status);
        await request.query(
            "UPDATE PurchaseOrder SET Status = @Status WHERE POID = @POID",
        );
    },

    upsertInventory: async (warehouseId, productId, quantity) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("ProductID", sql.Int, productId);
        request.input("QuantityChange", sql.Int, quantity);
        const result = await request.execute("sp_UpsertInventory");
        return result.recordset[0]?.NewQuantity;
    },
};

export default purchaseOrderQueries;
