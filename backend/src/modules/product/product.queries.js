import sql from "mssql";

const productQueries = {
    getStaffRecord: async (userId, businessId) => {
        const request = new sql.Request();
        request.input("UserID", sql.Int, userId);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT s.*, r.RoleName FROM Staff s
            JOIN Roles r ON s.RoleID = r.RoleID
            WHERE s.UserID = @UserID AND s.BusinessID = @BusinessID AND s.IsActive = 1
        `);
        return result.recordset[0];
    },

    getProductsByBusiness: async (businessId) => {
        const request = new sql.Request();
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(`
            SELECT p.*, c.CategoryName
            FROM Product p
            JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.BusinessID = @BusinessID AND p.IsActive = 1
            ORDER BY p.ProductName
        `);
        return result.recordset;
    },

    getProductById: async (productId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(`
            SELECT p.*, c.CategoryName
            FROM Product p
            JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.ProductID = @ProductID
        `);
        return result.recordset[0];
    },

    getLinkedSuppliers: async (productId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        const result = await request.query(`
            SELECT s.SupplierID, s.SupplierName, s.ContactNumber, s.Email
            FROM Supplier s
            JOIN Product_Supplier ps ON s.SupplierID = ps.SupplierID
            WHERE ps.ProductID = @ProductID AND s.IsActive = 1
        `);
        return result.recordset;
    },

    findBySKU: async (sku, businessId) => {
        const request = new sql.Request();
        request.input("SKU", sql.VarChar(50), sku);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.query(
            "SELECT * FROM Product WHERE SKU = @SKU AND BusinessID = @BusinessID"
        );
        return result.recordset[0];
    },

    createProduct: async (productName, sku, categoryId, unitOfMeasure, sellingPrice, businessId) => {
        const request = new sql.Request();
        request.input("ProductName", sql.NVarChar(255), productName);
        request.input("SKU", sql.VarChar(50), sku);
        request.input("CategoryID", sql.Int, categoryId);
        request.input("UnitOfMeasure", sql.NVarChar(50), unitOfMeasure);
        request.input("SellingPrice", sql.Decimal(10, 2), sellingPrice);
        request.input("BusinessID", sql.Int, businessId);
        const result = await request.execute("sp_CreateProduct");
        return result.recordset[0].ProductID;
    },

    updateProduct: async (productId, productName, sku, categoryId, unitOfMeasure, sellingPrice) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        request.input("ProductName", sql.NVarChar(255), productName);
        request.input("SKU", sql.VarChar(50), sku);
        request.input("CategoryID", sql.Int, categoryId);
        request.input("UnitOfMeasure", sql.NVarChar(50), unitOfMeasure);
        request.input("SellingPrice", sql.Decimal(10, 2), sellingPrice);
        await request.execute("sp_UpdateProduct");
    },

    deactivateProduct: async (productId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        await request.query("UPDATE Product SET IsActive = 0 WHERE ProductID = @ProductID");
    },

    linkSupplier: async (productId, supplierId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        request.input("SupplierID", sql.Int, supplierId);
        await request.execute("sp_LinkSupplier");
    },

    unlinkSupplier: async (productId, supplierId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        request.input("SupplierID", sql.Int, supplierId);
        await request.execute("sp_UnlinkSupplier");
    },

    isSupplierLinked: async (productId, supplierId) => {
        const request = new sql.Request();
        request.input("ProductID", sql.Int, productId);
        request.input("SupplierID", sql.Int, supplierId);
        const result = await request.query(
            "SELECT TOP 1 1 AS Found FROM Product_Supplier WHERE ProductID = @ProductID AND SupplierID = @SupplierID"
        );
        return result.recordset.length > 0;
    },

    getSupplierById: async (supplierId) => {
        const request = new sql.Request();
        request.input("SupplierID", sql.Int, supplierId);
        const result = await request.query(
            "SELECT * FROM Supplier WHERE SupplierID = @SupplierID AND IsActive = 1"
        );
        return result.recordset[0];
    },

    getCategoryById: async (categoryId) => {
        const request = new sql.Request();
        request.input("CategoryID", sql.Int, categoryId);
        const result = await request.query(
            "SELECT * FROM Category WHERE CategoryID = @CategoryID"
        );
        return result.recordset[0];
    },
};

export default productQueries;
