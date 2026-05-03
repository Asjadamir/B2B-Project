import queries from "./business.queries.js";
import logAudit from "../../utils/audit.js";

const businessControllers = {
    create: async (req, res) => {
        try {
            const { businessName, description } = req.body;
            const userId = req.user.userId;

            if (!businessName) {
                return res
                    .status(400)
                    .json({ message: "Business name is required." });
            }

            const businessId = await queries.createBusiness(
                businessName,
                description,
                userId,
            );
            await queries.addOwnerAsStaff(userId, businessId);
            await logAudit({
                businessId,
                actorId: userId,
                action: "CREATE_BUSINESS",
                entityType: "Business",
                entityId: businessId,
                details: `Created business "${businessName}".`,
            });

            return res.status(201).json({
                message: "Business created successfully.",
                businessId,
            });
        } catch (error) {
            console.error("Create business error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    getMy: async (req, res) => {
        try {
            const businesses = await queries.getMyBusinesses(req.user.userId);
            return res.status(200).json({ businesses });
        } catch (error) {
            console.error("Get businesses error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const business = await queries.getBusinessById(id);
            if (!business) {
                return res.status(404).json({ message: "Business not found." });
            }

            const staffRecord = await queries.getStaffRecord(userId, id);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }

            return res.status(200).json({ business });
        } catch (error) {
            console.error("Get business error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { businessName, description } = req.body;
            const userId = req.user.userId;

            if (!businessName) {
                return res
                    .status(400)
                    .json({ message: "Business name is required." });
            }

            const business = await queries.getBusinessById(id);
            if (!business) {
                return res.status(404).json({ message: "Business not found." });
            }

            if (business.OwnerID !== userId) {
                return res.status(403).json({
                    message: "Only the owner can update this business.",
                });
            }

            await queries.updateBusiness(id, businessName, description);
            await logAudit({
                businessId: id,
                actorId: userId,
                action: "UPDATE_BUSINESS",
                entityType: "Business",
                entityId: id,
                details: `Updated business name to "${businessName}".`,
            });

            return res
                .status(200)
                .json({ message: "Business updated successfully." });
        } catch (error) {
            console.error("Update business error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    remove: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const business = await queries.getBusinessById(id);
            if (!business) {
                return res.status(404).json({ message: "Business not found." });
            }

            if (business.OwnerID !== userId) {
                return res.status(403).json({
                    message: "Only the owner can delete this business.",
                });
            }

            await queries.deleteBusiness(id);
            await logAudit({
                businessId: id,
                actorId: userId,
                action: "DELETE_BUSINESS",
                entityType: "Business",
                entityId: id,
                details: `Deleted business "${business.BusinessName}".`,
            });

            return res
                .status(200)
                .json({ message: "Business deleted successfully." });
        } catch (error) {
            console.error("Delete business error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },
};

export default businessControllers;
