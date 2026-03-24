import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import businessReducer from "./businessSlice";
import supplierReducer from "./supplierSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        business: businessReducer,
        supplier: supplierReducer,
    },
});
