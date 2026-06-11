import queries from "./supplier.queries.js";
import logAudit from "../../utils/audit.js";
import asyncHandler from "../../utils/asyncHandler.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const supplierControllers = {
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

        const suppliers = await queries.getSuppliersByBusiness(businessId);
        return res.status(200).json({ suppliers });
    }),

    getById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const supplier = await queries.getSupplierById(id);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, supplier.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        return res.status(200).json({ supplier });
    }),

    create: asyncHandler(async (req, res) => {
        const { businessId, supplierName, contactNumber, email, description } = req.body;
        const userId = req.user.userId;

        if (!businessId || !supplierName) {
            return res.status(400).json({ message: "businessId and supplierName are required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can add suppliers." });
        }

        const supplierId = await queries.createSupplier(supplierName, contactNumber, email, description, businessId);
        await logAudit({ businessId, actorId: userId, action: "CREATE_SUPPLIER", entityType: "Supplier", entityId: supplierId, details: `Created supplier "${supplierName}".` });
        return res.status(201).json({ message: "Supplier created successfully.", supplierId });
    }),

    update: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { supplierName, contactNumber, email, description } = req.body;
        const userId = req.user.userId;

        if (!supplierName) {
            return res.status(400).json({ message: "supplierName is required." });
        }

        const supplier = await queries.getSupplierById(id);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, supplier.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can update suppliers." });
        }

        await queries.updateSupplier(id, supplierName, contactNumber, email, description);
        await logAudit({ businessId: supplier.BusinessID, actorId: userId, action: "UPDATE_SUPPLIER", entityType: "Supplier", entityId: id, details: `Updated supplier "${supplierName}".` });
        return res.status(200).json({ message: "Supplier updated successfully." });
    }),

    getProducts: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const products = await queries.getLinkedProducts(id, businessId);
        return res.status(200).json({ products });
    }),

    getUnlinkedProducts: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const products = await queries.getUnlinkedProducts(id, businessId);
        return res.status(200).json({ products });
    }),

    remove: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const supplier = await queries.getSupplierById(id);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, supplier.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can remove suppliers." });
        }

        await queries.deactivateSupplier(id);
        await logAudit({ businessId: supplier.BusinessID, actorId: userId, action: "DEACTIVATE_SUPPLIER", entityType: "Supplier", entityId: id, details: `Deactivated supplier "${supplier.SupplierName}".` });
        return res.status(200).json({ message: "Supplier deactivated successfully." });
    }),
};

export default supplierControllers;
