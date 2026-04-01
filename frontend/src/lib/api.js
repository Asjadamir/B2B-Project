const BASE = "/api";

async function request(method, path, body) {
    const res = await fetch(BASE + path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
}

// Auth
export const signup = (body) => request("POST", "/auth/signup", body);
export const login = (body) => request("POST", "/auth/login", body);
export const logout = () => request("POST", "/auth/logout");
export const forgotPassword = (body) => request("POST", "/auth/forgot-password", body);
export const resetPassword = (token, body) => request("POST", `/auth/reset-password/${token}`, body);
export const verifyEmail = (token) => request("GET", `/auth/verify-email/${token}`);

// Business
export const createBusiness = (body) => request("POST", "/business", body);
export const getMyBusinesses = () => request("GET", "/business/my");
export const getBusinessById = (id) => request("GET", `/business/${id}`);
export const updateBusiness = (id, body) => request("PUT", `/business/${id}`, body);
export const deleteBusiness = (id) => request("DELETE", `/business/${id}`);

// Supplier
export const getSuppliers = (businessId) => request("GET", `/supplier?businessId=${businessId}`);
export const getSupplierById = (id) => request("GET", `/supplier/${id}`);
export const createSupplier = (body) => request("POST", "/supplier", body);
export const updateSupplier = (id, body) => request("PUT", `/supplier/${id}`, body);
export const deleteSupplier = (id) => request("DELETE", `/supplier/${id}`);
