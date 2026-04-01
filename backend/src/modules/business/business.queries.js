const businessQueries = (db) => {
    return {
        // Create a new business
        createBusiness: async (businessName, description, ownerID) => {
            const [result] = await db.execute(
                `INSERT INTO Business (BusinessName, Description, OwnerID)
                VALUES (?, ?, ?)`,
                [businessName, description ?? null, ownerID],
            );
            return result.insertId;
        },

        // Add owner as staff with Owner role (RoleID = 1)
        addOwnerAsStaff: async (userId, businessId) => {
            await db.execute(
                `INSERT INTO Staff (UserID, BusinessID, RoleID, IsActive)
                VALUES (?, ?, 1, TRUE)`,
                [userId, businessId],
            );
        },

        // Get all businesses where the user is owner or active staff
        getMyBusinesses: async (userId) => {
            const [rows] = await db.execute(
                `SELECT DISTINCT
                    b.BusinessID,
                    b.BusinessName,
                    b.Description,
                    b.OwnerID,
                    b.CreatedAt,
                    r.RoleName AS MyRole
                FROM Business b
                JOIN Staff s ON b.BusinessID = s.BusinessID
                JOIN Roles r ON s.RoleID = r.RoleID
                WHERE s.UserID = ? AND s.IsActive = TRUE`,
                [userId],
            );
            return rows;
        },

        // Get a single business by ID
        getBusinessById: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Business WHERE BusinessID = ?`,
                [businessId],
            );
            return rows[0];
        },

        // Check if user is active staff in a business
        getStaffRecord: async (userId, businessId) => {
            const [rows] = await db.execute(
                `SELECT s.*, r.RoleName FROM Staff s
                JOIN Roles r ON s.RoleID = r.RoleID
                WHERE s.UserID = ? AND s.BusinessID = ? AND s.IsActive = TRUE`,
                [userId, businessId],
            );
            return rows[0];
        },

        // Update business details (owner only)
        updateBusiness: async (businessId, businessName, description) => {
            await db.execute(
                `UPDATE Business SET BusinessName = ?, Description = ?
                WHERE BusinessID = ?`,
                [businessName, description ?? null, businessId],
            );
        },

        // Delete a business (owner only)
        deleteBusiness: async (businessId) => {
            await db.execute(
                `DELETE FROM Business WHERE BusinessID = ?`,
                [businessId],
            );
        },
    };
};

export default businessQueries;
