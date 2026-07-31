"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Store, Check, X, Image as ImageIcon, Sparkles, PackageCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import { toast } from "sonner";

interface GroceryItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  unit: string;
  freshness_badge: string;
  image_url: string | null;
  stock: number;
  is_active: number;
}

export default function AdminGroceriesPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    compare_price: "",
    unit: "per 1kg",
    freshness_badge: "100% Organic",
    image_url: "",
    stock: "100",
    is_active: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groceries");
      const d = await res.json();
      setItems(d.items || []);
      setIsEnabled(!!d.is_enabled);
    } catch {
      toast.error("Failed to load fresh groceries");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleHomepage = async () => {
    setToggling(true);
    try {
      const nextState = !isEnabled;
      const res = await fetch("/api/admin/groceries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggle_visibility: nextState })
      });
      const data = await res.json();
      if (res.ok) {
        setIsEnabled(nextState);
        toast.success(nextState ? "Groceries section is now LIVE on homepage!" : "Groceries section HIDDEN from homepage.");
      } else {
        toast.error(data.error || "Failed to update visibility");
      }
    } catch {
      toast.error("Error toggling section visibility");
    }
    setToggling(false);
  };

  const openAdd = () => {
    setForm({
      name: "",
      price: "",
      compare_price: "",
      unit: "per 1kg",
      freshness_badge: "Farm Fresh",
      image_url: "",
      stock: "100",
      is_active: true
    });
    setEditingItem(null);
    setModal("add");
  };

  const openEdit = (item: GroceryItem) => {
    setForm({
      name: item.name,
      price: String(item.price),
      compare_price: item.compare_price ? String(item.compare_price) : "",
      unit: item.unit || "per pack",
      freshness_badge: item.freshness_badge || "Farm Fresh",
      image_url: item.image_url || "",
      stock: String(item.stock || 0),
      is_active: item.is_active !== 0
    });
    setEditingItem(item);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Please provide both Product Name and Price");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: form.price,
        compare_price: form.compare_price || null,
        unit: form.unit,
        freshness_badge: form.freshness_badge,
        image_url: form.image_url || null,
        stock: form.stock,
        is_active: form.is_active
      };

      if (modal === "edit" && editingItem) {
        await fetch(`/api/admin/groceries/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        toast.success("Grocery item updated successfully!");
      } else {
        await fetch("/api/admin/groceries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        toast.success("New fresh grocery item added!");
      }
      setModal(null);
      loadData();
    } catch {
      toast.error("Error saving grocery item");
    }
    setSaving(false);
  };

  const handleDelete = async (item: GroceryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await fetch(`/api/admin/groceries/${item.id}`, { method: "DELETE" });
      toast.success("Item deleted from inventory");
      loadData();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.unit.toLowerCase().includes(search.toLowerCase()) ||
    i.freshness_badge.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = items.filter(i => i.is_active !== 0).length;
  const outOfStockCount = items.filter(i => i.stock <= 0).length;

  return (
    <div className="space-y-6 p-2 md:p-6">
      {/* Top Banner with Master Switch */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        isEnabled 
          ? "bg-gradient-to-r from-emerald-950 via-neutral-900 to-neutral-950 border-emerald-500/40 text-white shadow-xl shadow-emerald-950/20" 
          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
            }`}>
              <Store size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display">Fresh Groceries CRM</h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isEnabled ? "bg-emerald-500 text-black animate-pulse" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                }`}>
                  {isEnabled ? "LIVE ON STORE" : "SECTION DISABLED"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Dedicated management portal for daily fresh produce, dairy, and farm items. Toggle homepage showcase visibility instantly.
              </p>
            </div>
          </div>

          {/* Master Toggle Control */}
          <div className="flex items-center gap-3 bg-neutral-900/60 dark:bg-neutral-800/80 p-3 rounded-2xl border border-white/10 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">Homepage Showcase</p>
              <p className="text-[10px] text-neutral-400">{isEnabled ? "Displayed to customers" : "Hidden from customers"}</p>
            </div>
            <button
              onClick={handleToggleHomepage}
              disabled={toggling}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                isEnabled ? "bg-emerald-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md flex items-center justify-center ${
                  isEnabled ? "translate-x-9 text-emerald-600" : "translate-x-1 text-neutral-400"
                }`}
              >
                {isEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400">Total Fresh Items</p>
            <p className="text-2xl font-black font-display text-neutral-900 dark:text-white mt-1">{items.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400">Active Stocked Items</p>
            <p className="text-2xl font-black font-display text-emerald-500 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <PackageCheck size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400">Out of Stock Alert</p>
            <p className="text-2xl font-black font-display text-amber-500 mt-1">{outOfStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Control Bar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="bg-white dark:bg-neutral-900 px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 flex-1 max-w-md">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groceries by name, unit, badge..."
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-white focus:outline-none"
          />
        </div>

        <button
          onClick={openAdd}
          className="px-5 py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#e02020]/20 cursor-pointer"
        >
          <Plus size={18} /> Add Fresh Item
        </button>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-12 text-center border border-neutral-100 dark:border-neutral-800">
          <Store size={40} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">No fresh items found</h3>
          <p className="text-xs text-neutral-400 mt-1">Click "Add Fresh Item" above to add your first grocery product.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Item</th>
                  <th className="py-4 px-5">Unit / Size</th>
                  <th className="py-4 px-5">Badge</th>
                  <th className="py-4 px-5">Price</th>
                  <th className="py-4 px-5">Stock</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-sm">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    {/* Item */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 relative border border-neutral-200 dark:border-neutral-700">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white leading-tight">{item.name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">/{item.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-4 px-5">
                      <span className="inline-block px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold">
                        {item.unit}
                      </span>
                    </td>

                    {/* Freshness Badge */}
                    <td className="py-4 px-5">
                      <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold">
                        🌿 {item.freshness_badge}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        ${Number(item.price).toFixed(2)}
                        {item.compare_price && (
                          <span className="ml-1.5 text-xs text-neutral-400 line-through font-normal">
                            ${Number(item.compare_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-5 font-semibold text-neutral-700 dark:text-neutral-300">
                      {item.stock} units
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.is_active !== 0
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active !== 0 ? "bg-emerald-500" : "bg-neutral-400"}`} />
                        {item.is_active !== 0 ? "Active" : "Hidden"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                <Store size={20} className="text-[#e02020]" />
                {modal === "edit" ? "Edit Fresh Grocery Item" : "Add New Fresh Item"}
              </h3>
              <button onClick={() => setModal(null)} className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Organic Red Tomatoes"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="1.99"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Compare Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.compare_price}
                    onChange={e => setForm(p => ({ ...p, compare_price: e.target.value }))}
                    placeholder="2.49"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Unit / Size</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    placeholder="per 1kg / per pack"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Freshness Tag</label>
                  <input
                    type="text"
                    value={form.freshness_badge}
                    onChange={e => setForm(p => ({ ...p, freshness_badge: e.target.value }))}
                    placeholder="100% Organic / Daily Harvest"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  placeholder="100"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <CloudinaryUpload
                mode="single"
                label="Product Image"
                value={form.image_url}
                onChange={v => setForm(p => ({ ...p, image_url: v as string }))}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_chk"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#e02020] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_active_chk" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Active & Available for sale
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold text-sm rounded-xl transition-colors shadow-md shadow-[#e02020]/20 cursor-pointer mt-4"
              >
                {saving ? "Saving..." : modal === "edit" ? "Save Changes" : "Create Fresh Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
