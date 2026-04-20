import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchEmployees, inviteEmployeeThunk, updateEmployeeRoleThunk, removeEmployeeThunk, fetchPendingInvitesThunk } from "@/store/employeeSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Trash2, Pencil, Users, Clock, Mail } from "lucide-react";
import { toast } from "sonner";
import { ROLES, ALL_ROLES } from "@/lib/constants";

const inviteSchema = z.object({
    email: z.string().email("Valid email required"),
    roleId: z.string().min(1, "Role required"),
});

const roleSchema = z.object({
    roleId: z.string().min(1, "Role required"),
});

function InviteDialog({ open, onOpenChange, businessId, onSubmit, loading }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(inviteSchema), defaultValues: { email: "", roleId: "" } });
    useEffect(() => { if (!open) reset(); }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Invite Employee</DialogTitle>
                    <DialogDescription>Send an email invitation to join this business.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit((d) => onSubmit({ ...d, businessId: Number(businessId), roleId: Number(d.roleId) }))} className="space-y-4 py-1">
                    <div className="space-y-1.5">
                        <Label>Email Address *</Label>
                        <Input type="email" placeholder="jane@company.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Role *</Label>
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
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Sending…" : "Send Invite"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RoleDialog({ open, onOpenChange, employee, onSubmit, loading }) {
    const { handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(roleSchema), defaultValues: { roleId: "" } });
    useEffect(() => { reset({ roleId: String(employee?.RoleID || "") }); }, [employee, open, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Change Role</DialogTitle>
                    <DialogDescription>Update role for {employee?.FullName || employee?.Email}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit((d) => onSubmit({ staffId: employee.StaffID, roleId: Number(d.roleId) }))} className="space-y-4 py-1">
                    <div className="space-y-1.5">
                        <Label>New Role *</Label>
                        <Select value={watch("roleId")} onValueChange={(v) => setValue("roleId", v)}>
                            <SelectTrigger className={errors.roleId ? "border-destructive" : ""}>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Update Role"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function EmployeesPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { employees, invites, loading } = useSelector((s) => s.employee);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [removeTarget, setRemoveTarget] = useState(null);

    useEffect(() => {
        dispatch(fetchEmployees(id));
        dispatch(fetchPendingInvitesThunk(id));
    }, [id, dispatch]);

    async function handleInvite(form) {
        const r = await dispatch(inviteEmployeeThunk(form));
        if (!r.error) { setInviteOpen(false); toast.success("Invitation sent"); dispatch(fetchPendingInvitesThunk(id)); }
        else toast.error(r.payload);
    }

    async function handleUpdateRole(form) {
        const r = await dispatch(updateEmployeeRoleThunk(form));
        if (!r.error) { setEditRole(null); dispatch(fetchEmployees(id)); toast.success("Role updated"); }
        else toast.error(r.payload);
    }

    async function handleRemove() {
        const r = await dispatch(removeEmployeeThunk(removeTarget.StaffID));
        if (!r.error) { setRemoveTarget(null); toast.success("Employee removed"); }
        else toast.error(r.payload);
    }

    const roleMap = Object.fromEntries(ALL_ROLES.map((r) => [r.id, r.name]));

    return (
        <div className="p-6 space-y-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Employees</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{employees.length} member{employees.length !== 1 ? "s" : ""}</p>
                </div>
                <Button onClick={() => setInviteOpen(true)}><UserPlus className="size-4 mr-1.5" /> Invite Employee</Button>
            </div>

            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members" className="gap-2"><Users className="size-3.5" /> Team ({employees.length})</TabsTrigger>
                    <TabsTrigger value="invites" className="gap-2"><Clock className="size-3.5" /> Pending ({invites.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-4">
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
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <TableRow key={i}>{[1, 2, 3, 4].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                                    ))
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                                                    <Users className="size-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-muted-foreground text-sm">No team members yet. Invite your first employee.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((e) => (
                                        <TableRow key={e.StaffID}>
                                            <TableCell className="font-medium">{e.FullName || "—"}</TableCell>
                                            <TableCell className="text-muted-foreground">{e.Email}</TableCell>
                                            <TableCell>
                                                <Badge variant={e.RoleName === "Owner" ? "default" : "secondary"} className="text-xs">
                                                    {e.RoleName || roleMap[e.RoleID] || "Staff"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {e.RoleName !== "Owner" && (
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditRole(e)}>
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setRemoveTarget(e)}>
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="invites" className="mt-4">
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Expires</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invites.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                            <Mail className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                                            No pending invitations.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invites.map((inv, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{inv.Email}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-xs">{inv.RoleName || "Staff"}</Badge></TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{inv.ValidTill ? new Date(inv.ValidTill).toLocaleDateString() : "—"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} businessId={id} onSubmit={handleInvite} loading={loading} />
            <RoleDialog open={!!editRole} onOpenChange={(v) => !v && setEditRole(null)} employee={editRole} onSubmit={handleUpdateRole} loading={loading} />

            <Dialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove Employee</DialogTitle>
                        <DialogDescription>Remove <span className="font-medium text-foreground">{removeTarget?.FullName || removeTarget?.Email}</span> from this business?</DialogDescription>
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
