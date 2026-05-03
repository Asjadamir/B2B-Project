import queries from "./product.queries.js";
import logAudit from "../../utils/audit.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const productControllers = {
    getAll: async (req, res) => {
        try {
            const { businessId } = req.query;
            const userId = req.user.userId;

            if (!businessId) {
                return res.status(400).json({ message: "businessId query param is required." });
            }

            const staffRecord = await queries.getStaffRecord(userId, businessId);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }

            const products = await queries.getProductsByBusiness(businessId);
            return res.status(200).json({ products });
        } catch (error) {
            console.error("Get products error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const product = await queries.getProductById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            const staffRecord = await queries.getStaffRecord(userId, product.BusinessID);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }

            const suppliers = await queries.getLinkedSuppliers(id);
            return res.status(200).json({ product: { ...product, suppliers } });
        } catch (error) {
            console.error("Get product error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    create: async (req, res) => {
        try {
            const { businessId, productName, sku, categoryId, unitOfMeasure, sellingPrice } = req.body;
            const userId = req.user.userId;

            if (!businessId || !productName || !sku || !categoryId || !unitOfMeasure || sellingPrice == null) {
                return res.status(400).json({ message: "businessId, productName, sku, categoryId, unitOfMeasure, and sellingPrice are required." });
            }

            const staffRecord = await queries.getStaffRecord(userId, businessId);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }
            if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can add products." });
            }

            const category = await queries.getCategoryById(categoryId);
            if (!category || category.BusinessID !== Number(businessId)) {
                return res.status(400).json({ message: "Invalid category for this business." });
            }

            const duplicate = await queries.findBySKU(sku.trim(), businessId);
            if (duplicate) {
                return res.status(409).json({ message: "A product with this SKU already exists in this business." });
            }

            const productId = await queries.createProduct(
                productName.trim(),
                sku.trim().toUpperCase(),
                categoryId,
                unitOfMeasure.trim(),
                sellingPrice,
                businessId,
            );

            await logAudit({ businessId, actorId: userId, action: "CREATE_PRODUCT", entityType: "Product", entityId: productId, details: `Created product "${productName}" (SKU: ${sku.trim().toUpperCase()}).` });
            return res.status(201).json({ message: "Product created successfully.", productId });
        } catch (error) {
            console.error("Create product error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { productName, sku, categoryId, unitOfMeasure, sellingPrice } = req.body;
            const userId = req.user.userId;

            if (!productName || !sku || !categoryId || !unitOfMeasure || sellingPrice == null) {
                return res.status(400).json({ message: "productName, sku, categoryId, unitOfMeasure, and sellingPrice are required." });
            }

            const product = await queries.getProductById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            const staffRecord = await queries.getStaffRecord(userId, product.BusinessID);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }
            if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can update products." });
            }

            const category = await queries.getCategoryById(categoryId);
            if (!category || category.BusinessID !== product.BusinessID) {
                return res.status(400).json({ message: "Invalid category for this business." });
            }

            const duplicate = await queries.findBySKU(sku.trim(), product.BusinessID);
            if (duplicate && duplicate.ProductID !== Number(id)) {
                return res.status(409).json({ message: "A product with this SKU already exists in this business." });
            }

            await queries.updateProduct(id, productName.trim(), sku.trim().toUpperCase(), categoryId, unitOfMeasure.trim(), sellingPrice);
            await logAudit({ businessId: product.BusinessID, actorId: userId, action: "UPDATE_PRODUCT", entityType: "Product", entityId: id, details: `Updated product "${product.ProductName}": name="${productName}", SKU="${sku.trim().toUpperCase()}", price=${sellingPrice}.` });
            return res.status(200).json({ message: "Product updated successfully." });
        } catch (error) {
            console.error("Update product error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    remove: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const product = await queries.getProductById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            const staffRecord = await queries.getStaffRecord(userId, product.BusinessID);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }
            if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can remove products." });
            }

            await queries.deactivateProduct(id);
            await logAudit({ businessId: product.BusinessID, actorId: userId, action: "DEACTIVATE_PRODUCT", entityType: "Product", entityId: id, details: `Deactivated product "${product.ProductName}" (SKU: ${product.SKU}).` });
            return res.status(200).json({ message: "Product deactivated successfully." });
        } catch (error) {
            console.error("Deactivate product error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    addSupplier: async (req, res) => {
        try {
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

            const staffRecord = await queries.getStaffRecord(userId, product.BusinessID);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }
            if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can link suppliers." });
            }

            const supplier = await queries.getSupplierById(supplierId);
            if (!supplier || supplier.BusinessID !== product.BusinessID) {
                return res.status(400).json({ message: "Invalid supplier for this business." });
            }

            const alreadyLinked = await queries.isSupplierLinked(id, supplierId);
            if (alreadyLinked) {
                return res.status(409).json({ message: "This supplier is already linked to the product." });
            }

            await queries.linkSupplier(id, supplierId);
            await logAudit({ businessId: product.BusinessID, actorId: userId, action: "LINK_SUPPLIER", entityType: "Product", entityId: id, details: `Linked supplier "${supplier.SupplierName}" to product "${product.ProductName}".` });
            return res.status(201).json({ message: "Supplier linked successfully." });
        } catch (error) {
            console.error("Link supplier error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    removeSupplier: async (req, res) => {
        try {
            const { id, supplierId } = req.params;
            const userId = req.user.userId;

            const product = await queries.getProductById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            const staffRecord = await queries.getStaffRecord(userId, product.BusinessID);
            if (!staffRecord) {
                return res.status(403).json({ message: "Access denied." });
            }
            if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can unlink suppliers." });
            }

            const linked = await queries.isSupplierLinked(id, supplierId);
            if (!linked) {
                return res.status(404).json({ message: "This supplier is not linked to the product." });
            }

            await queries.unlinkSupplier(id, supplierId);
            await logAudit({ businessId: product.BusinessID, actorId: userId, action: "UNLINK_SUPPLIER", entityType: "Product", entityId: id, details: `Unlinked supplier #${supplierId} from product "${product.ProductName}".` });
            return res.status(200).json({ message: "Supplier unlinked successfully." });
        } catch (error) {
            console.error("Unlink supplier error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },
};

export default productControllers;
