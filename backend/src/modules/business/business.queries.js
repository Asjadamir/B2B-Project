import sql from "mssql";

const businessQueries = {
    createBusiness: async (businessName, description, ownerID) => {
        const request = new sql.Request();
        request.input("BusinessName", sql.NVarChar(255), businessName);
        request.input("Description", sql.NVarChar(sql.MAX), description ?? null);
        request.input("OwnerID", sql.Int, ownerID);
        const result = await request.execute("sp_CreateBusiness");
        return result.recordset[0].BusinessID;
    },

    addOwnerAsStaff: async (userId, businessId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        await request.query(`
            INSERT INTO Staff (UserID, BusinessID, RoleID, IsActive)
            VALUES (@UserID, @BusinessID, 1, 1)
        `);
    },

    getMyBusinesses: async (userId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        const result = await request.query(`
            SELECT DISTINCT
                b.BusinessID, b.BusinessName, b.Description,
                b.OwnerID, b.CreatedAt, r.RoleName AS MyRole
            FROM Business b
            JOIN Staff s ON b.BusinessID = s.BusinessID
            JOIN Roles r ON s.RoleID = r.RoleID
            WHERE s.UserID = @UserID AND s.IsActive = 1 AND b.IsActive = 1
        `);
        return result.recordset;
    },

    getBusinessById: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT * FROM Business WHERE BusinessID = @BusinessID AND IsActive = 1"
        );
        return result.recordset[0];
    },

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

    updateBusiness: async (businessId, businessName, description) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        request.input("BusinessName", sql.NVarChar(255), businessName);
        request.input("Description", sql.NVarChar(sql.MAX), description ?? null);
        await request.query(`
            UPDATE Business
            SET BusinessName = @BusinessName, Description = @Description
            WHERE BusinessID = @BusinessID
        `);
    },

    deleteBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        await request.query("UPDATE Business SET IsActive = 0 WHERE BusinessID = @BusinessID");
    },
};

export default businessQueries;
