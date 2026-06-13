import queries from "./saleOrder.queries.js";
import logAudit from "../../utils/audit.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sql from "mssql";

const SO_ROLES = ["Owner", "Manager", "Warehouse Staff"];
const CANCEL_ROLES = ["Owner", "Manager"];

const saleOrderControllers = {
    getWarehouseProducts: asyncHandler(async (req, res) => {
        const { warehouseId } = req.params;
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

        const warehouse = await queries.getWarehouseById(warehouseId);
        if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const products = await queries.getProductsByWarehouse(
            warehouseId,
            businessId,
        );
        return res.status(200).json({ products });
    }),

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

        const orders = await queries.getSOsByBusiness(businessId);
        return res.status(200).json({ orders });
    }),

    getById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const order = await queries.getSOById(id);
        if (!order) {
            return res.status(404).json({ message: "Sale order not found." });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            order.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const items = await queries.getSOItems(id);
        return res.status(200).json({ order: { ...order, items } });
    }),

    create: asyncHandler(async (req, res) => {
        const {
            businessId,
            warehouseId,
            customerName,
            customerContact,
            customerAddress,
            items,
        } = req.body;
        const userId = req.user.userId;

        if (!businessId || !warehouseId || !customerName) {
            return res
                .status(400)
                .json({
                    message:
                        "businessId, warehouseId, and customerName are required.",
                });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res
                .status(400)
                .json({ message: "At least one item is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!SO_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message:
                        "Only Owner, Manager, or Warehouse Staff can create sale orders.",
                });
        }

        const warehouse = await queries.getWarehouseById(warehouseId);
        if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid warehouse for this business." });
        }

        const productIds = items.map((i) => i.productId);
        if (new Set(productIds).size !== productIds.length) {
            return res
                .status(400)
                .json({
                    message:
                        "Duplicate products in items list. Combine them into a single line item.",
                });
        }

        for (const item of items) {
            const { productId, quantity, unitPrice } = item;
            if (!productId || !quantity || unitPrice == null) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Each item requires productId, quantity, and unitPrice.",
                    });
            }
            if (quantity <= 0) {
                return res
                    .status(400)
                    .json({
                        message: "Item quantity must be greater than zero.",
                    });
            }
            if (unitPrice < 0) {
                return res
                    .status(400)
                    .json({ message: "Item unit price cannot be negative." });
            }
            const product = await queries.getProductById(productId);
            if (!product || product.BusinessID !== Number(businessId)) {
                return res
                    .status(400)
                    .json({
                        message: `Product ${productId} does not belong to this business.`,
                    });
            }
            const stock = await queries.getInventoryItem(
                warehouseId,
                productId,
            );
            if (!stock || stock.Quantity < quantity) {
                const available = stock ? stock.Quantity : 0;
                return res
                    .status(400)
                    .json({
                        message: `Insufficient stock for "${product.ProductName}". Available: ${available}, Requested: ${quantity}.`,
                    });
            }
        }

        const request = new sql.Request();
        request.input("ActorID", sql.Int, userId);
        await request.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        const soId = await queries.createSO(
            businessId,
            warehouseId,
            customerName.trim(),
            customerContact,
            customerAddress,
            userId,
        );
        for (const item of items) {
            await queries.addSOItem(
                soId,
                item.productId,
                item.quantity,
                item.unitPrice,
            );
        }
        return res
            .status(201)
            .json({ message: "Sale order created successfully.", soId });
    }),

    updateStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        if (!status) {
            return res.status(400).json({ message: "status is required." });
        }
        if (!["Fulfilled", "Cancelled"].includes(status)) {
            return res
                .status(400)
                .json({
                    message: "status must be 'Fulfilled' or 'Cancelled'.",
                });
        }

        const order = await queries.getSOById(id);
        if (!order) {
            return res.status(404).json({ message: "Sale order not found." });
        }
        if (order.Status !== "Pending") {
            return res
                .status(409)
                .json({
                    message: `Cannot update a ${order.Status} sale order.`,
                });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            order.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (status === "Cancelled") {
            if (!CANCEL_ROLES.includes(staffRecord.RoleName)) {
                return res
                    .status(403)
                    .json({
                        message:
                            "Only Owner or Manager can cancel sale orders.",
                    });
            }
            const request = new sql.Request();
            request.input("ActorID", sql.Int, userId);
            await request.query(
                "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
            );

            await queries.updateSOStatus(id, "Cancelled");
            return res.status(200).json({ message: "Sale order cancelled." });
        }

        if (!SO_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message:
                        "Only Owner, Manager, or Warehouse Staff can fulfill sale orders.",
                });
        }

        const items = await queries.getSOItems(id);
        if (items.length === 0) {
            return res
                .status(400)
                .json({
                    message: "Cannot fulfill a sale order with no items.",
                });
        }

        for (const item of items) {
            const stock = await queries.getInventoryItem(
                order.WarehouseID,
                item.ProductID,
            );
            const available = stock ? stock.Quantity : 0;
            if (available < item.Quantity) {
                return res
                    .status(400)
                    .json({
                        message: `Insufficient stock for "${item.ProductName}". Available: ${available}, Requested: ${item.Quantity}.`,
                    });
            }
        }

        const request2 = new sql.Request();
        request2.input("ActorID", sql.Int, userId);
        await request2.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        for (const item of items) {
            await queries.decrementInventory(
                order.WarehouseID,
                item.ProductID,
                item.Quantity,
            );
        }

        await queries.updateSOStatus(id, "Fulfilled");
        return res
            .status(200)
            .json({ message: "Sale order fulfilled. Inventory updated." });
    }),

    addItem: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { productId, quantity, unitPrice } = req.body;
        const userId = req.user.userId;

        if (!productId || !quantity || unitPrice == null) {
            return res
                .status(400)
                .json({
                    message: "productId, quantity, and unitPrice are required.",
                });
        }
        if (quantity <= 0) {
            return res
                .status(400)
                .json({ message: "Quantity must be greater than zero." });
        }
        if (unitPrice < 0) {
            return res
                .status(400)
                .json({ message: "Unit price cannot be negative." });
        }

        const order = await queries.getSOById(id);
        if (!order) {
            return res.status(404).json({ message: "Sale order not found." });
        }
        if (order.Status !== "Pending") {
            return res
                .status(409)
                .json({
                    message: `Cannot modify a ${order.Status} sale order.`,
                });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            order.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!SO_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message:
                        "Only Owner, Manager, or Warehouse Staff can modify sale orders.",
                });
        }

        const product = await queries.getProductById(productId);
        if (!product || product.BusinessID !== order.BusinessID) {
            return res
                .status(400)
                .json({ message: "Invalid product for this business." });
        }

        const stock = await queries.getInventoryItem(
            order.WarehouseID,
            productId,
        );
        const available = stock ? stock.Quantity : 0;
        if (available < quantity) {
            return res
                .status(400)
                .json({
                    message: `Insufficient stock for "${product.ProductName}". Available: ${available}, Requested: ${quantity}.`,
                });
        }

        const duplicate = await queries.isSOItemDuplicate(id, productId);
        if (duplicate) {
            return res
                .status(409)
                .json({
                    message:
                        "This product is already in the sale order. Edit the existing line item instead.",
                });
        }

        const itemId = await queries.addSOItem(
            id,
            productId,
            quantity,
            unitPrice,
        );
        await logAudit({
            businessId: order.BusinessID,
            actorId: userId,
            action: "ADD_SO_ITEM",
            entityType: "SaleOrder",
            entityId: id,
            details: `Added ${quantity} x "${product.ProductName}" at $${unitPrice} to sale order #${id}.`,
        });
        return res
            .status(201)
            .json({ message: "Item added to sale order.", itemId });
    }),

    updateItem: asyncHandler(async (req, res) => {
        const { id, itemId } = req.params;
        const { quantity, unitPrice } = req.body;
        const userId = req.user.userId;

        if (!quantity || unitPrice == null) {
            return res
                .status(400)
                .json({ message: "quantity and unitPrice are required." });
        }
        if (quantity <= 0) {
            return res
                .status(400)
                .json({ message: "Quantity must be greater than zero." });
        }
        if (unitPrice < 0) {
            return res
                .status(400)
                .json({ message: "Unit price cannot be negative." });
        }

        const order = await queries.getSOById(id);
        if (!order) {
            return res.status(404).json({ message: "Sale order not found." });
        }
        if (order.Status !== "Pending") {
            return res
                .status(409)
                .json({
                    message: `Cannot modify a ${order.Status} sale order.`,
                });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            order.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!SO_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message:
                        "Only Owner, Manager, or Warehouse Staff can modify sale orders.",
                });
        }

        const item = await queries.getSOItemById(itemId);
        if (!item || item.SOID !== Number(id)) {
            return res
                .status(404)
                .json({ message: "Item not found in this sale order." });
        }

        const stock = await queries.getInventoryItem(
            order.WarehouseID,
            item.ProductID,
        );
        const available = stock ? stock.Quantity : 0;
        if (available < quantity) {
            return res
                .status(400)
                .json({
                    message: `Insufficient stock. Available: ${available}, Requested: ${quantity}.`,
                });
        }

        await queries.updateSOItem(itemId, quantity, unitPrice);
        await logAudit({
            businessId: order.BusinessID,
            actorId: userId,
            action: "UPDATE_SO_ITEM",
            entityType: "SaleOrder",
            entityId: id,
            details: `Updated item #${itemId} in sale order #${id}: quantity ${quantity}, unit price $${unitPrice}.`,
        });
        return res.status(200).json({ message: "Item updated successfully." });
    }),

    removeItem: asyncHandler(async (req, res) => {
        const { id, itemId } = req.params;
        const userId = req.user.userId;

        const order = await queries.getSOById(id);
        if (!order) {
            return res.status(404).json({ message: "Sale order not found." });
        }
        if (order.Status !== "Pending") {
            return res
                .status(409)
                .json({
                    message: `Cannot modify a ${order.Status} sale order.`,
                });
        }

        const staffRecord = await queries.getStaffRecord(
            userId,
            order.BusinessID,
        );
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!SO_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message:
                        "Only Owner, Manager, or Warehouse Staff can modify sale orders.",
                });
        }

        const item = await queries.getSOItemById(itemId);
        if (!item || item.SOID !== Number(id)) {
            return res
                .status(404)
                .json({ message: "Item not found in this sale order." });
        }

        await queries.deleteSOItem(itemId);
        await logAudit({
            businessId: order.BusinessID,
            actorId: userId,
            action: "REMOVE_SO_ITEM",
            entityType: "SaleOrder",
            entityId: id,
            details: `Removed item #${itemId} from sale order #${id}.`,
        });
        return res
            .status(200)
            .json({ message: "Item removed from sale order." });
    }),
};

export default saleOrderControllers;
