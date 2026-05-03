import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchWarehouseByIdThunk, fetchWarehouseStaff, assignWarehouseStaffThunk, updateWarehouseStaffRoleThunk, removeWarehouseStaffThunk, clearCurrentWarehouse } from "@/store/warehouseSlice";
import { fetchEmployees } from "@/store/employeeSlice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, UserPlus, Trash2, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ROLES, ALL_ROLES } from "@/lib/constants";

const assignSchema = z.object({
    staffId: z.string().min(1, "Employee required"),
    roleId: z.string().min(1, "Role required"),
});

const roleOnlySchema = z.object({
    roleId: z.string().min(1, "Role required"),
});

export default function WarehouseDetailPage() {
    const { id, wId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentWarehouse: warehouse, warehouseStaff, loading } = useSelector((s) => s.warehouse);
    const { employees } = useSelector((s) => s.employee);
    const [assignOpen, setAssignOpen] = useState(false);
    const [editStaff, setEditStaff] = useState(null);
    const [removeTarget, setRemoveTarget] = useState(null);

    const { handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(assignSchema),
        defaultValues: { staffId: "", roleId: "" },
    });

    const { handleSubmit: handleRoleSubmit, setValue: setRoleValue, watch: watchRole, reset: resetRole } = useForm({
        resolver: zodResolver(roleOnlySchema),
        defaultValues: { roleId: "" },
    });

    useEffect(() => {
        dispatch(fetchWarehouseByIdThunk(wId));
        dispatch(fetchWarehouseStaff(wId));
        dispatch(fetchEmployees(id));
        return () => dispatch(clearCurrentWarehouse());
    }, [wId, id, dispatch]);

    async function handleAssign(data) {
        const r = await dispatch(assignWarehouseStaffThunk({ warehouseId: wId, data: { staffId: Number(data.staffId), roleId: Number(data.roleId) } }));
        if (!r.error) { setAssignOpen(false); reset(); dispatch(fetchWarehouseStaff(wId)); toast.success("Staff assigned"); }
        else toast.error(r.payload);
    }

    async function handleUpdateRole(data) {
        const r = await dispatch(updateWarehouseStaffRoleThunk({ warehouseId: wId, staffId: editStaff.StaffID, roleId: Number(data.roleId) }));
        if (!r.error) { setEditStaff(null); resetRole(); dispatch(fetchWarehouseStaff(wId)); toast.success("Role updated"); }
        else toast.error(r.payload);
    }

    async function handleRemove() {
        const r = await dispatch(removeWarehouseStaffThunk({ warehouseId: wId, staffId: removeTarget.StaffID }));
        if (!r.error) { setRemoveTarget(null); toast.success("Staff removed"); }
        else toast.error(r.payload);
    }

    const assignedStaffIds = new Set(warehouseStaff.map((s) => s.StaffID));
    const availableEmployees = employees.filter((e) => !assignedStaffIds.has(e.StaffID));
    const roleMap = Object.fromEntries(ALL_ROLES.map((r) => [r.id, r.name]));

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate(`/business/${id}/warehouses`)}>
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div className="flex-1">
                    {loading && !warehouse ? (
                        <Skeleton className="h-6 w-48" />
                    ) : (
                        <div>
                            <h1 className="text-xl font-bold">{warehouse?.WarehouseName}</h1>
                            {(warehouse?.Address || warehouse?.City) && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="size-3.5" />
                                    {[warehouse.Address, warehouse.City].filter(Boolean).join(", ")}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Staff Assignment</h2>
                <Button size="sm" onClick={() => setAssignOpen(true)}>
                    <UserPlus className="size-3.5 mr-1.5" /> Assign Staff
                </Button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && !warehouseStaff.length ? (
                            [1, 2].map((i) => <TableRow key={i}>{[1, 2, 3, 4].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                        ) : warehouseStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                                    No staff assigned to this warehouse yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            warehouseStaff.map((s) => (
                                <TableRow key={s.StaffID}>
                                    <TableCell className="font-medium">{s.FullName || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{s.Email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-xs">{s.RoleName || roleMap[s.RoleID] || "Staff"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditStaff(s)}>
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setRemoveTarget(s)}>
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Assign dialog */}
            <Dialog open={assignOpen} onOpenChange={(v) => { setAssignOpen(v); if (!v) reset(); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Assign Staff</DialogTitle>
                        <DialogDescription>Assign an employee to this warehouse with a role.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleAssign)} className="space-y-4 py-1">
                        <div className="space-y-1.5">
                            <Label>Employee *</Label>
                            <Select value={watch("staffId")} onValueChange={(v) => setValue("staffId", v)}>
                                <SelectTrigger className={errors.staffId ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEmployees.map((e) => (
                                        <SelectItem key={e.StaffID} value={String(e.StaffID)}>{e.FullName || e.Email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.staffId && <p className="text-xs text-destructive">{errors.staffId.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Warehouse Role *</Label>
                            <Select value={watch("roleId")} onValueChange={(v) => setValue("roleId", v)}>
                                <SelectTrigger className={errors.roleId ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setAssignOpen(false); reset(); }} disabled={loading}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Assigning…" : "Assign"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit role dialog */}
            <Dialog open={!!editStaff} onOpenChange={(v) => { if (!v) { setEditStaff(null); resetRole(); } }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Update Role</DialogTitle>
                        <DialogDescription>Change role for {editStaff?.FullName || editStaff?.Email}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRoleSubmit(handleUpdateRole)} className="space-y-4 py-1">
                        <div className="space-y-1.5">
                            <Label>New Role *</Label>
                            <Select value={watchRole("roleId")} onValueChange={(v) => setRoleValue("roleId", v)}>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setEditStaff(null); resetRole(); }} disabled={loading}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove confirm */}
            <Dialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove Staff</DialogTitle>
                        <DialogDescription>Remove <span className="font-medium text-foreground">{removeTarget?.FullName || removeTarget?.Email}</span> from this warehouse?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={loading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemove} disabled={loading}>{loading ? "Removing…" : "Remove"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
