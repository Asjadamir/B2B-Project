import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import businessReducer from "./businessSlice";
import supplierReducer from "./supplierSlice";
import productReducer from "./productSlice";
import categoryReducer from "./categorySlice";
import purchaseOrderReducer from "./purchaseOrderSlice";
import saleOrderReducer from "./saleOrderSlice";
import employeeReducer from "./employeeSlice";
import warehouseReducer from "./warehouseSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        business: businessReducer,
        supplier: supplierReducer,
        product: productReducer,
        category: categoryReducer,
        purchaseOrder: purchaseOrderReducer,
        saleOrder: saleOrderReducer,
        employee: employeeReducer,
        warehouse: warehouseReducer,
    },
});
