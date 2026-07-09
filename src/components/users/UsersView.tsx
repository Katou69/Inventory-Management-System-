"use client"

import { useEffect, useState } from "react";
import { Search, UserPlus, Edit2, Trash2, Building2, Shield, User, Mail, Check, XCircle, RefreshCw } from "lucide-react";
import { UserType, Role, UserStatus } from "@/types/user";
import type { Warehouse } from "@/types/dashboard";
import { getUsers, updateUser, deleteUser } from "@/services/users-service";
import { getWarehouses } from "@/services/dashboard-service";
import { initials, avatarColor } from "@/lib/format";
import { Badge, ActionBtn, Modal, ModalFooter, FormField } from "@/components/ui";

export default function UsersView({ role, userWarehouseId }: { role: Role; userWarehouseId: number | "all" }) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<UserType | null>(null);
  const [showDelete, setShowDelete] = useState<UserType | null>(null);
  const [wf, setWf] = useState<number | "All">("All");
  const [rf, setRf] = useState("All");
  const [sf, setSf] = useState("All");
  const [search, setSearch] = useState("");
  const [nu, setNu] = useState({ name: "", email: "", role: "staff" as Role, warehouseId: 0 as number | "all", status: "pending" as UserStatus });
  const [eu, setEu] = useState({ name: "", email: "", role: "staff" as Role, warehouseId: 0 as number | "all", status: "pending" as UserStatus });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshUsers = async () => {
    setRefreshing(true);
    try {
      const users = await getUsers();
      setUsers(users);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void getUsers().then(setUsers);
    void getWarehouses().then((w) => {
      setWarehouses(w);
      if (w.length > 0) setNu((p) => ({ ...p, warehouseId: w[0].id }));
    });
  }, []);

  const warehouseName = (id: number | "all") =>
    id === "all" ? "All" : warehouses.find((w) => w.id === id)?.name ?? String(id);

  const filtered = users.filter(u =>
    (role === "admin" ? (wf === "All" || u.warehouseId === wf || u.warehouseId === "all") : (u.warehouseId === userWarehouseId || (role === "manager" && u.warehouseId === userWarehouseId))) &&
    (rf === "All" || u.role === rf) &&
    (sf === "All" || u.status === sf) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleApprove = async (user: UserType) => {
    setLoading(true);
    try {
      const updated = await updateUser(user.id, { status: "active" });
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    } catch (error) {
      console.error("Failed to approve user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (user: UserType) => {
    setLoading(true);
    try {
      const updated = await updateUser(user.id, { status: "inactive" });
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    } catch (error) {
      console.error("Failed to reject user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    setLoading(true);
    try {
      const updated = await updateUser(showEdit.id, {
        name: eu.name,
        email: eu.email,
        role: eu.role,
        warehouse_id: eu.warehouseId === "all" ? undefined : eu.warehouseId,
        status: eu.status,
      });
      setUsers(prev => prev.map(u => u.id === showEdit.id ? updated : u));
      setShowEdit(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setLoading(true);
    try {
      await deleteUser(showDelete.id);
      setUsers(prev => prev.filter(u => u.id !== showDelete.id));
      setShowDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = () => {
    setUsers(p => [...p, { ...nu, id: `u${p.length + 1}`, warehouseId: nu.role === "admin" ? "all" : nu.warehouseId, joinedDate: new Date().toISOString().slice(0, 10), loginAttempts: 0, lockoutUntil: null }]);
    setShowAdd(false);
    setNu({ name: "", email: "", role: "staff", warehouseId: warehouses[0]?.id ?? 0, status: "pending" });
  };

  const roleDesc: Record<Role, string> = {
    admin: "Full access to all warehouses, users, and system settings.",
    manager: `Can manage inventory and staff at ${warehouseName(nu.warehouseId)}. Read-only for other warehouses.`,
    staff: `Can view and update inventory at ${warehouseName(nu.warehouseId)}. Read-only access to orders.`,
  };

  const counts = {
    total: users.length,
    pending: users.filter(u => u.status === "pending").length,
    admin: users.filter(u => u.role === "admin").length,
    manager: users.filter(u => u.role === "manager").length,
    staff: users.filter(u => u.role === "staff").length,
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their access</p>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-4 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
        </div>
        {role === "admin" && (
          <select value={wf} onChange={e => setWf(e.target.value === "All" ? "All" : Number(e.target.value))} className="select-sm">
            <option value="All">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}
        <select value={rf} onChange={e => setRf(e.target.value)} className="select-sm">
          <option value="All">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
        <select value={sf} onChange={e => setSf(e.target.value)} className="select-sm">
          <option value="All">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Add User
            </button>
          )}
          <button onClick={refreshUsers} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Users", value: counts.total, color: "text-foreground" },
          { label: "Pending", value: counts.pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "Admins", value: counts.admin, color: "text-violet-600 dark:text-violet-400" },
          { label: "Managers", value: counts.manager, color: "text-blue-600 dark:text-blue-400" },
          { label: "Staff", value: counts.staff, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: avatarColor(u.id) }}
                >
                  {initials(u.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              {role === "admin" && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ActionBtn icon={Edit2} onClick={() => {
                    setShowEdit(u);
                    setEu({
                      name: u.name,
                      email: u.email,
                      role: u.role,
                      warehouseId: u.warehouseId,
                      status: u.status,
                    });
                  }} />
                  {u.role !== "admin" && <ActionBtn icon={Trash2} danger onClick={() => setShowDelete(u)} />}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <Badge status={u.role} />
              <Badge status={u.status} />
              {u.warehouseId === "all"
                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-secondary text-secondary-foreground"><Shield className="w-2.5 h-2.5" />All Warehouses</span>
                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-secondary text-secondary-foreground"><Building2 className="w-2.5 h-2.5" />{warehouseName(u.warehouseId)}</span>
              }
            </div>
            {u.status === "pending" && role === "admin" && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleApprove(u)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-xs font-medium py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => handleReject(u)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground font-mono">Joined {u.joinedDate}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground text-sm">No users found</div>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal title="Add New User" subtitle="Invite a team member to GRGI" onClose={() => setShowAdd(false)}>
          <div className="p-5 space-y-4">
            <FormField label="Full Name">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" placeholder="Taylor Kim" value={nu.name} onChange={e => setNu(p => ({ ...p, name: e.target.value }))} className="modal-input pl-8" />
              </div>
            </FormField>
            <FormField label="Email Address">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="email" placeholder="taylor@grandroyal.com" value={nu.email} onChange={e => setNu(p => ({ ...p, email: e.target.value }))} className="modal-input pl-8" />
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role">
                <select value={nu.role} onChange={e => setNu(p => ({ ...p, role: e.target.value as Role }))} className="modal-input">
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </FormField>
              <FormField label="Status">
                <select value={nu.status} onChange={e => setNu(p => ({ ...p, status: e.target.value as UserStatus }))} className="modal-input">
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
            </div>
            {nu.role !== "admin" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Warehouse Assignment</label>
                <div className="grid grid-cols-2 gap-2">
                  {warehouses.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setNu(p => ({ ...p, warehouseId: w.id }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${nu.warehouseId === w.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                    >
                      <Building2 className="w-3 h-3 shrink-0" />{w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
              {roleDesc[nu.role]}
            </div>
          </div>
          <ModalFooter onCancel={() => setShowAdd(false)} onConfirm={addUser} confirmLabel="Send Invite" disabled={!nu.name || !nu.email} />
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEdit && (
        <Modal title="Edit User" subtitle="Update user information" onClose={() => setShowEdit(null)}>
          <div className="p-5 space-y-4">
            <FormField label="Full Name">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" placeholder="Taylor Kim" value={eu.name} onChange={e => setEu(p => ({ ...p, name: e.target.value }))} className="modal-input pl-8" />
              </div>
            </FormField>
            <FormField label="Email Address">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="email" placeholder="taylor@grandroyal.com" value={eu.email} onChange={e => setEu(p => ({ ...p, email: e.target.value }))} className="modal-input pl-8" />
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role">
                <select value={eu.role} onChange={e => setEu(p => ({ ...p, role: e.target.value as Role }))} className="modal-input">
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </FormField>
              <FormField label="Status">
                <select value={eu.status} onChange={e => setEu(p => ({ ...p, status: e.target.value as UserStatus }))} className="modal-input">
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
            </div>
            {eu.role !== "admin" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Warehouse Assignment</label>
                <div className="grid grid-cols-2 gap-2">
                  {warehouses.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setEu(p => ({ ...p, warehouseId: w.id }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${eu.warehouseId === w.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                    >
                      <Building2 className="w-3 h-3 shrink-0" />{w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <ModalFooter onCancel={() => setShowEdit(null)} onConfirm={handleEdit} confirmLabel="Save Changes" disabled={!eu.name || !eu.email} loading={loading} />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <Modal title="Delete User" subtitle="This action cannot be undone" onClose={() => setShowDelete(null)}>
          <div className="p-5">
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete <span className="font-medium text-foreground">{showDelete.name}</span>?
            </p>
          </div>
          <ModalFooter onCancel={() => setShowDelete(null)} onConfirm={handleDelete} confirmLabel="Delete User" danger loading={loading} />
        </Modal>
      )}
    </div>
  );
}
