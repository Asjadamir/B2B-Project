import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    motion,
    useInView,
    useMotionValue,
    useSpring,
    AnimatePresence,
} from "framer-motion";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Label,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import { fetchProducts } from "@/store/productSlice.js";
import { fetchPurchaseOrders } from "@/store/purchaseOrderSlice.js";
import { fetchSaleOrders } from "@/store/saleOrderSlice.js";
import { fetchEmployees } from "@/store/employeeSlice.js";
import { getAuditLogs } from "@/lib/api.js";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
    Package,
    ShoppingCart,
    ClipboardList,
    Users,
    ArrowRight,
    Activity,
    TrendingUp,
    PieChart as PieIcon,
    DollarSign,
} from "lucide-react";
import { STATUS_COLORS } from "@/lib/constants.js";

const EASE = [0.21, 0.47, 0.32, 0.98];

/* ── colour palettes ── */
const STAT_VARIANTS = [
    {
        iconBg: "from-blue-500/20 to-indigo-500/20",
        iconColor: "text-blue-500",
        hoverShadow: "hover:shadow-blue-500/10",
    },
    {
        iconBg: "from-orange-500/20 to-amber-500/20",
        iconColor: "text-orange-500",
        hoverShadow: "hover:shadow-orange-500/10",
    },
    {
        iconBg: "from-violet-500/20 to-purple-500/20",
        iconColor: "text-violet-500",
        hoverShadow: "hover:shadow-violet-500/10",
    },
    {
        iconBg: "from-emerald-500/20 to-teal-500/20",
        iconColor: "text-emerald-500",
        hoverShadow: "hover:shadow-emerald-500/10",
    },
];

const PO_COLORS = [
    { status: "Pending", color: "#f59e0b" },
    { status: "Received", color: "#22c55e" },
    { status: "Cancelled", color: "#ef4444" },
];
const SO_COLORS = [
    { status: "Pending", color: "#f59e0b" },
    { status: "Fulfilled", color: "#22c55e" },
    { status: "Cancelled", color: "#ef4444" },
];

/* ── helpers ── */
function buildLastNMonths(n) {
    return Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (n - 1 - i));
        return {
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleDateString("en-US", { month: "short" }),
            PO: 0,
            SO: 0,
        };
    });
}

/* ── chart sub-components ── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 12,
                boxShadow: "0 8px 24px -4px rgba(0,0,0,0.18)",
            }}
        >
            {label && (
                <p
                    style={{
                        color: "var(--muted-foreground)",
                        marginBottom: 6,
                        fontWeight: 600,
                    }}
                >
                    {label}
                </p>
            )}
            {payload.map((p) => (
                <div
                    key={p.dataKey}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                    }}
                >
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            background: p.color,
                        }}
                    />
                    <span
                        style={{ color: "var(--foreground)", fontWeight: 700 }}
                    >
                        {p.value}
                    </span>
                    <span style={{ color: "var(--muted-foreground)" }}>
                        {p.name}
                    </span>
                </div>
            ))}
        </div>
    );
}

function PieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div
            style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 12,
                boxShadow: "0 4px 16px -4px rgba(0,0,0,0.2)",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: p.payload.color,
                    }}
                />
                <span style={{ color: "var(--foreground)", fontWeight: 700 }}>
                    {p.value}
                </span>
                <span style={{ color: "var(--muted-foreground)" }}>
                    {p.name}
                </span>
            </div>
        </div>
    );
}

function EmptyChartState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center h-[160px] gap-2">
            <PieIcon className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}

function StatusDonut({ title, description, data, total, loading }) {
    const isEmpty = total === 0;
    const displayData = isEmpty
        ? [{ status: "None", color: "var(--muted)", value: 1 }]
        : data;

    if (loading) {
        return (
            <Card className="glass">
                <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass hover:border-primary/20 transition-colors">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <PieIcon className="size-3.5 text-muted-foreground" />{" "}
                    {title}
                </CardTitle>
                <CardDescription className="text-xs">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    {/* Donut */}
                    <div className="w-[130px] h-[130px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={58}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    strokeWidth={2}
                                    stroke="var(--background)"
                                >
                                    {displayData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                    {!isEmpty && (
                                        <Label
                                            content={({
                                                viewBox: { cx, cy },
                                            }) => (
                                                <>
                                                    <text
                                                        x={cx}
                                                        y={cy - 7}
                                                        textAnchor="middle"
                                                        style={{
                                                            fill: "var(--foreground)",
                                                            fontSize: 22,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {total}
                                                    </text>
                                                    <text
                                                        x={cx}
                                                        y={cy + 11}
                                                        textAnchor="middle"
                                                        style={{
                                                            fill: "var(--muted-foreground)",
                                                            fontSize: 10,
                                                        }}
                                                    >
                                                        total
                                                    </text>
                                                </>
                                            )}
                                        />
                                    )}
                                </Pie>
                                <RechartsTooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-2.5">
                        {isEmpty ? (
                            <p className="text-xs text-muted-foreground italic">
                                No orders yet
                            </p>
                        ) : (
                            data
                                .filter((d) => d.value > 0)
                                .map((d) => (
                                    <div key={d.status} className="space-y-0.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="size-2 rounded-full shrink-0"
                                                    style={{
                                                        background: d.color,
                                                    }}
                                                />
                                                <span className="text-muted-foreground">
                                                    {d.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold">
                                                    {d.value}
                                                </span>
                                                <span className="text-muted-foreground/60">
                                                    {Math.round(
                                                        (d.value / total) * 100,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                        {/* Mini progress bar */}
                                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.round((d.value / total) * 100)}%`,
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    ease: "easeOut",
                                                    delay: 0.2,
                                                }}
                                                className="h-full rounded-full"
                                                style={{ background: d.color }}
                                            />
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* ── animated count ── */
function AnimatedCount({ target }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    const motionVal = useMotionValue(0);
    const spring = useSpring(motionVal, { stiffness: 120, damping: 22 });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (inView) motionVal.set(target);
    }, [inView, target, motionVal]);
    useEffect(
        () => spring.on("change", (v) => setDisplay(Math.round(v))),
        [spring],
    );

    return <span ref={ref}>{display}</span>;
}

/* ── stat card ── */
function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    to,
    navigate,
    delay = 0,
    colorIndex = 0,
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    const colors = STAT_VARIANTS[colorIndex % STAT_VARIANTS.length];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.45, delay, ease: EASE }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <Card
                className={`glass hover:border-primary/30 hover:shadow-lg ${colors.hoverShadow} transition-all cursor-pointer`}
                onClick={() => navigate(to)}
            >
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {label}
                            </p>
                            <p className="text-3xl font-bold">
                                <AnimatedCount target={value} />
                            </p>
                            {sub && (
                                <p className="text-xs text-muted-foreground">
                                    {sub}
                                </p>
                            )}
                        </div>
                        <motion.div
                            whileHover={{
                                rotate: [0, -8, 8, 0],
                                scale: 1.1,
                                transition: { duration: 0.4 },
                            }}
                            className={`size-12 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center shrink-0`}
                        >
                            <Icon className={`size-6 ${colors.iconColor}`} />
                        </motion.div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

/* ── financial chart helpers ── */
const FINANCE_TABS = ["Weekly", "Monthly", "Yearly", "Overall"];

function buildFinancialData(poOrders, soOrders, tab) {
    const getKey = (o) => o.OrderDate || o.CreatedAt || "";

    if (tab === "Weekly") {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dayKey = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString("en-US", { weekday: "short" });
            const revenue = soOrders
                .filter((o) => getKey(o).slice(0, 10) === dayKey)
                .reduce((s, o) => s + Number(o.TotalValue || 0), 0);
            const expense = poOrders
                .filter((o) => getKey(o).slice(0, 10) === dayKey)
                .reduce((s, o) => s + Number(o.TotalValue || 0), 0);
            return { label, revenue, expense };
        });
    }

    if (tab === "Monthly") {
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - (5 - i));
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("en-US", { month: "short" });
            const matchKey = (o) => {
                const od = new Date(getKey(o));
                return (
                    `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, "0")}` ===
                    mKey
                );
            };
            const revenue = soOrders
                .filter(matchKey)
                .reduce((s, o) => s + Number(o.TotalValue || 0), 0);
            const expense = poOrders
                .filter(matchKey)
                .reduce((s, o) => s + Number(o.TotalValue || 0), 0);
            return { label, revenue, expense };
        });
    }

    if (tab === "Yearly") {
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - (11 - i));
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
            });
            const matchKey = (o) => {
                const od = new Date(getKey(o));
                return (
                    `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, "0")}` ===
                    mKey
                );
            };
            const revenue = soOrders
                .filter(matchKey)
                .reduce((s, o) => s + Number(o.TotalValue || 0), 0);
            const expense = poOrders
                .filter(matchKey)
                .reduce((s, o) => s + Number(o.TotalValue || 0), 0);
            return { label, revenue, expense };
        });
    }

    // Overall — group by year
    const yearMap = {};
    poOrders.forEach((o) => {
        const yr = new Date(getKey(o)).getFullYear();
        if (isNaN(yr)) return;
        if (!yearMap[yr])
            yearMap[yr] = { label: String(yr), revenue: 0, expense: 0 };
        yearMap[yr].expense += Number(o.TotalValue || 0);
    });
    soOrders.forEach((o) => {
        const yr = new Date(getKey(o)).getFullYear();
        if (isNaN(yr)) return;
        if (!yearMap[yr])
            yearMap[yr] = { label: String(yr), revenue: 0, expense: 0 };
        yearMap[yr].revenue += Number(o.TotalValue || 0);
    });
    const sorted = Object.values(yearMap).sort((a, b) =>
        a.label.localeCompare(b.label),
    );
    return sorted.length
        ? sorted
        : [
              {
                  label: new Date().getFullYear().toString(),
                  revenue: 0,
                  expense: 0,
              },
          ];
}

function formatCurrency(v) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function FinancialTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 12,
                boxShadow: "0 8px 24px -4px rgba(0,0,0,0.18)",
            }}
        >
            {label && (
                <p
                    style={{
                        color: "var(--muted-foreground)",
                        marginBottom: 6,
                        fontWeight: 600,
                    }}
                >
                    {label}
                </p>
            )}
            {payload.map((p) => (
                <div
                    key={p.dataKey}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                    }}
                >
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            background: p.color,
                        }}
                    />
                    <span
                        style={{ color: "var(--foreground)", fontWeight: 700 }}
                    >
                        {formatCurrency(p.value)}
                    </span>
                    <span style={{ color: "var(--muted-foreground)" }}>
                        {p.name}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ════════════════════════════════════════════
   Main page
   ════════════════════════════════════════════ */
export default function OverviewPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products } = useSelector((s) => s.product);
    const { orders: poOrders, loading: poLoading } = useSelector(
        (s) => s.purchaseOrder,
    );
    const { orders: soOrders, loading: soLoading } = useSelector(
        (s) => s.saleOrder,
    );
    const { employees } = useSelector((s) => s.employee);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [financeTab, setFinanceTab] = useState("Monthly");

    useEffect(() => {
        dispatch(fetchProducts(id));
        dispatch(fetchPurchaseOrders(id));
        dispatch(fetchSaleOrders(id));
        dispatch(fetchEmployees(id));
        getAuditLogs({ businessId: id, limit: 8 })
            .then((d) => setLogs(d.logs || []))
            .catch(() => {})
            .finally(() => setLogsLoading(false));
    }, [id, dispatch]);

    /* ── derived chart data ── */
    const monthlyData = useMemo(() => {
        const months = buildLastNMonths(6);
        poOrders.forEach((o) => {
            const d = new Date(o.OrderDate || o.CreatedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const m = months.find((m) => m.key === key);
            if (m) m.PO++;
        });
        soOrders.forEach((o) => {
            const d = new Date(o.OrderDate || o.CreatedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const m = months.find((m) => m.key === key);
            if (m) m.SO++;
        });
        return months;
    }, [poOrders, soOrders]);

    const hasAnyOrderActivity = monthlyData.some((m) => m.PO > 0 || m.SO > 0);

    const financialData = useMemo(
        () => buildFinancialData(poOrders, soOrders, financeTab),
        [poOrders, soOrders, financeTab],
    );
    const hasFinancialData = financialData.some(
        (d) => d.revenue > 0 || d.expense > 0,
    );

    const poStatusData = useMemo(
        () =>
            PO_COLORS.map(({ status, color }) => ({
                status,
                color,
                value: poOrders.filter((o) => o.Status === status).length,
            })),
        [poOrders],
    );

    const soStatusData = useMemo(
        () =>
            SO_COLORS.map(({ status, color }) => ({
                status,
                color,
                value: soOrders.filter((o) => o.Status === status).length,
            })),
        [soOrders],
    );

    const pendingPO = poOrders.filter((o) => o.Status === "Pending").length;
    const pendingSO = soOrders.filter((o) => o.Status === "Pending").length;
    const base = `/business/${id}`;

    return (
        <div className="relative p-6 space-y-6 max-w-5xl mx-auto">
            {/* Ambient blobs */}
            <div className="fixed top-32 right-16 size-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none -z-10" />
            <div className="fixed bottom-32 left-1/3 size-64 rounded-full bg-violet-500/5 blur-3xl pointer-events-none -z-10" />

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
            >
                <h1 className="text-xl font-bold">Overview</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    A snapshot of your business activity
                </p>
            </motion.div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Package}
                    label="Total Products"
                    value={products.length}
                    sub="in catalog"
                    to={`${base}/products`}
                    navigate={navigate}
                    delay={0}
                    colorIndex={0}
                />
                <StatCard
                    icon={ShoppingCart}
                    label="Purchase Orders"
                    value={pendingPO}
                    sub="pending"
                    to={`${base}/purchase-orders`}
                    navigate={navigate}
                    delay={0.07}
                    colorIndex={1}
                />
                <StatCard
                    icon={ClipboardList}
                    label="Sale Orders"
                    value={pendingSO}
                    sub="pending"
                    to={`${base}/sale-orders`}
                    navigate={navigate}
                    delay={0.14}
                    colorIndex={2}
                />
                <StatCard
                    icon={Users}
                    label="Team Members"
                    value={employees.length}
                    sub="employees"
                    to={`${base}/employees`}
                    navigate={navigate}
                    delay={0.21}
                    colorIndex={3}
                />
            </div>

            {/* ═══════════════════════════════════
                Charts section
                ═══════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
                className="space-y-4"
            >
                {/* ── Orders Trend (area chart) ── */}
                <Card className="glass hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="size-3.5 text-muted-foreground" />
                                Orders Trend
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Purchase &amp; sale order volume — last 6 months
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block size-2.5 rounded-full bg-indigo-500" />
                                Purchase
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block size-2.5 rounded-full bg-violet-500" />
                                Sale
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4">
                        {poLoading || soLoading ? (
                            <Skeleton className="h-[180px] w-full rounded-xl" />
                        ) : !hasAnyOrderActivity ? (
                            <EmptyChartState message="No order activity yet — create your first order to see trends" />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart
                                    data={monthlyData}
                                    margin={{
                                        top: 6,
                                        right: 6,
                                        left: -18,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="gradPO"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#6366f1"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#6366f1"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="gradSO"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#8b5cf6"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#8b5cf6"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                        vertical={false}
                                        strokeOpacity={0.6}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{
                                            fontSize: 11,
                                            fill: "var(--muted-foreground)",
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: "var(--muted-foreground)",
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip
                                        content={<CustomTooltip />}
                                        cursor={{
                                            stroke: "var(--border)",
                                            strokeWidth: 1,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="PO"
                                        name="Purchase Orders"
                                        stroke="#6366f1"
                                        fill="url(#gradPO)"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#6366f1" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="SO"
                                        name="Sale Orders"
                                        stroke="#8b5cf6"
                                        fill="url(#gradSO)"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#8b5cf6" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ── Revenue vs Expense (bar chart) ── */}
                <Card className="glass hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <DollarSign className="size-3.5 text-muted-foreground" />
                                    Revenue vs Expense
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    Sale order revenue and purchase order
                                    expense over time
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 self-start">
                                {FINANCE_TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFinanceTab(tab)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                            financeTab === tab
                                                ? "bg-background shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
                                Revenue
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block size-2.5 rounded-full bg-rose-500" />
                                Expense
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4">
                        {poLoading || soLoading ? (
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                        ) : !hasFinancialData ? (
                            <EmptyChartState message="No financial data yet — create orders to see revenue and expense trends" />
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={financeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25, ease: EASE }}
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height={220}
                                    >
                                        <BarChart
                                            data={financialData}
                                            margin={{
                                                top: 6,
                                                right: 6,
                                                left: -4,
                                                bottom: 0,
                                            }}
                                            barCategoryGap="30%"
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="gradRevenue"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#10b981"
                                                        stopOpacity={0.9}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#10b981"
                                                        stopOpacity={0.6}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="gradExpense"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#f43f5e"
                                                        stopOpacity={0.9}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#f43f5e"
                                                        stopOpacity={0.6}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="var(--border)"
                                                vertical={false}
                                                strokeOpacity={0.6}
                                            />
                                            <XAxis
                                                dataKey="label"
                                                tick={{
                                                    fontSize: 11,
                                                    fill: "var(--muted-foreground)",
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={formatCurrency}
                                                tick={{
                                                    fontSize: 11,
                                                    fill: "var(--muted-foreground)",
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={54}
                                            />
                                            <RechartsTooltip
                                                content={<FinancialTooltip />}
                                                cursor={{
                                                    fill: "var(--muted)",
                                                    opacity: 0.3,
                                                }}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                name="Revenue"
                                                fill="url(#gradRevenue)"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={32}
                                            />
                                            <Bar
                                                dataKey="expense"
                                                name="Expense"
                                                fill="url(#gradExpense)"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={32}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </CardContent>
                </Card>

                {/* ── Status donut charts ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatusDonut
                        title="Purchase Order Status"
                        description="Breakdown of all PO statuses"
                        data={poStatusData}
                        total={poOrders.length}
                        loading={poLoading}
                    />
                    <StatusDonut
                        title="Sale Order Status"
                        description="Breakdown of all SO statuses"
                        data={soStatusData}
                        total={soOrders.length}
                        loading={soLoading}
                    />
                </div>
            </motion.div>

            {/* ── Recent orders ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.38, ease: EASE }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
                <Card className="glass">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            Recent Purchase Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {poLoading ? (
                            [1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))
                        ) : poOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                                No purchase orders yet
                            </p>
                        ) : (
                            <AnimatePresence>
                                {poOrders.slice(0, 4).map((o, i) => (
                                    <motion.div
                                        key={o.POID}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: i * 0.05,
                                            duration: 0.3,
                                        }}
                                        className="flex items-center justify-between py-1.5 text-sm"
                                    >
                                        <span className="text-muted-foreground font-mono text-xs">
                                            PO-{String(o.POID).padStart(4, "0")}
                                        </span>
                                        <Badge
                                            className={`text-xs ${STATUS_COLORS[o.Status]}`}
                                            variant="outline"
                                        >
                                            {o.Status}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1 gap-1"
                            onClick={() => navigate(`${base}/purchase-orders`)}
                        >
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            Recent Sale Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {soLoading ? (
                            [1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))
                        ) : soOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                                No sale orders yet
                            </p>
                        ) : (
                            <AnimatePresence>
                                {soOrders.slice(0, 4).map((o, i) => (
                                    <motion.div
                                        key={o.SOID}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: i * 0.05,
                                            duration: 0.3,
                                        }}
                                        className="flex items-center justify-between py-1.5 text-sm"
                                    >
                                        <span className="text-muted-foreground truncate max-w-[140px]">
                                            {o.CustomerName || `SO #${o.SOID}`}
                                        </span>
                                        <Badge
                                            className={`text-xs ${STATUS_COLORS[o.Status]}`}
                                            variant="outline"
                                        >
                                            {o.Status}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1 gap-1"
                            onClick={() => navigate(`${base}/sale-orders`)}
                        >
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Audit log ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
            >
                <Card className="glass">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="size-4" /> Recent Activity
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => navigate(`${base}/audit-logs`)}
                        >
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {logsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : logs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No activity recorded yet.
                            </p>
                        ) : (
                            <div className="divide-y divide-border">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            delay: i * 0.04,
                                            duration: 0.3,
                                        }}
                                        className="py-2.5 flex items-start justify-between gap-2 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <span className="font-medium">
                                                {log.Action}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {" "}
                                                · {log.EntityType}
                                            </span>
                                            {log.Details && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {log.Details}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                            {new Date(
                                                log.CreatedAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
