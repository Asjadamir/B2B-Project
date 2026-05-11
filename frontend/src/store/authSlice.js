import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const loginThunk = createAsyncThunk("auth/login", async (creds, { rejectWithValue }) => {
    try {
        return await api.login(creds);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const signupThunk = createAsyncThunk("auth/signup", async (data, { rejectWithValue }) => {
    try {
        return await api.signup(data);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const logoutThunk = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
    try {
        return await api.logout();
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const forgotPasswordThunk = createAsyncThunk("auth/forgotPassword", async (data, { rejectWithValue }) => {
    try {
        return await api.forgotPassword(data);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const resetPasswordThunk = createAsyncThunk("auth/resetPassword", async ({ token, password }, { rejectWithValue }) => {
    try {
        return await api.resetPassword(token, { password });
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const verifyEmailThunk = createAsyncThunk("auth/verifyEmail", async (token, { rejectWithValue }) => {
    try {
        return await api.verifyEmail(token);
    } catch (e) {
        return rejectWithValue(e.message);
    }
});

export const checkAuthThunk = createAsyncThunk("auth/check", async (_, { rejectWithValue }) => {
    try {
        return await api.getMe();
    } catch (e) {
        return rejectWithValue(e.status === 401);
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        initializing: true,
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        clearAuthStatus(state) {
            state.error = null;
            state.successMessage = null;
        },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; state.successMessage = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(loginThunk.pending, pending)
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data;
            })
            .addCase(loginThunk.rejected, rejected)

            .addCase(signupThunk.pending, pending)
            .addCase(signupThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(signupThunk.rejected, rejected)

            .addCase(logoutThunk.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
            })

            .addCase(forgotPasswordThunk.pending, pending)
            .addCase(forgotPasswordThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(forgotPasswordThunk.rejected, rejected)

            .addCase(resetPasswordThunk.pending, pending)
            .addCase(resetPasswordThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(resetPasswordThunk.rejected, rejected)

            .addCase(verifyEmailThunk.pending, pending)
            .addCase(verifyEmailThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                state.user = action.payload.data;
            })
            .addCase(verifyEmailThunk.rejected, rejected)

            .addCase(checkAuthThunk.fulfilled, (state, action) => {
                state.user = action.payload.data;
                state.initializing = false;
            })
            .addCase(checkAuthThunk.rejected, (state) => {
                state.user = null;
                state.initializing = false;
            });
    },
});

export const { clearAuthStatus } = authSlice.actions;
export default authSlice.reducer;
