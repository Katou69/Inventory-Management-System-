"use client"

import { useEffect, useState } from "react";
import { Building2, Package, Bell, Trash2, Plus, X, RefreshCw, PackageCheck, Globe } from "lucide-react";
import { Role } from "@/types/user";
import { CATEGORIES } from "@/data/users-data";
import { getWarehouses } from "@/services/dashboard-service";

export default function SettingsView({ role }: { role: Role; userWarehouseId: number | "all" }) {
  // System configuration state
  const [warehouses, setWarehouses] = useState<string[]>([]);
  useEffect(() => { void getWarehouses().then((w) => setWarehouses(w.map((wh) => wh.name))); }, []);
  const [categories, setCategories] = useState<string[]>([...CATEGORIES]);
  const [newWarehouse, setNewWarehouse] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [notifications, setNotifications] = useState({ lowStock: true, orderUpdate: true, poApproval: true });
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">System Settings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage system configurations and preferences</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <PackageCheck className="w-4 h-4" /> Settings saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Warehouses Settings */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Warehouses</h4>
            </div>
            <div className="space-y-2 mb-3">
              {warehouses.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded-lg text-sm">
                  <span>{w}</span>
                  {role === "admin" && (
                    <button onClick={() => setWarehouses(p => p.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {role === "admin" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new warehouse…"
                  value={newWarehouse}
                  onChange={(e) => setNewWarehouse(e.target.value)}
                  className="modal-input flex-1"
                />
                <button
                  onClick={() => { if (newWarehouse) { setWarehouses(p => [...p, newWarehouse]); setNewWarehouse(""); } }}
                  className="btn-primary flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            )}
          </div>

          {/* Categories Settings */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Product Categories</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((c, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-sm">
                  {c}
                  {role === "admin" && (
                    <button onClick={() => setCategories(p => p.filter((_, i) => i !== idx))} className="ml-1 hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {role === "admin" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new category…"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="modal-input flex-1"
                />
                <button
                  onClick={() => { if (newCategory) { setCategories(p => [...p, newCategory]); setNewCategory(""); } }}
                  className="btn-primary flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Notifications Settings */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            <div className="space-y-3">
              {[
                { key: "lowStock" as const, label: "Low stock alerts" },
                { key: "orderUpdate" as const, label: "Order status updates" },
                { key: "poApproval" as const, label: "Purchase order approvals" }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">{label}</span>
                  <button
                    onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                    className={`w-11 h-6 rounded-full transition-colors ${notifications[key] ? "bg-primary" : "bg-secondary"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications[key] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">General</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="modal-input">
                  <option value="English">English</option>
                  <option value="Thai">Thai</option>
                  <option value="Myanmar">Burmese</option>
                  <option value="China">China</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="modal-input">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Myanmar">Myanmar (GMT+6:30)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
