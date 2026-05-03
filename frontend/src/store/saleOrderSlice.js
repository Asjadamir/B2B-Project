import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchSaleOrders = createAsyncThunk("saleOrder/fetchAll", async (businessId, { rejectWithValue }) => {
    try { return await api.getSaleOrders(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const fetchSaleOrderById = createAsyncThunk("saleOrder/fetchById", async (id, { rejectWithValue }) => {
    try { return await api.getSaleOrderById(id); }
    catch (e) { return rejectWithValue(e.message); }
});

export const createSaleOrderThunk = createAsyncThunk("saleOrder/create", async (data, { rejectWithValue }) => {
    try { return await api.createSaleOrder(data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updateSaleOrderStatusThunk = createAsyncThunk("saleOrder/updateStatus", async ({ id, status }, { rejectWithValue }) => {
    try { await api.updateSaleOrderStatus(id, { status }); return { id, status }; }
    catch (e) { return rejectWithValue(e.message); }
});

const saleOrderSlice = createSlice({
    name: "saleOrder",
    initialState: { orders: [], currentOrder: null, loading: false, error: null },
    reducers: {
        clearSaleOrderError(state) { state.error = null; },
        clearCurrentSaleOrder(state) { state.currentOrder = null; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchSaleOrders.pending, pending)
            .addCase(fetchSaleOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.orders || [];
            })
            .addCase(fetchSaleOrders.rejected, rejected)

            .addCase(fetchSaleOrderById.pending, pending)
            .addCase(fetchSaleOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload.order;
            })
            .addCase(fetchSaleOrderById.rejected, rejected)

            .addCase(createSaleOrderThunk.pending, pending)
            .addCase(createSaleOrderThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(createSaleOrderThunk.rejected, rejected)

            .addCase(updateSaleOrderStatusThunk.pending, pending)
            .addCase(updateSaleOrderStatusThunk.fulfilled, (state, action) => {
                state.loading = false;
                const { id, status } = action.payload;
                const idx = state.orders.findIndex((o) => o.SOID === id);
                if (idx !== -1) state.orders[idx] = { ...state.orders[idx], Status: status };
                if (state.currentOrder?.SOID === id) state.currentOrder = { ...state.currentOrder, Status: status };
            })
            .addCase(updateSaleOrderStatusThunk.rejected, rejected);
    },
});

export const { clearSaleOrderError, clearCurrentSaleOrder } = saleOrderSlice.actions;
export default saleOrderSlice.reducer;
