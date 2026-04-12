import queries from "./saleOrder.queries.js";

const SO_ROLES     = ["Owner", "Manager", "Warehouse Staff"];
const CANCEL_ROLES = ["Owner", "Manager"];

const saleOrderControllers = (pool) => {
    const {
        getStaffRecord,
        getWarehouseById,
        getProductsByWarehouse,
        getInventoryItem,
        getProductById,
        getSOsByBusiness,
        getSOById,
        getSOItems,
        getSOItemById,
        isSOItemDuplicate,
        createSO,
        addSOItem,
        updateSOItem,
        deleteSOItem,
        updateSOStatus,
        decrementInventory,
    } = queries(pool);

    return {
        // ── GET PRODUCTS AVAILABLE IN A WAREHOUSE ────────────────────
        // GET /api/sale-order/warehouse/:warehouseId/products?businessId=
        getWarehouseProducts: async (req, res) => {
            try {
                const { warehouseId } = req.params;
                const { businessId } = req.query;
                const userId = req.user.userId;

                if (!businessId) {
                    return res.status(400).json({ message: "businessId query param is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const warehouse = await getWarehouseById(warehouseId);
                if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const products = await getProductsByWarehouse(warehouseId, businessId);
                return res.status(200).json({ products });
            } catch (error) {
                console.error("Get warehouse products error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET ALL SALE ORDERS ──────────────────────────────────────
        // GET /api/sale-order?businessId=
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

                const orders = await getSOsByBusiness(businessId);
                return res.status(200).json({ orders });
            } catch (error) {
                console.error("Get sale orders error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET SALE ORDER BY ID ─────────────────────────────────────
        // GET /api/sale-order/:id
        getById: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const order = await getSOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Sale order not found." });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const items = await getSOItems(id);
                return res.status(200).json({ order: { ...order, items } });
            } catch (error) {
                console.error("Get sale order error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── CREATE SALE ORDER ────────────────────────────────────────
        // POST /api/sale-order
        // Body: { businessId, warehouseId, customerName, customerContact?,
        //         customerAddress?, items: [{ productId, quantity, unitPrice }] }
        create: async (req, res) => {
            try {
                const {
                    businessId, warehouseId,
                    customerName, customerContact, customerAddress,
                    items,
                } = req.body;
                const userId = req.user.userId;

                if (!businessId || !warehouseId || !customerName) {
                    return res.status(400).json({ message: "businessId, warehouseId, and customerName are required." });
                }
                if (!Array.isArray(items) || items.length === 0) {
                    return res.status(400).json({ message: "At least one item is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!SO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Warehouse Staff can create sale orders." });
                }

                // Validate warehouse belongs to this business
                const warehouse = await getWarehouseById(warehouseId);
                if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
                    return res.status(400).json({ message: "Invalid warehouse for this business." });
                }

                // Check for duplicate productIds in the items array
                const productIds = items.map((i) => i.productId);
                if (new Set(productIds).size !== productIds.length) {
                    return res.status(400).json({ message: "Duplicate products in items list. Combine them into a single line item." });
                }

                // Validate each line item
                for (const item of items) {
                    const { productId, quantity, unitPrice } = item;

                    if (!productId || !quantity || unitPrice == null) {
                        return res.status(400).json({ message: "Each item requires productId, quantity, and unitPrice." });
                    }
                    if (quantity <= 0) {
                        return res.status(400).json({ message: "Item quantity must be greater than zero." });
                    }
                    if (unitPrice < 0) {
                        return res.status(400).json({ message: "Item unit price cannot be negative." });
                    }

                    const product = await getProductById(productId);
                    if (!product || product.BusinessID !== Number(businessId)) {
                        return res.status(400).json({ message: `Product ${productId} does not belong to this business.` });
                    }

                    // Warn if product has no inventory record in this warehouse
                    const stock = await getInventoryItem(warehouseId, productId);
                    if (!stock || stock.Quantity < quantity) {
                        const available = stock ? stock.Quantity : 0;
                        return res.status(400).json({
                            message: `Insufficient stock for "${product.ProductName}". Available: ${available}, Requested: ${quantity}.`,
                        });
                    }
                }

                // Create SO then insert items
                const soId = await createSO(
                    businessId, warehouseId,
                    customerName.trim(), customerContact, customerAddress,
                    userId,
                );
                for (const item of items) {
                    await addSOItem(soId, item.productId, item.quantity, item.unitPrice);
                }

                return res.status(201).json({ message: "Sale order created successfully.", soId });
            } catch (error) {
                console.error("Create sale order error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE SALE ORDER STATUS ─────────────────────────────────
        // PATCH /api/sale-order/:id/status
        // Body: { status: "Fulfilled" | "Cancelled" }
        updateStatus: async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                const userId = req.user.userId;

                if (!status) {
                    return res.status(400).json({ message: "status is required." });
                }
                if (!["Fulfilled", "Cancelled"].includes(status)) {
                    return res.status(400).json({ message: "status must be 'Fulfilled' or 'Cancelled'." });
                }

                const order = await getSOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Sale order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot update a ${order.Status} sale order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                // ── Cancel ──────────────────────────────────────────
                if (status === "Cancelled") {
                    if (!CANCEL_ROLES.includes(staffRecord.RoleName)) {
                        return res.status(403).json({ message: "Only Owner or Manager can cancel sale orders." });
                    }
                    await updateSOStatus(id, "Cancelled");
                    return res.status(200).json({ message: "Sale order cancelled." });
                }

                // ── Fulfill ─────────────────────────────────────────
                if (!SO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Warehouse Staff can fulfill sale orders." });
                }

                const items = await getSOItems(id);
                if (items.length === 0) {
                    return res.status(400).json({ message: "Cannot fulfill a sale order with no items." });
                }

                // Check ALL items have sufficient stock before touching inventory
                for (const item of items) {
                    const stock = await getInventoryItem(order.WarehouseID, item.ProductID);
                    const available = stock ? stock.Quantity : 0;
                    if (available < item.Quantity) {
                        return res.status(400).json({
                            message: `Insufficient stock for "${item.ProductName}". Available: ${available}, Requested: ${item.Quantity}.`,
                        });
                    }
                }

                // All items passed — decrement inventory
                for (const item of items) {
                    await decrementInventory(order.WarehouseID, item.ProductID, item.Quantity);
                }

                await updateSOStatus(id, "Fulfilled");
                return res.status(200).json({ message: "Sale order fulfilled. Inventory updated." });
            } catch (error) {
                console.error("Update SO status error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── ADD ITEM TO SALE ORDER ───────────────────────────────────
        // POST /api/sale-order/:id/items
        addItem: async (req, res) => {
            try {
                const { id } = req.params;
                const { productId, quantity, unitPrice } = req.body;
                const userId = req.user.userId;

                if (!productId || !quantity || unitPrice == null) {
                    return res.status(400).json({ message: "productId, quantity, and unitPrice are required." });
                }
                if (quantity <= 0) {
                    return res.status(400).json({ message: "Quantity must be greater than zero." });
                }
                if (unitPrice < 0) {
                    return res.status(400).json({ message: "Unit price cannot be negative." });
                }

                const order = await getSOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Sale order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot modify a ${order.Status} sale order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!SO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Warehouse Staff can modify sale orders." });
                }

                const product = await getProductById(productId);
                if (!product || product.BusinessID !== order.BusinessID) {
                    return res.status(400).json({ message: "Invalid product for this business." });
                }

                const stock = await getInventoryItem(order.WarehouseID, productId);
                const available = stock ? stock.Quantity : 0;
                if (available < quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for "${product.ProductName}". Available: ${available}, Requested: ${quantity}.`,
                    });
                }

                const duplicate = await isSOItemDuplicate(id, productId);
                if (duplicate) {
                    return res.status(409).json({ message: "This product is already in the sale order. Edit the existing line item instead." });
                }

                const itemId = await addSOItem(id, productId, quantity, unitPrice);
                return res.status(201).json({ message: "Item added to sale order.", itemId });
            } catch (error) {
                console.error("Add SO item error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE SALE ORDER ITEM ───────────────────────────────────
        // PUT /api/sale-order/:id/items/:itemId
        updateItem: async (req, res) => {
            try {
                const { id, itemId } = req.params;
                const { quantity, unitPrice } = req.body;
                const userId = req.user.userId;

                if (!quantity || unitPrice == null) {
                    return res.status(400).json({ message: "quantity and unitPrice are required." });
                }
                if (quantity <= 0) {
                    return res.status(400).json({ message: "Quantity must be greater than zero." });
                }
                if (unitPrice < 0) {
                    return res.status(400).json({ message: "Unit price cannot be negative." });
                }

                const order = await getSOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Sale order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot modify a ${order.Status} sale order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!SO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Warehouse Staff can modify sale orders." });
                }

                const item = await getSOItemById(itemId);
                if (!item || item.SOID !== Number(id)) {
                    return res.status(404).json({ message: "Item not found in this sale order." });
                }

                // Check stock for the new quantity
                const stock = await getInventoryItem(order.WarehouseID, item.ProductID);
                const available = stock ? stock.Quantity : 0;
                if (available < quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock. Available: ${available}, Requested: ${quantity}.`,
                    });
                }

                await updateSOItem(itemId, quantity, unitPrice);
                return res.status(200).json({ message: "Item updated successfully." });
            } catch (error) {
                console.error("Update SO item error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── REMOVE ITEM FROM SALE ORDER ──────────────────────────────
        // DELETE /api/sale-order/:id/items/:itemId
        removeItem: async (req, res) => {
            try {
                const { id, itemId } = req.params;
                const userId = req.user.userId;

                const order = await getSOById(id);
                if (!order) {
                    return res.status(404).json({ message: "Sale order not found." });
                }
                if (order.Status !== "Pending") {
                    return res.status(409).json({ message: `Cannot modify a ${order.Status} sale order.` });
                }

                const staffRecord = await getStaffRecord(userId, order.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!SO_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner, Manager, or Warehouse Staff can modify sale orders." });
                }

                const item = await getSOItemById(itemId);
                if (!item || item.SOID !== Number(id)) {
                    return res.status(404).json({ message: "Item not found in this sale order." });
                }

                await deleteSOItem(itemId);
                return res.status(200).json({ message: "Item removed from sale order." });
            } catch (error) {
                console.error("Remove SO item error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },
    };
};

export default saleOrderControllers;
