import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchMyBusinesses = createAsyncThunk("business/fetchMy", async (_, { rejectWithValue }) => {
    try {
        return await api.getMyBusinesses();
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const fetchBusinessById = createAsyncThunk("business/fetchById", async (id, { rejectWithValue }) => {
    try {
        return await api.getBusinessById(id);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const createBusinessThunk = createAsyncThunk("business/create", async (data, { rejectWithValue }) => {
    try {
        return await api.createBusiness(data);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const updateBusinessThunk = createAsyncThunk("business/update", async ({ id, data }, { rejectWithValue }) => {
    try {
        await api.updateBusiness(id, data);
        return { id, data };
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const deleteBusinessThunk = createAsyncThunk("business/delete", async (id, { rejectWithValue }) => {
    try {
        await api.deleteBusiness(id);
        return id;
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

const businessSlice = createSlice({
    name: "business",
    initialState: {
        businesses: [],
        currentBusiness: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearBusinessError(state) {
            state.error = null;
        },
        clearCurrentBusiness(state) {
            state.currentBusiness = null;
        },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchMyBusinesses.pending, pending)
            .addCase(fetchMyBusinesses.fulfilled, (state, action) => {
                state.loading = false;
                state.businesses = action.payload.businesses || [];
            })
            .addCase(fetchMyBusinesses.rejected, rejected)

            .addCase(fetchBusinessById.pending, pending)
            .addCase(fetchBusinessById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBusiness = action.payload.business;
            })
            .addCase(fetchBusinessById.rejected, rejected)

            .addCase(createBusinessThunk.pending, pending)
            .addCase(createBusinessThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createBusinessThunk.rejected, rejected)

            .addCase(updateBusinessThunk.pending, pending)
            .addCase(updateBusinessThunk.fulfilled, (state, action) => {
                state.loading = false;
                const { id, data } = action.payload;
                const idx = state.businesses.findIndex((b) => b.BusinessID === id);
                if (idx !== -1) {
                    state.businesses[idx] = { ...state.businesses[idx], BusinessName: data.businessName, Description: data.description };
                }
                if (state.currentBusiness?.BusinessID === id) {
                    state.currentBusiness = { ...state.currentBusiness, BusinessName: data.businessName, Description: data.description };
                }
            })
            .addCase(updateBusinessThunk.rejected, rejected)

            .addCase(deleteBusinessThunk.pending, pending)
            .addCase(deleteBusinessThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.businesses = state.businesses.filter((b) => b.BusinessID !== action.payload);
            })
            .addCase(deleteBusinessThunk.rejected, rejected);
    },
});

export const { clearBusinessError, clearCurrentBusiness } = businessSlice.actions;
export default businessSlice.reducer;
