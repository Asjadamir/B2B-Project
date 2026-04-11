const categoryQueries = (db) => {
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

        // Get all categories for a business
        getAllCategories: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Category WHERE BusinessID = ? ORDER BY CategoryName`,
                [businessId],
            );
            return rows;
        },

        // Get a single category by ID
        getCategoryById: async (categoryId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Category WHERE CategoryID = ?`,
                [categoryId],
            );
            return rows[0];
        },

        // Check if a category name already exists for this business
        findByName: async (categoryName, businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Category WHERE CategoryName = ? AND BusinessID = ?`,
                [categoryName, businessId],
            );
            return rows[0];
        },

        // Create a new category
        createCategory: async (categoryName, businessId) => {
            const [result] = await db.execute(
                `INSERT INTO Category (CategoryName, BusinessID) VALUES (?, ?)`,
                [categoryName, businessId],
            );
            return result.insertId;
        },

        // Rename a category
        updateCategory: async (categoryId, categoryName) => {
            await db.execute(
                `UPDATE Category SET CategoryName = ? WHERE CategoryID = ?`,
                [categoryName, categoryId],
            );
        },

        // Delete a category (only if no products reference it)
        deleteCategory: async (categoryId) => {
            await db.execute(
                `DELETE FROM Category WHERE CategoryID = ?`,
                [categoryId],
            );
        },

        // Check if any active product uses this category
        isCategoryInUse: async (categoryId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM Product WHERE CategoryID = ? AND IsActive = TRUE LIMIT 1`,
                [categoryId],
            );
            return rows.length > 0;
        },
    };
};

export default categoryQueries;
