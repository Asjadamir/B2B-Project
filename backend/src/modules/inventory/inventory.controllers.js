import queries from "./inventory.queries.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sql from "mssql";

const MANAGE_ROLES = ["Owner", "Manager"];

const inventoryControllers = {
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

        const inventory = await queries.getInventoryByBusiness(businessId);
        return res.status(200).json({ inventory });
    }),

    adjust: asyncHandler(async (req, res) => {
        const { businessId, warehouseId, productId, newQuantity } = req.body;
        const userId = req.user.userId;

        if (
            !businessId ||
            !warehouseId ||
            productId == null ||
            newQuantity == null
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "businessId, warehouseId, productId, and newQuantity are required.",
                });
        }
        if (newQuantity < 0) {
            return res
                .status(400)
                .json({ message: "Quantity cannot be negative." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGE_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message: "Only Owner or Manager can adjust inventory.",
                });
        }

        const warehouse = await queries.getWarehouseById(warehouseId);
        if (!warehouse || warehouse.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid warehouse for this business." });
        }

        const product = await queries.getProductById(productId);
        if (!product || product.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid product for this business." });
        }

        const current = await queries.getInventoryItem(warehouseId, productId);
        const oldQty = current ? current.Quantity : 0;

        const request = new sql.Request();
        request.input("ActorID", sql.Int, userId);
        await request.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        await queries.adjustStock(warehouseId, productId, newQuantity);

        return res
            .status(200)
            .json({ message: "Inventory adjusted successfully." });
    }),

    transfer: asyncHandler(async (req, res) => {
        const {
            businessId,
            fromWarehouseId,
            toWarehouseId,
            productId,
            quantity,
        } = req.body;
        const userId = req.user.userId;

        if (
            !businessId ||
            !fromWarehouseId ||
            !toWarehouseId ||
            !productId ||
            !quantity
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "businessId, fromWarehouseId, toWarehouseId, productId, and quantity are required.",
                });
        }
        if (quantity <= 0) {
            return res
                .status(400)
                .json({
                    message: "Transfer quantity must be greater than zero.",
                });
        }
        if (Number(fromWarehouseId) === Number(toWarehouseId)) {
            return res
                .status(400)
                .json({
                    message:
                        "Source and destination warehouses must be different.",
                });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGE_ROLES.includes(staffRecord.RoleName)) {
            return res
                .status(403)
                .json({
                    message: "Only Owner or Manager can transfer inventory.",
                });
        }

        const fromWH = await queries.getWarehouseById(fromWarehouseId);
        if (!fromWH || fromWH.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid source warehouse." });
        }

        const toWH = await queries.getWarehouseById(toWarehouseId);
        if (!toWH || toWH.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid destination warehouse." });
        }

        const product = await queries.getProductById(productId);
        if (!product || product.BusinessID !== Number(businessId)) {
            return res
                .status(400)
                .json({ message: "Invalid product for this business." });
        }

        const sourceStock = await queries.getInventoryItem(
            fromWarehouseId,
            productId,
        );
        const available = sourceStock ? sourceStock.Quantity : 0;
        if (available < quantity) {
            return res
                .status(400)
                .json({
                    message: `Insufficient stock in "${fromWH.WarehouseName}". Available: ${available}, Requested: ${quantity}.`,
                });
        }

        const request = new sql.Request();
        request.input("ActorID", sql.Int, userId);
        await request.query(
            "EXEC sp_set_session_context @key = N'actor_id', @value = @ActorID",
        );

        await queries.decrementStock(fromWarehouseId, productId, quantity);
        await queries.incrementStock(toWarehouseId, productId, quantity);

        return res
            .status(200)
            .json({ message: "Stock transferred successfully." });
    }),
};

export default inventoryControllers;
