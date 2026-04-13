import queries from "./purchaseOrder.queries.js";
import logAudit from "../../utils/audit.js";

const PO_ROLES    = ["Owner", "Manager", "Procurement Officer"];
const CANCEL_ROLES = ["Owner", "Manager"];

const purchaseOrderControllers = (pool) => {
    const {
        getStaffRecord,
        getSupplierById,
        getWarehouseById,
        getProductsBySupplier,
        isProductLinkedToSupplier,
        getProductById,
        getPOsByBusiness,
        getPOById,
        getPOItems,
        getPOItemById,
        isPOItemDuplicate,
        createPO,
        addPOItem,
        updatePOItem,
        deletePOItem,
        updatePOStatus,
        upsertInventory,
    } = queries(pool);

    return {
        // ── GET PRODUCTS FOR A SUPPLIER ──────────────────────────────
        // GET /api/purchase-order/supplier/:supplierId/products?businessId=
        getSupplierProducts: async (req, res) => {
            try {
                const { supplierId } = req.params;
                const { businessId } = req.query;
                const userId = req.user.userId;

                if (!businessId) {
                    return res.status(400).json({ message: "businessId query param is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const supplier = await getSupplierById(supplierId);
                if (!supplier || supplier.BusinessID !== Number(businessId)) {
                    return res.status(404).json({ message: "Supplier not found." });
                }

                const products = await getProductsBySupplier(supplierId, businessId);
                return res.status(200).json({ products });
            } catch (error) {
                console.error("Get supplier products error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET ALL PURCHASE ORDERS ──────────────────────────────────
        // GET /api/purchase-order?businessId=
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

                const orders = await getPOsByBusiness(businessId);
                return res.status(200).json({ orders });
            } catch (error) {
                console.error("Get purchase orders error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET PURCHASE ORDER BY ID ─────────────────────────────────
        // GET /api/purchase-order/:id
        getById: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const order = await getPOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Purchase order not found." });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const items = await getPOItems(id);
                return res.status(200).json({ order: { ...order, items } });
            } catch (error) {
                console.error("Get purchase order error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── CREATE PURCHASE ORDER ────────────────────────────────────
        // POST /api/purchase-order
        // Body: { businessId, supplierId, warehouseId, items: [{ productId, quantity, unitCost }] }
        create: async (req, res) => {
            try {
                const { businessId, supplierId, warehouseId, items } = req.body;
                const userId = req.user.userId;

                if (!businessId || !supplierId || !warehouseId) {
                    return res.status(400).json({ message: "businessId, supplierId, and warehouseId are required." });
                }
                if (!Array.isArray(items) || items.length === 0) {
                    return res.status(400).json({ message: "At least one item is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!PO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can create purchase orders." });
                }

                // Validate supplier belongs to this business
                const supplier = await getSupplierById(supplierId);
                if (!supplier || supplier.BusinessID !== Number(businessId)) {
                    return res.status(400).json({ message: "Invalid supplier for this business." });
                }

                // Validate warehouse belongs to this business
                const warehouse = await getWarehouseById(warehouseId);
                if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
                    return res.status(400).json({ message: "Invalid warehouse for this business." });
                }

                // Validate each line item
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

                    const product = await getProductById(productId);
                    if (!product || product.BusinessID !== Number(businessId)) {
                        return res.status(400).json({ message: `Product ${productId} does not belong to this business.` });
                    }

                    const linked = await isProductLinkedToSupplier(productId, supplierId);
                    if (!linked) {
                        return res.status(400).json({ message: `Product "${product.ProductName}" is not linked to the selected supplier.` });
                    }
                }

                // Check for duplicate productIds in the items array
                const productIds = items.map((i) => i.productId);
                if (new Set(productIds).size !== productIds.length) {
                    return res.status(400).json({ message: "Duplicate products in items list. Combine them into a single line item." });
                }

                // Create PO then insert items
                const poId = await createPO(supplierId, warehouseId, userId);
                for (const item of items) {
                    await addPOItem(poId, item.productId, item.quantity, item.unitCost);
                }

                await logAudit(pool, { businessId, actorId: userId, action: "CREATE_PO", entityType: "PurchaseOrder", entityId: poId, details: `Created purchase order from supplier "${supplier.SupplierName}" to warehouse "${warehouse.WarehouseName}" with ${items.length} item(s).` });
                return res.status(201).json({ message: "Purchase order created successfully.", poId });
            } catch (error) {
                console.error("Create purchase order error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE PO STATUS ─────────────────────────────────────────
        // PATCH /api/purchase-order/:id/status
        // Body: { status: "Received" | "Cancelled" }
        updateStatus: async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                const userId = req.user.userId;

                if (!status) {
                    return res.status(400).json({ message: "status is required." });
                }
                if (!["Received", "Cancelled"].includes(status)) {
                    return res.status(400).json({ message: "status must be 'Received' or 'Cancelled'." });
                }

                const order = await getPOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Purchase order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot update a ${order.Status} purchase order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                if (status === "Cancelled") {
                    if (!CANCEL_ROLES.includes(staffRecord.RoleName)) {
                        return res.status(403).json({ message: "Only Owner or Manager can cancel purchase orders." });
                    }
                    await updatePOStatus(id, "Cancelled");
                    await logAudit(pool, { businessId: order.BusinessID, actorId: userId, action: "CANCEL_PO", entityType: "PurchaseOrder", entityId: id, details: `Cancelled purchase order #${id}.` });
                    return res.status(200).json({ message: "Purchase order cancelled." });
                }

                // status === "Received"
                if (!PO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can mark orders as received." });
                }

                const items = await getPOItems(id);
                if (items.length === 0) {
                    return res.status(400).json({ message: "Cannot receive a purchase order with no items." });
                }

                // Upsert inventory for each line item
                for (const item of items) {
                    await upsertInventory(order.WarehouseID, item.ProductID, item.Quantity);
                }

                await updatePOStatus(id, "Received");
                await logAudit(pool, { businessId: order.BusinessID, actorId: userId, action: "RECEIVE_PO", entityType: "PurchaseOrder", entityId: id, details: `Marked purchase order #${id} as received. Inventory updated with ${items.length} item(s).` });
                return res.status(200).json({ message: "Purchase order marked as received. Inventory updated." });
            } catch (error) {
                console.error("Update PO status error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── ADD ITEM TO PO ───────────────────────────────────────────
        // POST /api/purchase-order/:id/items
        addItem: async (req, res) => {
            try {
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

                const order = await getPOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Purchase order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot modify a ${order.Status} purchase order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!PO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can modify purchase orders." });
                }

                const product = await getProductById(productId);
                if (!product || product.BusinessID !== order.BusinessID) {
                    return res.status(400).json({ message: "Invalid product for this business." });
                }

                const linked = await isProductLinkedToSupplier(productId, order.SupplierID);
                if (!linked) {
                    return res.status(400).json({ message: `Product "${product.ProductName}" is not linked to this PO's supplier.` });
                }

                const duplicate = await isPOItemDuplicate(id, productId);
                if (duplicate) {
                    return res.status(409).json({ message: "This product is already in the purchase order. Edit the existing line item instead." });
                }

                const itemId = await addPOItem(id, productId, quantity, unitCost);
                await logAudit(pool, { businessId: order.BusinessID, actorId: userId, action: "ADD_PO_ITEM", entityType: "PurchaseOrder", entityId: id, details: `Added ${quantity} x "${product.ProductName}" at $${unitCost} to purchase order #${id}.` });
                return res.status(201).json({ message: "Item added to purchase order.", itemId });
            } catch (error) {
                console.error("Add PO item error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE PO ITEM ───────────────────────────────────────────
        // PUT /api/purchase-order/:id/items/:itemId
        updateItem: async (req, res) => {
            try {
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

                const order = await getPOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Purchase order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot modify a ${order.Status} purchase order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!PO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can modify purchase orders." });
                }

                const item = await getPOItemById(itemId);
                if (!item || item.POID !== Number(id)) {
                    return res.status(404).json({ message: "Item not found in this purchase order." });
                }

                await updatePOItem(itemId, quantity, unitCost);
                await logAudit(pool, { businessId: order.BusinessID, actorId: userId, action: "UPDATE_PO_ITEM", entityType: "PurchaseOrder", entityId: id, details: `Updated item #${itemId} in purchase order #${id}: quantity ${quantity}, unit cost $${unitCost}.` });
                return res.status(200).json({ message: "Item updated successfully." });
            } catch (error) {
                console.error("Update PO item error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── REMOVE PO ITEM ───────────────────────────────────────────
        // DELETE /api/purchase-order/:id/items/:itemId
        removeItem: async (req, res) => {
            try {
                const { id, itemId } = req.params;
                const userId = req.user.userId;

                const order = await getPOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Purchase order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot modify a ${order.Status} purchase order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!PO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Procurement Officer can modify purchase orders." });
                }

                const item = await getPOItemById(itemId);
                if (!item || item.POID !== Number(id)) {
                    return res.status(404).json({ message: "Item not found in this purchase order." });
                }

                await deletePOItem(itemId);
                await logAudit(pool, { businessId: order.BusinessID, actorId: userId, action: "REMOVE_PO_ITEM", entityType: "PurchaseOrder", entityId: id, details: `Removed item #${itemId} from purchase order #${id}.` });
                return res.status(200).json({ message: "Item removed from purchase order." });
            } catch (error) {
                console.error("Remove PO item error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },
    };
};

export default purchaseOrderControllers;
