import sql from "mssql";

const auditLogQueries = {
    getStaffRecord: async (userId, businessId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT s.StaffID, r.RoleName
            FROM Staff s
            JOIN Roles r ON s.RoleID = r.RoleID
            WHERE s.UserID = @UserID AND s.BusinessID = @BusinessID AND s.IsActive = 1
        `);
        return result.recordset[0] ?? null;
    },

    getLogs: async ({ businessId, page, limit, entityType, actorId, action, from, to }) => {
        const offset = (page - 1) * limit;

        const conditions = ["l.BusinessID = @BusinessID"];
        const inputs = [{ name: "BusinessID", type: sql.Int, value: parseInt(businessId) }];

        if (entityType) {
            conditions.push("l.EntityType = @EntityType");
            inputs.push({ name: "EntityType", type: sql.NVarChar(50), value: entityType });
        }
        if (actorId) {
            conditions.push("l.ActorID = @ActorID");
            inputs.push({ name: "ActorID", type: sql.Int, value: parseInt(actorId) });
        }
        if (action) {
            conditions.push("l.Action = @Action");
            inputs.push({ name: "Action", type: sql.NVarChar(100), value: action });
        }
        if (from) {
            conditions.push("l.CreatedAt >= @From");
            inputs.push({ name: "From", type: sql.DateTime, value: new Date(from) });
        }
        if (to) {
            conditions.push("l.CreatedAt <= @To");
            inputs.push({ name: "To", type: sql.DateTime, value: new Date(to) });
        }

        const where = conditions.join(" AND ");

        const addInputs = (req) => {
            for (const { name, type, value } of inputs) req.input(name, type, value);
            return req;
        };

        const dataReq = addInputs(new sql.Request());
        dataReq.input("Offset", sql.Int, offset);
        dataReq.input("Limit", sql.Int, parseInt(limit));

        const logs = (await dataReq.query(`
            SELECT l.LogID, l.Action, l.EntityType, l.EntityID, l.Details, l.CreatedAt,
                   u.FullName AS ActorName, u.Email AS ActorEmail
            FROM AuditLog l
            JOIN Users u ON l.ActorID = u.UserID
            WHERE ${where}
            ORDER BY l.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
        `)).recordset;

        const countReq = addInputs(new sql.Request());
        const total = (await countReq.query(
            `SELECT COUNT(*) AS total FROM AuditLog l WHERE ${where}`
        )).recordset[0].total;

        return { logs, total };
    },
};

export default auditLogQueries;
