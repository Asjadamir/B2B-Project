import queries from "./warehouse.queries.js";
import logAudit from "../../utils/audit.js";
import asyncHandler from "../../utils/asyncHandler.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const warehouseControllers = {
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

        const warehouses = await queries.getWarehousesByBusiness(businessId);
        return res.status(200).json({ warehouses });
    }),

    getById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        return res.status(200).json({ warehouse });
    }),

    create: asyncHandler(async (req, res) => {
        const { businessId, warehouseName, address, city } = req.body;
        const userId = req.user.userId;

        if (!businessId || !warehouseName) {
            return res.status(400).json({ message: "businessId and warehouseName are required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can create warehouses." });
        }

        const existing = await queries.findByName(warehouseName.trim(), businessId);
        if (existing) {
            return res.status(409).json({ message: "A warehouse with this name already exists." });
        }

        const warehouseId = await queries.createWarehouse(warehouseName.trim(), address, city, businessId);
        await logAudit({ businessId, actorId: userId, action: "CREATE_WAREHOUSE", entityType: "Warehouse", entityId: warehouseId, details: `Created warehouse "${warehouseName}".` });
        return res.status(201).json({ message: "Warehouse created successfully.", warehouseId });
    }),

    update: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { warehouseName, address, city } = req.body;
        const userId = req.user.userId;

        if (!warehouseName) {
            return res.status(400).json({ message: "warehouseName is required." });
        }

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse || !warehouse.IsActive) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can update warehouses." });
        }

        const existing = await queries.findByName(warehouseName.trim(), warehouse.BusinessID);
        if (existing && existing.WarehouseID !== Number(id)) {
            return res.status(409).json({ message: "A warehouse with this name already exists." });
        }

        await queries.updateWarehouse(id, warehouseName.trim(), address, city);
        await logAudit({ businessId: warehouse.BusinessID, actorId: userId, action: "UPDATE_WAREHOUSE", entityType: "Warehouse", entityId: id, details: `Updated warehouse "${warehouse.WarehouseName}" to "${warehouseName}".` });
        return res.status(200).json({ message: "Warehouse updated successfully." });
    }),

    remove: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse || !warehouse.IsActive) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can deactivate warehouses." });
        }

        if (await queries.hasPendingPurchaseOrders(id)) {
            return res.status(409).json({ message: "Cannot deactivate warehouse — it has pending purchase orders." });
        }
        if (await queries.hasPendingSaleOrders(id)) {
            return res.status(409).json({ message: "Cannot deactivate warehouse — it has pending sale orders." });
        }

        await queries.deactivateWarehouse(id);
        await logAudit({ businessId: warehouse.BusinessID, actorId: userId, action: "DEACTIVATE_WAREHOUSE", entityType: "Warehouse", entityId: id, details: `Deactivated warehouse "${warehouse.WarehouseName}".` });
        return res.status(200).json({ message: "Warehouse deactivated successfully." });
    }),

    getStaff: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse || !warehouse.IsActive) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const staff = await queries.getWarehouseStaff(id);
        return res.status(200).json({ staff });
    }),

    getStaffAssignments: asyncHandler(async (req, res) => {
        const { staffId } = req.params;
        const userId = req.user.userId;

        const target = await queries.getStaffById(staffId);
        if (!target) {
            return res.status(404).json({ message: "Employee not found." });
        }

        const staffRecord = await queries.getStaffRecord(userId, target.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const warehouses = await queries.getStaffWarehouses(staffId);
        return res.status(200).json({ warehouses });
    }),

    assignStaffToWarehouse: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { staffId, roleId } = req.body;
        const userId = req.user.userId;

        if (!staffId || !roleId) {
            return res.status(400).json({ message: "staffId and roleId are required." });
        }

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse || !warehouse.IsActive) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const callerRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!callerRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can assign staff to warehouses." });
        }

        const target = await queries.getStaffById(staffId);
        if (!target || target.BusinessID !== warehouse.BusinessID) {
            return res.status(400).json({ message: "Employee does not belong to this business." });
        }

        const alreadyAssigned = await queries.isStaffAssigned(staffId, id);
        if (alreadyAssigned) {
            return res.status(409).json({ message: "Employee is already assigned to this warehouse." });
        }

        await queries.assignStaff(staffId, id, roleId);
        await logAudit({ businessId: warehouse.BusinessID, actorId: userId, action: "ASSIGN_STAFF", entityType: "Warehouse", entityId: id, details: `Assigned staff #${staffId} to warehouse "${warehouse.WarehouseName}".` });
        return res.status(201).json({ message: "Employee assigned to warehouse successfully." });
    }),

    updateStaffRole: asyncHandler(async (req, res) => {
        const { id, staffId } = req.params;
        const { roleId } = req.body;
        const userId = req.user.userId;

        if (!roleId) {
            return res.status(400).json({ message: "roleId is required." });
        }

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse || !warehouse.IsActive) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const callerRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!callerRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can update warehouse roles." });
        }

        const assigned = await queries.isStaffAssigned(staffId, id);
        if (!assigned) {
            return res.status(404).json({ message: "Employee is not assigned to this warehouse." });
        }

        await queries.updateStaffWarehouseRole(staffId, id, roleId);
        await logAudit({ businessId: warehouse.BusinessID, actorId: userId, action: "UPDATE_STAFF_ROLE", entityType: "Warehouse", entityId: id, details: `Updated warehouse role for staff #${staffId} in "${warehouse.WarehouseName}".` });
        return res.status(200).json({ message: "Warehouse role updated successfully." });
    }),

    removeStaffFromWarehouse: asyncHandler(async (req, res) => {
        const { id, staffId } = req.params;
        const userId = req.user.userId;

        const warehouse = await queries.getWarehouseById(id);
        if (!warehouse || !warehouse.IsActive) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        const callerRecord = await queries.getStaffRecord(userId, warehouse.BusinessID);
        if (!callerRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can remove staff from warehouses." });
        }

        const assigned = await queries.isStaffAssigned(staffId, id);
        if (!assigned) {
            return res.status(404).json({ message: "Employee is not assigned to this warehouse." });
        }

        await queries.removeStaff(staffId, id);
        await logAudit({ businessId: warehouse.BusinessID, actorId: userId, action: "REMOVE_STAFF", entityType: "Warehouse", entityId: id, details: `Removed staff #${staffId} from warehouse "${warehouse.WarehouseName}".` });
        return res.status(200).json({ message: "Employee removed from warehouse successfully." });
    }),
};

export default warehouseControllers;
