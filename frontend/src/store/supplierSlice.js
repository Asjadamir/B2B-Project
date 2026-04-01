import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchSuppliers = createAsyncThunk("supplier/fetchAll", async (businessId, { rejectWithValue }) => {
    try {
        return await api.getSuppliers(businessId);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const createSupplierThunk = createAsyncThunk("supplier/create", async (data, { rejectWithValue }) => {
    try {
        return await api.createSupplier(data);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const updateSupplierThunk = createAsyncThunk("supplier/update", async ({ id, data }, { rejectWithValue }) => {
    try {
        await api.updateSupplier(id, data);
        return { id, data };
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const deleteSupplierThunk = createAsyncThunk("supplier/delete", async (id, { rejectWithValue }) => {
    try {
        await api.deleteSupplier(id);
        return id;
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

const supplierSlice = createSlice({
    name: "supplier",
    initialState: {
        suppliers: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearSupplierError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchSuppliers.pending, pending)
            .addCase(fetchSuppliers.fulfilled, (state, action) => {
                state.loading = false;
                state.suppliers = action.payload.suppliers || [];
            })
            .addCase(fetchSuppliers.rejected, rejected)

            .addCase(createSupplierThunk.pending, pending)
            .addCase(createSupplierThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createSupplierThunk.rejected, rejected)

            .addCase(updateSupplierThunk.pending, pending)
            .addCase(updateSupplierThunk.fulfilled, (state, action) => {
                state.loading = false;
                const { id, data } = action.payload;
                const idx = state.suppliers.findIndex((s) => s.SupplierID === id);
                if (idx !== -1) {
                    state.suppliers[idx] = {
                        ...state.suppliers[idx],
                        SupplierName: data.supplierName,
                        ContactNumber: data.contactNumber,
                        Email: data.email,
                        Description: data.description,
                    };
                }
            })
            .addCase(updateSupplierThunk.rejected, rejected)

            .addCase(deleteSupplierThunk.pending, pending)
            .addCase(deleteSupplierThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.suppliers = state.suppliers.filter((s) => s.SupplierID !== action.payload);
            })
            .addCase(deleteSupplierThunk.rejected, rejected);
    },
});

export const { clearSupplierError } = supplierSlice.actions;
export default supplierSlice.reducer;
