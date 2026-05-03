import queries from "./auditLog.queries.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const auditLogControllers = {
    getAll: async (req, res) => {
        try {
            const { businessId, entityType, actorId, action, from, to } = req.query;
            const page  = Math.max(1, parseInt(req.query.page)  || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
            const userId = req.user.userId;

            if (!businessId) {
                return res.status(400).json({ message: "businessId query param is required." });
            }

            const staffRecord = await queries.getStaffRecord(userId, businessId);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }
            if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can view audit logs." });
            }

            const { logs, total } = await queries.getLogs({ businessId, page, limit, entityType, actorId, action, from, to });
            return res.status(200).json({ logs, total, page, limit });
        } catch (error) {
            console.error("Get audit logs error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },
};

export default auditLogControllers;
