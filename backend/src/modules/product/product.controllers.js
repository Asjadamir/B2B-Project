import queries from "./product.queries.js";
import logAudit from "../../utils/audit.js";
import sql from "mssql";
import asyncHandler from "../../utils/asyncHandler.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const productControllers = {
    getAll: asyncHandler(async (req, res) => {
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res
                .status(400)
                .json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const products = await queries.getProductsByBusiness(businessId);
        return res.status(200).json({ products });
    }),

    getById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const product = await queries.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            product.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const suppliers = await queries.getLinkedSuppliers(id);
        return res.status(200).json({ product: { ...product, suppliers } });
    }),

    create: asyncHandler(async (req, res) => {
        const {
            businessId,
            productName,
            sku,
            categoryId,
            unitOfMeasure,
            sellingPrice,
        } = req.body;
        const userId = req.user.userId;

        if (
            !businessId ||
            !productName ||
            !sku ||
            !categoryId ||
            !unitOfMeasure ||
            sellingPrice == null
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "businessId, productName, sku, categoryId, unitOfMeasure, and sellingPrice are required.",
                });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({ message: "Only Owner or Manager can add products." });
        }

        const category = await queries.getCategoryById(categoryId);
        if (!category || category.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid category for this business." });
        }

        const duplicate = await queries.findBySKU(sku.trim(), businessId);
        if (duplicate) {
            return res
                .status(409)
                .json({
                    message:
                        "A product with this SKU already exists in this business.",
                });
        }

        const request = new sql.Request();
        request.input("ActorID", sql.Int, userId);
        await request.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        const productId = await queries.createProduct(
            productName.trim(),
            sku.trim().toUpperCase(),
            categoryId,
            unitOfMeasure.trim(),
            sellingPrice,
            businessId,
        );

        return res
            .status(201)
            .json({ message: "Product created successfully.", productId });
    }),

    update: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { productName, sku, categoryId, unitOfMeasure, sellingPrice } =
            req.body;
        const userId = req.user.userId;

        if (
            !productName ||
            !sku ||
            !categoryId ||
            !unitOfMeasure ||
            sellingPrice == null
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "productName, sku, categoryId, unitOfMeasure, and sellingPrice are required.",
                });
        }

        const product = await queries.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            product.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message: "Only Owner or Manager can update products.",
                });
        }

        const category = await queries.getCategoryById(categoryId);
        if (!category || category.BusinessID !== product.BusinessID) {
            return res
                .status(400)
                .json({ message: "Invalid category for this business." });
        }

        const duplicate = await queries.findBySKU(
            sku.trim(),
            product.BusinessID,
        );
        if (duplicate && duplicate.ProductID !== Number(id)) {
            return res
                .status(409)
                .json({
                    message:
                        "A product with this SKU already exists in this business.",
                });
        }

        const request = new sql.Request();
        request.input("ActorID", sql.Int, userId);
        await request.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        await queries.updateProduct(
            id,
            productName.trim(),
            sku.trim().toUpperCase(),
            categoryId,
            unitOfMeasure.trim(),
            sellingPrice,
        );
        return res
            .status(200)
            .json({ message: "Product updated successfully." });
    }),

    remove: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const product = await queries.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            product.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message: "Only Owner or Manager can remove products.",
                });
        }

        const request = new sql.Request();
        request.input("ActorID", sql.Int, userId);
        await request.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        await queries.deactivateProduct(id);
        return res
            .status(200)
            .json({ message: "Product deactivated successfully." });
    }),

    addSupplier: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { supplierId } = req.body;
        const userId = req.user.userId;

        if (!supplierId) {
            return res.status(400).json({ message: "supplierId is required." });
        }

        const product = await queries.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            product.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({ message: "Only Owner or Manager can link suppliers." });
        }

        const supplier = await queries.getSupplierById(supplierId);
        if (!supplier || supplier.BusinessID !== product.BusinessID) {
            return res
                .status(400)
                .json({ message: "Invalid supplier for this business." });
        }

        const alreadyLinked = await queries.isSupplierLinked(id, supplierId);
        if (alreadyLinked) {
            return res
                .status(409)
                .json({
                    message: "This supplier is already linked to the product.",
                });
        }

        await queries.linkSupplier(id, supplierId);
        await logAudit({
            businessId: product.BusinessID,
            actorId: userId,
            action: "LINK_SUPPLIER",
            entityType: "Product",
            entityId: id,
            details: `Linked supplier "${supplier.SupplierName}" to product "${product.ProductName}".`,
        });
        return res
            .status(201)
            .json({ message: "Supplier linked successfully." });
    }),

    removeSupplier: asyncHandler(async (req, res) => {
        const { id, supplierId } = req.params;
        const userId = req.user.userId;

        const product = await queries.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            product.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message: "Only Owner or Manager can unlink suppliers.",
                });
        }

        const linked = await queries.isSupplierLinked(id, supplierId);
        if (!linked) {
            return res
                .status(404)
                .json({
                    message: "This supplier is not linked to the product.",
                });
        }

        await queries.unlinkSupplier(id, supplierId);
        await logAudit({
            businessId: product.BusinessID,
            actorId: userId,
            action: "UNLINK_SUPPLIER",
            entityType: "Product",
            entityId: id,
            details: `Unlinked supplier #${supplierId} from product "${product.ProductName}".`,
        });
        return res
            .status(200)
            .json({ message: "Supplier unlinked successfully." });
    }),
};

export default productControllers;
