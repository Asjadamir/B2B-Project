import sql from "mssql";

const warehouseQueries = {
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

    getWarehousesByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT * FROM Warehouse
            WHERE BusinessID = @BusinessID AND IsActive = 1
            ORDER BY WarehouseName
        `);
        return result.recordset;
    },

    getWarehouseById: async (warehouseId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        const result = await request.query(
            "SELECT * FROM Warehouse WHERE WarehouseID = @WarehouseID"
        );
        return result.recordset[0];
    },

    findByName: async (warehouseName, businessId) => {
        const request = new sql.Request();
        request.input("WarehouseName", sql.NVarChar(255), warehouseName);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT * FROM Warehouse
            WHERE WarehouseName = @WarehouseName AND BusinessID = @BusinessID AND IsActive = 1
        `);
        return result.recordset[0];
    },

    createWarehouse: async (warehouseName, address, city, businessId) => {
        const request = new sql.Request();
        request.input("WarehouseName", sql.NVarChar(255), warehouseName);
        request.input("Address", sql.NVarChar(500), address ?? null);
        request.input("City", sql.NVarChar(100), city ?? null);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            INSERT INTO Warehouse (WarehouseName, Address, City, BusinessID)
            OUTPUT INSERTED.WarehouseID
            VALUES (@WarehouseName, @Address, @City, @BusinessID)
        `);
        return result.recordset[0].WarehouseID;
    },

    updateWarehouse: async (warehouseId, warehouseName, address, city) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("WarehouseName", sql.NVarChar(255), warehouseName);
        request.input("Address", sql.NVarChar(500), address ?? null);
        request.input("City", sql.NVarChar(100), city ?? null);
        await request.query(`
            UPDATE Warehouse
            SET WarehouseName = @WarehouseName, Address = @Address, City = @City
            WHERE WarehouseID = @WarehouseID
        `);
    },

    deactivateWarehouse: async (warehouseId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        await request.query(
            "UPDATE Warehouse SET IsActive = 0 WHERE WarehouseID = @WarehouseID"
        );
    },

    hasPendingPurchaseOrders: async (warehouseId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM PurchaseOrder WHERE WarehouseID = @WarehouseID AND Status = 'Pending'"
        );
        return result.recordset.length > 0;
    },

    hasPendingSaleOrders: async (warehouseId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM SaleOrder WHERE WarehouseID = @WarehouseID AND Status = 'Pending'"
        );
        return result.recordset.length > 0;
    },

    getWarehouseStaff: async (warehouseId) => {
        const request = new sql.Request();
        request.input("WarehouseID", sql.Int, warehouseId);
        const result = await request.query(`
            SELECT sw.StaffID, sw.AssignedAt,
                   u.FullName, u.Email,
                   r.RoleID, r.RoleName
            FROM Staff_Warehouse sw
            JOIN Staff s ON sw.StaffID  = s.StaffID
            JOIN Users u ON s.UserID    = u.UserID
            JOIN Roles r ON sw.RoleID   = r.RoleID
            WHERE sw.WarehouseID = @WarehouseID AND s.IsActive = 1
            ORDER BY sw.AssignedAt DESC
        `);
        return result.recordset;
    },

    getStaffWarehouses: async (staffId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        const result = await request.query(`
            SELECT sw.AssignedAt, r.RoleName,
                   w.WarehouseID, w.WarehouseName, w.Address, w.City
            FROM Staff_Warehouse sw
            JOIN Warehouse w ON sw.WarehouseID = w.WarehouseID
            JOIN Roles r     ON sw.RoleID      = r.RoleID
            WHERE sw.StaffID = @StaffID AND w.IsActive = 1
            ORDER BY w.WarehouseName
        `);
        return result.recordset;
    },

    isStaffAssigned: async (staffId, warehouseId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        request.input("WarehouseID", sql.Int, warehouseId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM Staff_Warehouse WHERE StaffID = @StaffID AND WarehouseID = @WarehouseID"
        );
        return result.recordset.length > 0;
    },

    getStaffById: async (staffId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        const result = await request.query(`
            SELECT s.*, r.RoleName, u.FullName, u.Email
            FROM Staff s
            JOIN Roles r ON s.RoleID = r.RoleID
            JOIN Users u ON s.UserID = u.UserID
            WHERE s.StaffID = @StaffID AND s.IsActive = 1
        `);
        return result.recordset[0];
    },

    assignStaff: async (staffId, warehouseId, roleId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("RoleID", sql.Int, roleId);
        await request.query(
            "INSERT INTO Staff_Warehouse (StaffID, WarehouseID, RoleID) VALUES (@StaffID, @WarehouseID, @RoleID)"
        );
    },

    updateStaffWarehouseRole: async (staffId, warehouseId, roleId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        request.input("WarehouseID", sql.Int, warehouseId);
        request.input("RoleID", sql.Int, roleId);
        await request.query(
            "UPDATE Staff_Warehouse SET RoleID = @RoleID WHERE StaffID = @StaffID AND WarehouseID = @WarehouseID"
        );
    },

    removeStaff: async (staffId, warehouseId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        request.input("WarehouseID", sql.Int, warehouseId);
        await request.query(
            "DELETE FROM Staff_Warehouse WHERE StaffID = @StaffID AND WarehouseID = @WarehouseID"
        );
    },
};

export default warehouseQueries;
