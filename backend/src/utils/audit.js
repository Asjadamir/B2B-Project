const logAudit = async (pool, { businessId, actorId, action, entityType, entityId = null, details = null }) => {
    try {
        await pool.execute(
            `INSERT INTO AuditLog (BusinessID, ActorID, Action, EntityType, EntityID, Details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [businessId, actorId, action, entityType, entityId, details]
        );
    } catch (err) {
        console.error("[AUDIT] Failed to write log:", err);
    }
};

export default logAudit;
