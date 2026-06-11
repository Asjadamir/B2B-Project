//import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store/index.js";
import "./index.css";
import App from "./App.jsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")).render(
    <>
        <Provider store={store}>
            <App />
            <Analytics />
            <SpeedInsights />
        </Provider>
    </>,
);
