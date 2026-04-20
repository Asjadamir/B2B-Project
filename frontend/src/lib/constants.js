export const ROLES = [
    { id: 2, name: "Manager" },
    { id: 3, name: "Warehouse Staff" },
    { id: 4, name: "Procurement Officer" },
];

export const ALL_ROLES = [
    { id: 1, name: "Owner" },
    { id: 2, name: "Manager" },
    { id: 3, name: "Warehouse Staff" },
    { id: 4, name: "Procurement Officer" },
];

export const PO_STATUSES = ["Pending", "Received", "Cancelled"];
export const SO_STATUSES = ["Pending", "Fulfilled", "Cancelled"];

export const STATUS_COLORS = {
    Pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    Received: "bg-green-500/15 text-green-600 dark:text-green-400",
    Fulfilled: "bg-green-500/15 text-green-600 dark:text-green-400",
    Cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
    Active: "bg-green-500/15 text-green-600 dark:text-green-400",
    Inactive: "bg-muted text-muted-foreground",
};
