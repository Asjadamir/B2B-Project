import { body, query, validationResult } from "express-validator";

// ── Shared middleware ────────────────────────────────────────────────────────
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authValidator = {
    registerRules: [
        body("email").isEmail().withMessage("Invalid email format."),
        body("password")
            .isStrongPassword()
            .withMessage(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.",
            ),
        body("fullName")
            .trim()
            .isLength({ min: 3, max: 20 })
            .withMessage(
                "Full name must be at least 3 characters long and not exceed 20 characters.",
            ),
    ],

    loginRules: [
        body("email").isEmail().withMessage("Invalid email format."),
        body("password").notEmpty().withMessage("Password is required."),
    ],

    resetPasswordRules: [
        body("password")
            .isStrongPassword()
            .withMessage(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.",
            ),
    ],

    forgotPasswordRules: [
        body("email").isEmail().withMessage("Invalid email format."),
    ],
};

// ── Business ─────────────────────────────────────────────────────────────────
export const businessValidator = {
    createRules: [
        body("businessName")
            .trim()
            .notEmpty().withMessage("Business name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Business name must be between 2 and 100 characters."),
        body("description")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 500 }).withMessage("Description must not exceed 500 characters."),
    ],

    updateRules: [
        body("businessName")
            .trim()
            .notEmpty().withMessage("Business name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Business name must be between 2 and 100 characters."),
        body("description")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 500 }).withMessage("Description must not exceed 500 characters."),
    ],
};

// ── Employee ──────────────────────────────────────────────────────────────────
export const employeeValidator = {
    sendInviteRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("email")
            .isEmail().withMessage("A valid email address is required."),
        body("roleId")
            .notEmpty().withMessage("roleId is required.")
            .isInt({ gt: 0 }).withMessage("roleId must be a positive integer."),
    ],

    acceptInviteRules: [
        body("password")
            .notEmpty().withMessage("Password is required."),
        body("fullName")
            .optional()
            .trim()
            .isLength({ min: 3, max: 50 }).withMessage("Full name must be between 3 and 50 characters."),
    ],

    updateRoleRules: [
        body("roleId")
            .notEmpty().withMessage("roleId is required.")
            .isInt({ gt: 0 }).withMessage("roleId must be a positive integer."),
    ],

    leaveRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
    ],
};

// ── Category ──────────────────────────────────────────────────────────────────
export const categoryValidator = {
    createRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("categoryName")
            .trim()
            .notEmpty().withMessage("Category name is required.")
            .isLength({ min: 2, max: 50 }).withMessage("Category name must be between 2 and 50 characters."),
    ],

    updateRules: [
        body("categoryName")
            .trim()
            .notEmpty().withMessage("Category name is required.")
            .isLength({ min: 2, max: 50 }).withMessage("Category name must be between 2 and 50 characters."),
    ],
};

// ── Supplier ──────────────────────────────────────────────────────────────────
export const supplierValidator = {
    createRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("supplierName")
            .trim()
            .notEmpty().withMessage("Supplier name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Supplier name must be between 2 and 100 characters."),
        body("email")
            .optional({ nullable: true, checkFalsy: true })
            .isEmail().withMessage("Invalid email format."),
        body("contactNumber")
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isLength({ max: 20 }).withMessage("Contact number must not exceed 20 characters."),
        body("description")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 500 }).withMessage("Description must not exceed 500 characters."),
    ],

    updateRules: [
        body("supplierName")
            .trim()
            .notEmpty().withMessage("Supplier name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Supplier name must be between 2 and 100 characters."),
        body("email")
            .optional({ nullable: true, checkFalsy: true })
            .isEmail().withMessage("Invalid email format."),
        body("contactNumber")
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isLength({ max: 20 }).withMessage("Contact number must not exceed 20 characters."),
        body("description")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 500 }).withMessage("Description must not exceed 500 characters."),
    ],
};

// ── Warehouse ─────────────────────────────────────────────────────────────────
export const warehouseValidator = {
    createRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("warehouseName")
            .trim()
            .notEmpty().withMessage("Warehouse name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Warehouse name must be between 2 and 100 characters."),
        body("address")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 255 }).withMessage("Address must not exceed 255 characters."),
        body("city")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 100 }).withMessage("City must not exceed 100 characters."),
    ],

    updateRules: [
        body("warehouseName")
            .trim()
            .notEmpty().withMessage("Warehouse name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Warehouse name must be between 2 and 100 characters."),
        body("address")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 255 }).withMessage("Address must not exceed 255 characters."),
        body("city")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 100 }).withMessage("City must not exceed 100 characters."),
    ],

    assignStaffRules: [
        body("staffId")
            .notEmpty().withMessage("staffId is required.")
            .isInt({ gt: 0 }).withMessage("staffId must be a positive integer."),
        body("roleId")
            .notEmpty().withMessage("roleId is required.")
            .isInt({ gt: 0 }).withMessage("roleId must be a positive integer."),
    ],

    updateStaffRoleRules: [
        body("roleId")
            .notEmpty().withMessage("roleId is required.")
            .isInt({ gt: 0 }).withMessage("roleId must be a positive integer."),
    ],
};

// ── Product ───────────────────────────────────────────────────────────────────
export const productValidator = {
    createRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("productName")
            .trim()
            .notEmpty().withMessage("Product name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Product name must be between 2 and 100 characters."),
        body("sku")
            .trim()
            .notEmpty().withMessage("SKU is required.")
            .isLength({ min: 1, max: 50 }).withMessage("SKU must not exceed 50 characters."),
        body("categoryId")
            .notEmpty().withMessage("categoryId is required.")
            .isInt({ gt: 0 }).withMessage("categoryId must be a positive integer."),
        body("unitOfMeasure")
            .trim()
            .notEmpty().withMessage("Unit of measure is required.")
            .isLength({ min: 1, max: 30 }).withMessage("Unit of measure must not exceed 30 characters."),
        body("sellingPrice")
            .notEmpty().withMessage("Selling price is required.")
            .isFloat({ min: 0 }).withMessage("Selling price must be a non-negative number."),
    ],

    updateRules: [
        body("productName")
            .trim()
            .notEmpty().withMessage("Product name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Product name must be between 2 and 100 characters."),
        body("sku")
            .trim()
            .notEmpty().withMessage("SKU is required.")
            .isLength({ min: 1, max: 50 }).withMessage("SKU must not exceed 50 characters."),
        body("categoryId")
            .notEmpty().withMessage("categoryId is required.")
            .isInt({ gt: 0 }).withMessage("categoryId must be a positive integer."),
        body("unitOfMeasure")
            .trim()
            .notEmpty().withMessage("Unit of measure is required.")
            .isLength({ min: 1, max: 30 }).withMessage("Unit of measure must not exceed 30 characters."),
        body("sellingPrice")
            .notEmpty().withMessage("Selling price is required.")
            .isFloat({ min: 0 }).withMessage("Selling price must be a non-negative number."),
    ],

    addSupplierRules: [
        body("supplierId")
            .notEmpty().withMessage("supplierId is required.")
            .isInt({ gt: 0 }).withMessage("supplierId must be a positive integer."),
    ],
};

// ── Purchase Order ────────────────────────────────────────────────────────────
export const purchaseOrderValidator = {
    createRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("supplierId")
            .notEmpty().withMessage("supplierId is required.")
            .isInt({ gt: 0 }).withMessage("supplierId must be a positive integer."),
        body("warehouseId")
            .notEmpty().withMessage("warehouseId is required.")
            .isInt({ gt: 0 }).withMessage("warehouseId must be a positive integer."),
        body("items")
            .isArray({ min: 1 }).withMessage("At least one item is required."),
        body("items.*.productId")
            .notEmpty().withMessage("Each item must have a productId.")
            .isInt({ gt: 0 }).withMessage("productId must be a positive integer."),
        body("items.*.quantity")
            .notEmpty().withMessage("Each item must have a quantity.")
            .isInt({ gt: 0 }).withMessage("Item quantity must be a positive integer."),
        body("items.*.unitCost")
            .notEmpty().withMessage("Each item must have a unitCost.")
            .isFloat({ min: 0 }).withMessage("Unit cost must be a non-negative number."),
    ],

    updateStatusRules: [
        body("status")
            .notEmpty().withMessage("status is required.")
            .isIn(["Received", "Cancelled"]).withMessage("status must be 'Received' or 'Cancelled'."),
    ],

    addItemRules: [
        body("productId")
            .notEmpty().withMessage("productId is required.")
            .isInt({ gt: 0 }).withMessage("productId must be a positive integer."),
        body("quantity")
            .notEmpty().withMessage("quantity is required.")
            .isInt({ gt: 0 }).withMessage("Quantity must be a positive integer."),
        body("unitCost")
            .notEmpty().withMessage("unitCost is required.")
            .isFloat({ min: 0 }).withMessage("Unit cost must be a non-negative number."),
    ],

    updateItemRules: [
        body("quantity")
            .notEmpty().withMessage("quantity is required.")
            .isInt({ gt: 0 }).withMessage("Quantity must be a positive integer."),
        body("unitCost")
            .notEmpty().withMessage("unitCost is required.")
            .isFloat({ min: 0 }).withMessage("Unit cost must be a non-negative number."),
    ],
};

// ── Sale Order ────────────────────────────────────────────────────────────────
export const saleOrderValidator = {
    createRules: [
        body("businessId")
            .notEmpty().withMessage("businessId is required.")
            .isInt({ gt: 0 }).withMessage("businessId must be a positive integer."),
        body("warehouseId")
            .notEmpty().withMessage("warehouseId is required.")
            .isInt({ gt: 0 }).withMessage("warehouseId must be a positive integer."),
        body("customerName")
            .trim()
            .notEmpty().withMessage("Customer name is required.")
            .isLength({ min: 2, max: 100 }).withMessage("Customer name must be between 2 and 100 characters."),
        body("customerContact")
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isLength({ max: 20 }).withMessage("Customer contact must not exceed 20 characters."),
        body("customerAddress")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 255 }).withMessage("Customer address must not exceed 255 characters."),
        body("items")
            .isArray({ min: 1 }).withMessage("At least one item is required."),
        body("items.*.productId")
            .notEmpty().withMessage("Each item must have a productId.")
            .isInt({ gt: 0 }).withMessage("productId must be a positive integer."),
        body("items.*.quantity")
            .notEmpty().withMessage("Each item must have a quantity.")
            .isInt({ gt: 0 }).withMessage("Item quantity must be a positive integer."),
        body("items.*.unitPrice")
            .notEmpty().withMessage("Each item must have a unitPrice.")
            .isFloat({ min: 0 }).withMessage("Unit price must be a non-negative number."),
    ],

    updateStatusRules: [
        body("status")
            .notEmpty().withMessage("status is required.")
            .isIn(["Fulfilled", "Cancelled"]).withMessage("status must be 'Fulfilled' or 'Cancelled'."),
    ],

    addItemRules: [
        body("productId")
            .notEmpty().withMessage("productId is required.")
            .isInt({ gt: 0 }).withMessage("productId must be a positive integer."),
        body("quantity")
            .notEmpty().withMessage("quantity is required.")
            .isInt({ gt: 0 }).withMessage("Quantity must be a positive integer."),
        body("unitPrice")
            .notEmpty().withMessage("unitPrice is required.")
            .isFloat({ min: 0 }).withMessage("Unit price must be a non-negative number."),
    ],

    updateItemRules: [
        body("quantity")
            .notEmpty().withMessage("quantity is required.")
            .isInt({ gt: 0 }).withMessage("Quantity must be a positive integer."),
        body("unitPrice")
            .notEmpty().withMessage("unitPrice is required.")
            .isFloat({ min: 0 }).withMessage("Unit price must be a non-negative number."),
    ],
};
