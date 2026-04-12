const purchaseOrderQueries = (db) => {
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

        // Get supplier by ID (used to derive businessId and validate ownership)
        getSupplierById: async (supplierId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Supplier WHERE SupplierID = ? AND IsActive = TRUE`,
                [supplierId],
            );
            return rows[0];
        },

        // Get warehouse by ID (validate it belongs to same business)
        getWarehouseById: async (warehouseId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Warehouse WHERE WarehouseID = ? AND IsActive = TRUE`,
                [warehouseId],
            );
            return rows[0];
        },

        // Get products linked to a specific supplier for a business
        getProductsBySupplier: async (supplierId, businessId) => {
            const [rows] = await db.execute(
                `SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                        p.SellingPrice, c.CategoryName
                FROM Product p
                JOIN Category c          ON p.CategoryID  = c.CategoryID
                JOIN Product_Supplier ps ON p.ProductID   = ps.ProductID
                WHERE ps.SupplierID = ? AND p.BusinessID = ? AND p.IsActive = TRUE
                ORDER BY p.ProductName`,
                [supplierId, businessId],
            );
            return rows;
        },

        // Validate a single product is linked to the chosen supplier
        isProductLinkedToSupplier: async (productId, supplierId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM Product_Supplier
                WHERE ProductID = ? AND SupplierID = ? LIMIT 1`,
                [productId, supplierId],
            );
            return rows.length > 0;
        },

        // Get product by ID (validate it belongs to this business)
        getProductById: async (productId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Product WHERE ProductID = ? AND IsActive = TRUE`,
                [productId],
            );
            return rows[0];
        },

        // Get all POs for a business with summary info
        getPOsByBusiness: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT po.POID, po.OrderDate, po.Status,
                        s.SupplierName,
                        w.WarehouseName,
                        u.FullName AS CreatedByName,
                        COUNT(poi.POItemID)            AS ItemCount,
                        COALESCE(SUM(poi.TotalCost), 0) AS TotalValue
                FROM PurchaseOrder po
                JOIN Supplier  s   ON po.SupplierID  = s.SupplierID
                JOIN Warehouse w   ON po.WarehouseID = w.WarehouseID
                JOIN Users     u   ON po.CreatedBy   = u.UserID
                LEFT JOIN PurchaseOrderItem poi ON po.POID = poi.POID
                WHERE s.BusinessID = ?
                GROUP BY po.POID, po.OrderDate, po.Status,
                         s.SupplierName, w.WarehouseName, u.FullName
                ORDER BY po.OrderDate DESC`,
                [businessId],
            );
            return rows;
        },

        // Get a single PO with full details
        getPOById: async (poId) => {
            const [rows] = await db.execute(
                `SELECT po.*,
                        s.SupplierName, s.BusinessID,
                        w.WarehouseName,
                        u.FullName AS CreatedByName
                FROM PurchaseOrder po
                JOIN Supplier  s ON po.SupplierID  = s.SupplierID
                JOIN Warehouse w ON po.WarehouseID = w.WarehouseID
                JOIN Users     u ON po.CreatedBy   = u.UserID
                WHERE po.POID = ?`,
                [poId],
            );
            return rows[0];
        },

        // Get all line items for a PO
        getPOItems: async (poId) => {
            const [rows] = await db.execute(
                `SELECT poi.POItemID, poi.ProductID, poi.Quantity,
                        poi.UnitCost, poi.TotalCost,
                        p.ProductName, p.SKU, p.UnitOfMeasure
                FROM PurchaseOrderItem poi
                JOIN Product p ON poi.ProductID = p.ProductID
                WHERE poi.POID = ?
                ORDER BY p.ProductName`,
                [poId],
            );
            return rows;
        },

        // Get a single line item by ID
        getPOItemById: async (itemId) => {
            const [rows] = await db.execute(
                `SELECT * FROM PurchaseOrderItem WHERE POItemID = ?`,
                [itemId],
            );
            return rows[0];
        },

        // Check if a product already exists as a line item in this PO
        isPOItemDuplicate: async (poId, productId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM PurchaseOrderItem
                WHERE POID = ? AND ProductID = ? LIMIT 1`,
                [poId, productId],
            );
            return rows.length > 0;
        },

        // Create a new purchase order
        createPO: async (supplierId, warehouseId, createdBy) => {
            const [result] = await db.execute(
                `INSERT INTO PurchaseOrder (SupplierID, WarehouseID, CreatedBy)
                VALUES (?, ?, ?)`,
                [supplierId, warehouseId, createdBy],
            );
            return result.insertId;
        },

        // Add a line item to a PO
        addPOItem: async (poId, productId, quantity, unitCost) => {
            const [result] = await db.execute(
                `INSERT INTO PurchaseOrderItem (POID, ProductID, Quantity, UnitCost)
                VALUES (?, ?, ?, ?)`,
                [poId, productId, quantity, unitCost],
            );
            return result.insertId;
        },

        // Update a line item's quantity and unit cost
        updatePOItem: async (itemId, quantity, unitCost) => {
            await db.execute(
                `UPDATE PurchaseOrderItem
                SET Quantity = ?, UnitCost = ?
                WHERE POItemID = ?`,
                [quantity, unitCost, itemId],
            );
        },

        // Remove a line item from a PO
        deletePOItem: async (itemId) => {
            await db.execute(
                `DELETE FROM PurchaseOrderItem WHERE POItemID = ?`,
                [itemId],
            );
        },

        // Update PO status
        updatePOStatus: async (poId, status) => {
            await db.execute(
                `UPDATE PurchaseOrder SET Status = ? WHERE POID = ?`,
                [status, poId],
            );
        },

        // Upsert inventory — add quantity if record exists, create if not
        upsertInventory: async (warehouseId, productId, quantity) => {
            await db.execute(
                `INSERT INTO Inventory (WarehouseID, ProductID, Quantity, LowStockThreshold)
                VALUES (?, ?, ?, 10)
                ON DUPLICATE KEY UPDATE Quantity = Quantity + VALUES(Quantity)`,
                [warehouseId, productId, quantity],
            );
        },
    };
};

export default purchaseOrderQueries;
