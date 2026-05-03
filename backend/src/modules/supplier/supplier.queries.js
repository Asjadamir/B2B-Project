import sql from "mssql";

const supplierQueries = {
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

    getSuppliersByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT * FROM Supplier WHERE BusinessID = @BusinessID ORDER BY SupplierName"
        );
        return result.recordset;
    },

    getSupplierById: async (supplierId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        const result = await request.query(
            "SELECT * FROM Supplier WHERE SupplierID = @SupplierID"
        );
        return result.recordset[0];
    },

    createSupplier: async (supplierName, contactNumber, email, description, businessId) => {
        const request = new sql.Request();
        request.input("SupplierName", sql.NVarChar(255), supplierName);
        request.input("ContactNumber", sql.VarChar(20), contactNumber ?? null);
        request.input("Email", sql.VarChar(255), email ?? null);
        request.input("Description", sql.NVarChar(sql.MAX), description ?? null);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            INSERT INTO Supplier (SupplierName, ContactNumber, Email, Description, BusinessID)
            OUTPUT INSERTED.SupplierID
            VALUES (@SupplierName, @ContactNumber, @Email, @Description, @BusinessID)
        `);
        return result.recordset[0].SupplierID;
    },

    updateSupplier: async (supplierId, supplierName, contactNumber, email, description) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        request.input("SupplierName", sql.NVarChar(255), supplierName);
        request.input("ContactNumber", sql.VarChar(20), contactNumber ?? null);
        request.input("Email", sql.VarChar(255), email ?? null);
        request.input("Description", sql.NVarChar(sql.MAX), description ?? null);
        await request.query(`
            UPDATE Supplier
            SET SupplierName = @SupplierName, ContactNumber = @ContactNumber,
                Email = @Email, Description = @Description
            WHERE SupplierID = @SupplierID
        `);
    },

    getLinkedProducts: async (supplierId, businessId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                   p.SellingPrice, c.CategoryName
            FROM Product_Supplier ps
            JOIN Product  p ON ps.ProductID  = p.ProductID
            JOIN Category c ON p.CategoryID  = c.CategoryID
            WHERE ps.SupplierID = @SupplierID
              AND p.BusinessID  = @BusinessID
              AND p.IsActive    = 1
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    getUnlinkedProducts: async (supplierId, businessId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT p.ProductID, p.ProductName, p.SKU, p.UnitOfMeasure,
                   p.SellingPrice, c.CategoryName
            FROM Product  p
            JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.BusinessID = @BusinessID
              AND p.IsActive   = 1
              AND p.ProductID NOT IN (
                SELECT ProductID FROM Product_Supplier WHERE SupplierID = @SupplierID
              )
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    deactivateSupplier: async (supplierId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        await request.query(
            "UPDATE Supplier SET IsActive = 0 WHERE SupplierID = @SupplierID"
        );
    },
};

export default supplierQueries;
