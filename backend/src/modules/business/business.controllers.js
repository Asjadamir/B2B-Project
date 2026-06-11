import queries from "./business.queries.js";
import logAudit from "../../utils/audit.js";
import asyncHandler from "../../utils/asyncHandler.js";

const businessControllers = {
    create: asyncHandler(async (req, res) => {
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
    }),

    getMy: asyncHandler(async (req, res) => {
        const businesses = await queries.getMyBusinesses(req.user.userId);
        return res.status(200).json({ businesses });
    }),

    getById: asyncHandler(async (req, res) => {
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
    }),

    update: asyncHandler(async (req, res) => {
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
    }),

    remove: asyncHandler(async (req, res) => {
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
    }),
};

export default businessControllers;
