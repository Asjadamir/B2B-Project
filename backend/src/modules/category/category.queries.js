import sql from "mssql";

const categoryQueries = {
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

    getAllCategories: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT * FROM Category WHERE BusinessID = @BusinessID ORDER BY CategoryName"
        );
        return result.recordset;
    },

    getCategoryById: async (categoryId) => {
        const request = new sql.Request();
        request.input("CategoryID", sql.Int, categoryId);
        const result = await request.query(
            "SELECT * FROM Category WHERE CategoryID = @CategoryID"
        );
        return result.recordset[0];
    },

    findByName: async (categoryName, businessId) => {
        const request = new sql.Request();
        request.input("CategoryName", sql.NVarChar(255), categoryName);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT * FROM Category WHERE CategoryName = @CategoryName AND BusinessID = @BusinessID"
        );
        return result.recordset[0];
    },

    createCategory: async (categoryName, businessId) => {
        const request = new sql.Request();
        request.input("CategoryName", sql.NVarChar(255), categoryName);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            INSERT INTO Category (CategoryName, BusinessID)
            OUTPUT INSERTED.CategoryID
            VALUES (@CategoryName, @BusinessID)
        `);
        return result.recordset[0].CategoryID;
    },

    updateCategory: async (categoryId, categoryName) => {
        const request = new sql.Request();
        request.input("CategoryID", sql.Int, categoryId);
        request.input("CategoryName", sql.NVarChar(255), categoryName);
        await request.query(
            "UPDATE Category SET CategoryName = @CategoryName WHERE CategoryID = @CategoryID"
        );
    },

    deleteCategory: async (categoryId) => {
        const request = new sql.Request();
        request.input("CategoryID", sql.Int, categoryId);
        await request.query("DELETE FROM Category WHERE CategoryID = @CategoryID");
    },

    isCategoryInUse: async (categoryId) => {
        const request = new sql.Request();
        request.input("CategoryID", sql.Int, categoryId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM Product WHERE CategoryID = @CategoryID AND IsActive = 1"
        );
        return result.recordset.length > 0;
    },
};

export default categoryQueries;
