import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "@/lib/api";

export const fetchEmployees = createAsyncThunk("employee/fetchAll", async (businessId, { rejectWithValue }) => {
    try { return await api.getEmployees(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const fetchPendingInvitesThunk = createAsyncThunk("employee/fetchInvites", async (businessId, { rejectWithValue }) => {
    try { return await api.getPendingInvites(businessId); }
    catch (e) { return rejectWithValue(e.message); }
});

export const inviteEmployeeThunk = createAsyncThunk("employee/invite", async (data, { rejectWithValue }) => {
    try { return await api.inviteEmployee(data); }
    catch (e) { return rejectWithValue(e.message); }
});

export const updateEmployeeRoleThunk = createAsyncThunk("employee/updateRole", async ({ staffId, roleId }, { rejectWithValue }) => {
    try { await api.updateEmployeeRole(staffId, { roleId }); return { staffId, roleId }; }
    catch (e) { return rejectWithValue(e.message); }
});

export const removeEmployeeThunk = createAsyncThunk("employee/remove", async (staffId, { rejectWithValue }) => {
    try { await api.removeEmployee(staffId); return staffId; }
    catch (e) { return rejectWithValue(e.message); }
});

const employeeSlice = createSlice({
    name: "employee",
    initialState: { employees: [], invites: [], loading: false, error: null },
    reducers: {
        clearEmployeeError(state) { state.error = null; },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchEmployees.pending, pending)
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                state.employees = action.payload.employees || [];
            })
            .addCase(fetchEmployees.rejected, rejected)

            .addCase(fetchPendingInvitesThunk.pending, pending)
            .addCase(fetchPendingInvitesThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.invites = action.payload.invites || [];
            })
            .addCase(fetchPendingInvitesThunk.rejected, rejected)

            .addCase(inviteEmployeeThunk.pending, pending)
            .addCase(inviteEmployeeThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(inviteEmployeeThunk.rejected, rejected)

            .addCase(updateEmployeeRoleThunk.pending, pending)
            .addCase(updateEmployeeRoleThunk.fulfilled, (state) => { state.loading = false; })
            .addCase(updateEmployeeRoleThunk.rejected, rejected)

            .addCase(removeEmployeeThunk.pending, pending)
            .addCase(removeEmployeeThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.employees = state.employees.filter((e) => e.StaffID !== action.payload);
            })
            .addCase(removeEmployeeThunk.rejected, rejected);
    },
});

export const { clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
