const warehouseQueries = (db) => {
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

        // Get all active warehouses for a business
        getWarehousesByBusiness: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Warehouse
                WHERE BusinessID = ? AND IsActive = TRUE
                ORDER BY WarehouseName`,
                [businessId],
            );
            return rows;
        },

        // Get a single warehouse by ID
        getWarehouseById: async (warehouseId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Warehouse WHERE WarehouseID = ?`,
                [warehouseId],
            );
            return rows[0];
        },

        // Check if warehouse name already exists for this business
        findByName: async (warehouseName, businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Warehouse
                WHERE WarehouseName = ? AND BusinessID = ? AND IsActive = TRUE`,
                [warehouseName, businessId],
            );
            return rows[0];
        },

        // Create a new warehouse
        createWarehouse: async (warehouseName, address, city, businessId) => {
            const [result] = await db.execute(
                `INSERT INTO Warehouse (WarehouseName, Address, City, BusinessID)
                VALUES (?, ?, ?, ?)`,
                [warehouseName, address ?? null, city ?? null, businessId],
            );
            return result.insertId;
        },

        // Update warehouse details
        updateWarehouse: async (warehouseId, warehouseName, address, city) => {
            await db.execute(
                `UPDATE Warehouse
                SET WarehouseName = ?, Address = ?, City = ?
                WHERE WarehouseID = ?`,
                [warehouseName, address ?? null, city ?? null, warehouseId],
            );
        },

        // Soft delete warehouse
        deactivateWarehouse: async (warehouseId) => {
            await db.execute(
                `UPDATE Warehouse SET IsActive = FALSE WHERE WarehouseID = ?`,
                [warehouseId],
            );
        },

        // Block deletion if warehouse has any pending purchase orders
        hasPendingPurchaseOrders: async (warehouseId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM PurchaseOrder
                WHERE WarehouseID = ? AND Status = 'Pending' LIMIT 1`,
                [warehouseId],
            );
            return rows.length > 0;
        },

        // Block deletion if warehouse has any pending sale orders
        hasPendingSaleOrders: async (warehouseId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM SaleOrder
                WHERE WarehouseID = ? AND Status = 'Pending' LIMIT 1`,
                [warehouseId],
            );
            return rows.length > 0;
        },

        // ── Staff_Warehouse queries ───────────────────────────────────

        // Get all staff assigned to a warehouse (with user + role info)
        getWarehouseStaff: async (warehouseId) => {
            const [rows] = await db.execute(
                `SELECT sw.StaffID, sw.AssignedAt,
                        u.FullName, u.Email,
                        r.RoleID, r.RoleName
                FROM Staff_Warehouse sw
                JOIN Staff s  ON sw.StaffID  = s.StaffID
                JOIN Users u  ON s.UserID    = u.UserID
                JOIN Roles r  ON sw.RoleID   = r.RoleID
                WHERE sw.WarehouseID = ? AND s.IsActive = TRUE
                ORDER BY sw.AssignedAt DESC`,
                [warehouseId],
            );
            return rows;
        },

        // Get all warehouses an employee is assigned to
        getStaffWarehouses: async (staffId) => {
            const [rows] = await db.execute(
                `SELECT sw.AssignedAt, r.RoleName,
                        w.WarehouseID, w.WarehouseName, w.Address, w.City
                FROM Staff_Warehouse sw
                JOIN Warehouse w ON sw.WarehouseID = w.WarehouseID
                JOIN Roles r     ON sw.RoleID      = r.RoleID
                WHERE sw.StaffID = ? AND w.IsActive = TRUE
                ORDER BY w.WarehouseName`,
                [staffId],
            );
            return rows;
        },

        // Check if a staff member is already assigned to a warehouse
        isStaffAssigned: async (staffId, warehouseId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM Staff_Warehouse
                WHERE StaffID = ? AND WarehouseID = ? LIMIT 1`,
                [staffId, warehouseId],
            );
            return rows.length > 0;
        },

        // Get a staff record by StaffID — to verify they belong to same business
        getStaffById: async (staffId) => {
            const [rows] = await db.execute(
                `SELECT s.*, r.RoleName, u.FullName, u.Email
                FROM Staff s
                JOIN Roles r ON s.RoleID = r.RoleID
                JOIN Users u ON s.UserID = u.UserID
                WHERE s.StaffID = ? AND s.IsActive = TRUE`,
                [staffId],
            );
            return rows[0];
        },

        // Assign a staff member to a warehouse with a role
        assignStaff: async (staffId, warehouseId, roleId) => {
            await db.execute(
                `INSERT INTO Staff_Warehouse (StaffID, WarehouseID, RoleID)
                VALUES (?, ?, ?)`,
                [staffId, warehouseId, roleId],
            );
        },

        // Update the role of a staff member in a warehouse
        updateStaffWarehouseRole: async (staffId, warehouseId, roleId) => {
            await db.execute(
                `UPDATE Staff_Warehouse SET RoleID = ?
                WHERE StaffID = ? AND WarehouseID = ?`,
                [roleId, staffId, warehouseId],
            );
        },

        // Remove a staff member from a warehouse
        removeStaff: async (staffId, warehouseId) => {
            await db.execute(
                `DELETE FROM Staff_Warehouse
                WHERE StaffID = ? AND WarehouseID = ?`,
                [staffId, warehouseId],
            );
        },
    };
};

export default warehouseQueries;
