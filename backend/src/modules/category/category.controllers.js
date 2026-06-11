import queries from "./category.queries.js";
import logAudit from "../../utils/audit.js";
import asyncHandler from "../../utils/asyncHandler.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const categoryControllers = {
    getAll: asyncHandler(async (req, res) => {
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const categories = await queries.getAllCategories(businessId);
        return res.status(200).json({ categories });
    }),

    create: asyncHandler(async (req, res) => {
        const { businessId, categoryName } = req.body;
        const userId = req.user.userId;

        if (!businessId || !categoryName) {
            return res.status(400).json({ message: "businessId and categoryName are required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can create categories." });
        }

        const existing = await queries.findByName(categoryName.trim(), businessId);
        if (existing) {
            return res.status(409).json({ message: "A category with this name already exists." });
        }

        const categoryId = await queries.createCategory(categoryName.trim(), businessId);
        await logAudit({ businessId, actorId: userId, action: "CREATE_CATEGORY", entityType: "Category", entityId: categoryId, details: `Created category "${categoryName}".` });
        return res.status(201).json({ message: "Category created successfully.", categoryId });
    }),

    update: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { categoryName } = req.body;
        const userId = req.user.userId;

        if (!categoryName) {
            return res.status(400).json({ message: "categoryName is required." });
        }

        const category = await queries.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, category.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can update categories." });
        }

        const existing = await queries.findByName(categoryName.trim(), category.BusinessID);
        if (existing && existing.CategoryID !== Number(id)) {
            return res.status(409).json({ message: "A category with this name already exists." });
        }

        await queries.updateCategory(id, categoryName.trim());
        await logAudit({ businessId: category.BusinessID, actorId: userId, action: "UPDATE_CATEGORY", entityType: "Category", entityId: id, details: `Renamed category "${category.CategoryName}" to "${categoryName}".` });
        return res.status(200).json({ message: "Category updated successfully." });
    }),

    remove: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const category = await queries.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, category.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can delete categories." });
        }

        const inUse = await queries.isCategoryInUse(id);
        if (inUse) {
            return res.status(409).json({ message: "Cannot delete category — it is assigned to one or more active products." });
        }

        await queries.deleteCategory(id);
        await logAudit({ businessId: category.BusinessID, actorId: userId, action: "DELETE_CATEGORY", entityType: "Category", entityId: id, details: `Deleted category "${category.CategoryName}".` });
        return res.status(200).json({ message: "Category deleted successfully." });
    }),
};

export default categoryControllers;
