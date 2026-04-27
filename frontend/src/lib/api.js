const BASE = "http://localhost:5000/api";

async function request(method, path, body) {

    console.log(body);
    const res = await fetch(BASE + path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok){
        throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
}

// Auth
export const signup = (body) => request("POST", "/auth/signup", body);
export const login = (body) => request("POST", "/auth/login", body);
export const logout = () => request("POST", "/auth/logout");
export const forgotPassword = (body) =>
    request("POST", "/auth/forgot-password", body);
export const resetPassword = (token, body) =>
    request("POST", `/auth/reset-password/${token}`, body);
export const verifyEmail = (token) =>
    request("GET", `/auth/verify-email/${token}`);

// Business
export const createBusiness = (body) => request("POST", "/business", body);
export const getMyBusinesses = () => request("GET", "/business/my");
export const getBusinessById = (id) => request("GET", `/business/${id}`);
export const updateBusiness = (id, body) =>
    request("PUT", `/business/${id}`, body);
export const deleteBusiness = (id) => request("DELETE", `/business/${id}`);

// Supplier
export const getSuppliers = (businessId) =>
    request("GET", `/supplier?businessId=${businessId}`);
export const getSupplierById = (id) => request("GET", `/supplier/${id}`);
export const createSupplier = (body) => request("POST", "/supplier", body);
export const updateSupplier = (id, body) =>
    request("PUT", `/supplier/${id}`, body);
export const deleteSupplier = (id) => request("DELETE", `/supplier/${id}`);

// Product
export const getProducts = (businessId) =>
    request("GET", `/product?businessId=${businessId}`);
export const getProductById = (id) => request("GET", `/product/${id}`);
export const createProduct = (body) => request("POST", "/product", body);
export const updateProduct = (id, body) =>
    request("PUT", `/product/${id}`, body);
export const deleteProduct = (id) => request("DELETE", `/product/${id}`);
export const linkProductSupplier = (productId, body) =>
    request("POST", `/product/${productId}/suppliers`, body);
export const unlinkProductSupplier = (productId, supplierId) =>
    request("DELETE", `/product/${productId}/suppliers/${supplierId}`);

// Category
export const getCategories = (businessId) =>
    request("GET", `/category?businessId=${businessId}`);
export const createCategory = (body) => request("POST", "/category", body);
export const updateCategory = (id, body) =>
    request("PUT", `/category/${id}`, body);
export const deleteCategory = (id) => request("DELETE", `/category/${id}`);

// Employee
export const getEmployees = (businessId) =>
    request("GET", `/employee?businessId=${businessId}`);
export const getPendingInvites = (businessId) =>
    request("GET", `/employee/invites?businessId=${businessId}`);
export const inviteEmployee = (body) =>
    request("POST", "/employee/invite", body);
export const updateEmployeeRole = (staffId, body) =>
    request("PATCH", `/employee/${staffId}/role`, body);
export const removeEmployee = (staffId) =>
    request("DELETE", `/employee/${staffId}`);

// Warehouse
export const getWarehouses = (businessId) =>
    request("GET", `/warehouse?businessId=${businessId}`);
export const getWarehouseById = (id) => request("GET", `/warehouse/${id}`);
export const createWarehouse = (body) => request("POST", "/warehouse", body);
export const updateWarehouse = (id, body) =>
    request("PUT", `/warehouse/${id}`, body);
export const deleteWarehouse = (id) => request("DELETE", `/warehouse/${id}`);
export const getWarehouseStaff = (warehouseId) =>
    request("GET", `/warehouse/${warehouseId}/staff`);
export const assignWarehouseStaff = (warehouseId, body) =>
    request("POST", `/warehouse/${warehouseId}/staff`, body);
export const updateWarehouseStaffRole = (warehouseId, staffId, body) =>
    request("PATCH", `/warehouse/${warehouseId}/staff/${staffId}`, body);
export const removeWarehouseStaff = (warehouseId, staffId) =>
    request("DELETE", `/warehouse/${warehouseId}/staff/${staffId}`);

// Purchase Order
export const getPurchaseOrders = (businessId) =>
    request("GET", `/purchaseorder?businessId=${businessId}`);
export const getPurchaseOrderById = (id) =>
    request("GET", `/purchaseorder/${id}`);
export const createPurchaseOrder = (body) =>
    request("POST", "/purchaseorder", body);
export const updatePurchaseOrderStatus = (id, body) =>
    request("PATCH", `/purchaseorder/${id}/status`, body);
export const getSupplierProducts = (supplierId, businessId) =>
    request(
        "GET",
        `/purchaseorder/supplier/${supplierId}/products?businessId=${businessId}`,
    );

// Sale Order
export const getSaleOrders = (businessId) =>
    request("GET", `/saleorder?businessId=${businessId}`);
export const getSaleOrderById = (id) => request("GET", `/saleorder/${id}`);
export const createSaleOrder = (body) => request("POST", "/saleorder", body);
export const updateSaleOrderStatus = (id, body) =>
    request("PATCH", `/saleorder/${id}/status`, body);
export const getWarehouseProducts = (warehouseId, businessId) =>
    request(
        "GET",
        `/saleorder/warehouse/${warehouseId}/products?businessId=${businessId}`,
    );

// Audit Log
export const getAuditLogs = (params) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/auditlog?${q}`);
};
