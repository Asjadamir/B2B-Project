const productQueries = (db) => {
    return {
        // Check if user is active staff in a business (returns record with RoleName)
        getStaffRecord: async (userId, businessId) => {
            const [rows] = await db.execute(
                `SELECT s.*, r.RoleName FROM Staff s
                JOIN Roles r ON s.RoleID = r.RoleID
                WHERE s.UserID = ? AND s.BusinessID = ? AND s.IsActive = TRUE`,
                [userId, businessId],
            );
            return rows[0];
        },

        // Get all active products for a business, with category name
        getProductsByBusiness: async (businessId) => {
            const [rows] = await db.execute(
                `SELECT p.*, c.CategoryName
                FROM Product p
                JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE p.BusinessID = ? AND p.IsActive = TRUE
                ORDER BY p.ProductName`,
                [businessId],
            );
            return rows;
        },

        // Get a single product by ID (with category name and linked suppliers)
        getProductById: async (productId) => {
            const [rows] = await db.execute(
                `SELECT p.*, c.CategoryName
                FROM Product p
                JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE p.ProductID = ?`,
                [productId],
            );
            return rows[0];
        },

        // Get all suppliers linked to a product
        getLinkedSuppliers: async (productId) => {
            const [rows] = await db.execute(
                `SELECT s.SupplierID, s.SupplierName, s.ContactNumber, s.Email
                FROM Supplier s
                JOIN Product_Supplier ps ON s.SupplierID = ps.SupplierID
                WHERE ps.ProductID = ? AND s.IsActive = TRUE`,
                [productId],
            );
            return rows;
        },

        // Check SKU uniqueness within a business
        findBySKU: async (sku, businessId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Product WHERE SKU = ? AND BusinessID = ?`,
                [sku, businessId],
            );
            return rows[0];
        },

        // Create a new product
        createProduct: async (productName, sku, categoryId, unitOfMeasure, sellingPrice, businessId) => {
            const [result] = await db.execute(
                `INSERT INTO Product (ProductName, SKU, CategoryID, UnitOfMeasure, SellingPrice, BusinessID)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [productName, sku, categoryId, unitOfMeasure, sellingPrice, businessId],
            );
            return result.insertId;
        },

        // Update product details
        updateProduct: async (productId, productName, sku, categoryId, unitOfMeasure, sellingPrice) => {
            await db.execute(
                `UPDATE Product
                SET ProductName = ?, SKU = ?, CategoryID = ?, UnitOfMeasure = ?, SellingPrice = ?
                WHERE ProductID = ?`,
                [productName, sku, categoryId, unitOfMeasure, sellingPrice, productId],
            );
        },

        // Soft delete — deactivate product
        deactivateProduct: async (productId) => {
            await db.execute(
                `UPDATE Product SET IsActive = FALSE WHERE ProductID = ?`,
                [productId],
            );
        },

        // Link a supplier to a product
        linkSupplier: async (productId, supplierId) => {
            await db.execute(
                `INSERT INTO Product_Supplier (ProductID, SupplierID) VALUES (?, ?)`,
                [productId, supplierId],
            );
        },

        // Unlink a supplier from a product
        unlinkSupplier: async (productId, supplierId) => {
            await db.execute(
                `DELETE FROM Product_Supplier WHERE ProductID = ? AND SupplierID = ?`,
                [productId, supplierId],
            );
        },

        // Check if a supplier is already linked to a product
        isSupplierLinked: async (productId, supplierId) => {
            const [rows] = await db.execute(
                `SELECT 1 FROM Product_Supplier WHERE ProductID = ? AND SupplierID = ? LIMIT 1`,
                [productId, supplierId],
            );
            return rows.length > 0;
        },

        // Verify a supplier belongs to a given business
        getSupplierById: async (supplierId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Supplier WHERE SupplierID = ? AND IsActive = TRUE`,
                [supplierId],
            );
            return rows[0];
        },

        // Verify a category belongs to a given business
        getCategoryById: async (categoryId) => {
            const [rows] = await db.execute(
                `SELECT * FROM Category WHERE CategoryID = ?`,
                [categoryId],
            );
            return rows[0];
        },
    };
};

export default productQueries;
