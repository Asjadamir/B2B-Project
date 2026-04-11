import queries from "./warehouse.queries.js";

const MANAGING_ROLES = ["Owner", "Manager"];

const warehouseControllers = (pool) => {
    const {
        getStaffRecord,
        getWarehousesByBusiness,
        getWarehouseById,
        findByName,
        createWarehouse,
        updateWarehouse,
        deactivateWarehouse,
        hasPendingPurchaseOrders,
        hasPendingSaleOrders,
        getWarehouseStaff,
        getStaffWarehouses,
        isStaffAssigned,
        getStaffById,
        assignStaff,
        updateStaffWarehouseRole,
        removeStaff,
    } = queries(pool);

    return {
        // ── GET ALL WAREHOUSES ───────────────────────────────────────
        // GET /api/warehouse?businessId=1
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

                const warehouses = await getWarehousesByBusiness(businessId);
                return res.status(200).json({ warehouses });
            } catch (error) {
                console.error("Get warehouses error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET WAREHOUSE BY ID ──────────────────────────────────────
        // GET /api/warehouse/:id
        getById: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const warehouse = await getWarehouseById(id);
                if (!warehouse) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const staffRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                return res.status(200).json({ warehouse });
            } catch (error) {
                console.error("Get warehouse error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── CREATE WAREHOUSE ─────────────────────────────────────────
        // POST /api/warehouse
        create: async (req, res) => {
            try {
                const { businessId, warehouseName, address, city } = req.body;
                const userId = req.user.userId;

                if (!businessId || !warehouseName) {
                    return res.status(400).json({ message: "businessId and warehouseName are required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can create warehouses." });
                }

                const existing = await findByName(warehouseName.trim(), businessId);
                if (existing) {
                    return res.status(409).json({ message: "A warehouse with this name already exists." });
                }

                const warehouseId = await createWarehouse(
                    warehouseName.trim(),
                    address,
                    city,
                    businessId,
                );
                return res.status(201).json({ message: "Warehouse created successfully.", warehouseId });
            } catch (error) {
                console.error("Create warehouse error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE WAREHOUSE ─────────────────────────────────────────
        // PUT /api/warehouse/:id
        update: async (req, res) => {
            try {
                const { id } = req.params;
                const { warehouseName, address, city } = req.body;
                const userId = req.user.userId;

                if (!warehouseName) {
                    return res.status(400).json({ message: "warehouseName is required." });
                }

                const warehouse = await getWarehouseById(id);
                if (!warehouse || !warehouse.IsActive) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const staffRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can update warehouses." });
                }

                // Check name uniqueness — exclude current warehouse
                const existing = await findByName(warehouseName.trim(), warehouse.BusinessID);
                if (existing && existing.WarehouseID !== Number(id)) {
                    return res.status(409).json({ message: "A warehouse with this name already exists." });
                }

                await updateWarehouse(id, warehouseName.trim(), address, city);
                return res.status(200).json({ message: "Warehouse updated successfully." });
            } catch (error) {
                console.error("Update warehouse error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET WAREHOUSE STAFF ──────────────────────────────────────
        // GET /api/warehouse/:id/staff
        getStaff: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const warehouse = await getWarehouseById(id);
                if (!warehouse || !warehouse.IsActive) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const staffRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const staff = await getWarehouseStaff(id);
                return res.status(200).json({ staff });
            } catch (error) {
                console.error("Get warehouse staff error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET WAREHOUSES FOR A STAFF MEMBER ───────────────────────
        // GET /api/warehouse/staff/:staffId
        getStaffAssignments: async (req, res) => {
            try {
                const { staffId } = req.params;
                const userId = req.user.userId;

                const target = await getStaffById(staffId);
                if (!target) {
                    return res.status(404).json({ message: "Employee not found." });
                }

                const staffRecord = await getStaffRecord(userId, target.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const warehouses = await getStaffWarehouses(staffId);
                return res.status(200).json({ warehouses });
            } catch (error) {
                console.error("Get staff warehouses error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── ASSIGN STAFF TO WAREHOUSE ────────────────────────────────
        // POST /api/warehouse/:id/staff
        assignStaffToWarehouse: async (req, res) => {
            try {
                const { id } = req.params;
                const { staffId, roleId } = req.body;
                const userId = req.user.userId;

                if (!staffId || !roleId) {
                    return res.status(400).json({ message: "staffId and roleId are required." });
                }

                const warehouse = await getWarehouseById(id);
                if (!warehouse || !warehouse.IsActive) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const callerRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!callerRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can assign staff to warehouses." });
                }

                // Verify the staff member belongs to the same business
                const target = await getStaffById(staffId);
                if (!target || target.BusinessID !== warehouse.BusinessID) {
                    return res.status(400).json({ message: "Employee does not belong to this business." });
                }

                const alreadyAssigned = await isStaffAssigned(staffId, id);
                if (alreadyAssigned) {
                    return res.status(409).json({ message: "Employee is already assigned to this warehouse." });
                }

                await assignStaff(staffId, id, roleId);
                return res.status(201).json({ message: "Employee assigned to warehouse successfully." });
            } catch (error) {
                console.error("Assign staff error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE STAFF WAREHOUSE ROLE ──────────────────────────────
        // PATCH /api/warehouse/:id/staff/:staffId
        updateStaffRole: async (req, res) => {
            try {
                const { id, staffId } = req.params;
                const { roleId } = req.body;
                const userId = req.user.userId;

                if (!roleId) {
                    return res.status(400).json({ message: "roleId is required." });
                }

                const warehouse = await getWarehouseById(id);
                if (!warehouse || !warehouse.IsActive) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const callerRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!callerRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can update warehouse roles." });
                }

                const assigned = await isStaffAssigned(staffId, id);
                if (!assigned) {
                    return res.status(404).json({ message: "Employee is not assigned to this warehouse." });
                }

                await updateStaffWarehouseRole(staffId, id, roleId);
                return res.status(200).json({ message: "Warehouse role updated successfully." });
            } catch (error) {
                console.error("Update staff warehouse role error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── REMOVE STAFF FROM WAREHOUSE ──────────────────────────────
        // DELETE /api/warehouse/:id/staff/:staffId
        removeStaffFromWarehouse: async (req, res) => {
            try {
                const { id, staffId } = req.params;
                const userId = req.user.userId;

                const warehouse = await getWarehouseById(id);
                if (!warehouse || !warehouse.IsActive) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const callerRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!callerRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can remove staff from warehouses." });
                }

                const assigned = await isStaffAssigned(staffId, id);
                if (!assigned) {
                    return res.status(404).json({ message: "Employee is not assigned to this warehouse." });
                }

                await removeStaff(staffId, id);
                return res.status(200).json({ message: "Employee removed from warehouse successfully." });
            } catch (error) {
                console.error("Remove staff from warehouse error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── DEACTIVATE WAREHOUSE ─────────────────────────────────────
        // DELETE /api/warehouse/:id
        remove: async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.userId;

                const warehouse = await getWarehouseById(id);
                if (!warehouse || !warehouse.IsActive) {
                    return res.status(404).json({ message: "Warehouse not found." });
                }

                const staffRecord = await getStaffRecord(userId, warehouse.BusinessID);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can deactivate warehouses." });
                }

                // Block if warehouse has active pending orders
                if (await hasPendingPurchaseOrders(id)) {
                    return res.status(409).json({ message: "Cannot deactivate warehouse — it has pending purchase orders." });
                }
                if (await hasPendingSaleOrders(id)) {
                    return res.status(409).json({ message: "Cannot deactivate warehouse — it has pending sale orders." });
                }

                await deactivateWarehouse(id);
                return res.status(200).json({ message: "Warehouse deactivated successfully." });
            } catch (error) {
                console.error("Deactivate warehouse error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },
    };
};

export default warehouseControllers;
