import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { fetchProducts } from "@/store/productSlice";
import { fetchPurchaseOrders } from "@/store/purchaseOrderSlice";
import { fetchSaleOrders } from "@/store/saleOrderSlice";
import { fetchEmployees } from "@/store/employeeSlice";
import { getAuditLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, ClipboardList, Users, ArrowRight, Activity } from "lucide-react";
import { STATUS_COLORS } from "@/lib/constants";

const EASE = [0.21, 0.47, 0.32, 0.98];

const STAT_VARIANTS = [
    { iconBg: "from-blue-500/20 to-indigo-500/20",    iconColor: "text-blue-500",    hoverShadow: "hover:shadow-blue-500/10"    },
    { iconBg: "from-orange-500/20 to-amber-500/20",   iconColor: "text-orange-500",  hoverShadow: "hover:shadow-orange-500/10"  },
    { iconBg: "from-violet-500/20 to-purple-500/20",  iconColor: "text-violet-500",  hoverShadow: "hover:shadow-violet-500/10"  },
    { iconBg: "from-emerald-500/20 to-teal-500/20",   iconColor: "text-emerald-500", hoverShadow: "hover:shadow-emerald-500/10" },
];

function AnimatedCount({ target }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    const motionVal = useMotionValue(0);
    const spring = useSpring(motionVal, { stiffness: 120, damping: 22 });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (inView) motionVal.set(target);
    }, [inView, target, motionVal]);

    useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

    return <span ref={ref}>{display}</span>;
}

function StatCard({ icon: Icon, label, value, sub, to, navigate, delay = 0, colorIndex = 0 }) {
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
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                            <p className="text-3xl font-bold">
                                <AnimatedCount target={value} />
                            </p>
                            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                        </div>
                        <motion.div
                            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1, transition: { duration: 0.4 } }}
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

export default function OverviewPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products } = useSelector((s) => s.product);
    const { orders: poOrders, loading: poLoading } = useSelector((s) => s.purchaseOrder);
    const { orders: soOrders, loading: soLoading } = useSelector((s) => s.saleOrder);
    const { employees } = useSelector((s) => s.employee);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);

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

    const pendingPO = poOrders.filter((o) => o.Status === "Pending").length;
    const pendingSO = soOrders.filter((o) => o.Status === "Pending").length;
    const base = `/business/${id}`;

    return (
        <div className="relative p-6 space-y-6 max-w-5xl mx-auto">
            {/* Ambient blobs — blur sources for glass cards */}
            <div className="fixed top-32 right-16 size-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none -z-10" />
            <div className="fixed bottom-32 left-1/3 size-64 rounded-full bg-violet-500/5 blur-3xl pointer-events-none -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
            >
                <h1 className="text-xl font-bold">Overview</h1>
                <p className="text-sm text-muted-foreground mt-0.5">A snapshot of your business activity</p>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Package}       label="Total Products"  value={products.length}  sub="in catalog" to={`${base}/products`}        navigate={navigate} delay={0}    colorIndex={0} />
                <StatCard icon={ShoppingCart}  label="Purchase Orders" value={pendingPO}         sub="pending"    to={`${base}/purchase-orders`}  navigate={navigate} delay={0.07} colorIndex={1} />
                <StatCard icon={ClipboardList} label="Sale Orders"     value={pendingSO}         sub="pending"    to={`${base}/sale-orders`}       navigate={navigate} delay={0.14} colorIndex={2} />
                <StatCard icon={Users}         label="Team Members"    value={employees.length}  sub="employees"  to={`${base}/employees`}         navigate={navigate} delay={0.21} colorIndex={3} />
            </div>

            {/* Quick action cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Purchase Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {poLoading ? (
                            [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                        ) : poOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No purchase orders yet</p>
                        ) : (
                            <AnimatePresence>
                                {poOrders.slice(0, 4).map((o, i) => (
                                    <motion.div
                                        key={o.POID}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05, duration: 0.3 }}
                                        className="flex items-center justify-between py-1.5 text-sm"
                                    >
                                        <span className="text-muted-foreground">PO #{o.POID}</span>
                                        <Badge className={`text-xs ${STATUS_COLORS[o.Status]}`} variant="outline">{o.Status}</Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        <Button variant="ghost" size="sm" className="w-full mt-1 gap-1" onClick={() => navigate(`${base}/purchase-orders`)}>
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Sale Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {soLoading ? (
                            [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                        ) : soOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No sale orders yet</p>
                        ) : (
                            <AnimatePresence>
                                {soOrders.slice(0, 4).map((o, i) => (
                                    <motion.div
                                        key={o.SOID}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05, duration: 0.3 }}
                                        className="flex items-center justify-between py-1.5 text-sm"
                                    >
                                        <span className="text-muted-foreground truncate max-w-[140px]">{o.CustomerName || `SO #${o.SOID}`}</span>
                                        <Badge className={`text-xs ${STATUS_COLORS[o.Status]}`} variant="outline">{o.Status}</Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        <Button variant="ghost" size="sm" className="w-full mt-1 gap-1" onClick={() => navigate(`${base}/sale-orders`)}>
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Audit log */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            >
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="size-4" /> Recent Activity
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate(`${base}/audit-logs`)}>
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {logsLoading ? (
                            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                        ) : logs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                        ) : (
                            <div className="divide-y divide-border">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04, duration: 0.3 }}
                                        className="py-2.5 flex items-start justify-between gap-2 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <span className="font-medium">{log.Action}</span>
                                            <span className="text-muted-foreground"> · {log.EntityType}</span>
                                            {log.Details && <p className="text-xs text-muted-foreground truncate mt-0.5">{log.Details}</p>}
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                            {new Date(log.CreatedAt).toLocaleDateString()}
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
