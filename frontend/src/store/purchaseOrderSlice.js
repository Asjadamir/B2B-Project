import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchPurchaseOrders = createAsyncThunk("purchaseOrder/fetchAll", async (businessId, { rejectWithValue }) => {
    try { return await api.getPurchaseOrders(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const fetchPurchaseOrderById = createAsyncThunk("purchaseOrder/fetchById", async (id, { rejectWithValue }) => {
    try { return await api.getPurchaseOrderById(id); }
    catch (e) { return rejectWithValue(e.message); }
});

export const createPurchaseOrderThunk = createAsyncThunk("purchaseOrder/create", async (data, { rejectWithValue }) => {
    try { return await api.createPurchaseOrder(data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updatePurchaseOrderStatusThunk = createAsyncThunk("purchaseOrder/updateStatus", async ({ id, status }, { rejectWithValue }) => {
    try { await api.updatePurchaseOrderStatus(id, { status }); return { id, status }; }
    catch (e) { return rejectWithValue(e.message); }
});

const purchaseOrderSlice = createSlice({
    name: "purchaseOrder",
    initialState: { orders: [], currentOrder: null, loading: false, error: null },
    reducers: {
        clearPurchaseOrderError(state) { state.error = null; },
        clearCurrentOrder(state) { state.currentOrder = null; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchPurchaseOrders.pending, pending)
            .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.orders || [];
            })
            .addCase(fetchPurchaseOrders.rejected, rejected)

            .addCase(fetchPurchaseOrderById.pending, pending)
            .addCase(fetchPurchaseOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload.order;
            })
            .addCase(fetchPurchaseOrderById.rejected, rejected)

            .addCase(createPurchaseOrderThunk.pending, pending)
            .addCase(createPurchaseOrderThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(createPurchaseOrderThunk.rejected, rejected)

            .addCase(updatePurchaseOrderStatusThunk.pending, pending)
            .addCase(updatePurchaseOrderStatusThunk.fulfilled, (state, action) => {
                state.loading = false;
                const { id, status } = action.payload;
                const idx = state.orders.findIndex((o) => o.POID === id);
                if (idx !== -1) state.orders[idx] = { ...state.orders[idx], Status: status };
                if (state.currentOrder?.POID === id) state.currentOrder = { ...state.currentOrder, Status: status };
            })
            .addCase(updatePurchaseOrderStatusThunk.rejected, rejected);
    },
});

export const { clearPurchaseOrderError, clearCurrentOrder } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
