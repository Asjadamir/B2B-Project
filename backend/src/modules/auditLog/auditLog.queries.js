const auditLogQueries = (pool) => {
    return {
        getStaffRecord: async (userId, businessId) => {
            const [rows] = await pool.execute(
                `SELECT s.StaffID, r.RoleName
                 FROM Staff s
                 JOIN Roles r ON s.RoleID = r.RoleID
                 WHERE s.UserID = ? AND s.BusinessID = ? AND s.IsActive = TRUE`,
                [userId, businessId]
            );
            return rows[0] ?? null;
        },

        getLogs: async ({ businessId, page, limit, entityType, actorId, action, from, to }) => {
            const offset = (page - 1) * limit;

            const conditions = ["l.BusinessID = ?"];
            const params = [businessId];

            if (entityType) { conditions.push("l.EntityType = ?"); params.push(entityType); }
            if (actorId)    { conditions.push("l.ActorID = ?");    params.push(actorId); }
            if (action)     { conditions.push("l.Action = ?");     params.push(action); }
            if (from)       { conditions.push("l.CreatedAt >= ?"); params.push(from); }
            if (to)         { conditions.push("l.CreatedAt <= ?"); params.push(to); }

            const where = conditions.join(" AND ");

            const [logs] = await pool.execute(
                `SELECT l.LogID, l.Action, l.EntityType, l.EntityID, l.Details, l.CreatedAt,
                        u.FullName AS ActorName, u.Email AS ActorEmail
                 FROM AuditLog l
                 JOIN Users u ON l.ActorID = u.UserID
                 WHERE ${where}
                 ORDER BY l.CreatedAt DESC
                 LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), parseInt(offset)]
            );

            const [[{ total }]] = await pool.execute(
                `SELECT COUNT(*) AS total FROM AuditLog l WHERE ${where}`,
                params
            );

            return { logs, total };
        },
    };
};

export default auditLogQueries;
