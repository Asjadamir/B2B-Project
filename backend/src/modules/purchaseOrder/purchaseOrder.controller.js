import queries from "./purchaseOrder.queries.js";
import logAudit from "../../utils/audit.js";
import asyncHandler from "../../utils/asyncHandler.js";

const PO_ROLES    = ["Owner", "Manager", "Procurement Officer"];
const CANCEL_ROLES = ["Owner", "Manager"];

const purchaseOrderControllers = {
    getSupplierProducts: asyncHandler(async (req, res) => {
        const { supplierId } = req.params;
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const supplier = await queries.getSupplierById(supplierId);
        if (!supplier || supplier.BusinessID !== Number(businessId)) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const products = await queries.getProductsBySupplier(supplierId, businessId);
        return res.status(200).json({ products });
    }),

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

        const orders = await queries.getPOsByBusiness(businessId);
        return res.status(200).json({ orders });
    }),

    getById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const order = await queries.getPOById(id);
        if (!order) {
            return res.status(404).json({ message: "Purchase order not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, order.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const items = await queries.getPOItems(id);
        return res.status(200).json({ order: { ...order, items } });
    }),

    create: asyncHandler(async (req, res) => {
        const { businessId, supplierId, warehouseId, items } = req.body;
        const userId = req.user.userId;

        if (!businessId || !supplierId || !warehouseId) {
            return res.status(400).json({ message: "businessId, supplierId, and warehouseId are required." });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "At least one item is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!PO_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can create purchase orders." });
        }

        const supplier = await queries.getSupplierById(supplierId);
        if (!supplier || supplier.BusinessID !== Number(businessId)) {
            return res.status(400).json({ message: "Invalid supplier for this business." });
        }

        const warehouse = await queries.getWarehouseById(warehouseId);
        if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
            return res.status(400).json({ message: "Invalid warehouse for this business." });
        }

        for (const item of items) {
            const { productId, quantity, unitCost } = item;
            if (!productId || !quantity || unitCost == null) {
                return res.status(400).json({ message: "Each item requires productId, quantity, and unitCost." });
            }
            if (quantity <= 0) {
                return res.status(400).json({ message: "Item quantity must be greater than zero." });
            }
            if (unitCost < 0) {
                return res.status(400).json({ message: "Item unit cost cannot be negative." });
            }
            const product = await queries.getProductById(productId);
            if (!product || product.BusinessID !== Number(businessId)) {
                return res.status(400).json({ message: `Product ${productId} does not belong to this business.` });
            }
            const linked = await queries.isProductLinkedToSupplier(productId, supplierId);
            if (!linked) {
                return res.status(400).json({ message: `Product "${product.ProductName}" is not linked to the selected supplier.` });
            }
        }

        const productIds = items.map((i) => i.productId);
        if (new Set(productIds).size !== productIds.length) {
            return res.status(400).json({ message: "Duplicate products in items list. Combine them into a single line item." });
        }

        const poId = await queries.createPO(supplierId, warehouseId, userId);
        for (const item of items) {
            await queries.addPOItem(poId, item.productId, item.quantity, item.unitCost);
        }

        await logAudit({ businessId, actorId: userId, action: "CREATE_PO", entityType: "PurchaseOrder", entityId: poId, details: `Created purchase order from supplier "${supplier.SupplierName}" to warehouse "${warehouse.WarehouseName}" with ${items.length} item(s).` });
        return res.status(201).json({ message: "Purchase order created successfully.", poId });
    }),

    updateStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        if (!status) {
            return res.status(400).json({ message: "status is required." });
        }
        if (!["Received", "Cancelled"].includes(status)) {
            return res.status(400).json({ message: "status must be 'Received' or 'Cancelled'." });
        }

        const order = await queries.getPOById(id);
        if (!order) {
            return res.status(404).json({ message: "Purchase order not found." });
        }
        if (order.Status !== "Pending") {
            return res.status(409).json({ message: `Cannot update a ${order.Status} purchase order.` });
        }

        const staffRecord = await queries.getStaffRecord(userId, order.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (status === "Cancelled") {
            if (!CANCEL_ROLES.includes(staffRecord.RoleName)) {
                return res.status(403).json({ message: "Only Owner or Manager can cancel purchase orders." });
            }
            await queries.updatePOStatus(id, "Cancelled");
            await logAudit({ businessId: order.BusinessID, actorId: userId, action: "CANCEL_PO", entityType: "PurchaseOrder", entityId: id, details: `Cancelled purchase order #${id}.` });
            return res.status(200).json({ message: "Purchase order cancelled." });
        }

        if (!PO_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can mark orders as received." });
        }

        const items = await queries.getPOItems(id);
        if (items.length === 0) {
            return res.status(400).json({ message: "Cannot receive a purchase order with no items." });
        }

        for (const item of items) {
            await queries.upsertInventory(order.WarehouseID, item.ProductID, item.Quantity);
        }

        await queries.updatePOStatus(id, "Received");
        await logAudit({ businessId: order.BusinessID, actorId: userId, action: "RECEIVE_PO", entityType: "PurchaseOrder", entityId: id, details: `Marked purchase order #${id} as received. Inventory updated with ${items.length} item(s).` });
        return res.status(200).json({ message: "Purchase order marked as received. Inventory updated." });
    }),

    addItem: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { productId, quantity, unitCost } = req.body;
        const userId = req.user.userId;

        if (!productId || !quantity || unitCost == null) {
            return res.status(400).json({ message: "productId, quantity, and unitCost are required." });
        }
        if (quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero." });
        }
        if (unitCost < 0) {
            return res.status(400).json({ message: "Unit cost cannot be negative." });
        }

        const order = await queries.getPOById(id);
        if (!order) {
            return res.status(404).json({ message: "Purchase order not found." });
        }
        if (order.Status !== "Pending") {
            return res.status(409).json({ message: `Cannot modify a ${order.Status} purchase order.` });
        }

        const staffRecord = await queries.getStaffRecord(userId, order.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!PO_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can modify purchase orders." });
        }

        const product = await queries.getProductById(productId);
        if (!product || product.BusinessID !== order.BusinessID) {
            return res.status(400).json({ message: "Invalid product for this business." });
        }

        const linked = await queries.isProductLinkedToSupplier(productId, order.SupplierID);
        if (!linked) {
            return res.status(400).json({ message: `Product "${product.ProductName}" is not linked to this PO's supplier.` });
        }

        const duplicate = await queries.isPOItemDuplicate(id, productId);
        if (duplicate) {
            return res.status(409).json({ message: "This product is already in the purchase order. Edit the existing line item instead." });
        }

        const itemId = await queries.addPOItem(id, productId, quantity, unitCost);
        await logAudit({ businessId: order.BusinessID, actorId: userId, action: "ADD_PO_ITEM", entityType: "PurchaseOrder", entityId: id, details: `Added ${quantity} x "${product.ProductName}" at $${unitCost} to purchase order #${id}.` });
        return res.status(201).json({ message: "Item added to purchase order.", itemId });
    }),

    updateItem: asyncHandler(async (req, res) => {
        const { id, itemId } = req.params;
        const { quantity, unitCost } = req.body;
        const userId = req.user.userId;

        if (!quantity || unitCost == null) {
            return res.status(400).json({ message: "quantity and unitCost are required." });
        }
        if (quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero." });
        }
        if (unitCost < 0) {
            return res.status(400).json({ message: "Unit cost cannot be negative." });
        }

        const order = await queries.getPOById(id);
        if (!order) {
            return res.status(404).json({ message: "Purchase order not found." });
        }
        if (order.Status !== "Pending") {
            return res.status(409).json({ message: `Cannot modify a ${order.Status} purchase order.` });
        }

        const staffRecord = await queries.getStaffRecord(userId, order.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!PO_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can modify purchase orders." });
        }

        const item = await queries.getPOItemById(itemId);
        if (!item || item.POID !== Number(id)) {
            return res.status(404).json({ message: "Item not found in this purchase order." });
        }

        await queries.updatePOItem(itemId, quantity, unitCost);
        await logAudit({ businessId: order.BusinessID, actorId: userId, action: "UPDATE_PO_ITEM", entityType: "PurchaseOrder", entityId: id, details: `Updated item #${itemId} in purchase order #${id}: quantity ${quantity}, unit cost $${unitCost}.` });
        return res.status(200).json({ message: "Item updated successfully." });
    }),

    removeItem: asyncHandler(async (req, res) => {
        const { id, itemId } = req.params;
        const userId = req.user.userId;

        const order = await queries.getPOById(id);
        if (!order) {
            return res.status(404).json({ message: "Purchase order not found." });
        }
        if (order.Status !== "Pending") {
            return res.status(409).json({ message: `Cannot modify a ${order.Status} purchase order.` });
        }

        const staffRecord = await queries.getStaffRecord(userId, order.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!PO_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can modify purchase orders." });
        }

        const item = await queries.getPOItemById(itemId);
        if (!item || item.POID !== Number(id)) {
            return res.status(404).json({ message: "Item not found in this purchase order." });
        }

        await queries.deletePOItem(itemId);
        await logAudit({ businessId: order.BusinessID, actorId: userId, action: "REMOVE_PO_ITEM", entityType: "PurchaseOrder", entityId: id, details: `Removed item #${itemId} from purchase order #${id}.` });
        return res.status(200).json({ message: "Item removed from purchase order." });
    }),
};

export default purchaseOrderControllers;
