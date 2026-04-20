import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchWarehouses = createAsyncThunk("warehouse/fetchAll", async (businessId, { rejectWithValue }) => {
    try { return await api.getWarehouses(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const fetchWarehouseByIdThunk = createAsyncThunk("warehouse/fetchById", async (id, { rejectWithValue }) => {
    try { return await api.getWarehouseById(id); }
    catch (e) { return rejectWithValue(e.message); }
});

export const createWarehouseThunk = createAsyncThunk("warehouse/create", async (data, { rejectWithValue }) => {
    try { return await api.createWarehouse(data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updateWarehouseThunk = createAsyncThunk("warehouse/update", async ({ id, data }, { rejectWithValue }) => {
    try { await api.updateWarehouse(id, data); return { id, data }; }
    catch (e) { return rejectWithValue(e.message); }
});

export const deleteWarehouseThunk = createAsyncThunk("warehouse/delete", async (id, { rejectWithValue }) => {
    try { await api.deleteWarehouse(id); return id; }
    catch (e) { return rejectWithValue(e.message); }
});

export const fetchWarehouseStaff = createAsyncThunk("warehouse/fetchStaff", async (warehouseId, { rejectWithValue }) => {
    try { return await api.getWarehouseStaff(warehouseId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const assignWarehouseStaffThunk = createAsyncThunk("warehouse/assignStaff", async ({ warehouseId, data }, { rejectWithValue }) => {
    try { return await api.assignWarehouseStaff(warehouseId, data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updateWarehouseStaffRoleThunk = createAsyncThunk("warehouse/updateStaffRole", async ({ warehouseId, staffId, roleId }, { rejectWithValue }) => {
    try { await api.updateWarehouseStaffRole(warehouseId, staffId, { roleId }); return { staffId, roleId }; }
    catch (e) { return rejectWithValue(e.message); }
});

export const removeWarehouseStaffThunk = createAsyncThunk("warehouse/removeStaff", async ({ warehouseId, staffId }, { rejectWithValue }) => {
    try { await api.removeWarehouseStaff(warehouseId, staffId); return staffId; }
    catch (e) { return rejectWithValue(e.message); }
});

const warehouseSlice = createSlice({
    name: "warehouse",
    initialState: { warehouses: [], currentWarehouse: null, warehouseStaff: [], loading: false, error: null },
    reducers: {
        clearWarehouseError(state) { state.error = null; },
        clearCurrentWarehouse(state) { state.currentWarehouse = null; state.warehouseStaff = []; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchWarehouses.pending, pending)
            .addCase(fetchWarehouses.fulfilled, (state, action) => {
                state.loading = false;
                state.warehouses = action.payload.warehouses || [];
            })
            .addCase(fetchWarehouses.rejected, rejected)

            .addCase(fetchWarehouseByIdThunk.pending, pending)
            .addCase(fetchWarehouseByIdThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.currentWarehouse = action.payload.warehouse;
            })
            .addCase(fetchWarehouseByIdThunk.rejected, rejected)

            .addCase(createWarehouseThunk.pending, pending)
            .addCase(createWarehouseThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(createWarehouseThunk.rejected, rejected)

            .addCase(updateWarehouseThunk.pending, pending)
            .addCase(updateWarehouseThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(updateWarehouseThunk.rejected, rejected)

            .addCase(deleteWarehouseThunk.pending, pending)
            .addCase(deleteWarehouseThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.warehouses = state.warehouses.filter((w) => w.WarehouseID !== action.payload);
            })
            .addCase(deleteWarehouseThunk.rejected, rejected)

            .addCase(fetchWarehouseStaff.pending, pending)
            .addCase(fetchWarehouseStaff.fulfilled, (state, action) => {
                state.loading = false;
                state.warehouseStaff = action.payload.staff || [];
            })
            .addCase(fetchWarehouseStaff.rejected, rejected)

            .addCase(assignWarehouseStaffThunk.pending, pending)
            .addCase(assignWarehouseStaffThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(assignWarehouseStaffThunk.rejected, rejected)

            .addCase(updateWarehouseStaffRoleThunk.pending, pending)
            .addCase(updateWarehouseStaffRoleThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(updateWarehouseStaffRoleThunk.rejected, rejected)

            .addCase(removeWarehouseStaffThunk.pending, pending)
            .addCase(removeWarehouseStaffThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.warehouseStaff = state.warehouseStaff.filter((s) => s.StaffID !== action.payload);
            })
            .addCase(removeWarehouseStaffThunk.rejected, rejected);
    },
});

export const { clearWarehouseError, clearCurrentWarehouse } = warehouseSlice.actions;
export default warehouseSlice.reducer;
