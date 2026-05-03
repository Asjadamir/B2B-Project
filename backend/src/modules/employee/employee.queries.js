import sql from "mssql";

const employeeQueries = {
    getMyRole: async (userId, businessId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT r.RoleName FROM Staff s
            JOIN Roles r ON s.RoleID = r.RoleID
            WHERE s.UserID = @UserID AND s.BusinessID = @BusinessID AND s.IsActive = 1
        `);
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

    getBusinessById: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT * FROM Business WHERE BusinessID = @BusinessID AND IsActive = 1"
        );
        return result.recordset[0];
    },

    getRoleById: async (roleId) => {
        const request = new sql.Request();
        request.input("RoleID", sql.Int, roleId);
        const result = await request.query(
            "SELECT * FROM Roles WHERE RoleID = @RoleID"
        );
        return result.recordset[0];
    },

    findPendingInvite: async (email, businessId) => {
        const request = new sql.Request();
        request.input("Email", sql.VarChar(255), email);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT * FROM JoiningRequest
            WHERE Email = @Email AND BusinessID = @BusinessID AND Status = 'Pending'
        `);
        return result.recordset[0];
    },

    isAlreadyStaff: async (userId, businessId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM Staff WHERE UserID = @UserID AND BusinessID = @BusinessID AND IsActive = 1"
        );
        return result.recordset.length > 0;
    },

    createInvite: async (email, businessId, roleId, invitedBy, token) => {
        const request = new sql.Request();
        request.input("Email", sql.VarChar(255), email);
        request.input("BusinessID", sql.Int, businessId);
        request.input("RoleID", sql.Int, roleId);
        request.input("InvitedBy", sql.Int, invitedBy);
        request.input("Token", sql.VarChar(64), token);
        const result = await request.query(`
            INSERT INTO JoiningRequest (Email, BusinessID, RoleID, InvitedBy, Token, ValidTill)
            OUTPUT INSERTED.RequestID
            VALUES (@Email, @BusinessID, @RoleID, @InvitedBy, @Token, DATEADD(HOUR, 48, GETDATE()))
        `);
        return result.recordset[0].RequestID;
    },

    findInviteById: async (requestId) => {
        const request = new sql.Request();
        request.input("RequestID", sql.Int, requestId);
        const result = await request.query(`
            SELECT jr.*, b.BusinessName, r.RoleName
            FROM JoiningRequest jr
            JOIN Business b ON jr.BusinessID = b.BusinessID
            JOIN Roles r    ON jr.RoleID     = r.RoleID
            WHERE jr.RequestID = @RequestID
        `);
        return result.recordset[0];
    },

    findInviteByToken: async (token) => {
        const request = new sql.Request();
        request.input("Token", sql.VarChar(64), token);
        const result = await request.query(`
            SELECT jr.*, b.BusinessName, r.RoleName
            FROM JoiningRequest jr
            JOIN Business b ON jr.BusinessID = b.BusinessID
            JOIN Roles r    ON jr.RoleID     = r.RoleID
            WHERE jr.Token = @Token
        `);
        return result.recordset[0];
    },

    findUserByEmail: async (email) => {
        const request = new sql.Request();
        request.input("Email", sql.VarChar(255), email);
        const result = await request.query(
            "SELECT * FROM Users WHERE Email = @Email"
        );
        return result.recordset[0];
    },

    createVerifiedUser: async (fullName, email, passwordHash) => {
        const request = new sql.Request();
        request.input("FullName", sql.NVarChar(255), fullName);
        request.input("Email", sql.VarChar(255), email);
        request.input("PasswordHash", sql.VarChar(255), passwordHash);
        const result = await request.query(`
            INSERT INTO Users (FullName, Email, PasswordHash, IsVerified)
            OUTPUT INSERTED.UserID
            VALUES (@FullName, @Email, @PasswordHash, 1)
        `);
        return result.recordset[0].UserID;
    },

    addToStaff: async (userId, businessId, roleId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        request.input("RoleID", sql.Int, roleId);
        await request.query(`
            INSERT INTO Staff (UserID, BusinessID, RoleID, IsActive)
            VALUES (@UserID, @BusinessID, @RoleID, 1)
        `);
    },

    markInviteAccepted: async (requestId) => {
        const request = new sql.Request();
        request.input("RequestID", sql.Int, requestId);
        await request.query(
            "UPDATE JoiningRequest SET Status = 'Accepted' WHERE RequestID = @RequestID"
        );
    },

    getStaffById: async (staffId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        const result = await request.query(`
            SELECT s.*, r.RoleName, u.Email, u.FullName
            FROM Staff s
            JOIN Roles r ON s.RoleID = r.RoleID
            JOIN Users u ON s.UserID = u.UserID
            WHERE s.StaffID = @StaffID
        `);
        return result.recordset[0];
    },

    getStaffByUserAndBusiness: async (userId, businessId) => {
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

    updateStaffRole: async (staffId, roleId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        request.input("RoleID", sql.Int, roleId);
        await request.query(
            "UPDATE Staff SET RoleID = @RoleID WHERE StaffID = @StaffID"
        );
    },

    deactivateStaff: async (staffId) => {
        const request = new sql.Request();
        request.input("StaffID", sql.Int, staffId);
        await request.query(
            "UPDATE Staff SET IsActive = 0 WHERE StaffID = @StaffID"
        );
    },

    getEmployeesByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT s.StaffID, s.UserID, s.IsActive, s.JoinedAt,
                   u.FullName, u.Email,
                   r.RoleID, r.RoleName
            FROM Staff s
            JOIN Users u ON s.UserID  = u.UserID
            JOIN Roles r ON s.RoleID  = r.RoleID
            WHERE s.BusinessID = @BusinessID AND s.IsActive = 1
            ORDER BY s.JoinedAt DESC
        `);
        return result.recordset;
    },

    cancelInvite: async (requestId) => {
        const request = new sql.Request();
        request.input("RequestID", sql.Int, requestId);
        await request.query(
            "UPDATE JoiningRequest SET Status = 'Cancelled' WHERE RequestID = @RequestID AND Status = 'Pending'"
        );
    },

    getPendingInvites: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT jr.RequestID, jr.Email, jr.InvitedAt, jr.ValidTill,
                   r.RoleName,
                   u.FullName AS InvitedByName
            FROM JoiningRequest jr
            JOIN Roles r ON jr.RoleID    = r.RoleID
            JOIN Users u ON jr.InvitedBy = u.UserID
            WHERE jr.BusinessID = @BusinessID AND jr.Status = 'Pending'
            ORDER BY jr.InvitedAt DESC
        `);
        return result.recordset;
    },
};

export default employeeQueries;
