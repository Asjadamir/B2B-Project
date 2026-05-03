import sql from "mssql";

const authQueries = {
    findUserByEmail: async (email) => {
        const request = new sql.Request();
        request.input("Email", sql.VarChar(255), email);
        const result = await request.execute("sp_GetUserByEmail");
        return result.recordset[0];
    },

    findUserById: async (userId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        const result = await request.execute("sp_GetUserById");
        return result.recordset[0];
    },

    createUser: async (fullName, email, passwordHash) => {
        const request = new sql.Request();
        request.input("FullName", sql.NVarChar(255), fullName);
        request.input("Email", sql.VarChar(255), email);
        request.input("PasswordHash", sql.VarChar(255), passwordHash);
        const result = await request.execute("sp_CreateUser");
        return result.recordset[0].UserID;
    },

    updateUnverifiedUser: async (userId, fullName, passwordHash) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("FullName", sql.NVarChar(255), fullName);
        request.input("PasswordHash", sql.VarChar(255), passwordHash);
        await request.query(
            "UPDATE Users SET FullName = @FullName, PasswordHash = @PasswordHash WHERE UserID = @UserID",
        );
    },

    createVerifyToken: async (userID, token, validTill) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userID);
        request.input("Token", sql.VarChar(64), token);
        request.input("ValidTill", sql.DateTime, validTill);
        await request.execute("sp_CreateVerifyToken");
    },

    getVerifyToken: async (token) => {
        const request = new sql.Request();
        request.input("Token", sql.VarChar(64), token);
        const result = await request.execute("sp_GetVerifyToken");
        return result.recordset[0];
    },

    deleteVerifyToken: async (token) => {
        const request = new sql.Request();
        request.input("Token", sql.VarChar(64), token);
        await request.query("DELETE FROM VerifyTokens WHERE Token = @Token");
    },

    deleteVerifyTokensByUserId: async (userID) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userID);
        await request.execute("sp_DeleteVerifyTokenByUserId");
    },

    markUserVerified: async (userId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        await request.query(
            "UPDATE Users SET IsVerified = 1 WHERE UserID = @UserID",
        );
    },

    saveResetToken: async (userId, token, validTill) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("Token", sql.VarChar(64), token);
        request.input("ValidTill", sql.DateTime, validTill);
        await request.execute("sp_CreateResetToken");
    },

    getResetToken: async (token) => {
        const request = new sql.Request();
        request.input("Token", sql.VarChar(64), token);
        const result = await request.execute("sp_GetResetToken");
        return result.recordset[0];
    },

    deleteResetToken: async (token) => {
        const request = new sql.Request();
        request.input("Token", sql.VarChar(64), token);
        await request.query("DELETE FROM ResetTokens WHERE Token = @Token");
    },

    updatePassword: async (userId, passwordHash) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("PasswordHash", sql.VarChar(255), passwordHash);
        await request.query(
            "UPDATE Users SET PasswordHash = @PasswordHash WHERE UserID = @UserID",
        );
    },
};

export default authQueries;
