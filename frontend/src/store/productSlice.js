import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchProducts = createAsyncThunk("product/fetchAll", async (businessId, { rejectWithValue }) => {
    try { return await api.getProducts(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const createProductThunk = createAsyncThunk("product/create", async (data, { rejectWithValue }) => {
    try { return await api.createProduct(data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updateProductThunk = createAsyncThunk("product/update", async ({ id, data }, { rejectWithValue }) => {
    try { await api.updateProduct(id, data); return { id, data }; }
    catch (e) { return rejectWithValue(e.message); }
});

export const deleteProductThunk = createAsyncThunk("product/delete", async (id, { rejectWithValue }) => {
    try { await api.deleteProduct(id); return id; }
    catch (e) { return rejectWithValue(e.message); }
});

export const linkSupplierThunk = createAsyncThunk("product/linkSupplier", async ({ productId, supplierId }, { rejectWithValue }) => {
    try { await api.linkProductSupplier(productId, { supplierId }); }
    catch (e) { return rejectWithValue(e.message); }
});

export const unlinkSupplierThunk = createAsyncThunk("product/unlinkSupplier", async ({ productId, supplierId }, { rejectWithValue }) => {
    try { await api.unlinkProductSupplier(productId, supplierId); }
    catch (e) { return rejectWithValue(e.message); }
});

const productSlice = createSlice({
    name: "product",
    initialState: { products: [], loading: false, error: null },
    reducers: {
        clearProductError(state) { state.error = null; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchProducts.pending, pending)
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.products || [];
            })
            .addCase(fetchProducts.rejected, rejected)

            .addCase(createProductThunk.pending, pending)
            .addCase(createProductThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(createProductThunk.rejected, rejected)

            .addCase(updateProductThunk.pending, pending)
            .addCase(updateProductThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(updateProductThunk.rejected, rejected)

            .addCase(deleteProductThunk.pending, pending)
            .addCase(deleteProductThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.products = state.products.filter((p) => p.ProductID !== action.payload);
            })
            .addCase(deleteProductThunk.rejected, rejected);
    },
});

export const { clearProductError } = productSlice.actions;
export default productSlice.reducer;
