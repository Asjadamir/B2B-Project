const authQueries = (db) => {
    return {
        // Find a user by email
        findUserByEmail: async (email) => {
            const [rows] = await db.execute(
                "SELECT * FROM Users WHERE Email = ?",
                [email],
            );
            return rows[0];
        },

        // Find a user by ID
        findUserById: async (userId) => {
            const [rows] = await db.execute(
                "SELECT * FROM Users WHERE UserID = ?",
                [userId],
            );
            return rows[0];
        },

        // Update name and password for an unverified user re-signing up
        updateUnverifiedUser: async (userId, fullName, passwordHash) => {
            await db.execute(
                "UPDATE Users SET FullName = ?, PasswordHash = ? WHERE UserID = ?",
                [fullName, passwordHash, userId],
            );
        },

        // Insert a new user
        createUser: async (fullName, email, passwordHash) => {
            const [result] = await db.execute(
                `INSERT INTO Users (FullName, Email, PasswordHash, IsVerified)
                VALUES (?, ?, ?, FALSE)`,
                [fullName, email, passwordHash],
            );
            return result.insertId;
        },

        // Save a verification token into VerifyTokens table
        saveVerifyToken: async (userId, token) => {
            await db.execute(
                `INSERT INTO VerifyTokens (UserID, Token, ValidTill)
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR))`,
                [userId, token],
            );
        },

        // Find a verify token and join the user row in one query
        findVerifyToken: async (token) => {
            const [rows] = await db.execute(
                `SELECT u.UserID, u.Email, u.FullName, vt.ValidTill
                 FROM VerifyTokens vt
                 JOIN Users u ON u.UserID = vt.UserID
                 WHERE vt.Token = ?`,
                [token],
            );
            return rows[0];
        },

        // Delete token after it has been used
        deleteVerifyToken: async (token) => {
            await db.execute("DELETE FROM VerifyTokens WHERE Token = ?", [
                token,
            ]);
        },

        // Delete all verify tokens for a user (to refresh with a new one)
        deleteVerifyTokensByUserId: async (userId) => {
            await db.execute("DELETE FROM VerifyTokens WHERE UserID = ?", [userId]);
        },

        // Mark user as verified
        markUserVerified: async (userId) => {
            await db.execute(
                "UPDATE Users SET IsVerified = TRUE WHERE UserID = ?",
                [userId],
            );
        },

        // Save a password reset token (1 hour expiry)
        saveResetToken: async (userId, token) => {
            await db.execute(
                `INSERT INTO ResetTokens (UserID, Token, ValidTill)
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
                [userId, token],
            );
        },

        // Find a reset token record
        findResetToken: async (token) => {
            const [rows] = await db.execute(
                "SELECT * FROM ResetTokens WHERE Token = ?",
                [token],
            );
            return rows[0];
        },

        // Delete a reset token after use or expiry
        deleteResetToken: async (token) => {
            await db.execute("DELETE FROM ResetTokens WHERE Token = ?", [token]);
        },

        // Update a user's password
        updatePassword: async (userId, passwordHash) => {
            await db.execute(
                "UPDATE Users SET PasswordHash = ? WHERE UserID = ?",
                [passwordHash, userId],
            );
        },
    };
};

export default authQueries;
