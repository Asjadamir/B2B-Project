const employeeQueries = (db) => {
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

        // Get business by ID (for invite email content)
        getBusinessById: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Business WHERE BusinessID = ?`,
                [businessId],
            );
            return rows[0];
        },

        // Get role by ID (validate roleId sent in invite)
        getRoleById: async (roleId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Roles WHERE RoleID = ?`,
                [roleId],
            );
            return rows[0];
        },

        // Check if there is already a pending invite for this email + business
        findPendingInvite: async (email, businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM JoiningRequest
                WHERE Email = ? AND BusinessID = ? AND Status = 'Pending'`,
                [email, businessId],
            );
            return rows[0];
        },

        // Check if a user is already an active staff member of a business
        isAlreadyStaff: async (userId, businessId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM Staff
                WHERE UserID = ? AND BusinessID = ? AND IsActive = TRUE LIMIT 1`,
                [userId, businessId],
            );
            return rows.length > 0;
        },

        // Save the invitation record
        createInvite: async (email, businessId, roleId, invitedBy, token) => {
            const [result] = await db.execute(
                `INSERT INTO JoiningRequest (Email, BusinessID, RoleID, InvitedBy, Token, ValidTill)
                VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 48 HOUR))`,
                [email, businessId, roleId, invitedBy, token],
            );
            return result.insertId;
        },

        // Find an invite by token — joins business and role for full context
        findInviteByToken: async (token) => {
            const [rows] = await db.execute(
                `SELECT jr.*, b.BusinessName, r.RoleName
                FROM JoiningRequest jr
                JOIN Business b ON jr.BusinessID = b.BusinessID
                JOIN Roles r    ON jr.RoleID     = r.RoleID
                WHERE jr.Token = ?`,
                [token],
            );
            return rows[0];
        },

        // Find a user by email (to handle existing accounts)
        findUserByEmail: async (email) => {
            const [rows] = await db.execute(
                `SELECT * FROM Users WHERE Email = ?`,
                [email],
            );
            return rows[0];
        },

        // Create a new user — already verified (no email verification needed)
        createVerifiedUser: async (fullName, email, passwordHash) => {
            const [result] = await db.execute(
                `INSERT INTO Users (FullName, Email, PasswordHash, IsVerified)
                VALUES (?, ?, ?, TRUE)`,
                [fullName, email, passwordHash],
            );
            return result.insertId;
        },

        // Add user to Staff with the role from the invite
        addToStaff: async (userId, businessId, roleId) => {
            await db.execute(
                `INSERT INTO Staff (UserID, BusinessID, RoleID, IsActive)
                VALUES (?, ?, ?, TRUE)`,
                [userId, businessId, roleId],
            );
        },

        // Mark invite as accepted
        markInviteAccepted: async (requestId) => {
            await db.execute(
                `UPDATE JoiningRequest SET Status = 'Accepted' WHERE RequestID = ?`,
                [requestId],
            );
        },

        // Get a single staff record by StaffID (with role info)
        getStaffById: async (staffId) => {
            const [rows] = await db.execute(
                `SELECT s.*, r.RoleName, u.Email, u.FullName
                FROM Staff s
                JOIN Roles r ON s.RoleID = r.RoleID
                JOIN Users u ON s.UserID = u.UserID
                WHERE s.StaffID = ?`,
                [staffId],
            );
            return rows[0];
        },

        // Get a staff record by UserID + BusinessID (for leave flow)
        getStaffByUserAndBusiness: async (userId, businessId) => {
            const [rows] = await db.execute(
                `SELECT s.*, r.RoleName FROM Staff s
                JOIN Roles r ON s.RoleID = r.RoleID
                WHERE s.UserID = ? AND s.BusinessID = ? AND s.IsActive = TRUE`,
                [userId, businessId],
            );
            return rows[0];
        },

        // Update the role of a staff member
        updateStaffRole: async (staffId, roleId) => {
            await db.execute(
                `UPDATE Staff SET RoleID = ? WHERE StaffID = ?`,
                [roleId, staffId],
            );
        },

        // Soft-remove a staff member (expel or leave)
        deactivateStaff: async (staffId) => {
            await db.execute(
                `UPDATE Staff SET IsActive = FALSE WHERE StaffID = ?`,
                [staffId],
            );
        },

        // Get all active staff/employees for a business
        getEmployeesByBusiness: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT s.StaffID, s.UserID, s.IsActive, s.JoinedAt,
                        u.FullName, u.Email,
                        r.RoleID, r.RoleName
                FROM Staff s
                JOIN Users u  ON s.UserID  = u.UserID
                JOIN Roles r  ON s.RoleID  = r.RoleID
                WHERE s.BusinessID = ?
                ORDER BY s.JoinedAt DESC`,
                [businessId],
            );
            return rows;
        },

        // Get all pending invitations sent by a business
        getPendingInvites: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT jr.RequestID, jr.Email, jr.InvitedAt, jr.ValidTill,
                        r.RoleName,
                        u.FullName AS InvitedByName
                FROM JoiningRequest jr
                JOIN Roles r  ON jr.RoleID     = r.RoleID
                JOIN Users u  ON jr.InvitedBy  = u.UserID
                WHERE jr.BusinessID = ? AND jr.Status = 'Pending'
                ORDER BY jr.InvitedAt DESC`,
                [businessId],
            );
            return rows;
        },
    };
};

export default employeeQueries;
