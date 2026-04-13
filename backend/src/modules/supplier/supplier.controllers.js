import queries from "./supplier.queries.js";
import logAudit from "../../utils/audit.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const supplierControllers = (pool) => {
    const {
        getStaffRecord,
        getSuppliersByBusiness,
        getSupplierById,
        createSupplier,
        updateSupplier,
        deactivateSupplier,
    } = queries(pool);

    return {
        // ── GET ALL SUPPLIERS ────────────────────────────────────────
        // GET /api/supplier?businessId=1
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

                const suppliers = await getSuppliersByBusiness(businessId);
                return res.status(200).json({ suppliers });
            } catch (error) {
                console.error("Get suppliers error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET SUPPLIER BY ID ───────────────────────────────────────
        // GET /api/supplier/:id
        getById: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const supplier = await getSupplierById(id);
                if (!supplier) {
                    return res.status(404).json({ message: "Supplier not found." });
                }

                const staffRecord = await getStaffRecord(userId, supplier.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                return res.status(200).json({ supplier });
            } catch (error) {
                console.error("Get supplier error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── CREATE SUPPLIER ──────────────────────────────────────────
        // POST /api/supplier
        create: async (req, res) => {
            try {
                const { businessId, supplierName, contactNumber, email, description } = req.body;
                const userId = req.user.userId;

                if (!businessId || !supplierName) {
                    return res.status(400).json({ message: "businessId and supplierName are required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can add suppliers." });
                }

                const supplierId = await createSupplier(supplierName, contactNumber, email, description, businessId);
                await logAudit(pool, { businessId, actorId: userId, action: "CREATE_SUPPLIER", entityType: "Supplier", entityId: supplierId, details: `Created supplier "${supplierName}".` });
                return res.status(201).json({ message: "Supplier created successfully.", supplierId });
            } catch (error) {
                console.error("Create supplier error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE SUPPLIER ──────────────────────────────────────────
        // PUT /api/supplier/:id
        update: async (req, res) => {
            try {
                const { id } = req.params;
                const { supplierName, contactNumber, email, description } = req.body;
                const userId = req.user.userId;

                if (!supplierName) {
                    return res.status(400).json({ message: "supplierName is required." });
                }

                const supplier = await getSupplierById(id);
                if (!supplier) {
                    return res.status(404).json({ message: "Supplier not found." });
                }

                const staffRecord = await getStaffRecord(userId, supplier.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can update suppliers." });
                }

                await updateSupplier(id, supplierName, contactNumber, email, description);
                await logAudit(pool, { businessId: supplier.BusinessID, actorId: userId, action: "UPDATE_SUPPLIER", entityType: "Supplier", entityId: id, details: `Updated supplier "${supplierName}".` });
                return res.status(200).json({ message: "Supplier updated successfully." });
            } catch (error) {
                console.error("Update supplier error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── DEACTIVATE SUPPLIER ──────────────────────────────────────
        // DELETE /api/supplier/:id
        remove: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const supplier = await getSupplierById(id);
                if (!supplier) {
                    return res.status(404).json({ message: "Supplier not found." });
                }

                const staffRecord = await getStaffRecord(userId, supplier.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can remove suppliers." });
                }

                await deactivateSupplier(id);
                await logAudit(pool, { businessId: supplier.BusinessID, actorId: userId, action: "DEACTIVATE_SUPPLIER", entityType: "Supplier", entityId: id, details: `Deactivated supplier "${supplier.SupplierName}".` });
                return res.status(200).json({ message: "Supplier deactivated successfully." });
            } catch (error) {
                console.error("Deactivate supplier error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },
    };
};

export default supplierControllers;
