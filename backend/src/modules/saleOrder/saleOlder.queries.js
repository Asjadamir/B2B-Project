const saleOrderQueries = (db) => {
    return {
        // Check if user is active staff in a business (returns record with RoleName)
        getStaffRecord: async (userId, businessId) => {
            const [rows] = await db.execute(
                `SELECT s.*, r.RoleName FROM Staff s
                JOIN Roles r ON s.RoleID = r.RoleID
                WHERE s.UserID = ? AND s.BusinessID = ? AND s.IsActive = TRUE`,
                [userId, businessId],
            );
            return rows[0];
        },

        // Get warehouse by ID
        getWarehouseById: async (warehouseId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Warehouse WHERE WarehouseID = ? AND IsActive = TRUE`,
                [warehouseId],
            );
            return rows[0];
        },

        // Get products available in a warehouse (stock > 0) for item selection
        getProductsByWarehouse: async (warehouseId, businessId) => {
            const [rows] = await db.execute(
                `SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                        p.SellingPrice, c.CategoryName,
                        i.Quantity AS AvailableStock
                FROM Inventory i
                JOIN Product  p ON i.ProductID  = p.ProductID
                JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE i.WarehouseID = ? AND p.BusinessID = ?
                  AND p.IsActive = TRUE AND i.Quantity > 0
                ORDER BY p.ProductName`,
                [warehouseId, businessId],
            );
            return rows;
        },

        // Get current inventory record for a product in a warehouse
        getInventoryItem: async (warehouseId, productId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Inventory
                WHERE WarehouseID = ? AND ProductID = ?`,
                [warehouseId, productId],
            );
            return rows[0];
        },

        // Get product by ID
        getProductById: async (productId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Product WHERE ProductID = ? AND IsActive = TRUE`,
                [productId],
            );
            return rows[0];
        },

        // Get all sale orders for a business with summary
        getSOsByBusiness: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT so.SOID, so.OrderDate, so.Status,
                        so.CustomerName, so.CustomerContact, so.CustomerAddress,
                        w.WarehouseName,
                        u.FullName AS CreatedByName,
                        COUNT(soi.SOItemID)              AS ItemCount,
                        COALESCE(SUM(soi.TotalPrice), 0) AS TotalValue
                FROM SaleOrder so
                JOIN Warehouse w ON so.WarehouseID = w.WarehouseID
                JOIN Users     u ON so.CreatedBy   = u.UserID
                LEFT JOIN SaleOrderItem soi ON so.SOID = soi.SOID
                WHERE so.BusinessID = ?
                GROUP BY so.SOID, so.OrderDate, so.Status,
                         so.CustomerName, so.CustomerContact, so.CustomerAddress,
                         w.WarehouseName, u.FullName
                ORDER BY so.OrderDate DESC`,
                [businessId],
            );
            return rows;
        },

        // Get a single sale order with full details
        getSOById: async (soId) => {
            const [rows] = await db.execute(
                `SELECT so.*,
                        w.WarehouseName,
                        u.FullName AS CreatedByName
                FROM SaleOrder so
                JOIN Warehouse w ON so.WarehouseID = w.WarehouseID
                JOIN Users     u ON so.CreatedBy   = u.UserID
                WHERE so.SOID = ?`,
                [soId],
            );
            return rows[0];
        },

        // Get all line items for a sale order
        getSOItems: async (soId) => {
            const [rows] = await db.execute(
                `SELECT soi.SOItemID, soi.ProductID, soi.Quantity,
                        soi.UnitPrice, soi.TotalPrice,
                        p.ProductName, p.SKU, p.UnitOfMeasure
                FROM SaleOrderItem soi
                JOIN Product p ON soi.ProductID = p.ProductID
                WHERE soi.SOID = ?
                ORDER BY p.ProductName`,
                [soId],
            );
            return rows;
        },

        // Get a single line item by ID
        getSOItemById: async (itemId) => {
            const [rows] = await db.execute(
                `SELECT * FROM SaleOrderItem WHERE SOItemID = ?`,
                [itemId],
            );
            return rows[0];
        },

        // Check if a product already exists as a line item in this SO
        isSOItemDuplicate: async (soId, productId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM SaleOrderItem
                WHERE SOID = ? AND ProductID = ? LIMIT 1`,
                [soId, productId],
            );
            return rows.length > 0;
        },

        // Create a new sale order
        createSO: async (businessId, warehouseId, customerName, customerContact, customerAddress, createdBy) => {
            const [result] = await db.execute(
                `INSERT INTO SaleOrder
                    (BusinessID, WarehouseID, CustomerName, CustomerContact, CustomerAddress, CreatedBy)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [businessId, warehouseId, customerName, customerContact ?? null, customerAddress ?? null, createdBy],
            );
            return result.insertId;
        },

        // Add a line item to a sale order
        addSOItem: async (soId, productId, quantity, unitPrice) => {
            const [result] = await db.execute(
                `INSERT INTO SaleOrderItem (SOID, ProductID, Quantity, UnitPrice)
                VALUES (?, ?, ?, ?)`,
                [soId, productId, quantity, unitPrice],
            );
            return result.insertId;
        },

        // Update a line item
        updateSOItem: async (itemId, quantity, unitPrice) => {
            await db.execute(
                `UPDATE SaleOrderItem SET Quantity = ?, UnitPrice = ? WHERE SOItemID = ?`,
                [quantity, unitPrice, itemId],
            );
        },

        // Remove a line item
        deleteSOItem: async (itemId) => {
            await db.execute(
                `DELETE FROM SaleOrderItem WHERE SOItemID = ?`,
                [itemId],
            );
        },

        // Update sale order status
        updateSOStatus: async (soId, status) => {
            await db.execute(
                `UPDATE SaleOrder SET Status = ? WHERE SOID = ?`,
                [status, soId],
            );
        },

        // Decrement inventory after fulfillment
        decrementInventory: async (warehouseId, productId, quantity) => {
            await db.execute(
                `UPDATE Inventory SET Quantity = Quantity - ?
                WHERE WarehouseID = ? AND ProductID = ?`,
                [quantity, warehouseId, productId],
            );
        },
    };
};

export default saleOrderQueries;
