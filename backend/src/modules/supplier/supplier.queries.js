const supplierQueries = (db) => {
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

        // Get all suppliers for a business
        getSuppliersByBusiness: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Supplier WHERE BusinessID = ? ORDER BY SupplierName`,
                [businessId],
            );
            return rows;
        },

        // Get a single supplier by ID
        getSupplierById: async (supplierId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Supplier WHERE SupplierID = ?`,
                [supplierId],
            );
            return rows[0];
        },

        // Create a new supplier
        createSupplier: async (supplierName, contactNumber, email, description, businessId) => {
            const [result] = await db.execute(
                `INSERT INTO Supplier (SupplierName, ContactNumber, Email, Description, BusinessID)
                VALUES (?, ?, ?, ?, ?)`,
                [supplierName, contactNumber ?? null, email ?? null, description ?? null, businessId],
            );
            return result.insertId;
        },

        // Update supplier details
        updateSupplier: async (supplierId, supplierName, contactNumber, email, description) => {
            await db.execute(
                `UPDATE Supplier
                SET SupplierName = ?, ContactNumber = ?, Email = ?, Description = ?
                WHERE SupplierID = ?`,
                [supplierName, contactNumber ?? null, email ?? null, description ?? null, supplierId],
            );
        },

        // Soft delete — deactivate supplier    
        deactivateSupplier: async (supplierId) => {
            await db.execute(
                `UPDATE Supplier SET IsActive = FALSE WHERE SupplierID = ?`,
                [supplierId],
            );
        },
    };
};

export default supplierQueries;
