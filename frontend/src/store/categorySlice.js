import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchCategories = createAsyncThunk("category/fetchAll", async (businessId, { rejectWithValue }) => {
    try { return await api.getCategories(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const createCategoryThunk = createAsyncThunk("category/create", async (data, { rejectWithValue }) => {
    try { return await api.createCategory(data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updateCategoryThunk = createAsyncThunk("category/update", async ({ id, data }, { rejectWithValue }) => {
    try { await api.updateCategory(id, data); return { id, data }; }
    catch (e) { return rejectWithValue(e.message); }
});

export const deleteCategoryThunk = createAsyncThunk("category/delete", async (id, { rejectWithValue }) => {
    try { await api.deleteCategory(id); return id; }
    catch (e) { return rejectWithValue(e.message); }
});

const categorySlice = createSlice({
    name: "category",
    initialState: { categories: [], loading: false, error: null },
    reducers: {
        clearCategoryError(state) { state.error = null; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchCategories.pending, pending)
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload.categories || [];
            })
            .addCase(fetchCategories.rejected, rejected)

            .addCase(createCategoryThunk.pending, pending)
            .addCase(createCategoryThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(createCategoryThunk.rejected, rejected)

            .addCase(updateCategoryThunk.pending, pending)
            .addCase(updateCategoryThunk.fulfilled, (state, action) => {
                state.loading = false;
                const { id, data } = action.payload;
                const idx = state.categories.findIndex((c) => c.CategoryID === id);
                if (idx !== -1) state.categories[idx] = { ...state.categories[idx], CategoryName: data.categoryName };
            })
            .addCase(updateCategoryThunk.rejected, rejected)

            .addCase(deleteCategoryThunk.pending, pending)
            .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = state.categories.filter((c) => c.CategoryID !== action.payload);
            })
            .addCase(deleteCategoryThunk.rejected, rejected);
    },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
