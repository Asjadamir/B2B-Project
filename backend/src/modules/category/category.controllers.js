import queries from "./category.queries.js";
import logAudit from "../../utils/audit.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const categoryControllers = (pool) => {
    const {
        getStaffRecord,
        getAllCategories,
        getCategoryById,
        findByName,
        createCategory,
        updateCategory,
        deleteCategory,
        isCategoryInUse,
    } = queries(pool);

    return {
        // ── GET ALL CATEGORIES ───────────────────────────────────────
        // GET /api/category?businessId=1
        getAll: async (req, res) => {
            try {
                const { businessId } = req.query;
                const userId = req.user.userId;

                if (!businessId) {
                    return res.status(400).json({ message: "businessId query param is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const categories = await getAllCategories(businessId);
                return res.status(200).json({ categories });
            } catch (error) {
                console.error("Get categories error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── CREATE CATEGORY ──────────────────────────────────────────
        // POST /api/category
        create: async (req, res) => {
            try {
                const { businessId, categoryName } = req.body;
                const userId = req.user.userId;

                if (!businessId || !categoryName) {
                    return res.status(400).json({ message: "businessId and categoryName are required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can create categories." });
                }

                const existing = await findByName(categoryName.trim(), businessId);
                if (existing) {
                    return res.status(409).json({ message: "A category with this name already exists." });
                }

                const categoryId = await createCategory(categoryName.trim(), businessId);
                await logAudit(pool, { businessId, actorId: userId, action: "CREATE_CATEGORY", entityType: "Category", entityId: categoryId, details: `Created category "${categoryName}".` });
                return res.status(201).json({ message: "Category created successfully.", categoryId });
            } catch (error) {
                console.error("Create category error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE CATEGORY ──────────────────────────────────────────
        // PUT /api/category/:id
        update: async (req, res) => {
            try {
                const { id } = req.params;
                const { categoryName } = req.body;
                const userId = req.user.userId;

                if (!categoryName) {
                    return res.status(400).json({ message: "categoryName is required." });
                }

                const category = await getCategoryById(id);
                if (!category) {
                    return res.status(404).json({ message: "Category not found." });
                }

                const staffRecord = await getStaffRecord(userId, category.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can update categories." });
                }

                // Check name uniqueness within this business (exclude current category)
                const existing = await findByName(categoryName.trim(), category.BusinessID);
                if (existing && existing.CategoryID !== Number(id)) {
                    return res.status(409).json({ message: "A category with this name already exists." });
                }

                await updateCategory(id, categoryName.trim());
                await logAudit(pool, { businessId: category.BusinessID, actorId: userId, action: "UPDATE_CATEGORY", entityType: "Category", entityId: id, details: `Renamed category "${category.CategoryName}" to "${categoryName}".` });
                return res.status(200).json({ message: "Category updated successfully." });
            } catch (error) {
                console.error("Update category error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── DELETE CATEGORY ──────────────────────────────────────────
        // DELETE /api/category/:id
        remove: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const category = await getCategoryById(id);
                if (!category) {
                    return res.status(404).json({ message: "Category not found." });
                }

                const staffRecord = await getStaffRecord(userId, category.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can delete categories." });
                }

                const inUse = await isCategoryInUse(id);
                if (inUse) {
                    return res.status(409).json({ message: "Cannot delete category — it is assigned to one or more active products." });
                }

                await deleteCategory(id);
                await logAudit(pool, { businessId: category.BusinessID, actorId: userId, action: "DELETE_CATEGORY", entityType: "Category", entityId: id, details: `Deleted category "${category.CategoryName}".` });
                return res.status(200).json({ message: "Category deleted successfully." });
            } catch (error) {
                console.error("Delete category error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },
    };
};

export default categoryControllers;
