import sql from "mssql";

const logAudit = async ({ businessId, actorId, action, entityType, entityId = null, details = null }) => {
    try {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        request.input("ActorID", sql.Int, actorId);
        request.input("Action", sql.NVarChar(100), action);
        request.input("EntityType", sql.NVarChar(50), entityType);
        request.input("EntityID", sql.Int, entityId);
        request.input("Details", sql.NVarChar(sql.MAX), details);
        await request.query(`
            INSERT INTO AuditLog (BusinessID, ActorID, Action, EntityType, EntityID, Details)
            VALUES (@BusinessID, @ActorID, @Action, @EntityType, @EntityID, @Details)
        `);
    } catch (err) {
        console.error("[AUDIT] Failed to write log:", err);
    }
};

export default logAudit;
